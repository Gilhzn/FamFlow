"use client";

import { create } from "zustand";
import {
  FamAlert,
  LedgerState,
  Member,
  Transaction,
  WalletCard,
  FamilySettings,
  uid,
} from "./types";
import { buildSeedState } from "./seed";
import { runGovernanceChecks } from "./insights";

/**
 * FamSync engine — the live multi-user ledger.
 *
 * Every mutation is written to localStorage and broadcast over a
 * BroadcastChannel, so every open tab/window (each family member's
 * session) converges instantly — a faithful local stand-in for the
 * Supabase realtime channel. When NEXT_PUBLIC_SUPABASE_URL is set the
 * same mutation stream is mirrored through Supabase Postgres changes
 * (see lib/supabase.ts) and remote peers merge through the same code path.
 */

const STORAGE_KEY = "famfinance.ledger.v1";
const SESSION_KEY = "famfinance.session.v1";
const CHANNEL = "famfinance-sync";

interface SyncEnvelope {
  origin: string;
  state: LedgerState;
}

const TAB_ID = uid("tab");

interface FamStore extends LedgerState {
  hydrated: boolean;
  currentMemberId: string | null;
  peers: number; // live connected peers (other tabs)
  hydrate: () => void;
  signIn: (memberId: string) => void;
  signOut: () => void;
  addTransaction: (
    tx: Omit<Transaction, "id" | "ts"> & { ts?: number }
  ) => Transaction;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  addCard: (card: Omit<WalletCard, "id" | "createdAt" | "token">) => WalletCard;
  removeCard: (id: string) => void;
  pushAlert: (a: Omit<FamAlert, "id" | "ts" | "read">) => void;
  markAlertsRead: () => void;
  dismissAlert: (id: string) => void;
  setMemberCap: (memberId: string, cap: number | null) => void;
  setCategoryCap: (cat: keyof FamilySettings["categoryCaps"], cap: number | null) => void;
  setMonthlyBudget: (v: number) => void;
  resetDemo: () => void;
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL);
  return channel;
}

function persistAndBroadcast(state: LedgerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  getChannel()?.postMessage({ origin: TAB_ID, state } satisfies SyncEnvelope);
}

function ledgerSlice(s: FamStore): LedgerState {
  return {
    members: s.members,
    transactions: s.transactions,
    alerts: s.alerts,
    cards: s.cards,
    settings: s.settings,
  };
}

export const useFam = create<FamStore>((set, get) => ({
  ...buildSeedState(),
  transactions: [],
  hydrated: false,
  currentMemberId: null,
  peers: 0,

  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    let state: LedgerState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = raw ? (JSON.parse(raw) as LedgerState) : buildSeedState();
    } catch {
      state = buildSeedState();
    }
    const session = (() => {
      try {
        return localStorage.getItem(SESSION_KEY);
      } catch {
        return null;
      }
    })();
    set({ ...state, hydrated: true, currentMemberId: session });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}

    const ch = getChannel();
    if (ch) {
      ch.onmessage = (ev: MessageEvent<SyncEnvelope | { origin: string; ping?: boolean; pong?: boolean }>) => {
        const msg = ev.data;
        if (!msg || msg.origin === TAB_ID) return;
        if ("ping" in msg && msg.ping) {
          ch.postMessage({ origin: TAB_ID, pong: true });
          set((s) => ({ peers: Math.max(s.peers, 1) }));
          return;
        }
        if ("pong" in msg && msg.pong) {
          set((s) => ({ peers: Math.max(s.peers, 1) }));
          return;
        }
        if ("state" in msg && msg.state) {
          set({ ...msg.state });
        }
      };
      ch.postMessage({ origin: TAB_ID, ping: true });
    }
  },

  signIn: (memberId) => {
    set({ currentMemberId: memberId });
    try {
      localStorage.setItem(SESSION_KEY, memberId);
    } catch {}
  },

  signOut: () => {
    set({ currentMemberId: null });
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  },

  addTransaction: (tx) => {
    const full: Transaction = { ...tx, id: uid("tx"), ts: tx.ts ?? Date.now() };
    const s = get();
    const transactions = [...s.transactions, full].sort((a, b) => a.ts - b.ts);
    // Governance engine reacts to every mutation in real time
    const newAlerts = runGovernanceChecks(
      { ...ledgerSlice(s), transactions },
      full
    );
    const alerts = [...s.alerts, ...newAlerts];
    const next = { ...ledgerSlice(s), transactions, alerts };
    set({ transactions, alerts });
    persistAndBroadcast(next);
    return full;
  },

  deleteTransaction: (id) => {
    const s = get();
    const transactions = s.transactions.filter((t) => t.id !== id);
    const next = { ...ledgerSlice(s), transactions };
    set({ transactions });
    persistAndBroadcast(next);
  },

  updateTransaction: (id, patch) => {
    const s = get();
    const transactions = s.transactions.map((t) =>
      t.id === id ? { ...t, ...patch } : t
    );
    const next = { ...ledgerSlice(s), transactions };
    set({ transactions });
    persistAndBroadcast(next);
  },

  addCard: (card) => {
    const full: WalletCard = {
      ...card,
      id: uid("card"),
      token: `tok_mock_${Math.random().toString(36).slice(2, 12)}`,
      createdAt: Date.now(),
    };
    const s = get();
    const cards = [...s.cards, full];
    const next = { ...ledgerSlice(s), cards };
    set({ cards });
    persistAndBroadcast(next);
    return full;
  },

  removeCard: (id) => {
    const s = get();
    const cards = s.cards.filter((c) => c.id !== id);
    const next = { ...ledgerSlice(s), cards };
    set({ cards });
    persistAndBroadcast(next);
  },

  pushAlert: (a) => {
    const s = get();
    const alerts: FamAlert[] = [
      ...s.alerts,
      { ...a, id: uid("al"), ts: Date.now(), read: false },
    ];
    const next = { ...ledgerSlice(s), alerts };
    set({ alerts });
    persistAndBroadcast(next);
  },

  markAlertsRead: () => {
    const s = get();
    const alerts = s.alerts.map((a) => ({ ...a, read: true }));
    const next = { ...ledgerSlice(s), alerts };
    set({ alerts });
    persistAndBroadcast(next);
  },

  dismissAlert: (id) => {
    const s = get();
    const alerts = s.alerts.filter((a) => a.id !== id);
    const next = { ...ledgerSlice(s), alerts };
    set({ alerts });
    persistAndBroadcast(next);
  },

  setMemberCap: (memberId, cap) => {
    const s = get();
    const members: Member[] = s.members.map((m) =>
      m.id === memberId ? { ...m, monthlyCap: cap } : m
    );
    const next = { ...ledgerSlice(s), members };
    set({ members });
    persistAndBroadcast(next);
  },

  setCategoryCap: (cat, cap) => {
    const s = get();
    const settings: FamilySettings = {
      ...s.settings,
      categoryCaps: { ...s.settings.categoryCaps, [cat]: cap },
    };
    const next = { ...ledgerSlice(s), settings };
    set({ settings });
    persistAndBroadcast(next);
  },

  setMonthlyBudget: (v) => {
    const s = get();
    const settings = { ...s.settings, monthlyBudget: v };
    const next = { ...ledgerSlice(s), settings };
    set({ settings });
    persistAndBroadcast(next);
  },

  resetDemo: () => {
    const fresh = buildSeedState();
    set({ ...fresh });
    persistAndBroadcast(fresh);
  },
}));

export function useCurrentMember() {
  const members = useFam((s) => s.members);
  const id = useFam((s) => s.currentMemberId);
  return members.find((m) => m.id === id) ?? null;
}

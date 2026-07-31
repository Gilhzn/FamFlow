"use client";

import { create } from "zustand";
import {
  FamAlert,
  LedgerState,
  Member,
  StoredCredential,
  Transaction,
  WalletCard,
  FamilySettings,
  CategoryId,
  uid,
} from "./types";
import { buildSeedState } from "./seed";
import { setActiveCurrency, currencySymbol, Currency } from "./format";
import { DEFAULT_COUNTRY } from "./countries";
import { runGovernanceChecks } from "./insights";
import { useUI } from "./i18n";

/**
 * FamSync engine — the live multi-user ledger.
 *
 * Every mutation is written to localStorage and broadcast over a
 * BroadcastChannel, so every open tab/window (each family member's
 * session) converges instantly — a faithful local stand-in for the
 * Supabase realtime channel.
 *
 * Two family "modes" exist side by side on a device:
 *  - demo: the seeded Levi family (one-click profiles, resettable)
 *  - real: a family created through sign-up, with hashed credentials
 * Each mode has its own storage key and its own sync channel.
 */

export type FamilyMode = "demo" | "real";

const MODE_KEY = "famflow.familyMode.v1";
const storageKey = (m: FamilyMode) =>
  m === "demo" ? "famfinance.ledger.v1" : "famfinance.ledger.real.v1";
const sessionKey = (m: FamilyMode) =>
  m === "demo" ? "famfinance.session.v1" : "famfinance.session.real.v1";
const channelName = (m: FamilyMode) => `famfinance-sync-${m}`;

interface SyncEnvelope {
  origin: string;
  state: LedgerState;
}

const TAB_ID = uid("tab");

interface FamStore extends LedgerState {
  hydrated: boolean;
  currentMemberId: string | null;
  familyMode: FamilyMode;
  hasRealFamily: boolean;
  peers: number;
  hydrate: () => void;
  switchFamilyMode: (m: FamilyMode) => void;
  createFamily: (input: {
    familyName: string;
    adminName: string;
    email: string;
    credential: StoredCredential;
    monthlyBudget: number;
    currency?: Currency;
    country?: string;
  }) => Member;
  addMember: (input: {
    name: string;
    role: "admin" | "member";
    monthlyCap: number | null;
    pinCredential?: StoredCredential;
    email?: string;
    credential?: StoredCredential;
  }) => Member;
  removeMember: (id: string) => void;
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
  setCategoryCap: (cat: CategoryId, cap: number | null) => void;
  setMonthlyBudget: (v: number) => void;
  setCurrency: (c: Currency) => void;
  setCountry: (code: string) => void;
  resetDemo: () => void;
}

let channel: BroadcastChannel | null = null;
let channelMode: FamilyMode | null = null;

function readMode(): FamilyMode {
  try {
    return localStorage.getItem(MODE_KEY) === "real" ? "real" : "demo";
  } catch {
    return "demo";
  }
}

function writeMode(m: FamilyMode) {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {}
}

function realFamilyExists(): boolean {
  try {
    return localStorage.getItem(storageKey("real")) != null;
  } catch {
    return false;
  }
}

function persistAndBroadcast(mode: FamilyMode, state: LedgerState) {
  try {
    localStorage.setItem(storageKey(mode), JSON.stringify(state));
  } catch {}
  if (channel && channelMode === mode) {
    channel.postMessage({ origin: TAB_ID, state } satisfies SyncEnvelope);
  }
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

function emptyRealState(
  familyName: string,
  monthlyBudget: number,
  currency: Currency = "USD",
  country: string = DEFAULT_COUNTRY
): LedgerState {
  const settings: FamilySettings = {
    familyName,
    currency,
    country,
    monthlyBudget,
    categoryCaps: { food: null, leisure: null, fixed: null, mandatory: null },
  };
  return { members: [], transactions: [], alerts: [], cards: [], settings };
}

const MEMBER_COLORS = ["#6c8cff", "#3fcf8e", "#c084fc", "#ffb84d", "#ff6b6b", "#38bdf8"];

export const useFam = create<FamStore>((set, get) => {
  function openChannel(mode: FamilyMode) {
    if (typeof window === "undefined") return;
    if (channel && channelMode !== mode) {
      channel.close();
      channel = null;
    }
    if (!channel) {
      channel = new BroadcastChannel(channelName(mode));
      channelMode = mode;
      channel.onmessage = (
        ev: MessageEvent<SyncEnvelope | { origin: string; ping?: boolean; pong?: boolean }>
      ) => {
        const msg = ev.data;
        if (!msg || msg.origin === TAB_ID) return;
        if ("ping" in msg && msg.ping) {
          channel?.postMessage({ origin: TAB_ID, pong: true });
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
      channel.postMessage({ origin: TAB_ID, ping: true });
    }
  }

  function loadMode(mode: FamilyMode): { state: LedgerState; session: string | null } {
    let state: LedgerState | null = null;
    try {
      const raw = localStorage.getItem(storageKey(mode));
      state = raw ? (JSON.parse(raw) as LedgerState) : null;
    } catch {}
    if (!state) {
      state = mode === "demo" ? buildSeedState() : emptyRealState("", 5000);
      if (mode === "demo") {
        try {
          localStorage.setItem(storageKey(mode), JSON.stringify(state));
        } catch {}
      }
    }
    if (!state.settings.country) {
      state = { ...state, settings: { ...state.settings, country: DEFAULT_COUNTRY } };
    }
    let session: string | null = null;
    try {
      session = localStorage.getItem(sessionKey(mode));
    } catch {}
    if (session && !state.members.some((m) => m.id === session)) session = null;
    return { state, session };
  }

  return {
    ...buildSeedState(),
    transactions: [],
    hydrated: false,
    currentMemberId: null,
    familyMode: "demo",
    hasRealFamily: false,
    peers: 0,

    hydrate: () => {
      if (get().hydrated || typeof window === "undefined") return;
      const mode = readMode();
      const { state, session } = loadMode(mode);
      set({
        ...state,
        hydrated: true,
        currentMemberId: session,
        familyMode: mode,
        hasRealFamily: realFamilyExists(),
      });
      openChannel(mode);
    },

    switchFamilyMode: (mode) => {
      if (get().familyMode === mode) return;
      writeMode(mode);
      const { state, session } = loadMode(mode);
      set({
        ...state,
        currentMemberId: session,
        familyMode: mode,
        hasRealFamily: realFamilyExists(),
      });
      openChannel(mode);
    },

    createFamily: ({ familyName, adminName, email, credential, monthlyBudget, currency, country }) => {
      const admin: Member = {
        id: uid("m"),
        name: adminName,
        role: "admin",
        color: MEMBER_COLORS[0],
        monthlyCap: null,
        email: email.toLowerCase(),
        credential,
      };
      const state: LedgerState = {
        ...emptyRealState(familyName, monthlyBudget, currency, country),
        members: [admin],
      };
      writeMode("real");
      try {
        localStorage.setItem(storageKey("real"), JSON.stringify(state));
        localStorage.setItem(sessionKey("real"), admin.id);
      } catch {}
      set({
        ...state,
        currentMemberId: admin.id,
        familyMode: "real",
        hasRealFamily: true,
      });
      openChannel("real");
      persistAndBroadcast("real", state);
      return admin;
    },

    addMember: ({ name, role, monthlyCap, pinCredential, email, credential }) => {
      const s = get();
      const member: Member = {
        id: uid("m"),
        name,
        role,
        color: MEMBER_COLORS[s.members.length % MEMBER_COLORS.length],
        monthlyCap,
        pinCredential,
        email: email?.toLowerCase(),
        credential,
      };
      const members = [...s.members, member];
      const next = { ...ledgerSlice(s), members };
      set({ members });
      persistAndBroadcast(s.familyMode, next);
      return member;
    },

    removeMember: (id) => {
      const s = get();
      if (s.currentMemberId === id) return; // never remove yourself
      const members = s.members.filter((m) => m.id !== id);
      const next = { ...ledgerSlice(s), members };
      set({ members });
      persistAndBroadcast(s.familyMode, next);
    },

    signIn: (memberId) => {
      const mode = get().familyMode;
      set({ currentMemberId: memberId });
      try {
        localStorage.setItem(sessionKey(mode), memberId);
      } catch {}
    },

    signOut: () => {
      const mode = get().familyMode;
      set({ currentMemberId: null });
      try {
        localStorage.removeItem(sessionKey(mode));
      } catch {}
    },

    addTransaction: (tx) => {
      const full: Transaction = { ...tx, id: uid("tx"), ts: tx.ts ?? Date.now() };
      const s = get();
      const transactions = [...s.transactions, full].sort((a, b) => a.ts - b.ts);
      const newAlerts = runGovernanceChecks(
        { ...ledgerSlice(s), transactions },
        full,
        Date.now(),
        useUI.getState().lang
      );
      const alerts = [...s.alerts, ...newAlerts];
      const next = { ...ledgerSlice(s), transactions, alerts };
      set({ transactions, alerts });
      persistAndBroadcast(s.familyMode, next);
      return full;
    },

    deleteTransaction: (id) => {
      const s = get();
      const transactions = s.transactions.filter((t) => t.id !== id);
      const next = { ...ledgerSlice(s), transactions };
      set({ transactions });
      persistAndBroadcast(s.familyMode, next);
    },

    updateTransaction: (id, patch) => {
      const s = get();
      const transactions = s.transactions.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      );
      const next = { ...ledgerSlice(s), transactions };
      set({ transactions });
      persistAndBroadcast(s.familyMode, next);
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
      persistAndBroadcast(s.familyMode, next);
      return full;
    },

    removeCard: (id) => {
      const s = get();
      const cards = s.cards.filter((c) => c.id !== id);
      const next = { ...ledgerSlice(s), cards };
      set({ cards });
      persistAndBroadcast(s.familyMode, next);
    },

    pushAlert: (a) => {
      const s = get();
      const alerts: FamAlert[] = [
        ...s.alerts,
        { ...a, id: uid("al"), ts: Date.now(), read: false },
      ];
      const next = { ...ledgerSlice(s), alerts };
      set({ alerts });
      persistAndBroadcast(s.familyMode, next);
    },

    markAlertsRead: () => {
      const s = get();
      const alerts = s.alerts.map((a) => ({ ...a, read: true }));
      const next = { ...ledgerSlice(s), alerts };
      set({ alerts });
      persistAndBroadcast(s.familyMode, next);
    },

    dismissAlert: (id) => {
      const s = get();
      const alerts = s.alerts.filter((a) => a.id !== id);
      const next = { ...ledgerSlice(s), alerts };
      set({ alerts });
      persistAndBroadcast(s.familyMode, next);
    },

    setMemberCap: (memberId, cap) => {
      const s = get();
      const members: Member[] = s.members.map((m) =>
        m.id === memberId ? { ...m, monthlyCap: cap } : m
      );
      const next = { ...ledgerSlice(s), members };
      set({ members });
      persistAndBroadcast(s.familyMode, next);
    },

    setCategoryCap: (cat, cap) => {
      const s = get();
      const settings: FamilySettings = {
        ...s.settings,
        categoryCaps: { ...s.settings.categoryCaps, [cat]: cap },
      };
      const next = { ...ledgerSlice(s), settings };
      set({ settings });
      persistAndBroadcast(s.familyMode, next);
    },

    setMonthlyBudget: (v) => {
      const s = get();
      const settings = { ...s.settings, monthlyBudget: v };
      const next = { ...ledgerSlice(s), settings };
      set({ settings });
      persistAndBroadcast(s.familyMode, next);
    },

    setCurrency: (c) => {
      const s = get();
      const settings = { ...s.settings, currency: c };
      const next = { ...ledgerSlice(s), settings };
      set({ settings });
      persistAndBroadcast(s.familyMode, next);
    },

    setCountry: (code) => {
      const s = get();
      const settings = { ...s.settings, country: code };
      const next = { ...ledgerSlice(s), settings };
      set({ settings });
      persistAndBroadcast(s.familyMode, next);
    },

    resetDemo: () => {
      const s = get();
      if (s.familyMode !== "demo") return;
      const fresh = buildSeedState();
      set({ ...fresh });
      persistAndBroadcast("demo", fresh);
    },
  };
});

export function useCurrentMember() {
  const members = useFam((s) => s.members);
  const id = useFam((s) => s.currentMemberId);
  return members.find((m) => m.id === id) ?? null;
}

// Keep fmtMoney's active currency in lockstep with the family settings.
if (typeof window !== "undefined") {
  setActiveCurrency(useFam.getState().settings.currency);
  useFam.subscribe((s) => setActiveCurrency(s.settings.currency));
}

/** Reactive currency symbol for input prefixes etc. */
export function useCurrencySymbol(): string {
  const currency = useFam((s) => s.settings.currency);
  return currencySymbol(currency);
}

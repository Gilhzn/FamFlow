"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SearchX } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { CategoryId, Transaction } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import QuickAddBar from "@/components/ledger/QuickAddBar";
import LedgerFilters from "@/components/ledger/LedgerFilters";
import TxRow from "@/components/ledger/TxRow";
import UndoToast from "@/components/ledger/UndoToast";

const PAGE_SIZE = 150;

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function LedgerPage() {
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const deleteTransaction = useFam((s) => s.deleteTransaction);
  const addTransaction = useFam((s) => s.addTransaction);
  const me = useCurrentMember();

  const [pendingUndo, setPendingUndo] = useState<Transaction | null>(null);

  const handleDelete = useCallback(
    (t: Transaction) => {
      deleteTransaction(t.id);
      setPendingUndo(t);
    },
    [deleteTransaction]
  );

  const dismissUndo = useCallback(() => setPendingUndo(null), []);

  const undoDelete = useCallback(() => {
    setPendingUndo((t) => {
      if (t) {
        addTransaction({
          memberId: t.memberId,
          amount: t.amount,
          category: t.category,
          label: t.label,
          note: t.note,
          source: t.source,
          items: t.items,
          ts: t.ts,
        });
      }
      return null;
    });
  }, [addTransaction]);

  const [memberFilter, setMemberFilter] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<Set<CategoryId>>(new Set());
  const [query, setQuery] = useState("");
  const [cap, setCap] = useState(PAGE_SIZE);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter(
        (t) =>
          (memberFilter.size === 0 || memberFilter.has(t.memberId)) &&
          (catFilter.size === 0 || catFilter.has(t.category)) &&
          (!q ||
            t.label.toLowerCase().includes(q) ||
            (t.note ?? "").toLowerCase().includes(q))
      )
      .sort((a, b) => b.ts - a.ts);
  }, [transactions, memberFilter, catFilter, query]);

  const filteredTotal = useMemo(
    () => filtered.reduce((a, t) => a + t.amount, 0),
    [filtered]
  );

  const visible = useMemo(() => filtered.slice(0, cap), [filtered, cap]);

  const groups = useMemo(() => {
    const map = new Map<string, { ts: number; rows: Transaction[] }>();
    for (const t of visible) {
      const key = new Date(t.ts).toDateString();
      const g = map.get(key);
      if (g) g.rows.push(t);
      else map.set(key, { ts: t.ts, rows: [t] });
    }
    return [...map.entries()];
  }, [visible]);

  // Day subtotals over the full filtered set, so a mid-day cap never lies.
  const dayTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of filtered) {
      const key = new Date(t.ts).toDateString();
      m.set(key, (m.get(key) ?? 0) + t.amount);
    }
    return m;
  }, [filtered]);

  const hasFilters =
    memberFilter.size > 0 || catFilter.size > 0 || query.trim().length > 0;

  function toggleMember(id: string) {
    setMemberFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCat(id: CategoryId) {
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setMemberFilter(new Set());
    setCatFilter(new Set());
    setQuery("");
  }

  const remaining = filtered.length - visible.length;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up p-4 md:p-8">
      <header className="mb-4 md:mb-6">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Family Ledger
        </h1>
        <p className="mt-0.5 text-sm text-ink-dim">
          Every purchase, synced live across the family.
        </p>
      </header>

      <QuickAddBar />

      <div className="mt-4">
        <LedgerFilters
          members={members}
          activeMembers={memberFilter}
          toggleMember={toggleMember}
          activeCats={catFilter}
          toggleCat={toggleCat}
          query={query}
          setQuery={setQuery}
          count={filtered.length}
          total={filteredTotal}
          hasFilters={hasFilters}
          clearFilters={clearFilters}
        />
      </div>

      {groups.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-3 px-6 py-14 text-center animate-scale-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
            <SearchX size={22} />
          </div>
          {transactions.length === 0 ? (
            <>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
                Add your first purchase with the quick-add bar above — it syncs
                to every family member instantly.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Nothing matches these filters</p>
              <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
                Try a different member, category, or search term.
              </p>
              <button onClick={clearFilters} className="btn-ghost mt-1">
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-2">
          {groups.map(([key, g]) => (
            <section key={key}>
              <div className="sticky top-[53px] z-10 flex items-baseline justify-between bg-surface-0/85 px-1 py-2 backdrop-blur-md md:top-0">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  {dayLabel(g.ts)}
                </h2>
                <span className="tabular text-xs font-medium text-ink-dim">
                  {fmtMoney(dayTotals.get(key) ?? 0)}
                </span>
              </div>
              <div className="card overflow-hidden">
                <AnimatePresence initial={false}>
                  {g.rows.map((t) => (
                    <TxRow
                      key={t.id}
                      tx={t}
                      member={memberById.get(t.memberId)}
                      canDelete={
                        !!me && (me.role === "admin" || t.memberId === me.id)
                      }
                      onDelete={() => deleteTransaction(t.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}

          {remaining > 0 && (
            <motion.button
              layout
              onClick={() => setCap((c) => c + PAGE_SIZE)}
              className="btn-ghost mt-4 w-full"
            >
              <ChevronDown size={15} />
              Show more ({remaining} older)
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, SlidersHorizontal } from "lucide-react";
import { useFam } from "@/lib/store";
import { inMonth, sum } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";
import { CATEGORIES, CategoryId } from "@/lib/types";
import CapInput from "./CapInput";

export default function BudgetConfigCard() {
  const settings = useFam((s) => s.settings);
  const transactions = useFam((s) => s.transactions);
  const setMonthlyBudget = useFam((s) => s.setMonthlyBudget);
  const setCategoryCap = useFam((s) => s.setCategoryCap);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const { catSpend, familySpend } = useMemo(() => {
    const monthTx = transactions.filter((t) => inMonth(t));
    const catSpend = Object.fromEntries(
      CATEGORIES.map((c) => [c.id, sum(monthTx.filter((t) => t.category === c.id))])
    ) as Record<CategoryId, number>;
    return { catSpend, familySpend: sum(monthTx) };
  }, [transactions]);

  const budget = settings.monthlyBudget;
  const budgetPct = budget > 0 ? Math.min(1, familySpend / budget) : 0;
  const overBudget = familySpend > budget;

  const saveBudget = () => {
    const n = parseFloat(draft);
    if (Number.isFinite(n) && n > 0) setMonthlyBudget(Math.round(n));
    setEditing(false);
  };

  return (
    <section className="card animate-fade-up p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <SlidersHorizontal size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">
            Budget configuration
          </h2>
          <p className="text-[11px] text-ink-faint">
            Family-wide budget & per-category caps
          </p>
        </div>
      </div>

      {/* Family monthly budget — click to edit */}
      <div className="mt-4 rounded-xl bg-surface-2 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Family monthly budget
        </p>
        {editing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative w-36">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                $
              </span>
              <input
                autoFocus
                inputMode="numeric"
                aria-label="Family monthly budget"
                className="input tabular py-1.5 pl-6 pr-2.5 text-base font-semibold"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveBudget();
                  if (e.key === "Escape") setEditing(false);
                }}
                onBlur={saveBudget}
              />
            </div>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={saveBudget}
              aria-label="Save budget"
              className="btn-primary px-3 py-1.5"
            >
              <Check size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(String(budget));
              setEditing(true);
            }}
            className="group mt-0.5 inline-flex items-center gap-2 rounded-lg text-2xl font-bold tabular transition-colors hover:text-accent"
          >
            {fmtMoney(budget)}
            <Pencil
              size={14}
              className="text-ink-faint opacity-60 transition-opacity group-hover:opacity-100"
            />
          </button>
        )}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${budgetPct * 100}%`,
              background: overBudget ? "var(--negative)" : "var(--accent)",
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-dim">
          <span className="tabular font-medium text-ink">
            {fmtMoney(familySpend)}
          </span>{" "}
          spent this month
          {overBudget ? (
            <span className="tabular font-medium text-negative">
              {" "}
              · {fmtMoney(familySpend - budget)} over
            </span>
          ) : (
            <span className="tabular">
              {" "}
              · {fmtMoney(budget - familySpend)} left
            </span>
          )}
        </p>
      </div>

      {/* Per-category caps */}
      <div className="mt-2">
        {CATEGORIES.map((c) => {
          const spend = catSpend[c.id];
          const cap = settings.categoryCaps[c.id];
          const pct = cap != null && cap > 0 ? Math.min(1, spend / cap) : 0;
          const over = cap != null && spend > cap;
          return (
            <div key={c.id} className="border-b border-line py-3.5 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm">
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{c.label}</p>
                  <p className="text-xs text-ink-dim">
                    <span className="tabular">{fmtMoney(spend)}</span> spent
                    {cap != null ? (
                      <span className="tabular"> of {fmtMoney(cap)}</span>
                    ) : (
                      <span className="text-ink-faint"> · uncapped</span>
                    )}
                  </p>
                </div>
                <CapInput
                  value={cap}
                  onCommit={(v) => setCategoryCap(c.id, v)}
                  ariaLabel={`${c.label} monthly cap`}
                />
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-3">
                {cap != null && (
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${pct * 100}%`,
                      background: over ? "var(--negative)" : c.color,
                    }}
                  />
                )}
              </div>
              {over && (
                <p className="mt-1.5 text-xs font-medium text-negative">
                  Over cap by{" "}
                  <span className="tabular">{fmtMoney(spend - cap)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

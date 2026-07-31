"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, SlidersHorizontal } from "lucide-react";
import { useFam, useCurrencySymbol } from "@/lib/store";
import { inMonth, sum } from "@/lib/insights";
import { CURRENCIES, CURRENCY_SYMBOLS, fmtMoney } from "@/lib/format";
import { CATEGORIES, CategoryId } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { fill, Money } from "./i18nNodes";
import CapInput from "./CapInput";
import CountrySelect from "@/components/CountrySelect";
import { currencyForCountry, DEFAULT_COUNTRY } from "@/lib/countries";

export default function BudgetConfigCard() {
  const sym = useCurrencySymbol();
  const { t } = useT();
  const settings = useFam((s) => s.settings);
  const transactions = useFam((s) => s.transactions);
  const setMonthlyBudget = useFam((s) => s.setMonthlyBudget);
  const setCategoryCap = useFam((s) => s.setCategoryCap);
  const setCurrency = useFam((s) => s.setCurrency);
  const setCountry = useFam((s) => s.setCountry);

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
            {t("admin.budget.title")}
          </h2>
          <p className="text-[11px] text-ink-faint">
            {t("admin.budget.subtitle")}
          </p>
        </div>
      </div>

      {/* Shopping country — localizes the price-search store chains */}
      <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-ink-dim">
            {t("admin.country.label")}
          </span>
        </div>
        <CountrySelect
          value={settings.country ?? DEFAULT_COUNTRY}
          onChange={(code) => {
            setCountry(code);
            setCurrency(currencyForCountry(code));
          }}
          ariaLabel={t("admin.country.label")}
        />
        <p className="mt-1.5 text-[11px] text-ink-faint">
          {t("admin.country.hint")}
        </p>
      </div>

      {/* Family currency */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-xs font-medium text-ink-dim">
          {t("admin.currency.label")}
        </span>
        <div className="flex gap-1 rounded-lg bg-surface-1 p-0.5">
          {CURRENCIES.map((c) => {
            const sel = settings.currency === c;
            return (
              <button
                key={c}
                aria-pressed={sel}
                onClick={() => setCurrency(c)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  sel
                    ? "bg-accent text-white"
                    : "text-ink-dim hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span dir="ltr">
                  {CURRENCY_SYMBOLS[c]} {t(`admin.currency.${c}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Family monthly budget — click to edit */}
      <div className="mt-3 rounded-xl bg-surface-2 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {t("admin.budget.familyMonthly")}
        </p>
        {editing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative w-36" dir="ltr">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                {sym}
              </span>
              <input
                autoFocus
                inputMode="numeric"
                aria-label={t("admin.budget.familyMonthly")}
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
              aria-label={t("admin.budget.saveAria")}
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
            <span dir="ltr">{fmtMoney(budget)}</span>
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
          {fill(t("admin.budget.spentMonth"), {
            amt: (
              <Money className="tabular font-medium text-ink">
                {fmtMoney(familySpend)}
              </Money>
            ),
          })}
          {overBudget ? (
            <span className="font-medium text-negative">
              {" "}
              {fill(t("admin.overBy"), {
                amt: <Money>{fmtMoney(familySpend - budget)}</Money>,
              })}
            </span>
          ) : (
            <span>
              {" "}
              {fill(t("admin.budget.left"), {
                amt: <Money>{fmtMoney(budget - familySpend)}</Money>,
              })}
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
                  <p className="truncate text-[13px] font-medium">
                    {t(`cat.${c.id}`)}
                  </p>
                  <p className="text-xs text-ink-dim">
                    {cap != null ? (
                      fill(t("admin.budget.catSpent"), {
                        amt: <Money>{fmtMoney(spend)}</Money>,
                        cap: <Money>{fmtMoney(cap)}</Money>,
                      })
                    ) : (
                      <>
                        {fill(t("admin.budget.catSpentNoCap"), {
                          amt: <Money>{fmtMoney(spend)}</Money>,
                        })}
                        <span className="text-ink-faint">
                          {" "}
                          {t("admin.budget.uncapped")}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <CapInput
                  value={cap}
                  onCommit={(v) => setCategoryCap(c.id, v)}
                  ariaLabel={t("admin.capAria", { name: t(`cat.${c.id}`) })}
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
                  {fill(t("admin.budget.overCap"), {
                    amt: <Money>{fmtMoney(spend - cap)}</Money>,
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CATEGORIES, CategoryId } from "@/lib/types";
import { useFam, useCurrentMember } from "@/lib/store";
import { useT } from "@/lib/i18n";

/** Segmented quick-add bar — instant optimistic manual entry. */
export default function QuickAddBar() {
  const addTransaction = useFam((s) => s.addTransaction);
  const me = useCurrentMember();
  const { t } = useT();
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState<CategoryId>("food");
  const amountRef = useRef<HTMLInputElement>(null);

  const parsed = parseFloat(amount);
  const valid =
    !!me && Number.isFinite(parsed) && parsed > 0 && label.trim().length > 0;

  function submit() {
    if (!valid || !me) return;
    addTransaction({
      memberId: me.id,
      amount: Math.round(parsed * 100) / 100,
      category: cat,
      label: label.trim(),
      source: "manual",
    });
    setAmount("");
    setLabel("");
    amountRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="card p-3 md:p-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <div className="relative w-28 shrink-0">
            <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
              $
            </span>
            <input
              ref={amountRef}
              value={amount}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9.]/g, "");
                if (/^\d*\.?\d{0,2}$/.test(clean)) setAmount(clean);
              }}
              onKeyDown={onKeyDown}
              inputMode="decimal"
              placeholder={t("ledger.amountPlaceholder")}
              aria-label={t("ledger.amount")}
              className="input tabular ps-7"
            />
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("ledger.labelPlaceholder")}
            aria-label={t("ledger.labelPlaceholder")}
            className="input min-w-0 flex-1"
          />
          <button
            onClick={submit}
            disabled={!valid}
            className="btn-primary hidden shrink-0 sm:inline-flex"
          >
            <Plus size={16} />
            {t("common.add")}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            role="group"
            aria-label={t("ledger.category")}
            className="grid flex-1 grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1"
          >
            {CATEGORIES.map((c) => {
              const sel = cat === c.id;
              return (
                <button
                  key={c.id}
                  aria-pressed={sel}
                  onClick={() => setCat(c.id)}
                  className={`flex items-center justify-center gap-1.5 truncate rounded-lg px-1.5 py-2 text-xs font-medium transition-all duration-150 ${
                    sel ? "" : "text-ink-dim hover:bg-surface-3 hover:text-ink"
                  }`}
                  style={
                    sel
                      ? {
                          background: `color-mix(in srgb, ${c.color} 16%, transparent)`,
                          color: c.color,
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c.color} 40%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span aria-hidden>{c.emoji}</span>
                  <span className="hidden truncate min-[420px]:inline">
                    {t(`cat.${c.id}.short`)}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={submit}
            disabled={!valid}
            aria-label={t("ledger.addTx")}
            className="btn-primary shrink-0 px-3 sm:hidden"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, Plus, ScanLine, Sparkle, Store, X } from "lucide-react";
import { CATEGORIES, CATEGORY_MAP, CategoryId } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export interface EditableRow {
  id: string;
  name: string;
  price: string; // kept as raw input text for fluid editing
  historicalPrice: number | null;
  matched: boolean;
  suggestedCategory: CategoryId;
}

export function rowTotal(rows: EditableRow[]): number {
  return rows.reduce((sum, r) => {
    const v = parseFloat(r.price);
    return sum + (isFinite(v) && v > 0 ? v : 0);
  }, 0);
}

interface ResultsSheetProps {
  merchant: string;
  onMerchantChange: (v: string) => void;
  rows: EditableRow[];
  onRowChange: (id: string, patch: Partial<Pick<EditableRow, "name" | "price">>) => void;
  onRowRemove: (id: string) => void;
  onRowAdd: () => void;
  category: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  mode: "live" | "mock" | null;
  onLog: () => void;
}

function sanitizePrice(v: string): string {
  const clean = v.replace(/[^0-9.]/g, "");
  // Single decimal point, max two decimals — what you see is what gets logged.
  return /^\d*\.?\d{0,2}$/.test(clean) ? clean : clean.slice(0, -1);
}

export default function ResultsSheet({
  merchant,
  onMerchantChange,
  rows,
  onRowChange,
  onRowRemove,
  onRowAdd,
  category,
  onCategoryChange,
  mode,
  onLog,
}: ResultsSheetProps) {
  const total = rowTotal(rows);
  const matchedCount = rows.filter((r) => r.matched).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            <ScanLine size={13} />
            Extracted receipt
          </p>
          <div className="flex items-center gap-1.5">
            {mode === "mock" ? (
              <span className="chip bg-surface-2 text-ink-faint">
                <Sparkle size={11} />
                Mock vision
              </span>
            ) : mode === "live" ? (
              <span className="chip bg-accent-soft text-accent">
                <Sparkle size={11} />
                Claude Vision
              </span>
            ) : null}
            {matchedCount > 0 && (
              <span className="chip bg-surface-2 text-ink-dim">
                <History size={11} />
                {matchedCount} history match{matchedCount === 1 ? "" : "es"}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <Store size={16} className="shrink-0 text-ink-faint" />
          <input
            value={merchant}
            onChange={(e) => onMerchantChange(e.target.value)}
            placeholder="Merchant name"
            aria-label="Merchant"
            className="input !bg-surface-2 text-sm font-semibold"
          />
        </div>
      </div>

      {/* Item rows */}
      <div className="divide-y divide-line">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.div
              layout
              key={row.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <input
                    value={row.name}
                    onChange={(e) => onRowChange(row.id, { name: e.target.value })}
                    placeholder="Item name"
                    aria-label="Item name"
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-sm text-ink outline-none ring-1 ring-transparent transition-all placeholder:text-ink-faint hover:bg-surface-2 focus:bg-surface-2 focus:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                  />
                  <div className="relative shrink-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                      $
                    </span>
                    <input
                      value={row.price}
                      onChange={(e) =>
                        onRowChange(row.id, {
                          price: sanitizePrice(e.target.value),
                        })
                      }
                      inputMode="decimal"
                      placeholder="0.00"
                      aria-label="Item price"
                      className="tabular w-[84px] rounded-lg bg-surface-2 py-1.5 pl-6 pr-2 text-right text-sm text-ink outline-none ring-1 ring-transparent transition-all focus:bg-surface-3 focus:ring-[color-mix(in_srgb,var(--accent)_60%,transparent)]"
                    />
                  </div>
                  <button
                    onClick={() => onRowRemove(row.id)}
                    aria-label={`Remove ${row.name || "item"}`}
                    className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-negative"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-2">
                  {row.matched && row.historicalPrice != null ? (
                    <span className="chip bg-accent-soft text-accent">
                      <History size={11} />
                      History match: {fmtMoney(row.historicalPrice)}
                    </span>
                  ) : (
                    <span className="chip bg-surface-2 text-ink-faint">
                      New item — no purchase history
                    </span>
                  )}
                  <span
                    className="chip"
                    style={{
                      background: "var(--surface-2)",
                      color: CATEGORY_MAP[row.suggestedCategory].color,
                    }}
                  >
                    {CATEGORY_MAP[row.suggestedCategory].emoji}{" "}
                    {CATEGORY_MAP[row.suggestedCategory].label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {rows.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-ink-faint">
            No line items detected — add them manually below.
          </p>
        )}

        {/* Add item */}
        <button
          onClick={onRowAdd}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink sm:px-5"
        >
          <Plus size={15} />
          Add item
        </button>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-line px-4 py-3.5 sm:px-5">
        <p className="text-sm font-medium text-ink-dim">Total</p>
        <motion.p
          key={total.toFixed(2)}
          initial={{ opacity: 0.4, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="tabular text-lg font-bold text-ink"
        >
          {fmtMoney(total)}
        </motion.p>
      </div>

      {/* Category + log */}
      <div className="space-y-3 border-t border-line p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Ledger category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                onClick={() => onCategoryChange(c.id)}
                className={`chip transition-all duration-150 ${
                  active
                    ? "ring-1 ring-inset"
                    : "bg-surface-2 text-ink-dim hover:bg-surface-3 hover:text-ink"
                }`}
                style={
                  active
                    ? {
                        background: "color-mix(in srgb, " + c.color + " 16%, transparent)",
                        color: c.color,
                        // ring color via boxShadow to use CSS var
                        boxShadow: `inset 0 0 0 1px ${c.color}`,
                      }
                    : undefined
                }
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onLog}
          disabled={total <= 0 || !merchant.trim()}
          className="btn-primary w-full !py-3"
        >
          Log {fmtMoney(total)} to ledger
        </button>
      </div>
    </motion.div>
  );
}

"use client";

import { useCurrencySymbol } from "@/lib/store";

import { motion } from "framer-motion";
import { Check, PencilLine, Search, Store } from "lucide-react";
import { CATEGORIES, CategoryId } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { ProductOffer } from "@/lib/product-search";

interface Props {
  productName: string;
  onNameChange: (v: string) => void;
  offers: ProductOffer[];
  selectedOfferId: string | null;
  onSelectOffer: (o: ProductOffer) => void;
  price: string;
  onPriceChange: (v: string) => void;
  category: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  onLog: () => void;
}

function sanitizePrice(v: string): string {
  const clean = v.replace(/[^0-9.]/g, "");
  return /^\d*\.?\d{0,2}$/.test(clean) ? clean : clean.slice(0, -1);
}

export default function ProductResults({
  productName,
  onNameChange,
  offers,
  selectedOfferId,
  onSelectOffer,
  price,
  onPriceChange,
  category,
  onCategoryChange,
  onLog,
}: Props) {
  const { t } = useT();
  const parsed = parseFloat(price);
  const valid = Number.isFinite(parsed) && parsed > 0 && productName.trim();
  const cheapest = offers[0]?.price;
  const sym = useCurrencySymbol();

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
            <Search size={13} />
            {t("scan.product.resultsTitle")}
          </p>
          <span className="chip bg-surface-2 text-ink-faint">
            {t("scan.product.mockChip")}
          </span>
        </div>
        <input
          value={productName}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label={t("scan.product.nameAria")}
          className="input mt-3 text-sm font-semibold"
          placeholder={t("scan.product.namePlaceholder")}
        />
      </div>

      {/* Offers */}
      <div className="p-4 sm:p-5">
        <p className="mb-2.5 text-xs font-medium text-ink-dim">
          {t("scan.product.offersLabel", { n: offers.length })}
        </p>
        <div className="space-y-2">
          {offers.map((o, i) => {
            const selected = o.id === selectedOfferId;
            return (
              <motion.button
                key={o.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.25 }}
                onClick={() => onSelectOffer(o)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-start transition-all duration-150 ${
                  selected
                    ? "bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--accent)]"
                    : "bg-surface-2 hover:bg-surface-3"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    selected ? "bg-accent text-white" : "bg-surface-3 text-ink-faint"
                  }`}
                >
                  {selected ? <Check size={15} strokeWidth={3} /> : <Store size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.store}</span>
                  <span className="block text-[11px] text-ink-faint">
                    {t(`scan.product.note.${o.noteKey}`)}
                    {i === 0 && (
                      <span className="ms-1.5 font-medium text-positive">
                        {t("scan.product.cheapest")}
                      </span>
                    )}
                  </span>
                </span>
                <span dir="ltr" className="tabular shrink-0 text-sm font-bold">
                  {fmtMoney(o.price, { cents: true })}
                </span>
              </motion.button>
            );
          })}
        </div>
        {cheapest != null && offers.length > 1 && (
          <p className="mt-2 text-[11px] text-ink-faint">
            {t("scan.product.spread")}{" "}
            <span dir="ltr" className="tabular">
              {fmtMoney(offers[offers.length - 1].price - cheapest, { cents: true })}
            </span>
          </p>
        )}
      </div>

      {/* Price + category + log */}
      <div className="border-t border-line p-4 sm:p-5">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-dim">
          <PencilLine size={12} />
          {t("scan.product.priceLabel")}
        </label>
        <div className="relative" dir="ltr">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
            {sym}
          </span>
          <input
            value={price}
            onChange={(e) => onPriceChange(sanitizePrice(e.target.value))}
            inputMode="decimal"
            placeholder="0.00"
            aria-label={t("scan.product.priceLabel")}
            className="input tabular pl-7 text-base font-semibold"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">
          {t("scan.product.priceHint")}
        </p>

        <p className="mb-2 mt-4 text-xs font-medium text-ink-dim">
          {t("scan.ledgerCategory")}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map((c) => {
            const sel = category === c.id;
            return (
              <button
                key={c.id}
                aria-pressed={sel}
                onClick={() => onCategoryChange(c.id)}
                className={`flex items-center justify-center gap-1 truncate rounded-lg px-1.5 py-2 text-xs font-medium transition-all duration-150 ${
                  sel ? "" : "bg-surface-2 text-ink-dim hover:bg-surface-3"
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

        <button onClick={onLog} disabled={!valid} className="btn-primary mt-5 w-full">
          {t("scan.product.logPrefix")}{" "}
          <span dir="ltr" className="tabular">
            {valid ? fmtMoney(parsed, { cents: true }) : "—"}
          </span>{" "}
          {t("scan.product.logSuffix")}
        </button>
      </div>
    </motion.div>
  );
}

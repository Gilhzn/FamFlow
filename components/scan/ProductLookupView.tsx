"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Barcode,
  Check,
  Database,
  ImageOff,
  Loader2,
  PencilLine,
  Search,
  Store,
} from "lucide-react";
import { CATEGORIES, CategoryId } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useCurrencySymbol } from "@/lib/store";
import {
  fetchRealPrices,
  OffProduct,
  RealPrice,
  searchByName,
} from "@/lib/product-lookup";

interface Props {
  noBarcode: boolean;
  initialProduct: OffProduct | null;
  initialPrices: RealPrice[];
  onLog: (name: string, amount: number, category: CategoryId) => void;
  /** Called when the open product database is unreachable (offline etc.). */
  onNetworkFail: () => void;
}

function sanitizePrice(v: string): string {
  const clean = v.replace(/[^0-9.]/g, "");
  return /^\d*\.?\d{0,2}$/.test(clean) ? clean : clean.slice(0, -1);
}

export default function ProductLookupView({
  noBarcode,
  initialProduct,
  initialPrices,
  onLog,
  onNetworkFail,
}: Props) {
  const { t } = useT();
  const sym = useCurrencySymbol();

  const [product, setProduct] = useState<OffProduct | null>(initialProduct);
  const [prices, setPrices] = useState<RealPrice[]>(initialPrices);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [price, setPrice] = useState(
    initialPrices[0] ? initialPrices[0].price.toFixed(2) : ""
  );
  const [category, setCategory] = useState<CategoryId>("food");

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<OffProduct[] | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  const parsed = parseFloat(price);
  const valid = Number.isFinite(parsed) && parsed > 0 && !!product;

  async function runSearch() {
    if (!query.trim() || searching) return;
    setSearching(true);
    const found = await searchByName(query.trim());
    setSearching(false);
    if (found === null) return onNetworkFail();
    setResults(found);
  }

  async function pick(p: OffProduct) {
    setPicking(p.code);
    const real = await fetchRealPrices(p.code);
    setPicking(null);
    setProduct(p);
    setPrices(real);
    setSelectedPriceId(null);
    setPrice(real[0] ? real[0].price.toFixed(2) : "");
  }

  function choosePrice(rp: RealPrice) {
    setSelectedPriceId(rp.id);
    setPrice(rp.price.toFixed(2));
  }

  /* ---------------- search view ---------------- */
  if (!product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="border-b border-line p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            <Barcode size={13} />
            {noBarcode ? t("scan.product.noBarcode") : t("scan.product.notFound")}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={t("scan.product.searchPlaceholder")}
              aria-label={t("scan.product.searchPlaceholder")}
              className="input flex-1"
              autoFocus
            />
            <button
              onClick={runSearch}
              disabled={!query.trim() || searching}
              className="btn-primary shrink-0"
            >
              {searching ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              {t("scan.product.searchBtn")}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            {t("scan.product.offNote")}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          {results === null ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              {t("scan.product.searchHint")}
            </p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              {t("scan.product.noResults")}
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {results.map((r, i) => (
                  <motion.button
                    key={r.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    onClick={() => pick(r)}
                    disabled={picking !== null}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-start transition-colors hover:bg-surface-3"
                  >
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-faint">
                        <ImageOff size={16} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {r.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-faint">
                        {[r.brand, r.quantity].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {picking === r.code ? (
                      <Loader2 size={15} className="shrink-0 animate-spin text-accent" />
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-accent">
                        {t("scan.product.pick")}
                      </span>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* ---------------- real product view ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Product card — real data */}
      <div className="border-b border-line p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            <Check size={13} className="text-positive" />
            {t("scan.product.resultsTitle")}
          </p>
          <span className="chip bg-surface-2 text-ink-faint">
            <Database size={11} />
            {t("scan.product.realChip")}
          </span>
        </div>
        <div className="flex items-start gap-3.5">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-xl bg-white object-contain shadow-card"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-faint">
              <ImageOff size={20} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{product.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-dim">
              {[product.brand, product.quantity].filter(Boolean).join(" · ")}
            </p>
            {product.categories && (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-faint">
                {product.categories}
              </p>
            )}
            <p className="mt-1 text-[11px] text-ink-faint" dir="ltr">
              <Barcode size={10} className="mb-0.5 inline" /> {product.code}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setProduct(null);
            setResults(null);
            setPrice("");
          }}
          className="mt-3 text-xs font-medium text-accent transition-opacity hover:opacity-80"
        >
          {t("scan.product.searchOther")}
        </button>
      </div>

      {/* Real prices (when the community has recorded any) */}
      <div className="border-b border-line p-4 sm:p-5">
        {prices.length > 0 ? (
          <>
            <p className="mb-2.5 text-xs font-medium text-ink-dim">
              {t("scan.product.pricesTitle", { n: prices.length })}
            </p>
            <div className="space-y-2">
              {prices.map((rp) => {
                const selected = rp.id === selectedPriceId;
                return (
                  <button
                    key={rp.id}
                    onClick={() => choosePrice(rp)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-start transition-all duration-150 ${
                      selected
                        ? "bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--accent)]"
                        : "bg-surface-2 hover:bg-surface-3"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-accent text-white"
                          : "bg-surface-3 text-ink-faint"
                      }`}
                    >
                      {selected ? <Check size={13} strokeWidth={3} /> : <Store size={13} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {rp.store}
                      </span>
                      <span className="block text-[11px] text-ink-faint">
                        {[rp.location, rp.date].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span dir="ltr" className="tabular shrink-0 text-sm font-bold">
                      {rp.price.toFixed(2)}{" "}
                      <span className="text-[10px] font-medium text-ink-faint">
                        {rp.currency}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-faint">{t("scan.product.noPrices")}</p>
        )}
      </div>

      {/* Manual price + category + log */}
      <div className="p-4 sm:p-5">
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
            onChange={(e) => {
              setPrice(sanitizePrice(e.target.value));
              setSelectedPriceId(null);
            }}
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
                onClick={() => setCategory(c.id)}
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

        <button
          onClick={() => valid && onLog(product.name, Math.round(parsed * 100) / 100, category)}
          disabled={!valid}
          className="btn-primary mt-5 w-full"
        >
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

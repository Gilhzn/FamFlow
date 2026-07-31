"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, TriangleAlert } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { CATEGORIES, CategoryId, ReceiptItem, Transaction, uid } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { PRODUCT_REGISTRY } from "@/lib/seed";
import { matchHistoricalPrices } from "@/lib/vision";
import { mockExtract, VisionPayload } from "@/lib/vision-mock";
import CaptureZone from "@/components/scan/CaptureZone";
import ScanProgress, { PRODUCT_STEPS } from "@/components/scan/ScanProgress";
import ResultsSheet, {
  EditableRow,
  rowTotal,
} from "@/components/scan/ResultsSheet";
import ProductResults from "@/components/scan/ProductResults";
import {
  mockProductSearch,
  ProductOffer,
  ProductSearchResult,
} from "@/lib/product-search";
import { ReceiptText, Tag } from "lucide-react";

type Phase = "capture" | "analyzing" | "review" | "logged";
type ScanMode = "receipt" | "product";

interface ImageData {
  base64: string;
  mediaType: string;
  previewUrl: string;
  fileName: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function dominantCategory(rows: EditableRow[]): CategoryId {
  const counts = new Map<CategoryId, number>();
  for (const r of rows) {
    counts.set(r.suggestedCategory, (counts.get(r.suggestedCategory) ?? 0) + 1);
  }
  let best: CategoryId = "food";
  let bestCount = -1;
  for (const c of CATEGORIES) {
    const n = counts.get(c.id) ?? 0;
    if (n > bestCount) {
      best = c.id;
      bestCount = n;
    }
  }
  return best;
}

export default function ScanPage() {
  const { t } = useT();
  const me = useCurrentMember();
  const transactions = useFam((s) => s.transactions);
  const addTransaction = useFam((s) => s.addTransaction);

  const [phase, setPhase] = useState<Phase>("capture");
  const [image, setImage] = useState<ImageData | null>(null);
  const [step, setStep] = useState(0);
  // Holds an i18n key (scan.err*) so the banner re-translates on language switch.
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const [merchant, setMerchant] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [category, setCategory] = useState<CategoryId>("food");
  const [loggedTx, setLoggedTx] = useState<Transaction | null>(null);

  // Product-photo mode: automated price search + manual override
  const [scanMode, setScanMode] = useState<ScanMode>("receipt");
  const [product, setProduct] = useState<ProductSearchResult | null>(null);
  const [productName, setProductName] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState("");

  const handleSelect = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      setImage({
        base64: dataUrl.slice(comma + 1),
        mediaType: file.type || "image/jpeg",
        previewUrl: dataUrl,
        fileName: file.name,
      });
    };
    reader.onerror = () => setError("scan.errRead");
    reader.readAsDataURL(file);
  }, []);

  const reset = useCallback(() => {
    setPhase("capture");
    setImage(null);
    setStep(0);
    setError(null);
    setMode(null);
    setMerchant("");
    setRows([]);
    setCategory("food");
    setLoggedTx(null);
    setProduct(null);
    setProductName("");
    setSelectedOfferId(null);
    setProductPrice("");
  }, []);

  const switchScanMode = useCallback(
    (m: ScanMode) => {
      if (m === scanMode) return;
      setScanMode(m);
      reset();
    },
    [scanMode, reset]
  );

  /** Product photo → automated multi-store price search (labeled mock). */
  const searchProduct = useCallback(async () => {
    if (!image) return;
    setError(null);
    setPhase("analyzing");
    setStep(0);
    try {
      const request = mockProductSearch(image.base64);
      await sleep(450);
      setStep(1); // searching images
      await sleep(650);
      setStep(2); // comparing prices
      const result = await request;
      setProduct(result);
      setProductName(result.productName);
      setCategory(result.category);
      const best = result.offers[0] ?? null;
      setSelectedOfferId(best ? best.id : null);
      setProductPrice(best ? best.price.toFixed(2) : "");
      setPhase("review");
    } catch {
      setError("scan.errAnalyze");
      setPhase("capture");
    }
  }, [image]);

  const selectOffer = useCallback((o: ProductOffer) => {
    setSelectedOfferId(o.id);
    setProductPrice(o.price.toFixed(2));
  }, []);

  // Manual price entry always wins — typing detaches the offer selection.
  const changeProductPrice = useCallback(
    (v: string) => {
      setProductPrice(v);
      const sel = product?.offers.find((o) => o.id === selectedOfferId);
      if (sel && parseFloat(v) !== sel.price) setSelectedOfferId(null);
    },
    [product, selectedOfferId]
  );

  const logProduct = useCallback(() => {
    if (!me) return;
    const amount = Math.round(parseFloat(productPrice) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || !productName.trim()) return;
    const tx = addTransaction({
      memberId: me.id,
      amount,
      category,
      label: productName.trim(),
      source: "scan",
      items: [{ name: productName.trim(), price: amount }],
    });
    setLoggedTx(tx);
    setMode("mock");
    setPhase("logged");
  }, [me, productPrice, productName, category, addTransaction]);

  const analyze = useCallback(async () => {
    if (!image) return;
    setError(null);
    setPhase("analyzing");
    setStep(0);

    try {
      // Static deployments (e.g. GitHub Pages) have no API server at all —
      // fall back to the same labeled client-side mock the keyless server
      // uses. A live-API failure (5xx) still surfaces the error banner.
      const request = (async (): Promise<VisionPayload> => {
        let res: Response;
        try {
          res = await fetch("/api/vision", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: image.base64,
              mediaType: image.mediaType,
            }),
          });
        } catch {
          return mockExtract(image.base64); // no server reachable
        }
        if (res.ok) return res.json();
        // Our API route always returns a JSON {error} body. Anything else
        // (404/405/501 HTML from a static host) means the route simply
        // isn't deployed — use the labeled client-side mock instead.
        const isApiError = await res
          .clone()
          .json()
          .then((j) => typeof j?.error === "string")
          .catch(() => false);
        if (!isApiError) return mockExtract(image.base64);
        throw new Error(`Vision API returned ${res.status}`);
      })();

      await sleep(450);
      setStep(1); // AI reading

      const data = await request;

      setStep(2); // Matching history
      await sleep(650);

      const matches = matchHistoricalPrices(
        data.items,
        transactions,
        PRODUCT_REGISTRY
      );
      const nextRows: EditableRow[] = matches.map((m) => {
        // The receipt is the source of truth: prefill the vision-extracted
        // price and keep the historical price purely as a comparison badge.
        const prefill = m.visionPrice ?? m.historicalPrice;
        return {
          id: uid("row"),
          name: m.name,
          price: prefill != null ? prefill.toFixed(2) : "",
          historicalPrice: m.historicalPrice,
          matched: m.matched,
          suggestedCategory: m.suggestedCategory,
        };
      });

      setMode(data.mode);
      setMerchant(data.merchant);
      setRows(nextRows);
      setCategory(dominantCategory(nextRows));
      setPhase("review");
    } catch {
      setError("scan.errAnalyze");
      setPhase("capture");
    }
  }, [image, transactions]);

  const handleRowChange = useCallback(
    (id: string, patch: Partial<Pick<EditableRow, "name" | "price">>) => {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    },
    []
  );

  const handleRowRemove = useCallback((id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }, []);

  const handleRowAdd = useCallback(() => {
    setRows((rs) => [
      ...rs,
      {
        id: uid("row"),
        name: "",
        price: "",
        historicalPrice: null,
        matched: false,
        suggestedCategory: category,
      },
    ]);
  }, [category]);

  const logToLedger = useCallback(() => {
    if (!me) return;
    // Priced-but-unnamed rows are kept as "Unnamed item" so the logged
    // amount always equals the sum of the line items shown.
    const items: ReceiptItem[] = rows
      .filter((r) => isFinite(parseFloat(r.price)) && parseFloat(r.price) > 0)
      .map((r) => ({
        name: r.name.trim() || t("scan.unnamedItem"),
        price: Math.round(parseFloat(r.price) * 100) / 100,
        historicalPrice: r.historicalPrice,
        matched: r.matched,
      }));
    const total =
      Math.round(items.reduce((a, it) => a + it.price, 0) * 100) / 100;
    if (total <= 0 || !merchant.trim()) return;

    const tx = addTransaction({
      memberId: me.id,
      amount: total,
      category,
      label: merchant.trim(),
      source: "scan",
      items,
    });
    setLoggedTx(tx);
    setPhase("logged");
  }, [me, rows, merchant, category, addTransaction, t]);

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-5 animate-fade-up md:mb-7">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            {t("scan.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            {scanMode === "receipt"
              ? t("scan.subtitle")
              : t("scan.product.subtitle")}
          </p>
        </header>

        {/* Receipt / Product mode switcher */}
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          {(
            [
              { id: "receipt", icon: ReceiptText, key: "scan.mode.receipt" },
              { id: "product", icon: Tag, key: "scan.mode.product" },
            ] as const
          ).map((m) => {
            const sel = scanMode === m.id;
            return (
              <button
                key={m.id}
                aria-pressed={sel}
                onClick={() => switchScanMode(m.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  sel
                    ? "bg-surface-1 text-ink shadow-card"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                <m.icon size={15} />
                {t(m.key)}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2.5 rounded-xl bg-[color-mix(in_srgb,var(--negative)_12%,transparent)] px-4 py-3 text-sm text-negative"
            >
              <TriangleAlert size={16} className="shrink-0" />
              {t(error)}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "capture" && (
          <CaptureZone
            previewUrl={image?.previewUrl ?? null}
            fileName={image?.fileName ?? null}
            onSelect={handleSelect}
            onClear={() => setImage(null)}
            onAnalyze={scanMode === "receipt" ? analyze : searchProduct}
          />
        )}

        {phase === "analyzing" && (
          <ScanProgress
            step={step}
            stepKeys={scanMode === "product" ? PRODUCT_STEPS : undefined}
          />
        )}

        {phase === "review" && scanMode === "product" && product && (
          <ProductResults
            productName={productName}
            onNameChange={setProductName}
            offers={product.offers}
            selectedOfferId={selectedOfferId}
            onSelectOffer={selectOffer}
            price={productPrice}
            onPriceChange={changeProductPrice}
            category={category}
            onCategoryChange={setCategory}
            onLog={logProduct}
          />
        )}

        {phase === "review" && scanMode === "receipt" && (
          <ResultsSheet
            merchant={merchant}
            onMerchantChange={setMerchant}
            rows={rows}
            onRowChange={handleRowChange}
            onRowRemove={handleRowRemove}
            onRowAdd={handleRowAdd}
            category={category}
            onCategoryChange={setCategory}
            mode={mode}
            onLog={logToLedger}
          />
        )}

        {phase === "logged" && loggedTx && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="card flex flex-col items-center gap-4 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--positive)_15%,transparent)] text-positive"
            >
              <Check size={30} strokeWidth={2.6} />
            </motion.div>
            <div>
              <p className="text-base font-semibold">{t("scan.loggedTitle")}</p>
              <p className="mt-1 text-sm text-ink-dim">
                <span dir="ltr" className="tabular font-semibold text-ink">
                  {fmtMoney(loggedTx.amount)}
                </span>{" "}
                {t("scan.loggedAt", { merchant: loggedTx.label })}
                {loggedTx.items?.length
                  ? ` · ${
                      loggedTx.items.length === 1
                        ? t("scan.itemsOne")
                        : t("scan.itemsMany", { n: loggedTx.items.length })
                    }`
                  : ""}
              </p>
              {mode === "mock" && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  {t("scan.mockNote")}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/ledger" className="btn-primary">
                {t("scan.viewLedger")}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </Link>
              <button onClick={reset} className="btn-ghost">
                <RotateCcw size={14} />
                {t("scan.scanAnother")}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

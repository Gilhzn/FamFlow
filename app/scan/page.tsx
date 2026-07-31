"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, TriangleAlert } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { CATEGORIES, CategoryId, ReceiptItem, Transaction, uid } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { PRODUCT_REGISTRY } from "@/lib/seed";
import { matchHistoricalPrices } from "@/lib/vision";
import CaptureZone from "@/components/scan/CaptureZone";
import ScanProgress from "@/components/scan/ScanProgress";
import ResultsSheet, {
  EditableRow,
  rowTotal,
} from "@/components/scan/ResultsSheet";

type Phase = "capture" | "analyzing" | "review" | "logged";

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
  const me = useCurrentMember();
  const transactions = useFam((s) => s.transactions);
  const addTransaction = useFam((s) => s.addTransaction);

  const [phase, setPhase] = useState<Phase>("capture");
  const [image, setImage] = useState<ImageData | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const [merchant, setMerchant] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [category, setCategory] = useState<CategoryId>("food");
  const [loggedTx, setLoggedTx] = useState<Transaction | null>(null);

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
    reader.onerror = () => setError("Couldn't read that image — try another one.");
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
  }, []);

  const analyze = useCallback(async () => {
    if (!image) return;
    setError(null);
    setPhase("analyzing");
    setStep(0);

    try {
      const request = fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.base64,
          mediaType: image.mediaType,
        }),
      });

      await sleep(450);
      setStep(1); // AI reading

      const res = await request;
      if (!res.ok) throw new Error(`Vision API returned ${res.status}`);
      const data: {
        mode: "live" | "mock";
        merchant: string;
        items: { name: string; price: number }[];
      } = await res.json();

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
      setError("Analysis failed — check your connection and try again.");
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
        name: r.name.trim() || "Unnamed item",
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
  }, [me, rows, merchant, category, addTransaction]);

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-5 animate-fade-up md:mb-7">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            AI Vision Scan
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Photo → line items → price history → ledger, in one flow.
          </p>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2.5 rounded-xl bg-[color-mix(in_srgb,var(--negative)_12%,transparent)] px-4 py-3 text-sm text-negative"
            >
              <TriangleAlert size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "capture" && (
          <CaptureZone
            previewUrl={image?.previewUrl ?? null}
            fileName={image?.fileName ?? null}
            onSelect={handleSelect}
            onClear={() => setImage(null)}
            onAnalyze={analyze}
          />
        )}

        {phase === "analyzing" && <ScanProgress step={step} />}

        {phase === "review" && (
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
              <p className="text-base font-semibold">Logged to ledger</p>
              <p className="mt-1 text-sm text-ink-dim">
                <span className="tabular font-semibold text-ink">
                  {fmtMoney(loggedTx.amount)}
                </span>{" "}
                at {loggedTx.label}
                {loggedTx.items?.length
                  ? ` · ${loggedTx.items.length} item${
                      loggedTx.items.length === 1 ? "" : "s"
                    }`
                  : ""}
              </p>
              {mode === "mock" && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  Extracted with mock vision (no API key configured).
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/ledger" className="btn-primary">
                View in ledger
                <ArrowRight size={15} />
              </Link>
              <button onClick={reset} className="btn-ghost">
                <RotateCcw size={14} />
                Scan another
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { WalletCard } from "@/lib/types";
import type { CardBrand } from "@/lib/stripe-mock";

export const BRAND_GRADIENT: Record<CardBrand, string> = {
  visa: "linear-gradient(135deg, #2b4acb 0%, #4c3fd4 55%, #7048e8 100%)",
  mastercard: "linear-gradient(135deg, #e8590c 0%, #e03131 60%, #b02525 100%)",
  amex: "linear-gradient(135deg, #087f5b 0%, #0ca678 55%, #1098ad 100%)",
};

/** Subtle film-grain noise, inlined so no external asset is needed. */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export function BrandWordmark({
  brand,
  className = "",
}: {
  brand: CardBrand;
  className?: string;
}) {
  if (brand === "visa") {
    return (
      <span className={`font-sans text-lg font-black italic tracking-tighter ${className}`}>
        VISA
      </span>
    );
  }
  if (brand === "mastercard") {
    return (
      <span className={`flex items-center ${className}`} aria-label="Mastercard">
        <span className="h-5 w-5 rounded-full bg-[#eb001b]/90" />
        <span className="-ml-2 h-5 w-5 rounded-full bg-[#f79e1b]/90 mix-blend-screen" />
      </span>
    );
  }
  return (
    <span
      className={`rounded-[3px] border border-white/70 px-1 py-px text-[10px] font-extrabold tracking-[0.18em] ${className}`}
    >
      AMEX
    </span>
  );
}

function ChipGlyph() {
  return (
    <span className="flex h-6 w-8 items-center justify-center rounded-[5px] bg-gradient-to-br from-yellow-200/80 to-yellow-500/70 shadow-inner">
      <span className="grid h-4 w-6 grid-cols-3 gap-px opacity-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="rounded-[1px] border border-black/50" />
        ))}
      </span>
    </span>
  );
}

interface Props {
  card: WalletCard;
  holderName: string;
  /** Extra caption under the holder line (e.g. owner label for admins). */
  ownerLabel?: string;
  onRemove?: () => void;
}

export default function CardVisual({ card, holderName, ownerLabel, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const masked =
    card.brand === "amex"
      ? `•••• •••••• •${card.last4}`
      : `•••• •••• •••• ${card.last4}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="group relative aspect-[1.6] w-full select-none overflow-hidden rounded-2xl text-white shadow-pop"
      style={{ background: BRAND_GRADIENT[card.brand] }}
    >
      {/* noise + shine overlays */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 15% -10%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 38%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.10) 50%, transparent 58%)",
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <ChipGlyph />
          <BrandWordmark brand={card.brand} className="drop-shadow" />
        </div>

        <p className="tabular text-base font-medium tracking-[0.14em] drop-shadow-sm sm:text-lg">
          {masked}
        </p>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">
              Cardholder
            </p>
            <p className="truncate text-[13px] font-semibold uppercase tracking-wider">
              {holderName}
            </p>
            {ownerLabel && (
              <p className="mt-0.5 truncate text-[10px] text-white/60">{ownerLabel}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">Exp</p>
            <p className="tabular text-[13px] font-semibold">
              {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
            </p>
          </div>
        </div>
      </div>

      {onRemove && (
        <button
          aria-label="Remove card"
          onClick={() => setConfirming(true)}
          className="absolute right-3 top-3 rounded-lg bg-black/25 p-1.5 text-white/70 opacity-60 backdrop-blur-sm transition-all hover:bg-black/45 hover:text-white group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* remove confirmation overlay */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 backdrop-blur-sm"
          >
            <p className="text-sm font-semibold">Remove this card?</p>
            <p className="-mt-2 text-xs text-white/60">
              {card.brand} •••• {card.last4} will be detached.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onRemove?.()}
                className="rounded-xl bg-negative px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/25 active:scale-95"
              >
                Keep
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

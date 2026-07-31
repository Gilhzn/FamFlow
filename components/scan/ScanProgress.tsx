"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

/** i18n keys for the three scan phases, in order. */
export const SCAN_STEPS = [
  "scan.step.upload",
  "scan.step.reading",
  "scan.step.matching",
] as const;

/** i18n keys for the product-search phases, in order. */
export const PRODUCT_STEPS = [
  "scan.product.step.barcode",
  "scan.product.step.lookup",
  "scan.product.step.prices",
] as const;

interface ScanProgressProps {
  step: number; // index of the currently active step
  stepKeys?: readonly string[];
}

export default function ScanProgress({ step, stepKeys = SCAN_STEPS }: ScanProgressProps) {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-2">
        {stepKeys.map((key, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={key} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300 ${
                  done
                    ? "bg-positive text-surface-0"
                    : active
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-ink-faint"
                }`}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} />
                ) : active ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`truncate text-xs font-medium transition-colors ${
                  active ? "text-ink" : done ? "text-ink-dim" : "text-ink-faint"
                }`}
              >
                {t(key)}
              </span>
              {i < stepKeys.length - 1 && (
                <div
                  className={`h-px min-w-3 flex-1 transition-colors duration-300 ${
                    done ? "bg-[color-mix(in_srgb,var(--positive)_50%,transparent)]" : "bg-line"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Shimmering receipt skeleton */}
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4"
            style={{ opacity: 1 - i * 0.14 }}
          >
            <div
              className="skeleton h-3.5"
              style={{ width: `${52 - (i % 3) * 9}%` }}
            />
            <div className="skeleton h-3.5 w-14 shrink-0" />
          </div>
        ))}
        <div className="!mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
        </div>
      </div>
    </motion.div>
  );
}

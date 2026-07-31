"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Granularity, GRANULARITIES } from "./periods";

export default function PeriodToggle({
  granularity,
  onGranularity,
  label,
  onNav,
  atCurrent,
}: {
  granularity: Granularity;
  onGranularity: (g: Granularity) => void;
  label: string;
  onNav: (dir: -1 | 1) => void;
  atCurrent: boolean;
}) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Segmented control with sliding indicator */}
      <div
        role="tablist"
        aria-label={t("analytics.granAria")}
        className="flex w-full rounded-xl bg-surface-2 p-1 sm:w-auto"
      >
        {GRANULARITIES.map((g) => {
          const active = g === granularity;
          return (
            <button
              key={g}
              role="tab"
              aria-selected={active}
              onClick={() => onGranularity(g)}
              className={`relative flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 sm:flex-none sm:px-5 ${
                active ? "text-ink" : "text-ink-dim hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="period-seg-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  className="absolute inset-0 rounded-lg bg-surface-3 shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_0_0_1px_var(--line)]"
                />
              )}
              <span className="relative z-10">{t(`analytics.gran.${g}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Prev / label / next — onNav(-1) is always chronologically backward;
          rtl:rotate-180 flips the glyphs so the arrows point outward in RTL too. */}
      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          onClick={() => onNav(-1)}
          aria-label={t("analytics.prevPeriod")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink active:scale-95"
        >
          <ChevronLeft size={17} className="rtl:rotate-180" />
        </button>
        <p className="min-w-0 truncate px-1 text-center text-sm font-semibold sm:min-w-[150px]">
          {label}
        </p>
        <button
          onClick={() => onNav(1)}
          disabled={atCurrent}
          aria-label={t("analytics.nextPeriod")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={17} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}

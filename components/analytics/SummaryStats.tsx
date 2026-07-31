"use client";

import { fmtMoney } from "@/lib/format";
import { CategoryDef } from "@/lib/types";

function DeltaChip({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="chip bg-surface-2 text-ink-faint" title="No previous-period data">
        —
      </span>
    );
  }
  const up = pct >= 0;
  const color = up ? "var(--negative)" : "var(--positive)";
  return (
    <span
      className="chip tabular font-semibold"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
      }}
    >
      {up ? "▲" : "▼"} {up ? "+" : "−"}
      {Math.abs(pct) >= 1000 ? Math.round(Math.abs(pct)).toLocaleString("en-US") : Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}
      %
    </span>
  );
}

export default function SummaryStats({
  total,
  avg,
  avgLabel,
  topCategory,
  deltaPct,
  prevLabel,
}: {
  total: number;
  avg: number;
  avgLabel: string;
  topCategory: CategoryDef | null;
  deltaPct: number | null;
  prevLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Total spent
        </p>
        <p className="tabular mt-1.5 truncate text-xl font-semibold">
          {fmtMoney(total, { compact: true })}
        </p>
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {avgLabel}
        </p>
        <p className="tabular mt-1.5 truncate text-xl font-semibold">
          {fmtMoney(avg, { compact: true })}
        </p>
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Top category
        </p>
        {topCategory ? (
          <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xl font-semibold">
            <span className="text-lg leading-none">{topCategory.emoji}</span>
            <span className="truncate text-base leading-tight">
              {topCategory.label.split(" ")[0]}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 text-xl font-semibold text-ink-faint">—</p>
        )}
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          vs {prevLabel}
        </p>
        <div className="mt-1.5">
          <DeltaChip pct={deltaPct} />
        </div>
      </div>
    </div>
  );
}

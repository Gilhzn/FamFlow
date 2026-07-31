"use client";

import { useT } from "@/lib/i18n";
import { fmtMoney } from "@/lib/format";
import { CategoryDef } from "@/lib/types";

function DeltaChip({ pct }: { pct: number | null }) {
  const { t } = useT();
  if (pct === null) {
    return (
      <span className="chip bg-surface-2 text-ink-faint" title={t("analytics.noPrevData")}>
        —
      </span>
    );
  }
  if (Math.round(Math.abs(pct) * 10) === 0) {
    return (
      <span
        dir="ltr"
        className="chip bg-surface-2 text-ink-faint"
        title={t("analytics.flatVsPrev")}
      >
        0%
      </span>
    );
  }
  const up = pct > 0;
  const color = up ? "var(--negative)" : "var(--positive)";
  return (
    <span
      dir="ltr"
      className="chip tabular max-w-full font-semibold"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
      }}
    >
      {up ? "▲" : "▼"} {up ? "+" : "−"}
      {Math.abs(pct) > 999 ? ">999" : Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}
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
  const { t } = useT();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {t("analytics.totalSpent")}
        </p>
        <p className="tabular mt-1.5 truncate text-xl font-semibold">
          <span dir="ltr">{fmtMoney(total, { compact: true })}</span>
        </p>
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {avgLabel}
        </p>
        <p className="tabular mt-1.5 truncate text-xl font-semibold">
          <span dir="ltr">{fmtMoney(avg, { compact: true })}</span>
        </p>
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {t("analytics.topCategory")}
        </p>
        {topCategory ? (
          <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xl font-semibold">
            <span className="text-lg leading-none">{topCategory.emoji}</span>
            <span className="truncate text-base leading-tight">
              {t(`cat.${topCategory.id}.short`)}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 text-xl font-semibold text-ink-faint">—</p>
        )}
      </div>

      <div className="card min-w-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {prevLabel}
        </p>
        <div className="mt-1.5">
          <DeltaChip pct={deltaPct} />
        </div>
      </div>
    </div>
  );
}

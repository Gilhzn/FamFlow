"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useT } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export interface CategorySlice {
  id: string;
  label: string;
  emoji: string;
  color: string;
  value: number;
}

function DonutTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategorySlice }>;
}) {
  const { lang } = useT();
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div
      dir={lang === "he" ? "rtl" : "ltr"}
      className="rounded-xl border border-line bg-surface-3 px-3 py-2 shadow-pop"
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
        <span>{s.emoji}</span>
        {s.label}
      </p>
      <p className="tabular mt-0.5 text-xs text-ink-dim">
        <span dir="ltr">{fmtMoney(s.value)}</span>
      </p>
    </div>
  );
}

export default function CategoryDonut({
  slices,
  total,
}: {
  slices: CategorySlice[];
  total: number;
}) {
  const { t } = useT();
  const nonZero = slices.filter((s) => s.value > 0);
  const empty = total === 0;
  const pieData = empty
    ? [
        {
          id: "empty",
          label: t("analytics.noSpending"),
          emoji: "",
          color: "var(--surface-3)",
          value: 1,
        },
      ]
    : nonZero;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      {/* recharts is not RTL-aware — the donut always renders LTR. */}
      <div dir="ltr" className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={empty || pieData.length < 2 ? 0 : 2.5}
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface-1)"
              strokeWidth={2}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {pieData.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
            {!empty && <Tooltip content={<DonutTip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p dir="ltr" className="tabular text-lg font-semibold leading-tight">
            {fmtMoney(total, { compact: true })}
          </p>
          <p className="text-[11px] text-ink-faint">{t("analytics.donutTotal")}</p>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1 space-y-2.5">
        {CATEGORIES.map((cat) => {
          const value = slices.find((s) => s.id === cat.id)?.value ?? 0;
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={cat.id} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                style={{ background: cat.color, opacity: value > 0 ? 1 : 0.3 }}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink-dim">
                {cat.emoji} {t(`cat.${cat.id}.short`)}
              </span>
              <span dir="ltr" className="tabular shrink-0 text-[13px] font-medium">
                {fmtMoney(value, { compact: true })}
              </span>
              <span className="tabular w-10 shrink-0 text-end text-[11px] text-ink-faint">
                <span dir="ltr">
                  {total > 0 ? `${pct < 1 && pct > 0 ? "<1" : Math.round(pct)}%` : "—"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

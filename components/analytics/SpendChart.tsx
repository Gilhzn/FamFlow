"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesColumn } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Bucket, Granularity, STACK_ORDER, tickMoney, xTicks } from "./periods";

/**
 * Custom stack segment: 1px surface gap between stacked fills, and a rounded
 * top on whichever segment is topmost (non-zero) in its bar.
 */
function StackSegment(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  dataKey?: string;
  payload?: Bucket;
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill, dataKey, payload } = props;
  if (!payload || height <= 0 || width <= 0) return <g />;
  const topKey = [...STACK_ORDER].reverse().find((k) => payload[k] > 0);
  const isTop = dataKey === topKey;
  const gap = !isTop && height > 2 ? 1 : 0;
  const gy = y + gap;
  const gh = height - gap;
  const r = isTop ? Math.min(4, width / 2, gh) : 0;
  const d = `M${x},${gy + r}
    Q${x},${gy} ${x + r},${gy}
    L${x + width - r},${gy}
    Q${x + width},${gy} ${x + width},${gy + r}
    L${x + width},${gy + gh}
    L${x},${gy + gh}
    Z`;
  return <path d={d} fill={fill} />;
}

function ChartTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Bucket }>;
}) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  const rows = STACK_ORDER.filter((k) => b[k] > 0);
  return (
    <div className="min-w-[150px] rounded-xl border border-line bg-surface-3 px-3 py-2.5 shadow-pop">
      <p className="text-xs font-semibold text-ink">{b.tip}</p>
      {rows.length === 0 ? (
        <p className="mt-1 text-xs text-ink-faint">No spending</p>
      ) : (
        <>
          <div className="mt-1.5 space-y-1">
            {rows.map((k) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: CATEGORY_MAP[k].color }}
                />
                <span className="flex-1 text-ink-dim">
                  {CATEGORY_MAP[k].label.split(" ")[0]}
                </span>
                <span className="tabular font-medium text-ink">{fmtMoney(b[k])}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5 text-xs">
            <span className="text-ink-faint">Total</span>
            <span className="tabular font-semibold text-ink">{fmtMoney(b.total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function SpendChart({
  buckets,
  granularity,
  total,
}: {
  buckets: Bucket[];
  granularity: Granularity;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
          <ChartNoAxesColumn size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-dim">No spending this period</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Transactions will appear here the moment they land.
          </p>
        </div>
      </div>
    );
  }

  const ticks = xTicks(granularity, buckets);

  return (
    <div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            barCategoryGap={granularity === "week" ? "28%" : "18%"}
          >
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="label"
              ticks={ticks}
              interval={0}
              tickFormatter={
                granularity === "year" ? (v: string) => v.charAt(0) : undefined
              }
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              width={44}
              tickFormatter={tickMoney}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              content={<ChartTip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            {STACK_ORDER.map((k) => (
              <Bar
                key={k}
                dataKey={k}
                stackId="spend"
                fill={CATEGORY_MAP[k].color}
                shape={<StackSegment />}
                animationDuration={550}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
        {STACK_ORDER.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[11px] text-ink-dim">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: CATEGORY_MAP[k].color }}
            />
            {CATEGORY_MAP[k].label.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

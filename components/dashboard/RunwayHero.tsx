"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Flame, CalendarDays, TrendingUp } from "lucide-react";
import { useFam } from "@/lib/store";
import { computeRunway, inMonth, monthWindow } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";

const DAY = 86_400_000;

interface Point {
  day: number;
  actual: number | null;
  projected: number | null;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number | null; dataKey: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const projected = payload.find((p) => p.dataKey === "projected")?.value;
  const actual = payload.find((p) => p.dataKey === "actual")?.value;
  const value = actual ?? projected;
  if (value == null) return null;
  return (
    <div className="rounded-xl bg-surface-3 px-3 py-2 text-xs shadow-pop">
      <p className="text-ink-faint">Day {label}</p>
      <p className="tabular mt-0.5 font-semibold text-ink">
        {fmtMoney(value)}{" "}
        <span className="font-normal text-ink-dim">
          {actual == null ? "projected" : "spent"}
        </span>
      </p>
    </div>
  );
}

export default function RunwayHero() {
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);

  const state = { members, transactions, alerts, cards, settings };
  const runway = useMemo(
    () => computeRunway(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, settings]
  );

  const budget = settings.monthlyBudget;
  const onTrack = runway.projectedDelta >= 0;

  const data: Point[] = useMemo(() => {
    const now = Date.now();
    const { start, daysInMonth } = monthWindow(now);
    const perDay = new Array<number>(daysInMonth + 1).fill(0);
    for (const t of transactions) {
      if (!inMonth(t, now)) continue;
      const d = Math.min(
        daysInMonth,
        Math.max(1, Math.floor((t.ts - start) / DAY) + 1)
      );
      perDay[d] += t.amount;
    }
    const points: Point[] = [{ day: 0, actual: 0, projected: null }];
    let cum = 0;
    for (let d = 1; d <= runway.daysElapsed; d++) {
      cum += perDay[d];
      points.push({ day: d, actual: cum, projected: null });
    }
    // Projection: dashed continuation from today to month end
    const last = points[points.length - 1];
    last.projected = last.actual;
    for (let d = runway.daysElapsed + 1; d <= daysInMonth; d++) {
      points.push({
        day: d,
        actual: null,
        projected: runway.spentSoFar + runway.dailyBurn * (d - runway.daysElapsed),
      });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, runway.daysElapsed, runway.dailyBurn, runway.spentSoFar]);

  const yMax = Math.max(budget * 1.08, runway.projectedTotal * 1.05, 1);
  const projColor = onTrack ? "var(--positive)" : "var(--negative)";

  return (
    <section className="card overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <h2 className="text-sm font-semibold">Predictive runway</h2>
          </div>
          <span className="chip bg-surface-2 capitalize text-ink-faint">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  runway.confidence === "high"
                    ? "var(--positive)"
                    : runway.confidence === "medium"
                      ? "var(--warning)"
                      : "var(--ink-faint)",
              }}
            />
            {runway.confidence} confidence
          </span>
        </div>

        {/* Headline numbers */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              Projected month-end
            </p>
            <p
              className={`tabular mt-1 truncate text-xl font-semibold md:text-2xl ${
                onTrack ? "text-ink" : "text-negative"
              }`}
            >
              {fmtMoney(runway.projectedTotal, { compact: true })}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint">
              Budget
            </p>
            <p className="tabular mt-1 truncate text-xl font-semibold text-ink-dim md:text-2xl">
              {fmtMoney(budget, { compact: true })}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-faint">
              <Flame size={11} /> Daily burn
            </p>
            <p className="tabular mt-1 truncate text-xl font-semibold md:text-2xl">
              {fmtMoney(runway.dailyBurn)}
              <span className="text-sm font-normal text-ink-faint">/day</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-faint">
              <CalendarDays size={11} /> Month progress
            </p>
            <p className="tabular mt-1 truncate text-xl font-semibold md:text-2xl">
              {runway.daysElapsed}
              <span className="text-sm font-normal text-ink-faint">
                /{runway.daysInMonth} days
              </span>
            </p>
          </div>
        </div>

        {/* Cumulative spend + projection chart */}
        <div className="mt-5 h-36 w-full md:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="runwayFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                type="number"
                domain={[0, runway.daysInMonth]}
                ticks={[1, Math.round(runway.daysInMonth / 2), runway.daysInMonth]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d: number) => `d${d}`}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide domain={[0, yMax]} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--line)", strokeWidth: 1 }}
              />
              <ReferenceLine
                y={budget}
                stroke="var(--ink-faint)"
                strokeDasharray="3 4"
                strokeOpacity={0.7}
                label={{
                  value: "budget",
                  position: "insideTopRight",
                  fill: "var(--ink-faint)",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#runwayFill)"
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke={projColor}
                strokeWidth={2}
                strokeDasharray="4 5"
                fill="none"
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trajectory verdict strip */}
      {onTrack ? (
        <div
          className="flex items-center gap-2.5 border-t border-line px-5 py-3 md:px-6"
          style={{ background: "color-mix(in srgb, var(--positive) 10%, transparent)" }}
        >
          <CheckCircle2 size={16} className="shrink-0 text-positive" />
          <p className="min-w-0 text-[13px] font-medium text-positive">
            On track —{" "}
            <span className="tabular">{fmtMoney(runway.projectedDelta)}</span>{" "}
            headroom projected at month end.
          </p>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 border-t border-line px-5 py-3 md:px-6"
          style={{ background: "color-mix(in srgb, var(--negative) 10%, transparent)" }}
        >
          <AlertTriangle
            size={16}
            className="shrink-0 animate-pulse-dot text-negative"
          />
          <p className="min-w-0 text-[13px] font-medium text-negative">
            On this trajectory you&apos;ll be{" "}
            <span className="tabular font-semibold">
              {fmtMoney(Math.abs(runway.projectedDelta))}
            </span>{" "}
            over budget
            {runway.overdraftDay != null && (
              <> by day {runway.overdraftDay}</>
            )}
            .
          </p>
        </div>
      )}
    </section>
  );
}

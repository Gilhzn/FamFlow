"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useFam } from "@/lib/store";
import { CATEGORIES, CategoryDef } from "@/lib/types";
import PeriodToggle from "@/components/analytics/PeriodToggle";
import SummaryStats from "@/components/analytics/SummaryStats";
import SpendChart from "@/components/analytics/SpendChart";
import CategoryDonut from "@/components/analytics/CategoryDonut";
import MemberBars from "@/components/analytics/MemberBars";
import {
  Granularity,
  buildBuckets,
  periodLabel,
  periodWindow,
} from "@/components/analytics/periods";

const HOUR = 3_600_000;
const DAY = 86_400_000;

export default function AnalyticsPage() {
  const transactions = useFam((s) => s.transactions);
  const members = useFam((s) => s.members);

  const [granularity, setGranularityRaw] = useState<Granularity>("month");
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(0);

  const setGranularity = (g: Granularity) => {
    if (g === granularity) return;
    setGranularityRaw(g);
    setOffset(0);
    setDir(0);
  };
  const nav = (d: -1 | 1) => {
    setOffset((o) => Math.min(0, o + d));
    setDir(d);
  };

  const data = useMemo(() => {
    const now = Date.now();
    const win = periodWindow(granularity, offset, now);
    const prevWin = periodWindow(granularity, offset - 1, now);

    const inWin = transactions.filter((t) => t.ts >= win.start && t.ts < win.end);
    const prevTotal = transactions
      .filter((t) => t.ts >= prevWin.start && t.ts < prevWin.end)
      .reduce((a, t) => a + t.amount, 0);

    const buckets = buildBuckets(granularity, win, inWin);
    const total = inWin.reduce((a, t) => a + t.amount, 0);

    // Average per day (per hour when viewing a single day). For the current,
    // still-running period divide by elapsed units so the average is honest.
    const current = now >= win.start && now < win.end;
    let avg: number;
    let avgLabel: string;
    if (granularity === "day") {
      const units = current
        ? Math.min(24, Math.max(1, Math.ceil((now - win.start) / HOUR)))
        : 24;
      avg = total / units;
      avgLabel = "Avg / hour";
    } else {
      const units = current
        ? Math.min(win.days, Math.max(1, Math.ceil((now - win.start) / DAY)))
        : win.days;
      avg = total / units;
      avgLabel = "Avg / day";
    }

    const slices = CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      color: c.color,
      value: inWin
        .filter((t) => t.category === c.id)
        .reduce((a, t) => a + t.amount, 0),
    }));

    let topCategory: CategoryDef | null = null;
    if (total > 0) {
      const top = [...slices].sort((a, b) => b.value - a.value)[0];
      topCategory = CATEGORIES.find((c) => c.id === top.id) ?? null;
    }

    const deltaPct =
      prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

    const memberRows = members.map((m) => ({
      member: m,
      value: inWin
        .filter((t) => t.memberId === m.id)
        .reduce((a, t) => a + t.amount, 0),
    }));

    return {
      label: periodLabel(granularity, offset, win.start),
      buckets,
      total,
      avg,
      avgLabel,
      slices,
      topCategory,
      deltaPct,
      memberRows,
    };
  }, [transactions, members, granularity, offset]);

  const periodKey = `${granularity}:${offset}`;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="animate-fade-up">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Analytics
          </h1>
          <p className="mt-0.5 text-sm text-ink-dim">
            Family spending, sliced by time.
          </p>
        </header>

        <div className="mt-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <PeriodToggle
            granularity={granularity}
            onGranularity={setGranularity}
            label={data.label}
            onNav={nav}
            atCurrent={offset === 0}
          />
        </div>

        <motion.div
          key={periodKey}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 space-y-4 md:mt-5 md:space-y-5"
        >
          <SummaryStats
            total={data.total}
            avg={data.avg}
            avgLabel={data.avgLabel}
            topCategory={data.topCategory}
            deltaPct={data.deltaPct}
            prevLabel={`prev ${granularity}`}
          />

          <section className="card p-4 md:p-6">
            <h2 className="mb-4 text-sm font-semibold">Spending over time</h2>
            <SpendChart
              buckets={data.buckets}
              granularity={granularity}
              total={data.total}
            />
          </section>

          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            <section className="card min-w-0 p-4 md:p-6">
              <h2 className="mb-4 text-sm font-semibold">Category breakdown</h2>
              <CategoryDonut slices={data.slices} total={data.total} />
            </section>

            <section className="card min-w-0 p-4 md:p-6">
              <h2 className="mb-4 text-sm font-semibold">By member</h2>
              <MemberBars rows={data.memberRows} />
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

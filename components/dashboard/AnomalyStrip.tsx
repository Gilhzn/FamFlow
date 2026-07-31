"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useFam } from "@/lib/store";
import { detectAnomalies } from "@/lib/insights";
import { fmtMoney, fmtRelative } from "@/lib/format";

const DAY = 86_400_000;

export default function AnomalyStrip() {
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);

  const anomalies = useMemo(() => {
    const now = Date.now();
    return detectAnomalies(
      { members, transactions, alerts, cards, settings },
      now
    ).filter((a) => now - a.ts <= 14 * DAY);
  }, [members, transactions, alerts, cards, settings]);

  if (anomalies.length === 0) return null;
  const top = anomalies.slice(0, 2);

  return (
    <section
      className="card overflow-hidden border"
      style={{ borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)" }}
    >
      <div
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:px-5"
        style={{ background: "color-mix(in srgb, var(--warning) 6%, transparent)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-warning"
            style={{ background: "color-mix(in srgb, var(--warning) 15%, transparent)" }}
          >
            <ShieldAlert size={15} />
          </span>
          <p className="text-[13px] font-semibold text-warning">
            {anomalies.length}{" "}
            {anomalies.length === 1 ? "anomaly" : "anomalies"} in the last 14
            days
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:px-2">
          {top.map((a) => (
            <p key={a.txId + a.kind} className="min-w-0 truncate text-xs text-ink-dim">
              <span className="font-medium text-ink">{a.label}</span>{" "}
              <span className="tabular">{fmtMoney(a.amount)}</span>
              {a.kind === "recurring-spike" ? (
                <>
                  {" "}
                  — {a.deviationPct}% above its usual{" "}
                  <span className="tabular">{fmtMoney(a.expected)}</span>
                </>
              ) : (
                <> — unrecognized micro-charge</>
              )}{" "}
              <span className="text-ink-faint">· {fmtRelative(a.ts)}</span>
            </p>
          ))}
        </div>

        <Link
          href="/admin"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-surface-3 sm:self-center"
        >
          Review in Admin
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

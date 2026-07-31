"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { useFam } from "@/lib/store";
import { detectAnomalies } from "@/lib/insights";
import { fmtDay, fmtMoney } from "@/lib/format";

export default function AnomalyCenter() {
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);

  // Anomaly ids regenerate on every detection pass — key reviews by txId+kind.
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const anomalies = useMemo(
    () => detectAnomalies({ members, transactions, alerts, cards, settings }),
    [members, transactions, alerts, cards, settings]
  );
  const visible = anomalies.filter((a) => !reviewed.has(a.txId + a.kind));

  return (
    <section className="card animate-fade-up p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-warning"
            style={{
              background: "color-mix(in srgb, var(--warning) 14%, transparent)",
            }}
          >
            <ShieldAlert size={15} />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">
              Anomaly review center
            </h2>
            <p className="text-[11px] text-ink-faint">
              Recurring-charge spikes & unrecognized micro-charges
            </p>
          </div>
        </div>
        {visible.length > 0 && (
          <span
            className="chip shrink-0 text-warning tabular"
            style={{
              background: "color-mix(in srgb, var(--warning) 14%, transparent)",
            }}
          >
            {visible.length} open
          </span>
        )}
      </div>

      <div className="mt-3">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2.5 py-10 text-center"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-positive"
                style={{
                  background:
                    "color-mix(in srgb, var(--positive) 12%, transparent)",
                }}
              >
                <ShieldCheck size={20} />
              </span>
              <p className="text-sm font-medium text-positive">
                No anomalies — all recurring charges within normal bands.
              </p>
            </motion.div>
          ) : (
            visible.map((a) => {
              const spike = a.kind === "recurring-spike";
              const tone = spike ? "var(--warning)" : "var(--negative)";
              return (
                <motion.div
                  layout
                  key={a.txId + a.kind}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-line py-3.5 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="chip shrink-0"
                          style={{
                            color: tone,
                            background: `color-mix(in srgb, ${tone} 14%, transparent)`,
                          }}
                        >
                          {spike ? "Recurring spike" : "Unrecognized micro-charge"}
                        </span>
                        <p className="min-w-0 truncate text-[13px] font-medium">
                          {a.label}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-ink-dim">
                        <span className="tabular font-semibold text-ink">
                          {fmtMoney(a.amount)}
                        </span>
                        {spike ? (
                          <>
                            {" "}
                            vs expected{" "}
                            <span className="tabular">
                              {fmtMoney(a.expected)}
                            </span>{" "}
                            <span
                              className="tabular font-medium"
                              style={{ color: tone }}
                            >
                              +{a.deviationPct}%
                            </span>
                          </>
                        ) : (
                          <> at a never-seen merchant</>
                        )}
                        <span className="text-ink-faint"> · {fmtDay(a.ts)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setReviewed((s) => new Set(s).add(a.txId + a.kind))
                      }
                      className="btn-ghost shrink-0 self-start px-3 py-1.5 text-xs sm:self-center"
                    >
                      <Check size={13} />
                      Mark reviewed
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

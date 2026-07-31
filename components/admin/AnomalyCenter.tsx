"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { useFam } from "@/lib/store";
import { detectAnomalies } from "@/lib/insights";
import { fmtDay, fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { fill, Money } from "./i18nNodes";

const REVIEWED_KEY = "famflow_reviewed_anomalies_v1";

export default function AnomalyCenter() {
  const { t, lang } = useT();
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);

  // Anomaly ids regenerate on every detection pass — key reviews by txId+kind.
  // Persisted to localStorage so reviews survive navigation/reload; the
  // "storage" event mirrors them to other open tabs (matching FamSync's
  // cross-tab behavior).
  const [reviewed, setReviewed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(REVIEWED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(
        Array.isArray(arr) ? arr.filter((v) => typeof v === "string") : []
      );
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== REVIEWED_KEY || e.newValue == null) return;
      try {
        const arr = JSON.parse(e.newValue);
        if (Array.isArray(arr)) {
          setReviewed(new Set(arr.filter((v) => typeof v === "string")));
        }
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function markReviewed(key: string) {
    setReviewed((prev) => {
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem(REVIEWED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

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
              {t("admin.anomaly.title")}
            </h2>
            <p className="text-[11px] text-ink-faint">
              {t("admin.anomaly.subtitle")}
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
            {t("admin.anomaly.open", { n: visible.length })}
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
                {t("admin.anomaly.empty")}
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
                          {spike
                            ? t("admin.anomaly.spikeBadge")
                            : t("admin.anomaly.microBadge")}
                        </span>
                        <p className="min-w-0 truncate text-[13px] font-medium">
                          {a.label}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-ink-dim">
                        {spike
                          ? fill(t("admin.anomaly.vsExpected"), {
                              amt: (
                                <Money className="tabular font-semibold text-ink">
                                  {fmtMoney(a.amount)}
                                </Money>
                              ),
                              exp: <Money>{fmtMoney(a.expected)}</Money>,
                              dev: (
                                <Money
                                  className="tabular font-medium"
                                  style={{ color: tone }}
                                >
                                  +{a.deviationPct}%
                                </Money>
                              ),
                            })
                          : fill(t("admin.anomaly.neverSeen"), {
                              amt: (
                                <Money className="tabular font-semibold text-ink">
                                  {fmtMoney(a.amount)}
                                </Money>
                              ),
                            })}
                        <span className="text-ink-faint">
                          {" "}
                          · {fmtDay(a.ts, lang)}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        markReviewed(a.txId + a.kind)
                      }
                      className="btn-ghost shrink-0 self-start px-3 py-1.5 text-xs sm:self-center"
                    >
                      <Check size={13} />
                      {t("admin.anomaly.markReviewed")}
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

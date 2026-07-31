"use client";

import { motion } from "framer-motion";
import { useFam } from "@/lib/store";
import { inMonth, sum } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function CategoryPulse() {
  const { t } = useT();
  const transactions = useFam((s) => s.transactions);
  const caps = useFam((s) => s.settings.categoryCaps);

  const monthTx = transactions.filter((t) => inMonth(t));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CATEGORIES.map((cat, i) => {
        const spend = sum(monthTx.filter((t) => t.category === cat.id));
        const cap = caps[cat.id];
        const pct = cap != null && cap > 0 ? (spend / cap) * 100 : null;
        const over = pct != null && pct > 100;

        return (
          <div key={cat.id} className="card card-hover min-w-0 p-4">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{cat.emoji}</span>
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink-dim">
                {t(`cat.${cat.id}`)}
              </p>
            </div>
            <p
              className={`tabular mt-2.5 truncate text-lg font-semibold ${
                over ? "text-negative" : "text-ink"
              }`}
            >
              <span dir="ltr">{fmtMoney(spend, { compact: true })}</span>
            </p>
            <p className="tabular mt-0.5 text-[11px] text-ink-faint">
              {cap != null ? (
                <>
                  {t("dashboard.pulse.ofCap.pre")}{" "}
                  <span dir="ltr">{fmtMoney(cap, { compact: true })}</span>{" "}
                  {t("dashboard.pulse.ofCap.post")}
                </>
              ) : (
                t("dashboard.pulse.noCap")
              )}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct != null ? Math.min(100, pct) : 0}%` }}
                transition={{
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1 + i * 0.06,
                }}
                className="h-full rounded-full"
                style={{
                  background: over ? "var(--negative)" : cat.color,
                  opacity: pct == null ? 0.25 : 1,
                }}
              />
            </div>
            {over && (
              <p className="tabular mt-1.5 text-[11px] font-semibold text-negative">
                {t("dashboard.pulse.over.pre")}{" "}
                <span dir="ltr">{fmtMoney(spend - (cap as number))}</span>{" "}
                {t("dashboard.pulse.over.post")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

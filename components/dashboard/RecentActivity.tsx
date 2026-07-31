"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Receipt } from "lucide-react";
import { useFam } from "@/lib/store";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { CATEGORY_MAP } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function RecentActivity() {
  const { t, lang } = useT();
  const transactions = useFam((s) => s.transactions);
  const members = useFam((s) => s.members);

  const recent = [...transactions].sort((a, b) => b.ts - a.ts).slice(0, 5);

  return (
    <section className="card flex min-w-0 flex-col p-5">
      <div className="flex items-center gap-2">
        <Receipt size={16} className="text-accent" />
        <h2 className="text-sm font-semibold">{t("dashboard.activity.title")}</h2>
        <Link
          href="/ledger"
          className="ms-auto inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:brightness-125"
        >
          {t("dashboard.activity.view")}
          <ArrowRight size={12} className="rtl:rotate-180" />
        </Link>
      </div>

      <div className="mt-2 flex flex-1 flex-col">
        {recent.length === 0 && (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-xs text-ink-faint">
            {t("dashboard.activity.empty")}
          </p>
        )}
        {recent.map((tx, i) => {
          const member = members.find((m) => m.id === tx.memberId);
          const cat = CATEGORY_MAP[tx.category];
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.2 }}
              className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: member?.color ?? "var(--ink-faint)" }}
                title={member?.name}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{tx.label}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <span className="truncate">
                    {member?.name ?? t("dashboard.activity.unknown")} ·{" "}
                    {fmtRelative(tx.ts, lang)}
                  </span>
                </p>
              </div>
              <span
                className="chip shrink-0"
                style={{
                  background: `color-mix(in srgb, ${cat.color} 14%, transparent)`,
                  color: cat.color,
                }}
              >
                <span aria-hidden>{cat.emoji}</span>
                <span className="hidden sm:inline">
                  {t(`cat.${tx.category}.short`)}
                </span>
              </span>
              <span
                dir="ltr"
                className="tabular shrink-0 text-[13px] font-semibold"
              >
                {fmtMoney(tx.amount)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

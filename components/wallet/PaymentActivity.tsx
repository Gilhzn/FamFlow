"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { useFam } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { CATEGORY_MAP } from "@/lib/types";

export default function PaymentActivity() {
  const transactions = useFam((s) => s.transactions);
  const members = useFam((s) => s.members);
  const { t, lang } = useT();

  const { payments, totalCount } = useMemo(() => {
    const all = transactions
      .filter((t) => t.source === "payment")
      .sort((a, b) => b.ts - a.ts);
    return { payments: all.slice(0, 10), totalCount: all.length };
  }, [transactions]);

  const memberOf = (id: string) => members.find((m) => m.id === id);

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Receipt size={15} className="text-accent" />
          {t("wallet.activity.title")}
        </h2>
        <span className="text-xs text-ink-faint">{t("wallet.activity.via")}</span>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-xl bg-surface-2 px-4 py-8 text-center text-sm text-ink-faint">
          {t("wallet.activity.empty")}
        </p>
      ) : (
        <ul className="-mx-2">
          <AnimatePresence initial={false}>
            {payments.map((tx) => {
              const m = memberOf(tx.memberId);
              const cat = CATEGORY_MAP[tx.category] ?? {
                color: "var(--surface-3)",
                label: "Other",
                emoji: "•",
              };
              return (
                <motion.li
                  layout
                  key={tx.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: m?.color ?? "var(--surface-3)" }}
                  >
                    {m?.name.slice(0, 1) ?? "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{tx.label}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-ink-faint">
                      <span className="truncate">{m?.name ?? t("wallet.unknown")}</span>
                      <span
                        className="h-1 w-1 shrink-0 rounded-full"
                        style={{ background: cat.color }}
                      />
                      <span className="shrink-0">{fmtRelative(tx.ts, lang)}</span>
                    </p>
                  </div>
                  <span dir="ltr" className="tabular shrink-0 text-[13px] font-semibold">
                    {fmtMoney(tx.amount, { cents: true })}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      {totalCount > 10 && (
        <Link
          href="/ledger"
          className="mt-3 block text-center text-xs font-medium text-accent transition-opacity hover:opacity-80"
        >
          {t("wallet.activity.viewAll", { n: totalCount })}{" "}
          <span className="inline-block rtl:rotate-180">→</span>
        </Link>
      )}
    </section>
  );
}

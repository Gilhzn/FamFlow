"use client";

import { motion } from "framer-motion";
import { useFam, useCurrentMember } from "@/lib/store";
import { inMonth, sum } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";

function greetingKey(hour: number) {
  if (hour < 5) return "dashboard.greeting.night";
  if (hour < 12) return "dashboard.greeting.morning";
  if (hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

export default function GreetingHeader() {
  const { t, lang } = useT();
  const me = useCurrentMember();
  const transactions = useFam((s) => s.transactions);
  const budget = useFam((s) => s.settings.monthlyBudget);

  const now = new Date();
  const spent = sum(transactions.filter((t) => inMonth(t)));
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = spent > budget;

  const today = now.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="min-w-0">
      <p className="text-[13px] text-ink-faint">{today}</p>
      <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight md:text-3xl">
        {t(greetingKey(now.getHours()))}
        {me ? `, ${me.name}` : ""}
      </h1>

      <div className="mt-4 max-w-xl">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-dim">
            {t("dashboard.spent.pre")}{" "}
            <span dir="ltr" className="tabular font-semibold text-ink">
              {fmtMoney(spent)}
            </span>{" "}
            {t("dashboard.spent.of")}{" "}
            <span dir="ltr" className="tabular font-medium text-ink-dim">
              {fmtMoney(budget)}
            </span>{" "}
            {t("dashboard.spent.post")}
          </p>
          <span
            className={`tabular shrink-0 text-xs font-semibold ${
              over ? "text-negative" : "text-ink-faint"
            }`}
          >
            {Math.round(budget > 0 ? (spent / budget) * 100 : 0)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="h-full rounded-full"
            style={{
              background: over
                ? "var(--negative)"
                : "linear-gradient(90deg, var(--accent), #8ea6ff)",
            }}
          />
        </div>
      </div>
    </header>
  );
}

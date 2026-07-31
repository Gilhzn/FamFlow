"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Member } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export default function MemberBars({
  rows,
}: {
  rows: Array<{ member: Member; value: number }>;
}) {
  const { t } = useT();
  const max = Math.max(...rows.map((r) => r.value), 0);

  if (max === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
          <Users size={20} />
        </div>
        <p className="text-sm text-ink-faint">{t("analytics.nobodySpent")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(({ member, value }, i) => {
        const pct = (value / max) * 100;
        return (
          <div key={member.id} className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: member.color }}
              >
                {member.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                {member.name}
              </span>
              <span dir="ltr" className="tabular shrink-0 text-[13px] font-semibold">
                {fmtMoney(value, { compact: true })}
              </span>
            </div>
            <div className="ms-[34px] mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08 + i * 0.06,
                }}
                className="h-full rounded-full"
                style={{ background: member.color, opacity: value > 0 ? 1 : 0.25 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

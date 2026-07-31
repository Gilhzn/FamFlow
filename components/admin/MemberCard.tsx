"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { useFam } from "@/lib/store";
import { memberMonthSpend, memberVelocity } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";
import { Member } from "@/lib/types";
import { useT } from "@/lib/i18n";
import MemberBadge from "@/components/MemberBadge";
import { fill, Money } from "./i18nNodes";
import CapInput from "./CapInput";
import Sparkline from "./Sparkline";

const DAY = 86_400_000;

function CapRing({
  pct,
  color,
  over,
}: {
  pct: number | null;
  color: string;
  over: boolean;
}) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const frac = pct == null ? 0 : Math.min(1, pct);
  return (
    <div className="relative h-[60px] w-[60px] shrink-0">
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle
          cx={30}
          cy={30}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={5}
        />
        {pct != null && (
          <circle
            cx={30}
            cy={30}
            r={r}
            fill="none"
            stroke={over ? "var(--negative)" : color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - frac)}
            className="transition-all duration-500"
          />
        )}
      </svg>
      <span
        dir="ltr"
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular"
        style={{ color: over ? "var(--negative)" : undefined }}
      >
        {pct == null
          ? "—"
          : pct > 9.99
            ? "999%+"
            : `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}

export default function MemberCard({ member }: { member: Member }) {
  const { t } = useT();
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);
  const setMemberCap = useFam((s) => s.setMemberCap);

  const { spend, velocity, spark } = useMemo(() => {
    const state = { members, transactions, alerts, cards, settings };
    const spend = memberMonthSpend(state, member.id);
    const velocity = memberVelocity(state, member.id);

    // 14-day daily spend buckets for the sparkline
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime() - 13 * DAY;
    const spark = new Array<number>(14).fill(0);
    for (const t of transactions) {
      if (t.memberId !== member.id || t.ts < start) continue;
      const i = Math.min(13, Math.floor((t.ts - start) / DAY));
      if (i >= 0) spark[i] += t.amount;
    }
    return { spend, velocity, spark };
  }, [members, transactions, alerts, cards, settings, member.id]);

  const cap = member.monthlyCap;
  const pct = cap != null && cap > 0 ? spend / cap : null;
  const over = cap != null && spend > cap;
  // Mirrors runGovernanceChecks: needs a real baseline and a meaningful spend.
  const burst =
    velocity.dailyAvg > 0 &&
    velocity.last24 > Math.max(40, velocity.dailyAvg * 3);

  return (
    <div className="card card-hover p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <MemberBadge member={member} showRole size={34} />
          <p className="mt-3 text-xl font-bold tabular">
            <span dir="ltr">{fmtMoney(spend)}</span>
          </p>
          <p className="text-xs text-ink-dim">
            {t("admin.member.thisMonth")}
            {cap != null ? (
              <span>
                {" "}
                {fill(t("admin.member.cap"), {
                  amt: <Money>{fmtMoney(cap)}</Money>,
                })}
              </span>
            ) : (
              <span className="text-ink-faint"> {t("admin.member.noCap")}</span>
            )}
            {over && cap != null && (
              <span className="font-medium text-negative">
                {" "}
                {fill(t("admin.overBy"), {
                  amt: <Money>{fmtMoney(spend - cap)}</Money>,
                })}
              </span>
            )}
          </p>
        </div>
        <CapRing pct={pct} color={member.color} over={over} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2">
        <span className="text-xs font-medium text-ink-dim">
          {t("admin.member.monthlyCap")}
        </span>
        <CapInput
          value={cap}
          onCommit={(v) => setMemberCap(member.id, v)}
          ariaLabel={t("admin.capAria", { name: member.name })}
        />
      </div>

      {/* Velocity */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <p className="text-xs text-ink-dim">
          {fill(t("admin.member.velocity"), {
            last: (
              <Money className="tabular font-semibold text-ink">
                {fmtMoney(velocity.last24)}
              </Money>
            ),
            avg: <Money>{fmtMoney(velocity.dailyAvg)}</Money>,
          })}
        </p>
        {burst && (
          <span
            className="chip text-warning"
            style={{
              background: "color-mix(in srgb, var(--warning) 14%, transparent)",
            }}
          >
            <Flame size={11} />
            {t("admin.member.spike")}
          </span>
        )}
      </div>

      {/* 14-day sparkline — chronology always runs left→right, so pin LTR */}
      <div className="mt-3" dir="ltr">
        <Sparkline data={spark} color={member.color} />
        <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
          <span>{t("admin.member.days14")}</span>
          <span>{t("admin.member.today")}</span>
        </div>
      </div>
    </div>
  );
}

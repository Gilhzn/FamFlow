"use client";

import { ShieldCheck, ShieldOff, Users } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import BudgetConfigCard from "@/components/admin/BudgetConfigCard";
import MemberCard from "@/components/admin/MemberCard";
import AnomalyCenter from "@/components/admin/AnomalyCenter";
import BroadcastCard from "@/components/admin/BroadcastCard";

export default function AdminPage() {
  const me = useCurrentMember();
  const members = useFam((s) => s.members);
  const familyName = useFam((s) => s.settings.familyName);

  if (!me || me.role !== "admin") {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-faint">
          <ShieldOff size={24} />
        </span>
        <div>
          <p className="text-sm font-semibold">Admin access only</p>
          <p className="mt-1 text-sm text-ink-faint">Ask a parent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="animate-fade-up">
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={16} />
            <p className="text-[11px] font-semibold uppercase tracking-widest">
              Admin governance
            </p>
          </div>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">
            {familyName} command center
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Budgets, caps, velocity monitoring and anomaly review — every change
            syncs live to the whole family.
          </p>
        </header>

        {/* Budget config + broadcast */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
          <BudgetConfigCard />
          <BroadcastCard />
        </div>

        {/* Member monitoring */}
        <section className="mt-7 animate-fade-up">
          <div className="flex items-center gap-2 text-ink-dim">
            <Users size={15} />
            <h2 className="text-sm font-semibold text-ink">
              Member monitoring
            </h2>
            <span className="chip bg-surface-2 text-ink-faint tabular">
              {members.length}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>

        {/* Anomaly review */}
        <div className="mt-7">
          <AnomalyCenter />
        </div>
      </div>
    </div>
  );
}

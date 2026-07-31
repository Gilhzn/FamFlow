"use client";

import GreetingHeader from "@/components/dashboard/GreetingHeader";
import RunwayHero from "@/components/dashboard/RunwayHero";
import CategoryPulse from "@/components/dashboard/CategoryPulse";
import SavingsTips from "@/components/dashboard/SavingsTips";
import AnomalyStrip from "@/components/dashboard/AnomalyStrip";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <div
          className="animate-fade-up md:col-span-2"
          style={{ animationDelay: "0ms" }}
        >
          <GreetingHeader />
        </div>

        <div
          className="animate-fade-up md:col-span-2"
          style={{ animationDelay: "60ms" }}
        >
          <RunwayHero />
        </div>

        <div
          className="animate-fade-up md:col-span-2"
          style={{ animationDelay: "120ms" }}
        >
          <CategoryPulse />
        </div>

        <div
          className="animate-fade-up md:col-span-2"
          style={{ animationDelay: "180ms" }}
        >
          <AnomalyStrip />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <SavingsTips />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

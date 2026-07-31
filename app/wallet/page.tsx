"use client";

import { Wallet } from "lucide-react";
import { useCurrentMember } from "@/lib/store";
import { useT } from "@/lib/i18n";
import CardsSection from "@/components/wallet/CardsSection";
import PayPanel from "@/components/wallet/PayPanel";
import PaymentActivity from "@/components/wallet/PaymentActivity";

export default function WalletPage() {
  const me = useCurrentMember();
  const { t } = useT();
  if (!me) return null;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="mb-6 animate-fade-up">
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Wallet size={18} />
          </span>
          {t("wallet.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-dim">{t("wallet.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="animate-fade-up lg:col-span-3" style={{ animationDelay: "40ms" }}>
          <CardsSection />
        </div>
        <div
          className="animate-fade-up lg:col-span-2 lg:row-span-2"
          style={{ animationDelay: "80ms" }}
        >
          <PayPanel />
        </div>
        <div className="animate-fade-up lg:col-span-3" style={{ animationDelay: "120ms" }}>
          <PaymentActivity />
        </div>
      </div>
    </div>
  );
}

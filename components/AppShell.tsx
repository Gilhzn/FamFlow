"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  ScanLine,
  ChartNoAxesColumn,
  Wallet,
  ShieldCheck,
  LogOut,
  Radio,
} from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { useT, syncDirWithLang } from "@/lib/i18n";
import LoginScreen from "@/components/LoginScreen";
import AlertsBell from "@/components/AlertsBell";
import MemberBadge from "@/components/MemberBadge";
import LangToggle from "@/components/LangToggle";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", key: "nav.home", icon: LayoutDashboard },
  { href: "/ledger", key: "nav.ledger", icon: ListOrdered },
  { href: "/scan", key: "nav.scan", icon: ScanLine },
  { href: "/analytics", key: "nav.analytics", icon: ChartNoAxesColumn },
  { href: "/wallet", key: "nav.wallet", icon: Wallet },
  { href: "/admin", key: "nav.admin", icon: ShieldCheck, adminOnly: true },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useFam((s) => s.hydrate);
  const hydrated = useFam((s) => s.hydrated);
  const me = useCurrentMember();
  const signOut = useFam((s) => s.signOut);
  const pathname = usePathname();
  const { t } = useT();

  useEffect(() => {
    syncDirWithLang();
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-pulse-dot rounded-2xl bg-accent" />
          <p className="text-sm text-ink-faint">{t("shell.syncing")}</p>
        </div>
      </div>
    );
  }

  if (!me) return <LoginScreen />;

  const nav = NAV.filter((n) => !n.adminOnly || me.role === "admin");

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-line bg-surface-1/70 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2.5 px-5 pb-2 pt-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-glow">
            F
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{t("app.name")}</p>
            <p className="flex items-center gap-1 text-[11px] text-ink-faint">
              <Radio size={10} className="animate-pulse-dot text-positive" />
              {t("app.liveSync")}
            </p>
          </div>
        </div>
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {nav.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-accent-soft text-ink shadow-[inset_0_0_0_1px_var(--accent-soft)]"
                    : "text-ink-dim hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <n.icon size={17} strokeWidth={active ? 2.4 : 2} />
                {t(n.key)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <div className="mb-2 flex gap-1.5 px-2">
            <LangToggle />
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5">
            <MemberBadge member={me} showRole />
            <button
              onClick={signOut}
              aria-label={t("shell.switchMember")}
              className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <LogOut size={15} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface-0/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
            F
          </div>
          <span className="text-sm font-semibold">FamFinance</span>
          <Radio size={11} className="animate-pulse-dot text-positive" />
        </div>
        <div className="flex items-center gap-2">
          <LangToggle compact />
          <ThemeToggle compact />
          <AlertsBell />
          <button onClick={signOut} aria-label={t("shell.switchMember")}>
            <MemberBadge member={me} compact />
          </button>
        </div>
      </header>

      {/* Desktop floating bell */}
      <div className="fixed end-5 top-5 z-40 hidden md:block">
        <AlertsBell />
      </div>

      <main className="flex-1 pb-24 md:ms-60 md:pb-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-1/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex items-stretch justify-around">
          {nav.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-accent" : "text-ink-faint"
                }`}
              >
                <n.icon size={20} strokeWidth={active ? 2.4 : 2} />
                {t(n.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

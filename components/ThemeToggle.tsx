"use client";

import { Moon, Sun } from "lucide-react";
import { useUI, useT } from "@/lib/i18n";

export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const { t } = useT();
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={t("theme.toggle")}
      title={t("theme.toggle")}
      className={
        compact
          ? "flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-dim transition-all hover:bg-surface-3 hover:text-ink active:scale-95"
          : "inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs font-medium text-ink-dim transition-all hover:bg-surface-3 hover:text-ink active:scale-[0.98]"
      }
    >
      <Icon size={compact ? 16 : 13} />
      {!compact && (theme === "dark" ? t("theme.light") : t("theme.dark"))}
    </button>
  );
}

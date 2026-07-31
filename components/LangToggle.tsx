"use client";

import { Languages } from "lucide-react";
import { useUI, useT } from "@/lib/i18n";

export default function LangToggle({ compact }: { compact?: boolean }) {
  const lang = useUI((s) => s.lang);
  const setLang = useUI((s) => s.setLang);
  const { t } = useT();

  return (
    <button
      onClick={() => setLang(lang === "he" ? "en" : "he")}
      aria-label="Switch language"
      className={
        compact
          ? "flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-dim transition-all hover:bg-surface-3 hover:text-ink active:scale-95"
          : "inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs font-medium text-ink-dim transition-all hover:bg-surface-3 hover:text-ink active:scale-[0.98]"
      }
    >
      <Languages size={compact ? 16 : 13} />
      {!compact && t("lang.toggle")}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Sparkles, X } from "lucide-react";
import { useFam } from "@/lib/store";
import { computeSavingsTips } from "@/lib/insights";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";

/** Dismissed tip ids persist across navigations & tabs (tip ids are stable). */
const DISMISSED_KEY = "famflow_dismissed_tips_v1";

function loadDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export default function SavingsTips() {
  const { t, lang } = useT();
  const members = useFam((s) => s.members);
  const transactions = useFam((s) => s.transactions);
  const alerts = useFam((s) => s.alerts);
  const cards = useFam((s) => s.cards);
  const settings = useFam((s) => s.settings);
  // Lazy init is safe: AppShell only mounts pages after store hydration,
  // so this component never renders on the server.
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);

  // Mirror dismissals from other tabs, matching the store's live cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISMISSED_KEY) setDismissed(loadDismissed());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismiss = (id: string) =>
    setDismissed((d) => {
      if (d.includes(id)) return d;
      const next = [...d, id];
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in-memory dismissal */
      }
      return next;
    });

  const tips = useMemo(
    () =>
      computeSavingsTips(
        { members, transactions, alerts, cards, settings },
        Date.now(),
        lang
      ),
    [members, transactions, alerts, cards, settings, lang]
  );

  const visible = tips.filter((t) => !dismissed.includes(t.id));

  return (
    <section className="card flex min-w-0 flex-col p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-warning" />
        <h2 className="text-sm font-semibold">{t("dashboard.tips.title")}</h2>
        <span className="ms-auto text-[11px] text-ink-faint">
          {t("dashboard.tips.ai")}
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((tip) => (
            <motion.div
              layout
              key={tip.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="group relative rounded-xl bg-surface-2 p-3.5"
            >
              <div className="flex gap-2.5">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-warning"
                  style={{ background: "color-mix(in srgb, var(--warning) 15%, transparent)" }}
                >
                  <Lightbulb size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="pe-5 text-[13px] font-medium leading-snug">
                    {tip.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                    {tip.body}
                  </p>
                  <span
                    className="chip tabular mt-2 font-semibold text-positive"
                    style={{ background: "color-mix(in srgb, var(--positive) 10%, transparent)" }}
                  >
                    {t("dashboard.tips.save.pre")}
                    <span dir="ltr">{fmtMoney(tip.estWeeklySaving)}</span>
                    {t("dashboard.tips.save.post")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismiss(tip.id)}
                aria-label={t("dashboard.tips.dismiss")}
                className="absolute end-2.5 top-2.5 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-faint">
              <Lightbulb size={16} />
            </span>
            <p className="max-w-[220px] text-xs leading-relaxed text-ink-faint">
              {t("dashboard.tips.empty")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

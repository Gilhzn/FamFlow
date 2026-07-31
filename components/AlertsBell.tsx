"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useFam } from "@/lib/store";
import { fmtRelative } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { FamAlert } from "@/lib/types";

const SEV_COLOR: Record<FamAlert["severity"], string> = {
  info: "var(--accent)",
  warn: "var(--warning)",
  critical: "var(--negative)",
};

export default function AlertsBell() {
  const alerts = useFam((s) => s.alerts);
  const markRead = useFam((s) => s.markAlertsRead);
  const dismiss = useFam((s) => s.dismissAlert);
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const unread = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const sorted = [...alerts].sort((a, b) => b.ts - a.ts).slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) setTimeout(markRead, 1200);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-dim transition-all hover:bg-surface-3 hover:text-ink active:scale-95"
      >
        <Bell size={17} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -end-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-negative px-1 text-[10px] font-bold text-white"
              style={{ height: 18 }}
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute end-0 top-11 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl bg-surface-2 shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold">{t("alerts.title")}</p>
              <span className="text-xs text-ink-faint">
                {t("alerts.total", { n: alerts.length })}
              </span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {sorted.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink-faint">
                  {t("alerts.empty")}
                </p>
              )}
              {sorted.map((a) => (
                <motion.div
                  layout
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group flex gap-3 border-b border-line px-4 py-3 last:border-0"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: SEV_COLOR[a.severity] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">
                      {a.body}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {fmtRelative(a.ts, lang)}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(a.id)}
                    aria-label={t("alerts.dismiss")}
                    className="self-start rounded-md p-1 text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

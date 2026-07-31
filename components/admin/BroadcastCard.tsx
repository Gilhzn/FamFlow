"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Megaphone, Send } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { fmtRelative } from "@/lib/format";
import { FamAlert } from "@/lib/types";
import { useT } from "@/lib/i18n";

const SEV_COLOR: Record<FamAlert["severity"], string> = {
  info: "var(--accent)",
  warn: "var(--warning)",
  critical: "var(--negative)",
};

export default function BroadcastCard() {
  const { t, lang } = useT();
  const alerts = useFam((s) => s.alerts);
  const pushAlert = useFam((s) => s.pushAlert);
  const me = useCurrentMember();
  const [sent, setSent] = useState(false);
  const sentTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (sentTimer.current !== null) window.clearTimeout(sentTimer.current);
    },
    []
  );

  const recent = useMemo(
    () => [...alerts].sort((a, b) => b.ts - a.ts).slice(0, 10),
    [alerts]
  );

  const send = () => {
    // Alert text is rendered in the sender's current language at send time.
    pushAlert({
      kind: "budget",
      severity: "info",
      title: t("admin.broadcast.testTitle"),
      body: t("admin.broadcast.testBody", {
        name: me?.name ?? t("common.admin"),
      }),
      memberId: me?.id,
    });
    setSent(true);
    if (sentTimer.current !== null) window.clearTimeout(sentTimer.current);
    sentTimer.current = window.setTimeout(() => setSent(false), 2500);
  };

  return (
    <section className="card animate-fade-up flex flex-col p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Megaphone size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">
            {t("admin.broadcast.title")}
          </h2>
          <p className="text-[11px] text-ink-faint">
            {t("admin.broadcast.subtitle")}
          </p>
        </div>
      </div>

      <button onClick={send} className="btn-primary mt-4 w-full">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.span
              key="sent"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex items-center gap-2"
            >
              <CheckCheck size={15} />
              {t("admin.broadcast.delivered")}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex items-center gap-2"
            >
              <Send size={15} />
              {t("admin.broadcast.send")}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {t("admin.broadcast.recent")}
      </p>
      <div className="mt-1.5 max-h-64 flex-1 overflow-y-auto pe-1">
        {recent.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">
            {t("admin.broadcast.empty")}
          </p>
        )}
        {recent.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-0"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: SEV_COLOR[a.severity] }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-snug">
                {a.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-dim">{a.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-ink-faint">
              {fmtRelative(a.ts, lang)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

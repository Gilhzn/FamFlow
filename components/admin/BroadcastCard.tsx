"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, Megaphone, Send } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { fmtRelative } from "@/lib/format";
import { FamAlert } from "@/lib/types";

const SEV_COLOR: Record<FamAlert["severity"], string> = {
  info: "var(--accent)",
  warn: "var(--warning)",
  critical: "var(--negative)",
};

export default function BroadcastCard() {
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
    pushAlert({
      kind: "budget",
      severity: "info",
      title: "Governance broadcast test",
      body: `${me?.name ?? "Admin"} sent a test alert — if you can see this on your device, realtime family sync is working.`,
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
            Governance broadcast
          </h2>
          <p className="text-[11px] text-ink-faint">
            Pushes instantly to every family member&apos;s device
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
              Broadcast delivered
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
              Send test alert to family
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        Recent family alerts (all sources)
      </p>
      <div className="mt-1.5 max-h-64 flex-1 overflow-y-auto pr-1">
        {recent.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">
            No family alerts yet — governance rules and broadcasts will appear here.
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
              {fmtRelative(a.ts)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

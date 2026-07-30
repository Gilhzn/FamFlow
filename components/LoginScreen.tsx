"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Users } from "lucide-react";
import { useFam } from "@/lib/store";

export default function LoginScreen() {
  const members = useFam((s) => s.members);
  const settings = useFam((s) => s.settings);
  const signIn = useFam((s) => s.signIn);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-white shadow-glow">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FamFinance AI</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {settings.familyName} — pick your profile to enter the shared ledger
          </p>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {members.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              onClick={() => signIn(m.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
            >
              <span className="flex items-center gap-3.5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: m.color }}
                >
                  {m.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{m.name}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    {m.role === "admin" ? (
                      <>
                        <ShieldCheck size={12} className="text-accent" /> Admin
                        · full governance
                      </>
                    ) : (
                      <>
                        <Users size={12} /> Member
                        {m.monthlyCap != null && ` · $${m.monthlyCap}/mo cap`}
                      </>
                    )}
                  </span>
                </span>
              </span>
              <span className="text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Enter →
              </span>
            </motion.button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
          Multi-device demo: open this app in a second tab or window —<br />
          every entry syncs across the family in real time.
        </p>
      </motion.div>
    </div>
  );
}

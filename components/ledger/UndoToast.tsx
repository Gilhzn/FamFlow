"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Undo2, X } from "lucide-react";
import { Transaction } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

const AUTO_DISMISS_MS = 6000;

export default function UndoToast({
  tx,
  onUndo,
  onDismiss,
}: {
  tx: Transaction | null;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!tx) return;
    const t = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [tx, onDismiss]);

  return (
    <AnimatePresence>
      {tx && (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-24 z-50 md:inset-x-auto md:bottom-6 md:right-8 md:w-[22rem]"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/95 py-2.5 pl-3.5 pr-2 shadow-2xl shadow-black/40 backdrop-blur-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-negative/15 text-negative">
              <Trash2 size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                Deleted &ldquo;{tx.label}&rdquo;
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                <span className="tabular">{fmtMoney(tx.amount)}</span> removed
                for everyone
              </p>
            </div>
            <button
              onClick={onUndo}
              className="btn-ghost shrink-0 px-2.5 py-1.5 text-sm font-semibold text-accent"
            >
              <Undo2 size={14} />
              Undo
            </button>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors duration-150 hover:bg-surface-3 hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

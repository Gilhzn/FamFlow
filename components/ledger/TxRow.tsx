"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CreditCard,
  Pencil,
  ScanLine,
  Trash2,
} from "lucide-react";
import { CATEGORY_MAP, Member, Transaction, TxSource } from "@/lib/types";
import { fmtMoney, fmtTime } from "@/lib/format";

const SOURCE_ICON: Record<TxSource, typeof Pencil> = {
  manual: Pencil,
  scan: ScanLine,
  payment: CreditCard,
};

const SOURCE_LABEL: Record<TxSource, string> = {
  manual: "Manual entry",
  scan: "Scanned receipt",
  payment: "Card payment",
};

export default function TxRow({
  tx,
  member,
  canDelete,
  onDelete,
}: {
  tx: Transaction;
  member: Member | undefined;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [touchRevealed, setTouchRevealed] = useState(false);
  const [armed, setArmed] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const armTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cat = CATEGORY_MAP[tx.category];
  const SourceIcon = SOURCE_ICON[tx.source];
  const hasItems = !!tx.items && tx.items.length > 0;

  function clearPress() {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function clearArm() {
    if (armTimer.current !== null) {
      window.clearTimeout(armTimer.current);
      armTimer.current = null;
    }
  }

  // Clean up pending timers on unmount (e.g. row removed after delete).
  useEffect(
    () => () => {
      clearPress();
      clearArm();
    },
    []
  );

  // Tapping anywhere outside the row hides a touch-revealed delete button.
  useEffect(() => {
    if (!touchRevealed) return;
    function onOutside(e: TouchEvent | MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setTouchRevealed(false);
        setArmed(false);
      }
    }
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [touchRevealed]);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!armed) {
      // First tap only arms the button — never a silent, irreversible delete.
      setArmed(true);
      clearArm();
      armTimer.current = window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    clearArm();
    setArmed(false);
    onDelete();
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{ overflow: "hidden" }}
      className="border-b border-line last:border-0"
      ref={rootRef}
    >
      <div
        role={hasItems ? "button" : undefined}
        tabIndex={hasItems ? 0 : undefined}
        onClick={
          hasItems
            ? () => {
                // A long-press that revealed the delete button must not also
                // toggle the receipt expansion on finger release.
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                setExpanded((v) => !v);
              }
            : undefined
        }
        onKeyDown={
          hasItems
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded((v) => !v);
                }
              }
            : undefined
        }
        onTouchStart={() => {
          if (!canDelete) return;
          clearPress();
          pressTimer.current = window.setTimeout(() => {
            suppressClick.current = true;
            setTouchRevealed((v) => !v);
          }, 450);
        }}
        onTouchEnd={clearPress}
        onTouchMove={clearPress}
        className={`group flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-surface-2 md:px-4 ${
          hasItems ? "cursor-pointer" : ""
        }`}
      >
        {/* Member avatar dot */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: member?.color ?? "var(--surface-3)",
            boxShadow: `0 0 10px ${member?.color ?? "transparent"}33`,
          }}
          title={member?.name}
        >
          {(member?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{tx.label}</p>
            <span
              className="chip shrink-0 px-2 py-0.5 text-[10px]"
              style={{
                background: `color-mix(in srgb, ${cat.color} 14%, transparent)`,
                color: cat.color,
              }}
            >
              {cat.emoji} {cat.label.split(" ")[0]}
            </span>
            {hasItems && (
              <ChevronDown
                size={13}
                className={`shrink-0 text-ink-faint transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-faint">
            {fmtTime(tx.ts)}
            {tx.note ? ` · ${tx.note}` : ""}
          </p>
        </div>

        <SourceIcon
          size={13}
          className="shrink-0 text-ink-faint"
          aria-label={SOURCE_LABEL[tx.source]}
        />
        <span className="tabular shrink-0 text-sm font-semibold">
          {fmtMoney(tx.amount, { cents: true })}
        </span>

        {canDelete && (
          <button
            onClick={handleDeleteClick}
            onBlur={() => {
              clearArm();
              setArmed(false);
            }}
            aria-label={armed ? "Confirm delete" : "Delete transaction"}
            className={`shrink-0 rounded-lg transition-all duration-150 focus-visible:pointer-events-auto focus-visible:opacity-100 ${
              armed
                ? "pointer-events-auto flex items-center gap-1 bg-negative/15 px-2 py-1.5 text-[11px] font-semibold text-negative opacity-100"
                : `p-1.5 text-ink-faint hover:bg-negative/15 hover:text-negative group-hover:pointer-events-auto group-hover:opacity-100 ${
                    touchRevealed
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  }`
            }`}
          >
            <Trash2 size={armed ? 12 : 14} />
            {armed && <span className="whitespace-nowrap">Delete?</span>}
          </button>
        )}
      </div>

      {/* Scanned receipt line items */}
      <AnimatePresence initial={false}>
        {expanded && hasItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2.5 rounded-xl bg-surface-2/60 px-3.5 py-2 md:mx-4">
              {tx.items!.map((it, i) => {
                const diff =
                  it.matched && it.historicalPrice != null
                    ? it.price - it.historicalPrice
                    : null;
                return (
                  <div
                    key={`${it.name}-${i}`}
                    className="flex items-center gap-2 border-b border-line py-1.5 text-xs last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-ink-dim">
                      {it.name}
                    </span>
                    {diff !== null && (
                      <span
                        className="chip shrink-0 px-1.5 py-0.5 text-[10px]"
                        style={{
                          background:
                            diff > 0
                              ? "color-mix(in srgb, var(--negative) 14%, transparent)"
                              : "color-mix(in srgb, var(--positive) 14%, transparent)",
                          color:
                            diff > 0 ? "var(--negative)" : "var(--positive)",
                        }}
                      >
                        <span className="tabular">
                          {fmtMoney(diff, { sign: true })}
                        </span>
                        vs usual
                      </span>
                    )}
                    <span className="tabular shrink-0 font-medium">
                      {fmtMoney(it.price, { cents: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

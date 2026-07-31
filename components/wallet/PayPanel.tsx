"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CATEGORIES, CategoryId } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { createPaymentIntent, StripeMockError } from "@/lib/stripe-mock";
import { BRAND_GRADIENT, BrandWordmark } from "./CardVisual";

type Phase = "idle" | "tokenizing" | "authorizing" | "succeeded" | "declined";

const STEPS = [
  { key: "tokenizing", labelKey: "wallet.stage.tokenizing" },
  { key: "authorizing", labelKey: "wallet.stage.authorizing" },
  { key: "succeeded", labelKey: "wallet.stage.captured" },
] as const;

const PHASE_INDEX: Record<Phase, number> = {
  idle: -1,
  tokenizing: 0,
  authorizing: 1,
  succeeded: 2,
  declined: 1,
};

function StageRail({ phase }: { phase: Phase }) {
  const idx = PHASE_INDEX[phase];
  const { t } = useT();
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {STEPS.map((s, i) => {
        const done = idx > i || phase === "succeeded";
        const active = idx === i && phase !== "succeeded" && phase !== "declined";
        const failed = phase === "declined" && i === 1;
        return (
          <div key={s.key} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <motion.span
                animate={{ scale: active ? 1.08 : 1 }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300 ${
                  failed
                    ? "bg-negative"
                    : done
                    ? "bg-positive"
                    : active
                    ? "bg-accent shadow-glow"
                    : "bg-surface-3 text-ink-faint"
                }`}
              >
                {failed ? (
                  <AlertCircle size={15} />
                ) : done ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    <Check size={15} strokeWidth={3} />
                  </motion.span>
                ) : active ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span className="text-[11px] font-bold">{i + 1}</span>
                )}
              </motion.span>
              <span
                className={`w-full truncate text-[10px] font-medium ${
                  failed
                    ? "text-negative"
                    : active || done
                    ? "text-ink"
                    : "text-ink-faint"
                }`}
              >
                {t(s.labelKey)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative -mt-5 h-px flex-1 overflow-hidden rounded bg-surface-3">
                <motion.div
                  className="absolute inset-y-0 start-0 bg-positive"
                  initial={false}
                  animate={{ width: idx > i || phase === "succeeded" ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PayPanel() {
  const me = useCurrentMember();
  const cards = useFam((s) => s.cards);
  const addTransaction = useFam((s) => s.addTransaction);
  const { t } = useT();

  const myCards = useMemo(
    () => (me ? cards.filter((c) => c.memberId === me.id) : []),
    [cards, me]
  );

  const [cardId, setCardId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [phase, setPhase] = useState<Phase>("idle");
  // i18n key, translated at render time so a language switch updates it live.
  const [declineKey, setDeclineKey] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selected =
    myCards.find((c) => c.id === cardId) ?? myCards[0] ?? null;

  const amountNum = parseFloat(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const ready = !!me && !!selected && amountValid && label.trim().length > 0;
  const inFlight = phase === "tokenizing" || phase === "authorizing";

  async function pay() {
    if (!ready || !me || !selected || inFlight) return;
    setDeclineKey(null);
    setPhase("tokenizing");
    // Card is already vaulted — brief tokenization handshake against the vault.
    await new Promise((r) => setTimeout(r, 450));
    try {
      await createPaymentIntent({
        amount: amountNum,
        token: selected.token,
        onStage: (stage) => {
          if (stage === "authorizing" || stage === "capturing") setPhase("authorizing");
        },
      });
      setPhase("succeeded");
      addTransaction({
        memberId: me.id,
        amount: Math.round(amountNum * 100) / 100,
        category,
        label: label.trim(),
        source: "payment",
      });
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      setTimeout(() => {
        setPhase("idle");
        setAmount("");
        setLabel("");
      }, 1600);
    } catch (err) {
      setDeclineKey(
        err instanceof StripeMockError
          ? `wallet.stripeErr.${err.code}`
          : "wallet.err.paymentFailed"
      );
      setPhase("declined");
    }
  }

  if (!me) return null;

  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Zap size={15} className="text-accent" />
            {t("wallet.pay.title")}
          </h2>
          <p className="mt-0.5 text-xs text-ink-faint">{t("wallet.pay.subtitle")}</p>
        </div>
        <ShieldCheck size={16} className="text-ink-faint" />
      </div>

      {myCards.length === 0 ? (
        <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-faint">
          {t("wallet.pay.noCards")}
        </p>
      ) : (
        <div className="space-y-4">
          {/* card selector — mini visuals */}
          <div>
            <p className="mb-2 text-xs font-medium text-ink-dim">{t("wallet.pay.with")}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {myCards.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCardId(c.id)}
                    disabled={inFlight}
                    dir="ltr"
                    className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-lg p-2 text-left text-white transition-all duration-150 ${
                      active
                        ? "ring-2 ring-accent ring-offset-2 ring-offset-surface-1"
                        : "opacity-60 hover:opacity-90"
                    }`}
                    style={{ background: BRAND_GRADIENT[c.brand] }}
                  >
                    <BrandWordmark
                      brand={c.brand}
                      className={c.brand === "visa" ? "!text-[11px]" : "scale-[0.6] origin-top-left"}
                    />
                    <span className="tabular absolute bottom-1.5 left-2 text-[10px] font-medium tracking-wider">
                      •• {c.last4}
                    </span>
                    {active && (
                      <span className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-accent">
                        <Check size={9} strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* amount + merchant */}
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                {t("wallet.pay.amount")}
              </label>
              {/* Money entry is a physical-LTR unit: $ sign, digits, padding. */}
              <div className="relative" dir="ltr">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-faint">
                  $
                </span>
                <input
                  className="input tabular !pl-7"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))
                  }
                  disabled={inFlight}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                {t("wallet.pay.merchant")}
              </label>
              <input
                className="input"
                placeholder={t("wallet.pay.merchantPh")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={inFlight}
              />
            </div>
          </div>

          {/* category chips */}
          <div>
            <p className="mb-2 text-xs font-medium text-ink-dim">
              {t("wallet.pay.category")}
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    disabled={inFlight}
                    className={`chip transition-all duration-150 ${
                      active ? "text-white" : "bg-surface-2 text-ink-dim hover:bg-surface-3"
                    }`}
                    style={
                      active
                        ? { background: `color-mix(in srgb, ${c.color} 75%, black)` }
                        : undefined
                    }
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: c.color }}
                    />
                    {t(`cat.${c.id}.short`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* progress / result / action */}
          <div className="pt-1">
            <AnimatePresence mode="wait" initial={false}>
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <button onClick={pay} disabled={!ready} className="btn-primary w-full">
                    <Zap size={15} />
                    Pay {amountValid ? fmtMoney(amountNum) : ""}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-ink-faint">
                    Tip: an amount of exactly $6.66 simulates a decline
                  </p>
                </motion.div>
              )}

              {(inFlight || phase === "succeeded") && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl bg-surface-2 px-3 py-4"
                >
                  <StageRail phase={phase} />
                  <AnimatePresence>
                    {phase === "succeeded" && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 flex items-center justify-center gap-1.5 overflow-hidden text-center text-xs font-medium text-positive"
                      >
                        <CheckCircle2 size={13} />
                        {fmtMoney(amountNum)} charged to •••• {selected?.last4}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {phase === "declined" && (
                <motion.div
                  key="declined"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-xl bg-negative/10 p-4 ring-1 ring-inset ring-negative/30"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-negative" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-negative">
                        Payment declined
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-dim">
                        {declineMsg} Nothing was charged and nothing was logged.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={pay} className="btn-primary flex-1 !py-2 text-xs">
                      <RotateCcw size={13} />
                      Retry payment
                    </button>
                    <button
                      onClick={() => {
                        setPhase("idle");
                        setDeclineMsg(null);
                      }}
                      className="btn-ghost flex-1 !py-2 text-xs"
                    >
                      Edit details
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* success toast — portaled so no animated ancestor can capture it */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-8 md:left-60"
              >
                <div className="flex items-center gap-2 rounded-xl bg-surface-3 px-4 py-2.5 text-sm font-medium shadow-pop">
                  <CheckCircle2 size={16} className="text-positive" />
                  {toast}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
}

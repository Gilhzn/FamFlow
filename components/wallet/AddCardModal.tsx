"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Loader2, Lock, Sparkles, X } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import {
  createToken,
  detectBrand,
  formatCardNumber,
  cardNumberLength,
  luhnCheck,
  isExpired,
  normalizeYear,
  StripeMockError,
  TEST_CARD,
  type CardBrand,
} from "@/lib/stripe-mock";
import { BrandWordmark } from "./CardVisual";

interface Errors {
  number?: string;
  exp?: string;
  cvc?: string;
  form?: string;
}

function BrandBadge({ brand }: { brand: CardBrand | null }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={brand ?? "none"}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.14 }}
        className="flex items-center text-ink-dim"
      >
        {brand ? (
          <BrandWordmark brand={brand} className={brand === "visa" ? "!text-sm" : ""} />
        ) : (
          <CreditCard size={17} className="text-ink-faint" />
        )}
      </motion.span>
    </AnimatePresence>
  );
}

export default function AddCardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useCurrentMember();
  const addCard = useFam((s) => s.addCard);

  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);

  const brand = detectBrand(number);

  useEffect(() => {
    if (open) {
      setNumber("");
      setExp("");
      setCvc("");
      setErrors({});
      setBusy(false);
      setTimeout(() => numberRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleNumber(v: string) {
    setNumber(formatCardNumber(v));
    setErrors((e) => ({ ...e, number: undefined, form: undefined }));
  }

  function handleExp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    let out = d;
    if (d.length >= 3) out = `${d.slice(0, 2)}/${d.slice(2)}`;
    else if (d.length === 2 && v.length > exp.length) out = `${d}/`;
    setExp(out);
    setErrors((e) => ({ ...e, exp: undefined, form: undefined }));
  }

  function handleCvc(v: string) {
    setCvc(v.replace(/\D/g, "").slice(0, brand === "amex" ? 4 : 3));
    setErrors((e) => ({ ...e, cvc: undefined, form: undefined }));
  }

  function fillTestCard() {
    setNumber(formatCardNumber(TEST_CARD.number));
    setExp(`${String(TEST_CARD.expMonth).padStart(2, "0")}/${String(TEST_CARD.expYear).slice(-2)}`);
    setCvc(TEST_CARD.cvc.slice(0, 3));
    setErrors({});
  }

  function validate(): { expMonth: number; expYear: number } | null {
    const errs: Errors = {};
    const digits = number.replace(/\D/g, "");

    if (!brand) errs.number = "Enter a Visa, Mastercard or Amex number";
    else if (digits.length !== cardNumberLength(brand))
      errs.number = "Card number is incomplete";
    else if (!luhnCheck(digits)) errs.number = "Invalid card number (failed check digit)";

    const m = exp.match(/^(\d{2})\/(\d{2})$/);
    let expMonth = 0;
    let expYear = 0;
    if (!m) errs.exp = "Use MM/YY";
    else {
      expMonth = parseInt(m[1], 10);
      expYear = normalizeYear(parseInt(m[2], 10));
      if (expMonth < 1 || expMonth > 12) errs.exp = "Invalid month";
      else if (isExpired(expMonth, expYear)) errs.exp = "Card is expired";
    }

    const cvcLen = brand === "amex" ? 4 : 3;
    if (cvc.length !== cvcLen) errs.cvc = `${cvcLen} digits`;

    if (Object.keys(errs).length) {
      setErrors(errs);
      return null;
    }
    return { expMonth, expYear };
  }

  async function submit() {
    if (!me || busy) return;
    const parsed = validate();
    if (!parsed) return;
    setBusy(true);
    try {
      const res = await createToken({
        number: number.replace(/\D/g, ""),
        expMonth: parsed.expMonth,
        expYear: parsed.expYear,
        cvc,
      });
      addCard({
        memberId: me.id,
        brand: res.brand,
        last4: res.last4,
        expMonth: parsed.expMonth,
        expYear: parsed.expYear,
      });
      onClose();
    } catch (err) {
      setErrors({
        form:
          err instanceof StripeMockError
            ? err.message
            : "Something went wrong tokenizing the card.",
      });
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-md rounded-2xl bg-surface-1 p-5 shadow-pop sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Add card"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Add a card</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
                  <Lock size={11} />
                  Tokenized locally — the number never touches the ledger
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                  Card number
                </label>
                <div className="relative">
                  <input
                    ref={numberRef}
                    className={`input tabular pr-16 ${
                      errors.number ? "ring-1 !ring-negative" : ""
                    }`}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={number}
                    onChange={(e) => handleNumber(e.target.value)}
                    disabled={busy}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center">
                    <BrandBadge brand={brand} />
                  </span>
                </div>
                {errors.number && (
                  <p className="mt-1 text-xs text-negative">{errors.number}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                    Expiry
                  </label>
                  <input
                    className={`input tabular ${errors.exp ? "ring-1 !ring-negative" : ""}`}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={exp}
                    onChange={(e) => handleExp(e.target.value)}
                    disabled={busy}
                  />
                  {errors.exp && <p className="mt-1 text-xs text-negative">{errors.exp}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                    CVC
                  </label>
                  <input
                    className={`input tabular ${errors.cvc ? "ring-1 !ring-negative" : ""}`}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={brand === "amex" ? "1234" : "123"}
                    value={cvc}
                    onChange={(e) => handleCvc(e.target.value)}
                    disabled={busy}
                  />
                  {errors.cvc && <p className="mt-1 text-xs text-negative">{errors.cvc}</p>}
                </div>
              </div>

              <AnimatePresence>
                {errors.form && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-xl bg-negative/10 px-3 py-2 text-xs font-medium text-negative"
                  >
                    {errors.form}
                  </motion.p>
                )}
              </AnimatePresence>

              <button onClick={submit} disabled={busy} className="btn-primary w-full">
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Tokenizing…
                  </>
                ) : (
                  "Save card"
                )}
              </button>

              <button
                onClick={fillTestCard}
                disabled={busy}
                className="mx-auto flex items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                <Sparkles size={12} />
                Use test card 4242 4242 4242 4242
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

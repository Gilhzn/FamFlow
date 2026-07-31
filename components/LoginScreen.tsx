"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useFam, useCurrencySymbol } from "@/lib/store";
import { Member } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { isValidEmail, makeCredential, verifySecret } from "@/lib/auth";
import { CURRENCIES, CURRENCY_SYMBOLS, Currency, fmtMoney } from "@/lib/format";
import { currencyForCountry, DEFAULT_COUNTRY } from "@/lib/countries";
import CountrySelect from "@/components/CountrySelect";
import LangToggle from "@/components/LangToggle";
import ThemeToggle from "@/components/ThemeToggle";

type View =
  | { kind: "profiles" }
  | { kind: "unlock"; member: Member } // password or PIN entry
  | { kind: "signup" };

export default function LoginScreen() {
  const members = useFam((s) => s.members);
  const settings = useFam((s) => s.settings);
  const familyMode = useFam((s) => s.familyMode);
  const hasRealFamily = useFam((s) => s.hasRealFamily);
  const signIn = useFam((s) => s.signIn);
  const switchFamilyMode = useFam((s) => s.switchFamilyMode);
  const createFamily = useFam((s) => s.createFamily);
  const { t } = useT();
  const sym = useCurrencySymbol();

  const [view, setView] = useState<View>({ kind: "profiles" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // unlock form
  const [secret, setSecret] = useState("");

  // signup form
  const [familyName, setFamilyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [budget, setBudget] = useState("5000");
  const [currency, setCurrencyChoice] = useState<Currency>(
    currencyForCountry(DEFAULT_COUNTRY)
  );
  const [country, setCountryChoice] = useState(DEFAULT_COUNTRY);

  function resetTo(v: View) {
    setView(v);
    setSecret("");
    setError(null);
  }

  function chooseMember(m: Member) {
    if (m.credential || m.pinCredential) {
      resetTo({ kind: "unlock", member: m });
    } else {
      signIn(m.id);
    }
  }

  async function unlock() {
    if (view.kind !== "unlock" || busy) return;
    const cred = view.member.credential ?? view.member.pinCredential;
    if (!cred) return signIn(view.member.id);
    setBusy(true);
    setError(null);
    const ok = await verifySecret(secret, cred);
    setBusy(false);
    if (ok) {
      signIn(view.member.id);
    } else {
      setError(view.member.credential ? t("login.wrongPassword") : t("login.wrongPin"));
    }
  }

  async function submitSignup() {
    if (busy) return;
    setError(null);
    if (!familyName.trim()) return setError(t("login.familyRequired"));
    if (!adminName.trim()) return setError(t("login.nameRequired"));
    if (!isValidEmail(email)) return setError(t("login.emailInvalid"));
    if (password.length < 6) return setError(t("login.passwordMin"));
    setBusy(true);
    const credential = await makeCredential(password);
    createFamily({
      familyName: familyName.trim(),
      adminName: adminName.trim(),
      email: email.trim(),
      credential,
      monthlyBudget: Math.max(0, parseFloat(budget) || 0) || 5000,
      currency,
      country,
    });
    setBusy(false);
  }

  const isDemo = familyMode === "demo";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="fixed end-4 top-4 flex gap-1.5">
        <LangToggle />
        <ThemeToggle compact />
      </div>

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
          <h1 className="text-2xl font-bold tracking-tight">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {view.kind === "signup"
              ? t("login.signUpSubtitle")
              : isDemo
                ? t("login.subtitle.demo", { family: settings.familyName || "Demo" })
                : t("login.subtitle.real")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- profile picker ---------- */}
          {view.kind === "profiles" && (
            <motion.div
              key="profiles"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {members.length > 0 ? (
                <div className="card divide-y divide-line overflow-hidden">
                  {members.map((m, i) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.3 }}
                      onClick={() => chooseMember(m)}
                      className="flex w-full items-center justify-between px-5 py-4 text-start transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
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
                                <ShieldCheck size={12} className="text-accent" />
                                {t("login.adminFull")}
                              </>
                            ) : (
                              <>
                                <Users size={12} />
                                {t("common.member")}
                                {m.monthlyCap != null &&
                                  ` ${t("login.capPerMonth", { n: fmtMoney(m.monthlyCap) })}`}
                              </>
                            )}
                          </span>
                        </span>
                      </span>
                      {(m.credential || m.pinCredential) && (
                        <KeyRound size={14} className="text-ink-faint" />
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="card px-5 py-8 text-center text-sm text-ink-dim">
                  {t("login.signUpSubtitle")}
                </div>
              )}

              <div className="mt-5 flex flex-col items-center gap-2.5">
                <button
                  onClick={() => resetTo({ kind: "signup" })}
                  className="btn-ghost w-full"
                >
                  <UserPlus size={15} />
                  {t("login.createFamily")}
                </button>
                {isDemo && hasRealFamily && (
                  <button
                    onClick={() => switchFamilyMode("real")}
                    className="text-xs font-medium text-accent transition-opacity hover:opacity-80"
                  >
                    {t("login.haveFamily")}
                  </button>
                )}
                {!isDemo && (
                  <button
                    onClick={() => switchFamilyMode("demo")}
                    className="flex items-center gap-1.5 text-xs font-medium text-accent transition-opacity hover:opacity-80"
                  >
                    <Sparkles size={12} />
                    {t("login.demoFamily")}
                  </button>
                )}
              </div>

              <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
                {isDemo ? t("login.multiDevice") : t("login.dataNote")}
              </p>
            </motion.div>
          )}

          {/* ---------- password / PIN unlock ---------- */}
          {view.kind === "unlock" && (
            <motion.div
              key="unlock"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="card p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: view.member.color }}
                >
                  {view.member.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{view.member.name}</p>
                  <p className="text-xs text-ink-faint">
                    {view.member.credential
                      ? t("login.password")
                      : t("login.pinFor", { name: view.member.name })}
                  </p>
                </div>
              </div>
              <input
                autoFocus
                type="password"
                inputMode={view.member.pinCredential ? "numeric" : undefined}
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder={
                  view.member.credential ? t("login.password") : t("login.pin")
                }
                className="input tabular"
              />
              {error && <p className="mt-2 text-xs text-negative">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => resetTo({ kind: "profiles" })}
                  className="btn-ghost flex-1"
                >
                  <ArrowLeft size={14} className="rtl:rotate-180" />
                  {t("common.back")}
                </button>
                <button
                  onClick={unlock}
                  disabled={busy || !secret}
                  className="btn-primary flex-1"
                >
                  {busy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    t("login.signIn")
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ---------- family sign-up ---------- */}
          {view.kind === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="card p-5"
            >
              <h2 className="mb-4 text-sm font-semibold">{t("login.signUpTitle")}</h2>
              <div className="space-y-3">
                <Field label={t("login.familyName")}>
                  <input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </Field>
                <Field label={t("login.yourName")}>
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label={t("login.email")}>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label={t("login.password")}>
                  <input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label={t("login.monthlyBudget")}>
                  <div className="relative">
                    <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                      {sym}
                    </span>
                    <input
                      inputMode="numeric"
                      value={budget}
                      onChange={(e) =>
                        setBudget(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="input tabular ps-7"
                    />
                  </div>
                </Field>
                <Field label={t("login.country")}>
                  <CountrySelect
                    value={country}
                    onChange={(code) => {
                      setCountryChoice(code);
                      setCurrencyChoice(currencyForCountry(code));
                    }}
                    ariaLabel={t("login.country")}
                  />
                </Field>
                <Field label={t("login.currency")}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CURRENCIES.map((c) => {
                      const sel = currency === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={sel}
                          onClick={() => setCurrencyChoice(c)}
                          className={`rounded-xl px-2 py-2 text-sm font-semibold transition-all duration-150 ${
                            sel
                              ? "bg-accent text-white"
                              : "bg-surface-2 text-ink-dim hover:bg-surface-3"
                          }`}
                        >
                          <span dir="ltr">{CURRENCY_SYMBOLS[c]} {c}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
              {error && <p className="mt-3 text-xs text-negative">{error}</p>}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => resetTo({ kind: "profiles" })}
                  className="btn-ghost flex-1"
                >
                  <ArrowLeft size={14} className="rtl:rotate-180" />
                  {t("common.back")}
                </button>
                <button
                  onClick={submitSignup}
                  disabled={busy}
                  className="btn-primary flex-[2]"
                >
                  {busy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    t("login.create")
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-dim">{label}</span>
      {children}
    </label>
  );
}

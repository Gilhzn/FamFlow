"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Trash2, UserPlus, Users, X } from "lucide-react";
import { useFam, useCurrentMember, useCurrencySymbol } from "@/lib/store";
import { makeCredential } from "@/lib/auth";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Role } from "@/lib/types";
import { fill, Money } from "./i18nNodes";

const ROLES: Role[] = ["member", "admin"];

export default function MembersManageCard() {
  const sym = useCurrencySymbol();
  const { t } = useT();
  const members = useFam((s) => s.members);
  const addMember = useFam((s) => s.addMember);
  const removeMember = useFam((s) => s.removeMember);
  const me = useCurrentMember();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [cap, setCap] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setRole("member");
    setCap("");
    setPin("");
    setError(null);
    setShowForm(false);
  };

  const submit = async () => {
    if (busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("admin.members.nameError"));
      return;
    }
    const pinTrim = pin.trim();
    if (pinTrim && !/^\d{4,6}$/.test(pinTrim)) {
      setError(t("admin.members.pinError"));
      return;
    }
    setBusy(true);
    try {
      const capN = parseFloat(cap);
      const monthlyCap =
        Number.isFinite(capN) && capN > 0 ? Math.round(capN) : null;
      const pinCredential = pinTrim
        ? await makeCredential(pinTrim)
        : undefined;
      // Sync store action — the new member appears in the list instantly.
      addMember({ name: trimmed, role, monthlyCap, pinCredential });
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card animate-fade-up p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Users size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">
            {t("admin.members.title")}
          </h2>
          <p className="truncate text-[11px] text-ink-faint">
            {t("admin.members.subtitle")}
          </p>
        </div>
        <span className="chip shrink-0 bg-surface-2 text-ink-faint tabular">
          {members.length}
        </span>
      </div>

      {/* Member list */}
      <div className="mt-2">
        <AnimatePresence initial={false}>
          {members.map((m) => {
            const isMe = m.id === me?.id;
            const hasSecret = Boolean(m.pinCredential || m.credential);
            return (
              <motion.div
                layout
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-line last:border-0"
              >
                <div className="flex items-center gap-3 py-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: m.color,
                      boxShadow: `0 0 8px ${m.color}66`,
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 truncate text-[13px] font-medium">
                        {m.name}
                      </p>
                      {isMe && (
                        <span className="chip shrink-0 bg-accent-soft px-2 py-0.5 text-[10px] text-accent">
                          {t("admin.members.you")}
                        </span>
                      )}
                    </div>
                    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-ink-dim">
                      <span className="shrink-0">
                        {m.role === "admin"
                          ? t("common.admin")
                          : t("common.member")}
                      </span>
                      {m.monthlyCap != null ? (
                        <span className="shrink-0">
                          {fill(t("admin.member.cap"), {
                            amt: <Money>{fmtMoney(m.monthlyCap)}</Money>,
                          })}
                        </span>
                      ) : (
                        <span className="shrink-0 text-ink-faint">
                          {t("admin.member.noCap")}
                        </span>
                      )}
                      {hasSecret ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-ink-faint">
                          · <KeyRound size={11} aria-hidden />
                          {m.pinCredential
                            ? t("admin.members.pinSet")
                            : t("admin.members.passwordSet")}
                        </span>
                      ) : (
                        <span className="shrink-0 text-ink-faint">
                          · {t("admin.members.noPin")}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* You can never remove yourself — the button is hidden. */}
                  {!isMe &&
                    (confirmingId === m.id ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="hidden text-xs text-ink-dim sm:inline">
                          {t("admin.members.removeConfirm", { name: m.name })}
                        </span>
                        <button
                          onClick={() => {
                            removeMember(m.id);
                            setConfirmingId(null);
                          }}
                          className="btn-ghost px-2.5 py-1.5 text-xs font-semibold text-negative"
                        >
                          {t("admin.members.remove")}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          aria-label={t("common.cancel")}
                          className="btn-ghost px-2 py-1.5"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(m.id)}
                        aria-label={t("admin.members.removeAria", {
                          name: m.name,
                        })}
                        className="btn-ghost shrink-0 px-2.5 py-1.5 text-ink-faint hover:text-negative"
                      >
                        <Trash2 size={14} />
                      </button>
                    ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add member — inline form */}
      <AnimatePresence initial={false}>
        {showForm ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="mt-3 rounded-xl bg-surface-2 p-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="mm-name"
                    className="text-[11px] font-medium uppercase tracking-wide text-ink-faint"
                  >
                    {t("admin.members.name")}
                  </label>
                  <input
                    id="mm-name"
                    autoFocus
                    className="input mt-1 py-2"
                    placeholder={t("admin.members.namePh")}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                    {t("admin.members.role")}
                  </p>
                  <div className="mt-1 flex rounded-xl bg-surface-3 p-0.5">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                          role === r
                            ? "bg-surface-1 text-ink shadow-card"
                            : "text-ink-dim hover:text-ink"
                        }`}
                      >
                        {r === "admin" ? t("common.admin") : t("common.member")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="mm-cap"
                    className="text-[11px] font-medium uppercase tracking-wide text-ink-faint"
                  >
                    {t("admin.members.capLabel")}
                  </label>
                  <div className="relative mt-1" dir="ltr">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
                      {sym}
                    </span>
                    <input
                      id="mm-cap"
                      inputMode="numeric"
                      className="input tabular py-2 pl-6"
                      placeholder={t("admin.capPlaceholder")}
                      value={cap}
                      onChange={(e) =>
                        setCap(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label
                    htmlFor="mm-pin"
                    className="text-[11px] font-medium uppercase tracking-wide text-ink-faint"
                  >
                    {t("admin.members.pinLabel")}
                  </label>
                  <input
                    id="mm-pin"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    className="input tabular mt-1 py-2"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError(null);
                    }}
                  />
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {t("admin.members.pinHint")}
                  </p>
                </div>
              </div>

              {error && (
                <p className="mt-2.5 text-xs font-medium text-negative">
                  {error}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <UserPlus size={14} />
                  {t("common.add")}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="addBtn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setShowForm(true)}
              className="btn-ghost mt-3 w-full"
            >
              <UserPlus size={15} />
              {t("admin.members.addBtn")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

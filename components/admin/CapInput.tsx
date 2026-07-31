"use client";

import { useCurrencySymbol } from "@/lib/store";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Numeric cap editor — commits on blur / Enter, Escape cancels.
 * Empty input commits `null` (= uncapped). Instant optimistic save.
 * Kept LTR (dir="ltr") so the $ prefix and digits stay put under RTL.
 */
export default function CapInput({
  value,
  onCommit,
  ariaLabel,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  ariaLabel?: string;
}) {
  const { t } = useT();
  const [text, setText] = useState(value == null ? "" : String(value));
  const [focused, setFocused] = useState(false);
  // Escape triggers blur, but the blur handler closes over the pre-revert
  // text — this flag makes the resulting blur a no-op instead of a commit.
  const canceling = useRef(false);
  const sym = useCurrencySymbol();

  useEffect(() => {
    if (!focused) setText(value == null ? "" : String(value));
  }, [value, focused]);

  const commit = () => {
    const n = parseFloat(text);
    const next = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    if (next !== value) onCommit(next);
    setText(next == null ? "" : String(next));
  };

  return (
    <div className="relative w-[104px] shrink-0" dir="ltr">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
        {sym}
      </span>
      <input
        aria-label={ariaLabel}
        inputMode="numeric"
        placeholder={t("admin.capPlaceholder")}
        className="input tabular py-1.5 pl-6 pr-2.5 text-right text-[13px]"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (canceling.current) {
            canceling.current = false;
            setText(value == null ? "" : String(value));
            return;
          }
          commit();
        }}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            canceling.current = true;
            setText(value == null ? "" : String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

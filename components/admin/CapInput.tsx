"use client";

import { useEffect, useState } from "react";

/**
 * Numeric cap editor — commits on blur / Enter.
 * Empty input commits `null` (= uncapped). Instant optimistic save.
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
  const [text, setText] = useState(value == null ? "" : String(value));
  const [focused, setFocused] = useState(false);

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
    <div className="relative w-[104px] shrink-0">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
        $
      </span>
      <input
        aria-label={ariaLabel}
        inputMode="numeric"
        placeholder="No cap"
        className="input tabular py-1.5 pl-6 pr-2.5 text-right text-[13px]"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(value == null ? "" : String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

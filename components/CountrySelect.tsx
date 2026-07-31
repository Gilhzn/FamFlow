"use client";

import { useMemo } from "react";
import { COUNTRY_CODES, countryFlag, countryName } from "@/lib/countries";
import { useT } from "@/lib/i18n";

/**
 * Full-world country picker (native select: searchable by typing, accessible,
 * zero dependencies). Names localize via Intl.DisplayNames, flags via
 * regional-indicator emoji.
 */
export default function CountrySelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (code: string) => void;
  ariaLabel?: string;
}) {
  const { lang } = useT();

  const options = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({
        code,
        label: `${countryFlag(code)} ${countryName(code, lang)}`,
        name: countryName(code, lang),
      })).sort((a, b) => a.name.localeCompare(b.name, lang === "he" ? "he" : "en")),
    [lang]
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="input cursor-pointer appearance-none"
    >
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

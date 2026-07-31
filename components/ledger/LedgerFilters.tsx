"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, CategoryId, Member } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface Props {
  members: Member[];
  activeMembers: Set<string>;
  toggleMember: (id: string) => void;
  activeCats: Set<CategoryId>;
  toggleCat: (id: CategoryId) => void;
  query: string;
  setQuery: (q: string) => void;
  count: number;
  total: number;
  hasFilters: boolean;
  clearFilters: () => void;
}

export default function LedgerFilters({
  members,
  activeMembers,
  toggleMember,
  activeCats,
  toggleCat,
  query,
  setQuery,
  count,
  total,
  hasFilters,
  clearFilters,
}: Props) {
  const { t } = useT();
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {members.map((m) => {
          const active = activeMembers.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggleMember(m.id)}
              aria-pressed={active}
              className={`chip transition-all duration-150 ${
                active ? "" : "bg-surface-2 text-ink-dim hover:bg-surface-3 hover:text-ink"
              }`}
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${m.color} 18%, transparent)`,
                      color: m.color,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${m.color} 45%, transparent)`,
                    }
                  : undefined
              }
            >
              <span
                aria-hidden
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ background: m.color }}
              >
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[72px] truncate">{m.name.split(" ")[0]}</span>
            </button>
          );
        })}

        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />

        {CATEGORIES.map((c) => {
          const active = activeCats.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCat(c.id)}
              aria-pressed={active}
              className={`chip transition-all duration-150 ${
                active ? "" : "bg-surface-2 text-ink-dim hover:bg-surface-3 hover:text-ink"
              }`}
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${c.color} 16%, transparent)`,
                      color: c.color,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c.color} 40%, transparent)`,
                    }
                  : undefined
              }
            >
              <span aria-hidden>{c.emoji}</span>
              {t(`cat.${c.id}.short`)}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ledger.searchPlaceholder")}
          aria-label={t("ledger.searchAria")}
          className="input ps-9 pe-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label={t("ledger.clearSearch")}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-0.5 text-xs text-ink-faint">
        <span>
          {count === 1
            ? t("ledger.resultsOne")
            : t("ledger.results", { n: count })}{" "}
          ·{" "}
          <span dir="ltr" className="tabular font-medium text-ink-dim">
            {fmtMoney(total)}
          </span>
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            <X size={12} />
            {t("ledger.clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}

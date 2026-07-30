# FamFinance AI — Gauntlet Workbench

Live pipeline dashboard. Statuses: `In Loop` → `Built` → `Critic Pass N` → `[PASSED]` / `[FAILED]`.

## Foundation (Lead Architect — inline)
| Component | Status |
|---|---|
| Next.js + Tailwind scaffold, dark design system | Built |
| Data model & types (`lib/types.ts`) | Built |
| Seed engine — 100-day deterministic family history (`lib/seed.ts`) | Built |
| FamSync realtime store — localStorage + BroadcastChannel live sync (`lib/store.ts`) | Built |
| Insights engines — Runway / Micro-Savings / Anomaly / Governance (`lib/insights.ts`) | Built |
| App shell, login gate, alerts bell, nav (mobile + desktop) | Built |

## Wave 1 — Parallel micro-modules (Builder agents)
| # | Module | Owner files | Status |
|---|---|---|---|
| B1 | Home Dashboard (runway hero, savings tips, category pulse) | `app/page.tsx`, `components/dashboard/*` | In Loop |
| B2 | Family Ledger (live feed, manual quick-entry, filters, micro-interactions) | `app/ledger/*`, `components/ledger/*` | In Loop |
| B3 | AI Vision Scan (photo → Claude Vision → historical price match → override) | `app/scan/*`, `app/api/vision/*`, `lib/vision.ts` | In Loop |
| B4 | Temporal Analytics (Day/Week/Month/Year slicing charts) | `app/analytics/*`, `components/analytics/*` | In Loop |
| B5 | Wallet & Payments (tokenized cards, pay → auto ledger mapping) | `app/wallet/*`, `lib/stripe-mock.ts` | In Loop |
| B6 | Admin Governance (caps config, velocity monitor, anomaly review) | `app/admin/*`, `components/admin/*` | In Loop |

## Gauntlet log
- (pending first critic pass)

## Integration (Agent 4 — CTO pass)
- Status: waiting for all modules `[PASSED]`

# FamFinance AI — Autonomous Family Expense & Payment Hub

A zero-friction family financial ecosystem: live multi-user ledger, AI vision
receipt entry, predictive runway analytics, and embedded tokenized payments.
Dark, Linear/Copilot-Money-grade UI, fully responsive from 390 px up.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Pick a family member on the login screen (Dana/Avi are Admin·Parents; Noa/Tom
are capped Members). **Open the app in a second tab or window** — every entry,
payment, cap change, and alert syncs across tabs instantly.

## Modules

| Route | What it does |
|---|---|
| `/` | Dashboard: predictive runway hero (velocity-weighted burn → projected month-end, overdraft warning), category pulse vs caps, AI micro-savings tips, anomaly strip, recent activity |
| `/ledger` | Shared live feed with day grouping + subtotals, quick-add bar, member/category/search filters, expandable scanned receipts, confirm-armed delete |
| `/scan` | Photo → AI vision extraction → historical price matching against the family purchase registry → inline manual override → log to ledger |
| `/analytics` | Day / Week / Month / Year slicing: stacked category bars, donut breakdown, member comparison, vs-previous-period deltas |
| `/wallet` | Tokenized card vault (mock Stripe: Luhn, brand detect, `tok_`/`pi_` flows), staged payment UI, auto-mapping of captured payments into the ledger |
| `/admin` | Admin-gated: family/category/member budget caps (live-editable), spending-velocity monitor with sparklines, anomaly review center, broadcast test alerts |

## Architecture notes

- **FamSync** (`lib/store.ts`): zustand store where every mutation persists to
  `localStorage` and broadcasts over a `BroadcastChannel` — open tabs converge
  in real time (~100 ms). Governance checks (`lib/insights.ts`) run on every
  new transaction and push alerts to all peers.
- **AI insight engines** (`lib/insights.ts`): pure functions — predictive
  runway (recent-velocity-weighted burn rate), contextual micro-savings
  recommendations, recurring-charge spike + unrecognized-micro-charge anomaly
  detection.
- **Vision API** (`app/api/vision/route.ts`): calls Claude vision when
  `ANTHROPIC_API_KEY` is set; otherwise a deterministic mock (labeled in the
  UI). Historical matching never fabricates prices — unmatched items show
  "no purchase history".
- **Payments** (`lib/stripe-mock.ts`): faithful Stripe façade. Test card
  `4242 4242 4242 4242`; an amount of exactly `6.66` simulates a decline.

## Verification

```bash
npx tsc --noEmit                 # types
npx next build                   # production build
npm run dev & node scripts/e2e.mjs   # cross-tab sync + payment E2E (needs Chromium)
node scripts/shot.mjs / out.png desktop m_dana   # screenshot + overflow audit
```

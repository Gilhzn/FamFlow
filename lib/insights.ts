import { fmtMoney } from "./format";
import {
  CATEGORY_MAP,
  CategoryId,
  FamAlert,
  LedgerState,
  Transaction,
  uid,
} from "./types";

const DAY = 86_400_000;

export function monthWindow(now = Date.now()) {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return { start, end, daysInMonth: Math.round((end - start) / DAY) };
}

export function inMonth(t: Transaction, now = Date.now()) {
  const { start, end } = monthWindow(now);
  return t.ts >= start && t.ts < end;
}

export function sum(txs: Transaction[]) {
  return txs.reduce((a, t) => a + t.amount, 0);
}

/* ---------------- Predictive Runway Engine ---------------- */

export interface Runway {
  spentSoFar: number;
  dailyBurn: number; // velocity-weighted burn rate $/day
  projectedTotal: number; // predicted end-of-month spend
  projectedDelta: number; // budget - projectedTotal (negative = overdraft)
  overdraftDay: number | null; // day-of-month budget is predicted to run dry
  daysElapsed: number;
  daysInMonth: number;
  confidence: "low" | "medium" | "high";
}

export function computeRunway(state: LedgerState, now = Date.now()): Runway {
  const { start, daysInMonth } = monthWindow(now);
  const daysElapsed = Math.min(
    daysInMonth,
    Math.max(1, Math.ceil((now - start) / DAY))
  );
  const monthTx = state.transactions.filter((t) => inMonth(t, now));
  const spentSoFar = sum(monthTx);

  // Velocity weighting: last-7-day burn counts double vs. month-average,
  // so early-month acceleration moves the projection before it's too late.
  const recent = monthTx.filter((t) => now - t.ts <= 7 * DAY);
  const recentDays = Math.min(daysElapsed, 7);
  const recentBurn = sum(recent) / recentDays;
  const avgBurn = spentSoFar / daysElapsed;
  const dailyBurn = daysElapsed < 3 ? avgBurn : (recentBurn * 2 + avgBurn) / 3;

  const daysLeft = daysInMonth - daysElapsed;
  const projectedTotal = spentSoFar + dailyBurn * daysLeft;
  const budget = state.settings.monthlyBudget;
  const projectedDelta = budget - projectedTotal;

  let overdraftDay: number | null = null;
  if (dailyBurn > 0 && spentSoFar + dailyBurn * daysLeft > budget) {
    const remaining = budget - spentSoFar;
    overdraftDay =
      remaining <= 0
        ? daysElapsed
        : Math.min(daysInMonth, daysElapsed + Math.floor(remaining / dailyBurn));
  }

  const confidence =
    daysElapsed < 4 ? "low" : daysElapsed < 10 ? "medium" : "high";

  return {
    spentSoFar,
    dailyBurn,
    projectedTotal,
    projectedDelta,
    overdraftDay,
    daysElapsed,
    daysInMonth,
    confidence,
  };
}

/* ---------------- Micro-Savings Recommendations ---------------- */

export interface SavingsTip {
  id: string;
  title: string;
  body: string;
  estWeeklySaving: number;
  category: CategoryId;
}

export function computeSavingsTips(
  state: LedgerState,
  now = Date.now()
): SavingsTip[] {
  const tips: SavingsTip[] = [];
  const txs = state.transactions;
  const dow = new Date(now).getDay();
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow];

  // 1. Delivery spending vs. same-weekday historical average
  const deliveries = txs.filter((t) => /delivery|wolt|takeout/i.test(t.label));
  if (deliveries.length >= 4) {
    const sameDowHist = deliveries.filter(
      (t) => new Date(t.ts).getDay() === dow && now - t.ts > 7 * DAY
    );
    const thisWeek = deliveries.filter((t) => now - t.ts <= 7 * DAY);
    if (sameDowHist.length >= 2 && thisWeek.length > 0) {
      const histAvg = sum(sameDowHist) / sameDowHist.length;
      const weekSpend = sum(thisWeek);
      const weeklyAvg =
        sum(deliveries.filter((t) => now - t.ts > 7 * DAY)) /
        Math.max(1, Math.round((now - deliveries[0].ts) / (7 * DAY)) - 1);
      if (weekSpend > weeklyAvg * 1.15) {
        const pct = Math.round((weekSpend / Math.max(1, weeklyAvg) - 1) * 100);
        tips.push({
          id: "tip_delivery",
          title: `Food delivery is ${pct}% above your weekly average`,
          body: `You've spent ${fmtMoney(Math.round(weekSpend))} on delivery this week vs. a typical ${fmtMoney(Math.round(weeklyAvg))}. Cooking at home on ${dayName}s (historical avg ${fmtMoney(Math.round(histAvg))}/order) could save ~${fmtMoney(Math.round(Math.max(5, weekSpend - weeklyAvg)))} this week.`,
          estWeeklySaving: Math.max(5, weekSpend - weeklyAvg),
          category: "food",
        });
      }
    }
  }

  // 2. Coffee ritual aggregation
  const coffee = txs.filter(
    (t) => /coffee/i.test(t.label) && now - t.ts <= 30 * DAY
  );
  if (coffee.length >= 8) {
    const monthly = sum(coffee);
    tips.push({
      id: "tip_coffee",
      title: `${coffee.length} café purchases this month`,
      body: `Café visits total ${fmtMoney(Math.round(monthly))}/month. Brewing at home 2 days a week would keep ~${fmtMoney(Math.round((monthly * 0.28)))} in the family budget.`,
      estWeeklySaving: (monthly * 0.28) / 4.3,
      category: "food",
    });
  }

  // 3. Underused subscriptions
  const subs = txs.filter((t) => /netflix|spotify|subscription/i.test(t.label));
  const leisure30 = txs.filter(
    (t) => t.category === "leisure" && now - t.ts <= 30 * DAY
  );
  if (subs.length >= 2 && leisure30.length > 6) {
    const subMonthly = sum(subs.filter((t) => now - t.ts <= 30 * DAY));
    if (subMonthly > 0) {
      tips.push({
        id: "tip_subs",
        title: "Streaming stack review",
        body: `Recurring streaming services cost ${fmtMoney(Math.round(subMonthly))}/month alongside ${fmtMoney(Math.round(sum(leisure30)))} of other leisure spending. Rotating one service off saves ${fmtMoney(Math.round((subMonthly / 2)))}/month with zero lifestyle change.`,
        estWeeklySaving: subMonthly / 2 / 4.3,
        category: "leisure",
      });
    }
  }

  return tips.sort((a, b) => b.estWeeklySaving - a.estWeeklySaving);
}

/* ---------------- Smart Anomaly Detection ---------------- */

export interface Anomaly {
  id: string;
  txId: string;
  label: string;
  amount: number;
  expected: number;
  deviationPct: number;
  kind: "recurring-spike" | "micro-unrecognized";
  ts: number;
}

export function detectAnomalies(
  state: LedgerState,
  now = Date.now()
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byLabel = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    const list = byLabel.get(t.label) ?? [];
    list.push(t);
    byLabel.set(t.label, list);
  }

  // Recurring merchants whose latest charge spikes >40% above trailing mean
  for (const [label, txs] of byLabel) {
    if (txs.length < 3) continue;
    const sorted = [...txs].sort((a, b) => a.ts - b.ts);
    const latest = sorted[sorted.length - 1];
    if (now - latest.ts > 45 * DAY) continue;
    const history = sorted.slice(0, -1);
    const mean = sum(history) / history.length;
    if (mean < 5) continue;
    const dev = (latest.amount - mean) / mean;
    if (dev > 0.4) {
      anomalies.push({
        id: uid("an"),
        txId: latest.id,
        label,
        amount: latest.amount,
        expected: mean,
        deviationPct: Math.round(dev * 100),
        kind: "recurring-spike",
        ts: latest.ts,
      });
    }
  }

  // Unrecognized micro-transactions: small charges at never-seen merchants
  const recent = state.transactions.filter((t) => now - t.ts <= 14 * DAY);
  for (const t of recent) {
    const hist = byLabel.get(t.label) ?? [];
    if (hist.length === 1 && t.amount > 0 && t.amount < 10 && t.source === "payment") {
      anomalies.push({
        id: uid("an"),
        txId: t.id,
        label: t.label,
        amount: t.amount,
        expected: 0,
        deviationPct: 100,
        kind: "micro-unrecognized",
        ts: t.ts,
      });
    }
  }

  return anomalies.sort((a, b) => b.ts - a.ts);
}

/* ---------------- Governance: live checks on every mutation ---------------- */

export function memberMonthSpend(
  state: LedgerState,
  memberId: string,
  now = Date.now()
) {
  return sum(
    state.transactions.filter((t) => t.memberId === memberId && inMonth(t, now))
  );
}

export function memberVelocity(
  state: LedgerState,
  memberId: string,
  now = Date.now()
) {
  const last24 = state.transactions.filter(
    (t) => t.memberId === memberId && now - t.ts <= DAY
  );
  const prior7 = state.transactions.filter(
    (t) => t.memberId === memberId && now - t.ts > DAY && now - t.ts <= 8 * DAY
  );
  const dailyAvg = sum(prior7) / 7;
  return { last24: sum(last24), dailyAvg, count24: last24.length };
}

/** Called by the store after each new transaction — returns alerts to push. */
export function runGovernanceChecks(
  state: LedgerState,
  newTx: Transaction,
  now = Date.now()
): FamAlert[] {
  const alerts: FamAlert[] = [];
  const member = state.members.find((m) => m.id === newTx.memberId);
  const mk = (a: Omit<FamAlert, "id" | "ts" | "read">): FamAlert => ({
    ...a,
    id: uid("al"),
    ts: now,
    read: false,
  });

  // Member cap breach / approach
  if (member?.monthlyCap != null) {
    const spent = memberMonthSpend(state, member.id, now);
    if (spent > member.monthlyCap) {
      alerts.push(
        mk({
          kind: "budget",
          severity: "critical",
          title: `${member.name} exceeded their monthly cap`,
          body: `${fmtMoney(Math.round(spent))} spent against a $${member.monthlyCap} cap.`,
          memberId: member.id,
        })
      );
    } else if (spent > member.monthlyCap * 0.85) {
      alerts.push(
        mk({
          kind: "budget",
          severity: "warn",
          title: `${member.name} at ${Math.round((spent / member.monthlyCap) * 100)}% of cap`,
          body: `${fmtMoney(Math.round((member.monthlyCap - spent)))} left this month.`,
          memberId: member.id,
        })
      );
    }
  }

  // Category cap breach
  const cap = state.settings.categoryCaps[newTx.category];
  if (cap != null) {
    const catSpent = sum(
      state.transactions.filter(
        (t) => t.category === newTx.category && inMonth(t, now)
      )
    );
    if (catSpent > cap) {
      alerts.push(
        mk({
          kind: "budget",
          severity: "warn",
          title: `${CATEGORY_MAP[newTx.category].label} over budget`,
          body: `${fmtMoney(Math.round(catSpent))} against a $${cap} monthly cap.`,
        })
      );
    }
  }

  // Spending velocity: burst detection
  if (member) {
    const v = memberVelocity(state, member.id, now);
    if (v.dailyAvg > 0 && v.last24 > Math.max(40, v.dailyAvg * 3)) {
      alerts.push(
        mk({
          kind: "velocity",
          severity: "warn",
          title: `Spending velocity spike — ${member.name}`,
          body: `${fmtMoney(Math.round(v.last24))} in 24h vs. a ${fmtMoney(Math.round(v.dailyAvg))}/day average (${v.count24} transactions).`,
          memberId: member.id,
        })
      );
    }
  }

  // Runway early-warning after large transactions
  if (newTx.amount >= 100) {
    const runway = computeRunway(state, now);
    if (runway.projectedDelta < 0 && runway.confidence !== "low") {
      alerts.push(
        mk({
          kind: "runway",
          severity: "critical",
          title: "Overdraft trajectory detected",
          body: `Current burn rate of ${fmtMoney(Math.round(runway.dailyBurn))}/day projects ${fmtMoney(Math.round(runway.projectedTotal))} by month-end — ${fmtMoney(Math.round(Math.abs(runway.projectedDelta)))} over budget (predicted dry on day ${runway.overdraftDay}).`,
        })
      );
    }
  }

  return alerts;
}

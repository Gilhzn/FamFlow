import {
  FamilySettings,
  LedgerState,
  Member,
  Transaction,
  CategoryId,
} from "./types";

// Deterministic pseudo-random so every client seeds identical demo data.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MEMBERS: Member[] = [
  { id: "m_dana", name: "Dana", role: "admin", color: "#6c8cff", monthlyCap: null },
  { id: "m_avi", name: "Avi", role: "admin", color: "#3fcf8e", monthlyCap: null },
  { id: "m_noa", name: "Noa", role: "member", color: "#c084fc", monthlyCap: 350 },
  { id: "m_tom", name: "Tom", role: "member", color: "#ffb84d", monthlyCap: 200 },
];

const SETTINGS: FamilySettings = {
  familyName: "The Levi Family",
  currency: "USD",
  monthlyBudget: 6200,
  categoryCaps: { food: 1400, leisure: 700, fixed: 2600, mandatory: 1600 },
};

// Product price registry — powers AI scan historical matching.
export const PRODUCT_REGISTRY: { name: string; price: number; category: CategoryId }[] = [
  { name: "Whole Milk 1L", price: 1.9, category: "food" },
  { name: "Sourdough Bread", price: 4.5, category: "food" },
  { name: "Free-Range Eggs 12pk", price: 5.2, category: "food" },
  { name: "Bananas 1kg", price: 1.6, category: "food" },
  { name: "Chicken Breast 1kg", price: 8.9, category: "food" },
  { name: "Pasta Barilla 500g", price: 2.1, category: "food" },
  { name: "Olive Oil 750ml", price: 9.8, category: "food" },
  { name: "Greek Yogurt 500g", price: 3.4, category: "food" },
  { name: "Tomatoes 1kg", price: 2.8, category: "food" },
  { name: "Coffee Beans 250g", price: 7.5, category: "food" },
  { name: "Cheddar Cheese 200g", price: 4.1, category: "food" },
  { name: "Orange Juice 1L", price: 3.2, category: "food" },
  { name: "Cereal Box", price: 4.9, category: "food" },
  { name: "Diapers 40pk", price: 14.5, category: "mandatory" },
  { name: "Dish Soap", price: 2.4, category: "fixed" },
  { name: "Laundry Detergent", price: 8.7, category: "fixed" },
];

interface MerchantDef {
  label: string;
  category: CategoryId;
  min: number;
  max: number;
  weeklyFreq: number; // avg occurrences per week
  members: string[];
}

const MERCHANTS: MerchantDef[] = [
  { label: "SuperMart Groceries", category: "food", min: 45, max: 160, weeklyFreq: 2.2, members: ["m_dana", "m_avi"] },
  { label: "Corner Bakery", category: "food", min: 6, max: 18, weeklyFreq: 1.5, members: ["m_dana", "m_noa"] },
  { label: "Wolt Delivery", category: "food", min: 22, max: 58, weeklyFreq: 1.8, members: ["m_avi", "m_noa", "m_tom"] },
  { label: "Coffee Corner", category: "food", min: 4, max: 12, weeklyFreq: 3.0, members: ["m_dana", "m_avi", "m_noa"] },
  { label: "Cinema City", category: "leisure", min: 24, max: 60, weeklyFreq: 0.5, members: ["m_noa", "m_tom", "m_avi"] },
  { label: "Spotify Family", category: "leisure", min: 16.9, max: 16.9, weeklyFreq: 0.23, members: ["m_dana"] },
  { label: "Netflix", category: "leisure", min: 15.5, max: 15.5, weeklyFreq: 0.23, members: ["m_dana"] },
  { label: "Steam Games", category: "leisure", min: 9, max: 45, weeklyFreq: 0.4, members: ["m_tom"] },
  { label: "Yoga Studio", category: "leisure", min: 18, max: 18, weeklyFreq: 0.9, members: ["m_dana"] },
  { label: "Arcade Zone", category: "leisure", min: 12, max: 30, weeklyFreq: 0.35, members: ["m_tom", "m_noa"] },
  { label: "Electric Co.", category: "fixed", min: 118, max: 165, weeklyFreq: 0.23, members: ["m_avi"] },
  { label: "Water Utility", category: "fixed", min: 38, max: 55, weeklyFreq: 0.23, members: ["m_avi"] },
  { label: "Internet Fiber", category: "fixed", min: 39.9, max: 39.9, weeklyFreq: 0.23, members: ["m_avi"] },
  { label: "Cell Plan x4", category: "fixed", min: 62, max: 62, weeklyFreq: 0.23, members: ["m_dana"] },
  { label: "Home Insurance", category: "fixed", min: 84, max: 84, weeklyFreq: 0.23, members: ["m_avi"] },
  { label: "Rent — Herzl St 12", category: "mandatory", min: 1450, max: 1450, weeklyFreq: 0.23, members: ["m_avi"] },
  { label: "Sunshine Kindergarten", category: "mandatory", min: 480, max: 480, weeklyFreq: 0.23, members: ["m_dana"] },
  { label: "Health Fund", category: "mandatory", min: 96, max: 96, weeklyFreq: 0.23, members: ["m_dana"] },
  { label: "Pharmacy Plus", category: "mandatory", min: 8, max: 42, weeklyFreq: 0.6, members: ["m_dana", "m_avi"] },
];

export function buildSeedTransactions(now = Date.now()): Transaction[] {
  const rand = mulberry32(42);
  const txs: Transaction[] = [];
  const DAY = 86_400_000;
  const days = 100; // ~3.3 months of history
  let counter = 0;

  for (let d = days; d >= 1; d--) {
    const dayStart = now - d * DAY;
    for (const m of MERCHANTS) {
      const pDaily = m.weeklyFreq / 7;
      // Monthly items land on a fixed day-of-month instead of random draw
      if (m.weeklyFreq <= 0.25) {
        const date = new Date(dayStart);
        const dom = m.category === "mandatory" ? 1 : m.category === "fixed" ? 3 : 5;
        if (date.getDate() !== dom) continue;
      } else if (rand() > pDaily) {
        continue;
      }
      const amount = Math.round((m.min + rand() * (m.max - m.min)) * 100) / 100;
      const member = m.members[Math.floor(rand() * m.members.length)];
      const hour = 8 + Math.floor(rand() * 13);
      txs.push({
        id: `seed_${counter++}`,
        memberId: member,
        amount,
        category: m.category,
        label: m.label,
        ts: dayStart + hour * 3_600_000 + Math.floor(rand() * 3_500_000),
        source: rand() < 0.2 ? "payment" : "manual",
      });
    }
  }

  // A recent anomaly: utility spike for anomaly-detection demo
  const lastElectric = txs.filter((t) => t.label === "Electric Co.").pop();
  if (lastElectric) lastElectric.amount = 287.4;

  txs.sort((a, b) => a.ts - b.ts);
  return txs;
}

export function buildSeedState(now = Date.now()): LedgerState {
  return {
    members: MEMBERS,
    transactions: buildSeedTransactions(now),
    alerts: [],
    cards: [
      {
        id: "card_seed1",
        memberId: "m_dana",
        brand: "visa",
        last4: "4242",
        expMonth: 8,
        expYear: 2029,
        token: "tok_mock_dana4242",
        createdAt: now - 40 * 86_400_000,
      },
    ],
    settings: SETTINGS,
  };
}

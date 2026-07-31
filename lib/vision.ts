import { CategoryId, Transaction } from "./types";

/**
 * Vision matching engine — pure, testable.
 *
 * Fuzzy-matches receipt line items extracted by Claude Vision against
 * (a) the historical PRODUCT_REGISTRY and (b) line items of previously
 * scanned transactions, producing per-item price history + category hints.
 *
 * CRITICAL FALLBACK RULE: when there is NO history match, historicalPrice
 * is null and matched=false — a price is never fabricated. The UI then
 * relies on the vision estimate or manual entry.
 */

export interface VisionItem {
  name: string;
  price?: number | null;
}

export interface PriceMatch {
  name: string;
  visionPrice: number | null;
  historicalPrice: number | null;
  matched: boolean;
  suggestedCategory: CategoryId;
}

export interface RegistryEntry {
  name: string;
  price: number;
  category: CategoryId;
}

interface Candidate {
  name: string;
  price: number;
  category: CategoryId;
  /** Recency weight for tie-breaking: registry = 0, scan items = tx timestamp. */
  ts: number;
}

const UNIT_TOKEN = /^\d+(g|kg|ml|l|pk|pcs|pack|ct|oz|lb|x\d*)?$/;

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !UNIT_TOKEN.test(t));
}

/** Similarity in [0,1] — exact > includes > token overlap. */
export function nameSimilarity(a: string, b: string): number {
  const an = a.trim().toLowerCase();
  const bn = b.trim().toLowerCase();
  if (!an || !bn) return 0;
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.9;
  const at = tokenize(an);
  const bt = tokenize(bn);
  if (at.length === 0 || bt.length === 0) return 0;
  const bset = new Set(bt);
  const overlap = at.filter((t) => bset.has(t)).length;
  return overlap / Math.max(at.length, bt.length);
}

/** Minimum similarity to count as a history match. */
const MATCH_THRESHOLD = 0.5;

const CATEGORY_HINTS: Array<[RegExp, CategoryId]> = [
  [/game|movie|cinema|ticket|toy|book|lego|console/i, "leisure"],
  [/soap|detergent|cleaner|sponge|towel|bulb|battery|batteries/i, "fixed"],
  [/diaper|pharma|medicine|vitamin|prescription|formula/i, "mandatory"],
];

function guessCategory(name: string): CategoryId {
  for (const [re, cat] of CATEGORY_HINTS) {
    if (re.test(name)) return cat;
  }
  return "food";
}

/**
 * Match each vision-extracted item against the product registry and the line
 * items of past scanned transactions. Case-insensitive token overlap /
 * substring inclusion. Never fabricates a price: no match → historicalPrice
 * null, matched false.
 */
export function matchHistoricalPrices(
  items: VisionItem[],
  transactions: Transaction[],
  registry: RegistryEntry[]
): PriceMatch[] {
  const candidates: Candidate[] = [];

  for (const r of registry) {
    candidates.push({ name: r.name, price: r.price, category: r.category, ts: 0 });
  }

  for (const t of transactions) {
    if (t.source !== "scan" || !t.items) continue;
    for (const it of t.items) {
      if (!it.name || typeof it.price !== "number" || !isFinite(it.price)) continue;
      candidates.push({ name: it.name, price: it.price, category: t.category, ts: t.ts });
    }
  }

  return items.map((item) => {
    const name = (item.name ?? "").trim();
    const visionPrice =
      typeof item.price === "number" && isFinite(item.price)
        ? Math.round(item.price * 100) / 100
        : null;

    let best: Candidate | null = null;
    let bestScore = 0;
    for (const c of candidates) {
      const score = nameSimilarity(name, c.name);
      if (
        score > bestScore ||
        (score === bestScore && best !== null && score >= MATCH_THRESHOLD && c.ts > best.ts)
      ) {
        best = c;
        bestScore = score;
      }
    }

    if (best && bestScore >= MATCH_THRESHOLD) {
      return {
        name,
        visionPrice,
        historicalPrice: Math.round(best.price * 100) / 100,
        matched: true,
        suggestedCategory: best.category,
      };
    }

    // No history — never fabricate a price.
    return {
      name,
      visionPrice,
      historicalPrice: null,
      matched: false,
      suggestedCategory: guessCategory(name),
    };
  });
}

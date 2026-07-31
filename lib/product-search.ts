import { PRODUCT_REGISTRY } from "./seed";
import { CategoryId } from "./types";

/**
 * Product photo → price search ("Google Images"-style automation).
 *
 * On a static deployment there is no server and no image-search API key, so
 * this is a deterministic simulation: the photo's bytes seed a PRNG that
 * identifies a product and fabricates a handful of price offers from
 * plausible stores — always labeled "mock" in the UI. Identical photos
 * always resolve to identical results.
 */

export interface ProductOffer {
  id: string;
  store: string;
  price: number;
  /** e.g. "In stock" flavor line shown under the store name */
  noteKey: "inStock" | "delivery" | "pickup" | "sale";
}

export interface ProductSearchResult {
  mode: "mock";
  productName: string;
  category: CategoryId;
  offers: ProductOffer[]; // sorted cheapest first
}

const STORES = [
  "SuperMart",
  "Amazon",
  "Walmart",
  "Shufersal Online",
  "Rami Levy",
  "eBay",
  "Target",
  "Victory",
];

const NOTES: ProductOffer["noteKey"][] = ["inStock", "delivery", "pickup", "sale"];

function hashImage(b64: string): number {
  let h = 0x811c9dc5;
  const stride = Math.max(1, Math.floor(b64.length / 4096));
  for (let i = 0; i < b64.length; i += stride) {
    h ^= b64.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function mockProductSearch(
  imageBase64: string
): Promise<ProductSearchResult> {
  const rand = mulberry32(hashImage(imageBase64));

  const product = PRODUCT_REGISTRY[Math.floor(rand() * PRODUCT_REGISTRY.length)];

  const storePool = [...STORES];
  const offerCount = 4 + Math.floor(rand() * 2); // 4–5 offers
  const offers: ProductOffer[] = [];
  for (let i = 0; i < offerCount && storePool.length > 0; i++) {
    const [store] = storePool.splice(Math.floor(rand() * storePool.length), 1);
    // Spread of ±20% around the registry price, so offers genuinely differ.
    const jitter = 0.8 + rand() * 0.4;
    offers.push({
      id: `offer_${i}`,
      store,
      price: Math.max(0.5, Math.round(product.price * jitter * 100) / 100),
      noteKey: NOTES[Math.floor(rand() * NOTES.length)],
    });
  }
  offers.sort((a, b) => a.price - b.price);

  // ~1.4s so the "searching" UX reads honestly.
  await new Promise((r) => setTimeout(r, 1400));

  return {
    mode: "mock",
    productName: product.name,
    category: product.category,
    offers,
  };
}

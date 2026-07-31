import { PRODUCT_REGISTRY } from "./seed";

/**
 * Deterministic mock vision extraction — shared by the /api/vision route
 * (no-API-key mode) and the client (static deployments with no server at
 * all). Derives 3–6 items from a hash of the image bytes so identical
 * photos always "scan" identically. Always labeled mode:"mock" in the UI.
 */

export interface ExtractedItem {
  name: string;
  price: number;
}

export interface VisionPayload {
  mode: "live" | "mock";
  merchant: string;
  items: ExtractedItem[];
}

/** FNV-1a over a (sampled) string — deterministic for identical image bytes. */
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

export async function mockExtract(imageBase64: string): Promise<VisionPayload> {
  const rand = mulberry32(hashImage(imageBase64));
  const count = 3 + Math.floor(rand() * 4); // 3–6 items

  const pool = [...PRODUCT_REGISTRY];
  const items: ExtractedItem[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    const [product] = pool.splice(idx, 1);
    const jitter = 0.9 + rand() * 0.2; // ±10%
    items.push({
      name: product.name,
      price: Math.round(product.price * jitter * 100) / 100,
    });
  }

  // ~1.2s artificial latency so the scanning UX reads honestly.
  await new Promise((r) => setTimeout(r, 1200));

  return { mode: "mock", merchant: "SuperMart Groceries", items };
}

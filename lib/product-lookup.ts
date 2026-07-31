"use client";

/**
 * REAL product identification & pricing — free, no AI, no tokens.
 *
 * 1. Barcode decode: runs entirely in the browser (native BarcodeDetector
 *    when available, ZXing as fallback). Zero network.
 * 2. Product lookup: Open Food Facts — the open, free product database
 *    (name, brand, photo, quantity) with CORS-enabled public API.
 * 3. Prices: Open Prices (prices.openfoodfacts.org) — community-recorded
 *    real store prices, where available.
 *
 * Every call is defensive: any network/API failure surfaces as null so the
 * UI can fall back gracefully (labeled simulation / manual entry).
 */

export interface OffProduct {
  code: string;
  name: string;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  categories: string | null;
}

export interface RealPrice {
  id: string;
  price: number;
  currency: string;
  store: string;
  location: string | null;
  date: string | null;
}

const OFF_FIELDS =
  "code,product_name,product_name_he,product_name_en,brands,quantity,image_front_small_url,image_small_url,image_url,categories";

function normalizeProduct(p: Record<string, unknown>): OffProduct | null {
  const code = typeof p.code === "string" ? p.code : String(p.code ?? "");
  const name =
    (p.product_name_he as string) ||
    (p.product_name as string) ||
    (p.product_name_en as string) ||
    "";
  if (!code || !name) return null;
  return {
    code,
    name: name.slice(0, 120),
    brand: (p.brands as string) || null,
    quantity: (p.quantity as string) || null,
    imageUrl:
      (p.image_front_small_url as string) ||
      (p.image_small_url as string) ||
      (p.image_url as string) ||
      null,
    categories: (p.categories as string) || null,
  };
}

/** Decode a barcode from an image data-URL. Local only — no network. */
export async function decodeBarcode(dataUrl: string): Promise<string | null> {
  // 1. Native BarcodeDetector (Chrome/Android — fastest path)
  try {
    const BD = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (BD) {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const bitmap = await createImageBitmap(img);
      const detector = new BD({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });
      const found = await detector.detect(bitmap);
      if (found.length > 0 && found[0].rawValue) return found[0].rawValue;
    }
  } catch {}

  // 2. ZXing fallback (all browsers)
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageUrl(dataUrl);
    const text = result.getText();
    if (text) return text;
  } catch {}

  return null;
}

/** Open Food Facts: exact product by barcode. null = not found / unreachable. */
export async function lookupByBarcode(code: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return normalizeProduct(data.product);
  } catch {
    return null;
  }
}

/** Open Food Facts: free-text product search (real products with photos). */
export async function searchByName(
  query: string,
  country?: string
): Promise<OffProduct[] | null> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      json: "1",
      page_size: "10",
      fields: OFF_FIELDS,
    });
    if (country) params.set("countries_tags_en", country.toLowerCase());
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    return products
      .map((p: Record<string, unknown>) => normalizeProduct(p))
      .filter((p: OffProduct | null): p is OffProduct => p !== null);
  } catch {
    return null;
  }
}

/** Open Prices: real community-recorded store prices for a barcode. */
export async function fetchRealPrices(code: string): Promise<RealPrice[]> {
  try {
    const res = await fetch(
      `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(code)}&size=10&order_by=-date`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const prices: RealPrice[] = [];
    for (const it of items) {
      const price = typeof it.price === "number" ? it.price : parseFloat(it.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const loc = it.location ?? {};
      prices.push({
        id: String(it.id ?? prices.length),
        price: Math.round(price * 100) / 100,
        currency: typeof it.currency === "string" ? it.currency : "",
        store: loc.osm_name || loc.osm_brand || it.location_id?.toString() || "—",
        location: loc.osm_address_city || loc.osm_address_country || null,
        date: typeof it.date === "string" ? it.date : null,
      });
    }
    return prices;
  } catch {
    return [];
  }
}

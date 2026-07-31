import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { mockExtract } from "@/lib/vision-mock";
import type { ExtractedItem, VisionPayload } from "@/lib/vision-mock";

export const runtime = "nodejs";

/**
 * POST /api/vision — { imageBase64, mediaType }
 *
 * Live mode (ANTHROPIC_API_KEY set): Claude vision extracts receipt line
 * items as strict JSON. Mock mode: deterministically derives 3–6 items from
 * a hash of the image bytes, with ~1.2s artificial latency. Response shape
 * is identical in both modes.
 */

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const EXTRACTION_PROMPT = `You are a receipt and product photo analyzer for a family expense tracker.
Look at the image and extract the merchant name and purchased line items.

Respond with ONLY strict JSON — no markdown fences, no commentary — in exactly this shape:
{"merchant": "Store Name", "items": [{"name": "Item name", "price": 4.99}]}

Rules:
- "price" is the line total as a plain number (no currency symbols).
- Skip subtotal, total, tax, change and payment lines.
- Normalize item names to plain product names (e.g. "WHL MLK 1L" -> "Whole Milk 1L").
- If the image is a single product photo rather than a receipt, return one item with your best price estimate and merchant "Unknown Store".
- If nothing purchasable is visible, return {"merchant": "Unknown", "items": []}.`;

/* ---------------- defensive JSON parsing ---------------- */

function parseVisionJson(text: string): { merchant: string; items: ExtractedItem[] } | null {
  // Strip code fences if the model added them despite instructions.
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;
  const merchant =
    typeof obj.merchant === "string" && obj.merchant.trim()
      ? obj.merchant.trim().slice(0, 80)
      : "Unknown Store";

  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  const items: ExtractedItem[] = [];
  for (const raw of rawItems.slice(0, 30)) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim().slice(0, 80) : "";
    const price =
      typeof r.price === "number"
        ? r.price
        : typeof r.price === "string"
          ? parseFloat(r.price.replace(/[^0-9.\-]/g, ""))
          : NaN;
    if (!name || !isFinite(price) || price < 0) continue;
    items.push({ name, price: Math.round(price * 100) / 100 });
  }
  return { merchant, items };
}

/* ---------------- live mode ---------------- */

async function liveExtract(imageBase64: string, mediaType: MediaType): Promise<VisionPayload> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseVisionJson(text);
  if (!parsed) {
    return { mode: "live", merchant: "Unknown Store", items: [] };
  }
  return { mode: "live", ...parsed };
}

/* ---------------- handler ---------------- */

export async function POST(req: Request) {
  let body: { imageBase64?: unknown; mediaType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  const mediaType: MediaType = MEDIA_TYPES.includes(body.mediaType as MediaType)
    ? (body.mediaType as MediaType)
    : "image/jpeg";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return NextResponse.json(await liveExtract(imageBase64, mediaType));
    } catch {
      // Never substitute invented line items for a real receipt — surface the
      // failure and let the client's error banner offer a retry.
      return NextResponse.json(
        { error: "Vision analysis failed — please retry." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(await mockExtract(imageBase64));
}

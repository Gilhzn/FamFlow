/**
 * stripe-mock — a faithful mini Stripe façade for the demo wallet.
 *
 * Mirrors the real Stripe.js surface: client-side card validation
 * (luhn / brand / expiry), async tokenization, and a PaymentIntent
 * lifecycle with staged status callbacks and realistic latency.
 * Amount 6.66 always declines — the demo path for error handling.
 */

export type CardBrand = "visa" | "mastercard" | "amex";

export type StripeMockErrorCode =
  | "invalid_number"
  | "incomplete_number"
  | "expired_card"
  | "invalid_expiry"
  | "invalid_cvc"
  | "card_declined";

export class StripeMockError extends Error {
  code: StripeMockErrorCode;
  constructor(code: StripeMockErrorCode, message: string) {
    super(message);
    this.name = "StripeMockError";
    this.code = code;
  }
}

/* ---------------------------------- validation ---------------------------------- */

export function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function detectBrand(number: string): CardBrand | null {
  const d = number.replace(/\D/g, "");
  if (d.length === 0) return null;
  if (/^3[47]/.test(d)) return "amex";
  if (/^4/.test(d)) return "visa";
  if (/^5/.test(d)) return "mastercard";
  return null;
}

export function cardNumberLength(brand: CardBrand | null): number {
  return brand === "amex" ? 15 : 16;
}

/** Groups of 4 (Visa/MC) or 4-6-5 (Amex). */
export function formatCardNumber(number: string): string {
  const brand = detectBrand(number);
  const d = number.replace(/\D/g, "").slice(0, cardNumberLength(brand));
  if (brand === "amex") {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return d.match(/.{1,4}/g)?.join(" ") ?? "";
}

/** Accepts 2- or 4-digit years. */
export function normalizeYear(year: number): number {
  return year < 100 ? 2000 + year : year;
}

export function isExpired(expMonth: number, expYear: number, now = new Date()): boolean {
  const y = normalizeYear(expYear);
  const m = expMonth;
  if (y < now.getFullYear()) return true;
  if (y === now.getFullYear() && m < now.getMonth() + 1) return true;
  return false;
}

/* --------------------------------- tokenization --------------------------------- */

export interface TokenizeInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface TokenResult {
  token: string;
  last4: string;
  brand: CardBrand;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const jitter = (base: number, spread = 0.25) =>
  Math.round(base * (1 - spread / 2 + Math.random() * spread));

function mockId(prefix: string): string {
  return `${prefix}_mock_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Tokenize a raw card. Resolves after ~700ms with a mock token;
 * rejects (after the same latency, like the real API) on luhn
 * failure, unsupported brand, past expiry, or bad CVC.
 */
export async function createToken(input: TokenizeInput): Promise<TokenResult> {
  await delay(jitter(700));

  const digits = input.number.replace(/\D/g, "");
  const brand = detectBrand(digits);

  if (!brand) {
    throw new StripeMockError("invalid_number", "Unsupported card number.");
  }
  if (digits.length !== cardNumberLength(brand)) {
    throw new StripeMockError("incomplete_number", "Card number is incomplete.");
  }
  if (!luhnCheck(digits)) {
    throw new StripeMockError("invalid_number", "Invalid card number — check the digits.");
  }
  if (input.expMonth < 1 || input.expMonth > 12) {
    throw new StripeMockError("invalid_expiry", "Invalid expiration month.");
  }
  if (isExpired(input.expMonth, input.expYear)) {
    throw new StripeMockError("expired_card", "This card has expired.");
  }
  const cvcLen = brand === "amex" ? 4 : 3;
  if (!/^\d+$/.test(input.cvc) || input.cvc.length !== cvcLen) {
    throw new StripeMockError("invalid_cvc", `CVC must be ${cvcLen} digits.`);
  }

  return {
    token: mockId("tok"),
    last4: digits.slice(-4),
    brand,
  };
}

/* -------------------------------- payment intents -------------------------------- */

export type IntentStage = "authorizing" | "capturing" | "succeeded";

export interface PaymentIntentInput {
  amount: number;
  token: string;
  /** Staged lifecycle callbacks — fired as the intent progresses. */
  onStage?: (stage: IntentStage) => void;
}

export interface PaymentIntentResult {
  id: string;
  status: "succeeded";
  amount: number;
}

/** The magic amount that always declines (demo of the error path). */
export const DECLINE_AMOUNT = 6.66;

/**
 * Create & confirm a payment intent. ~1.4s total latency with staged
 * status callbacks (authorizing → capturing → succeeded). An amount of
 * exactly 6.66 is declined by the "issuer".
 */
export async function createPaymentIntent(
  input: PaymentIntentInput
): Promise<PaymentIntentResult> {
  if (!input.token || !input.token.startsWith("tok_")) {
    throw new StripeMockError("invalid_number", "Invalid payment token.");
  }

  input.onStage?.("authorizing");
  await delay(jitter(650));

  if (Math.abs(input.amount - DECLINE_AMOUNT) < 0.001) {
    await delay(jitter(300));
    throw new StripeMockError(
      "card_declined",
      "Your card was declined by the issuing bank."
    );
  }

  input.onStage?.("capturing");
  await delay(jitter(750));

  input.onStage?.("succeeded");
  return {
    id: mockId("pi"),
    status: "succeeded",
    amount: input.amount,
  };
}

/** The classic Stripe test card — always passes luhn. */
export const TEST_CARD = {
  number: "4242424242424242",
  expMonth: 12,
  expYear: 2029,
  cvc: "424",
};

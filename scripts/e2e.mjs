// Integration E2E — Agent 4 (CTO pass).
// 1. Live cross-tab sync: two tabs on /ledger; a manual entry in tab A must
//    appear in tab B without reload, within 2s.
// 2. Wallet add-card modal must be truly viewport-fixed (regression check for
//    the persistent-transform containing-block bug).
// 3. Full payment flow: add test card -> pay -> success toast visible in
//    viewport -> transaction instantly present in the shared ledger feed.
import { chromium } from "playwright-core";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});
await ctx.addInitScript(() => {
  localStorage.setItem("famfinance.session.v1", "m_dana");
});

// ---------- 1. Cross-tab live sync ----------
const tabA = await ctx.newPage();
const tabB = await ctx.newPage();
await tabA.goto("http://localhost:3000/ledger", { waitUntil: "networkidle" });
await tabB.goto("http://localhost:3000/ledger", { waitUntil: "networkidle" });
await tabA.waitForTimeout(800);

const uniqueLabel = `E2E Sync Probe ${Math.random().toString(36).slice(2, 7)}`;
await tabA.getByLabel("Amount").fill("12.34");
await tabA.getByPlaceholder(/what was it/i).fill(uniqueLabel);
await tabA.getByRole("button", { name: "Add", exact: true }).click();

// The entry must appear in tab A instantly (optimistic)…
try {
  await tabA.getByText(uniqueLabel).first().waitFor({ timeout: 1500 });
  check("optimistic entry in origin tab", true);
} catch {
  check("optimistic entry in origin tab", false, "row never rendered in tab A");
}
// …and in tab B via BroadcastChannel within 2s, no reload.
const t0 = Date.now();
try {
  await tabB.getByText(uniqueLabel).first().waitFor({ timeout: 2000 });
  check("live sync to second tab", true, `${Date.now() - t0}ms`);
} catch {
  check("live sync to second tab", false, "entry never appeared in tab B");
}

// ---------- 2. Modal geometry ----------
const w = await ctx.newPage();
await w.goto("http://localhost:3000/wallet", { waitUntil: "networkidle" });
await w.waitForTimeout(900);
await w.getByRole("button", { name: /add card/i }).click();
await w.waitForTimeout(500);
const overlay = await w.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const el = dialog?.parentElement; // the fixed inset-0 backdrop
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
const vpOK =
  overlay &&
  Math.abs(overlay.x) < 2 &&
  Math.abs(overlay.y) < 2 &&
  Math.abs(overlay.w - 1440) < 4 &&
  Math.abs(overlay.h - 900) < 4;
check(
  "add-card modal overlay covers viewport",
  !!vpOK,
  overlay ? `rect ${Math.round(overlay.w)}x${Math.round(overlay.h)} at (${Math.round(overlay.x)},${Math.round(overlay.y)})` : "no dialog found"
);

// ---------- 3. Add card + payment flow ----------
await w.getByText(/use test card/i).click();
await w.getByRole("button", { name: /save card/i }).click();
try {
  await w.getByText("•••• 4242").last().waitFor({ timeout: 4000 });
  check("tokenized card added to wallet", true);
} catch {
  check("tokenized card added to wallet", false);
}
await w.waitForTimeout(400);

const payLabel = `E2E Coffee ${Math.random().toString(36).slice(2, 6)}`;
await w.getByPlaceholder("0.00").fill("9.75");
await w.getByPlaceholder("e.g. SuperMart Groceries").fill(payLabel);
const payBtn = w.getByRole("button", { name: /^pay/i }).first();
await payBtn.click();

let toastOK = false;
let toastRect = null;
try {
  const toast = w.getByText(/logged to family ledger/i).first();
  await toast.waitFor({ timeout: 6000 });
  toastRect = await toast.boundingBox();
  toastOK =
    !!toastRect &&
    toastRect.y >= 0 &&
    toastRect.y + toastRect.height <= 900 &&
    toastRect.x >= 0;
} catch {}
check(
  "payment success toast visible in viewport",
  toastOK,
  toastRect ? `y=${Math.round(toastRect.y)}..${Math.round(toastRect.y + toastRect.height)}` : "toast never appeared"
);

// Payment must be instantly mapped into the shared ledger (tab B still open).
try {
  await tabB.getByText(payLabel).first().waitFor({ timeout: 2500 });
  check("payment auto-logged into shared ledger (cross-tab)", true);
} catch {
  check("payment auto-logged into shared ledger (cross-tab)", false);
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} E2E checks passed`);
process.exit(failed.length ? 1 : 0);

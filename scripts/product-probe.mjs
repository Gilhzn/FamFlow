import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
writeFileSync("/tmp/probe-product.png", png);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  localStorage.setItem("famfinance.session.v1", "m_dana");
  localStorage.setItem("famflow.lang.v1", "he");
});
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));

await p.goto("http://localhost:3000/scan", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

// Switch to product mode
await p.getByRole("button", { name: /זיהוי מוצר/ }).click();
await p.setInputFiles('input[type="file"]', "/tmp/probe-product.png");
await p.waitForTimeout(400);
await p.getByRole("button", { name: /ניתוח|Analyze|חיפוש/i }).first().click().catch(async () => {
  // Analyze button label — find any primary button in capture zone
  await p.locator(".btn-primary").first().click();
});

// Wait for offers list
await p.getByText(/הצעות מחיר/).waitFor({ timeout: 15000 });
const offers = await p.locator('[aria-pressed]').filter({ hasText: /\$/ }).count();
console.log("offers rendered:", offers);
await p.screenshot({ path: process.env.SD + "/product-results-he.png", fullPage: true });

// Pick the second offer, verify price fills
const offerBtns = p.locator('button[aria-pressed]').filter({ hasText: "$" });
await offerBtns.nth(1).click();
const priceVal1 = await p.getByLabel(/מחיר לרישום/).inputValue();
console.log("price after picking offer #2:", priceVal1);

// Manual override
await p.getByLabel(/מחיר לרישום/).fill("55.55");
const stillSelected = await offerBtns.nth(1).getAttribute("aria-pressed");
console.log("offer deselected after manual price:", stillSelected === "false");

// Log to ledger
await p.getByRole("button", { name: /רישום/ }).last().click();
await p.getByText(/נרשם|לצפייה/).first().waitFor({ timeout: 5000 });
console.log("logged: true");

// Verify it landed in the ledger with the manual price
await p.goto("http://localhost:3000/ledger", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const inLedger = await p.getByText("$55.55").first().isVisible().catch(() => false);
console.log("manual price in ledger:", inLedger);
console.log("page errors:", errors.length ? errors : "none");
await browser.close();

import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
writeFileSync("/tmp/probe2.png", png);

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

// 1. Product search with default country (IL) → Israeli chains
await p.goto("http://localhost:3000/scan", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.getByRole("button", { name: /זיהוי מוצר/ }).click();
await p.setInputFiles('input[type="file"]', "/tmp/probe2.png");
await p.waitForTimeout(400);
await p.locator(".btn-primary").first().click();
await p.getByText(/הצעות מחיר/).waitFor({ timeout: 15000 });
const body = await p.locator("body").innerText();
const israeliStores = ["רמי לוי", "שופרסל", "חצי חינם", "יוחננוף", "אושר עד", "ויקטורי", "טיב טעם", "קרפור"];
const found = israeliStores.filter((st) => body.includes(st));
console.log("Israeli chains in offers:", found.join(", ") || "NONE");
await p.screenshot({ path: process.env.SD + "/country-product-he.png", fullPage: true });

// 2. Admin: switch country + currency, verify ₪ appears
await p.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const sel = p.locator("select").first();
await sel.selectOption("IL");
await p.waitForTimeout(600);
const adminBody = await p.locator("body").innerText();
console.log("shekel symbol shown after IL:", adminBody.includes("₪"));
await p.screenshot({ path: process.env.SD + "/country-admin-he.png", fullPage: false });

// 3. Dashboard shows ₪ everywhere now
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const dash = await p.locator("body").innerText();
console.log("dashboard uses ₪:", dash.includes("₪"), "| still has $:", /\$\d/.test(dash));
console.log("page errors:", errors.length ? errors.slice(0,3) : "none");
await browser.close();

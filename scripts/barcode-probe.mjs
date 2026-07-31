import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "fs";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
const p0 = await ctx.newPage();
// rasterize the SVG barcode to PNG
await p0.goto("data:text/html,<body style='margin:0'></body>");
await p0.setContent(`<img id="b" src="data:image/svg+xml;base64,${readFileSync("/tmp/barcode.svg").toString("base64")}">`);
await p0.waitForTimeout(300);
const el = await p0.locator("#b");
await el.screenshot({ path: "/tmp/barcode.png" });

// now the app flow
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx2.addInitScript(() => {
  localStorage.setItem("famfinance.session.v1", "m_dana");
  localStorage.setItem("famflow.lang.v1", "he");
});
const p = await ctx2.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:3000/scan", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.getByRole("button", { name: /זיהוי מוצר/ }).click();
await p.setInputFiles('input[type="file"]', "/tmp/barcode.png");
await p.waitForTimeout(400);
await p.locator(".btn-primary").first().click();
await p.waitForTimeout(6000);
const body = await p.locator("body").innerText();
// In the sandbox OFF is unreachable → barcode decodes, lookup fails → search view "המוצר לא נמצא"
console.log("barcode decoded (search view w/ notFound):", body.includes("המוצר לא נמצא במאגר"));
console.log("no-barcode msg (would mean decode failed):", body.includes("לא זוהה ברקוד"));
console.log("sim fallback visible:", body.includes("חיפוש מדומה"));
await p.screenshot({ path: process.env.SD + "/barcode-flow.png", fullPage: true });

// no-barcode image (1x1) → search view with noBarcode message
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==","base64");
writeFileSync("/tmp/blank.png", png);
await p.getByRole("button", { name: /סריקה נוספת|מוצר אחר|חזרה/ }).first().click().catch(() => p.reload({waitUntil:"networkidle"}));
await p.waitForTimeout(800);
await p.getByRole("button", { name: /זיהוי מוצר/ }).click().catch(()=>{});
await p.setInputFiles('input[type="file"]', "/tmp/blank.png");
await p.waitForTimeout(300);
await p.locator(".btn-primary").first().click();
await p.waitForTimeout(4000);
const body2 = await p.locator("body").innerText();
console.log("blank image → no-barcode search view:", body2.includes("לא זוהה ברקוד"));
console.log("page errors:", errors.length ? errors.slice(0,3) : "none");
await browser.close();

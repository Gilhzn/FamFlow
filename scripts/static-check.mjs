import { chromium } from "playwright-core";
import { writeFileSync } from "fs";

// 1x1 red PNG for the scan-flow probe
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
writeFileSync("/tmp/probe.png", png);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
await ctx.addInitScript(() => localStorage.setItem("famfinance.session.v1", "m_dana"));
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));

await p.goto("http://localhost:8091/FamFlow/", { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const dashOK = await p.getByText("Predictive runway").isVisible().catch(() => false);
console.log("dashboard renders:", dashOK);

await p.goto("http://localhost:8091/FamFlow/scan.html", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.setInputFiles('input[type="file"]', "/tmp/probe.png");
await p.waitForTimeout(400);
await p.getByRole("button", { name: /analyze/i }).click();
try {
  await p.getByText(/mock vision/i).waitFor({ timeout: 15000 });
  console.log("scan mock fallback works: true");
  await p.screenshot({ path: process.env.SD + "/static-scan.png" });
} catch {
  console.log("scan mock fallback works: false");
  await p.screenshot({ path: process.env.SD + "/static-scan-fail.png" });
}
console.log("page errors:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();

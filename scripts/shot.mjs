// Screenshot harness for the Gauntlet Critic.
// Usage: node scripts/shot.mjs <path> <outfile.png> [viewport] [memberId] [lang]
//   viewport: "mobile" (390x844) | "desktop" (1440x900, default)
//   memberId: m_dana (admin, default) | m_avi | m_noa | m_tom | none
//   lang: en (default) | he
import { chromium } from "playwright-core";

const [, , route = "/", out = "shot.png", viewport = "desktop", member = "m_dana", lang = "en"] =
  process.argv;

const size =
  viewport === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 };

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({
  viewport: size,
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
if (member !== "none") {
  await ctx.addInitScript((id) => {
    localStorage.setItem("famfinance.session.v1", id);
  }, member);
}
await ctx.addInitScript((l) => {
  localStorage.setItem("famflow.lang.v1", l);
}, lang);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});
await page.goto(`http://localhost:3000${route}`, {
  waitUntil: "networkidle",
  timeout: 45000,
});
await page.waitForTimeout(1600);
await page.screenshot({ path: out, fullPage: true });

// Overflow audit: report elements wider than the viewport (layout breaks)
const overflows = await page.evaluate(() => {
  const bad = [];
  const vw = document.documentElement.clientWidth;
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > vw + 2 || r.left < -2)) {
      const cls = (el.className?.toString() || "").slice(0, 60);
      bad.push(`<${el.tagName.toLowerCase()} class="${cls}"> right=${Math.round(r.right)} vw=${vw}`);
    }
  });
  return bad.slice(0, 12);
});
await browser.close();

console.log(JSON.stringify({ out, route, viewport, errors: errors.slice(0, 10), overflows }, null, 2));

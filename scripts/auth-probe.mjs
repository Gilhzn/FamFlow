import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);

// 1. Sign-up: create a new family
await p.getByRole("button", { name: /create a new family/i }).click();
await p.getByLabel(/family name/i).fill("Cohen Family");
await p.getByLabel(/your name/i).fill("Gil");
await p.getByLabel(/email/i).fill("gil@example.com");
await p.getByLabel(/password/i).fill("secret123");
await p.getByRole("button", { name: /create family/i }).click();
await p.waitForTimeout(1500);
const onDash = await p.getByText(/Gil/).first().isVisible().catch(() => false);
console.log("signup lands signed-in:", onDash);

// 2. Sign out -> profile requires password
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(800);
const stillIn = await p.getByText(/predictive runway/i).isVisible().catch(() => false);
console.log("session persists after reload:", stillIn);

// 3. Sign out and back in with wrong then right password
await p.evaluate(() => localStorage.removeItem("famfinance.session.real.v1"));
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.getByText("Gil", { exact: false }).first().click();
await p.waitForTimeout(400);
await p.getByPlaceholder(/password/i).fill("wrongpass");
await p.getByRole("button", { name: /sign in/i }).click();
await p.waitForTimeout(600);
const rejected = await p.getByText(/incorrect email or password/i).isVisible().catch(() => false);
console.log("wrong password rejected:", rejected);
await p.getByPlaceholder(/password/i).fill("secret123");
await p.getByRole("button", { name: /sign in/i }).click();
await p.waitForTimeout(1000);
const backIn = await p.getByText(/predictive runway/i).isVisible().catch(() => false);
console.log("correct password signs in:", backIn);

// 4. Demo family still reachable
await p.evaluate(() => localStorage.removeItem("famfinance.session.real.v1"));
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.getByRole("button", { name: /try the demo family/i }).click();
await p.waitForTimeout(600);
const demoVisible = await p.getByText("Dana").first().isVisible().catch(() => false);
console.log("demo family switch works:", demoVisible);

await browser.close();

import { mkdir } from "node:fs/promises";
await mkdir("test-results", { recursive: true });
import { spawn } from "node:child_process";
const server = spawn(process.execPath, ["server/index.js"], {
  env: {
    ...process.env,
    NODE_ENV: "test",
    TEST_PGLITE: "true",
    DATABASE_URL: "unused",
    DEV_AUTH: "true",
    ADMIN_TELEGRAM_IDS: "1",
    APP_URL: "http://localhost:3000",
  },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => {
    if (d.toString().includes("listening")) resolve();
  });
  server.on("exit", (c) => reject(Error("Server exited " + c)));
});
process.on("exit", () => server.kill());
import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000");
await page.getByText("Выбери свой автомат").waitFor();
await page.screenshot({ path: "test-results/hub-desktop.png", fullPage: true });
await page.locator('[data-play="snake"]').click();
await page.locator("#game").waitFor();
await page.waitForTimeout(5200);
if (await page.locator("#pause").count()) await page.locator("#exit").click();
if (await page.locator("#result-close").count())
  await page.locator("#result-close").click();
await page.locator('[data-nav="profile"]').click();
await page.getByText("Достижения", { exact: true }).waitFor();
await page.locator('[data-nav="collection"]').click();
await page.getByText("Коллекция", { exact: true }).waitFor();
await page.locator('[data-nav="challenges"]').click();
await page.getByText("Три попытки в Snake").waitFor();
await page.locator('[data-nav="admin"]').click();
await page.getByText("Управление аркадой").waitFor();
await page.screenshot({
  path: "test-results/admin-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-nav="games"]').click();
await page.getByText("Выбери свой автомат").waitFor();
await page.screenshot({ path: "test-results/hub-mobile.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  "mobile overflow",
);
const packets = [];
page.on("request", (request) => {
  if (request.url().endsWith("/api/session/sync")) packets.push(request.postDataJSON());
});
await page.locator('[data-play="platformer"]').click();
await page.locator('[data-level="1"]').click();
await page.locator("#game").waitFor();
const right = await page.locator('[data-key="2"]').boundingBox();
const jump = await page.locator('[data-key="16"]').boundingBox();
const cdp = await page.context().newCDPSession(page);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [right, jump].map((r, id) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2, id })),
});
await page.waitForTimeout(500);
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.locator("#pause").click();
await page.getByText("Сохранено ✓", { exact: true }).waitFor();
assert.ok(packets.some(p => p.inputs.some(i => (i & 18) === 18)), "simultaneous movement and jump");
await page.screenshot({ path: "test-results/platformer-mobile.png", fullPage: true });
await page.locator("#exit").click();
await page.locator("#resume").waitFor();
await page.reload();
await page.locator("#resume").click();
await page.locator("#game").waitFor();
await page.locator("#exit").click();
await page.locator("#abandon").click();
await page.locator('[data-play="maze"]').last().click();
await page.locator("#game").waitFor();
await page.screenshot({ path: "test-results/maze-mobile.png", fullPage: true });
assert.deepEqual(errors, []);
console.log("Browser hub/navigation/admin/mobile/multitouch/recovery checks passed");
await browser.close();
server.kill();

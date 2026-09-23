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
await page.locator(".reference-grid").waitFor();
await page.screenshot({ path: "test-results/hub-desktop.png", fullPage: true });
await page.locator('[data-play="snake"]').click();
await page.locator("#game").waitFor();
await page.screenshot({
  path: "test-results/snake-desktop.png",
  fullPage: true,
});
await page.evaluate(async () => {
  const { loadSnakeArt, drawSnake } = await import("/snake-art.js");
  await loadSnakeArt();
  const demo = document.createElement("canvas");
  demo.id = "snake-turn-fixture";
  demo.width = 768;
  demo.height = 576;
  document.body.append(demo);
  const body = [
    { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
    { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 },
    { x: 11, y: 9 }, { x: 10, y: 9 }, { x: 9, y: 9 },
  ];
  drawSnake(demo.getContext("2d"), {
    width: 24, height: 18, dir: 3, body, walls: [], moving: [],
    food: { x: 5, y: 8 }, eaten: 6,
    _visualBody: body.map((p, i) => i < 4 ? { x: p.x + 0.25, y: p.y } : p),
  }, 32, { theme: "base" }, { lighting: false });
});
await page.locator("#snake-turn-fixture").screenshot({ path: "test-results/snake-turn.png" });
await page.locator("#snake-turn-fixture").evaluate((el) => el.remove());
await page.waitForTimeout(5200);
if (await page.locator("#pause").count()) await page.locator("#exit").click();
if (await page.locator("#result-close").count())
  await page.locator("#result-close").click();
await page.locator('[data-dest="profile"]').last().click();
await page.getByText("Достижения", { exact: true }).waitFor();
await page.locator('[data-nav="collection"]:visible').click();
await page.getByRole("heading", { name: "Скины", exact: true }).waitFor();
await page.locator('[data-nav="challenges"]:visible').click();
await page.getByText("Три попытки в Snake").waitFor();
await page.locator('[data-nav="admin"]').click();
await page.getByText("Управление аркадой").waitFor();
await page.screenshot({
  path: "test-results/admin-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('[data-nav="games"]').last().click();
await page.locator(".reference-grid").waitFor();
await page.screenshot({ path: "test-results/hub-mobile.png", fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  "mobile overflow",
);
const packets = [];
page.on("request", (request) => {
  if (request.url().endsWith("/api/session/sync"))
    packets.push(request.postDataJSON());
});
await page.locator('[data-play="snake"]').click();
await page.locator("#game").waitFor();
await page.locator("#pause").click();
await page.screenshot({
  path: "test-results/snake-mobile.png",
  fullPage: true,
});
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  "snake mobile overflow",
);
await page.locator("#exit").click();
await page.locator("#abandon").click();
await page.locator('[data-play="platformer"]').click();
await page.locator('[data-level="1"]').click();
await page.locator("#game").waitFor();
const right = await page.locator('[data-key="2"]').boundingBox();
const jump = await page.locator('[data-key="16"]').boundingBox();
const cdp = await page.context().newCDPSession(page);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [right, jump].map((r, id) => ({
    x: r.x + r.width / 2,
    y: r.y + r.height / 2,
    id,
  })),
});
await page.waitForTimeout(500);
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchEnd",
  touchPoints: [],
});
await page.locator("#pause").click();
await page
  .getByText("Сохранено ✓", { exact: true })
  .waitFor({ state: "attached" });
assert.ok(
  packets.some((p) => p.inputs.some((i) => (i & 18) === 18)),
  "simultaneous movement and jump",
);
await page.screenshot({
  path: "test-results/platformer-mobile.png",
  fullPage: true,
});
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
console.log(
  "Browser hub/navigation/admin/mobile/multitouch/recovery checks passed",
);
await browser.close();
server.kill();

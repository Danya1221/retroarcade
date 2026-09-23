import test from "node:test";
import campaignReplays from "./campaign-replays.json" with { type: "json" };
import assert from "node:assert/strict";
import { generate, validate, reachable } from "../games/maze/generator.js";
import { createGame, tick, replay } from "../shared/engine.js";
import { rollLoot } from "../server/economy.js";
import { defaultConfig } from "../shared/content.js";
import { activeMissions } from "../shared/missions.js";
import { validateTelegram } from "../server/auth.js";
import { createHmac } from "node:crypto";
import { headPose, snakeSpine, visualHeading } from "../web/snake-art.js";
test("5,000 maze seeds: keys before doors and exit reachable", () => {
  for (let seed = 0; seed < 5000; seed++) {
    const m = generate(seed);
    assert.ok(validate(m), "seed " + seed);
    assert.equal(
      m.map[0].every((x) => x === 1),
      true,
    );
    assert.equal(
      m.map.at(-1).every((x) => x === 1),
      true,
    );
  }
});
test("seven games replay identically after serialization", () => {
  for (const game of [
    "snake",
    "maze",
    "platformer",
    "mines",
    "merge2048",
    "racer",
    "tanks",
  ]) {
    let a = createGame(game, "replay"),
      b = structuredClone(a);
    const inputs = Array.from(
      { length: 1500 },
      (_, i) => [2, 2, 2, 16 | 2, 32, 1, 8, 4][Math.floor(i / 7) % 8],
    );
    replay(a, inputs);
    replay(b, inputs.slice(0, 731));
    b = JSON.parse(JSON.stringify(b));
    replay(b, inputs.slice(731));
    assert.deepEqual(a, b);
  }
});
test("snake cannot reverse into itself", () => {
  const s = createGame("snake", "reverse");
  for (let i = 0; i < 9; i++) tick(s, 8);
  assert.equal(s.dir, 1);
  assert.equal(s.over, false);
});
test("mission rotation is stable during a day and week", () => {
  const builtIn = [{ id: "daily-snake", period: "day", metric: "snake", target: 3 }];
  const monday = activeMissions(builtIn, new Date("2026-09-21T01:00:00Z"));
  const tuesday = activeMissions(builtIn, new Date("2026-09-22T01:00:00Z"));
  assert.equal(monday.length, 6);
  assert.deepEqual(monday.filter((m) => m.period === "week"), tuesday.filter((m) => m.period === "week"));
  assert.notDeepEqual(monday.filter((m) => m.period === "day"), tuesday.filter((m) => m.period === "day"));
});
test("maze locked exit requires key", () => {
  const s = createGame("maze", "door"),
    adj = reachable(s.map, s.exit).cells[1];
  s.player = adj;
  const dx = s.exit.x - adj.x,
    dy = s.exit.y - adj.y;
  const input = dx > 0 ? 2 : dx < 0 ? 8 : dy > 0 ? 4 : 1;
  for (let i = 0; i < 5; i++) tick(s, input);
  assert.equal(s.won, false);
  s.keys = 1;
  for (let i = 0; i < 5; i++) tick(s, input);
  assert.equal(s.won, false);
  s.exitOpen = true;
  for (let i = 0; i < 5; i++) tick(s, input);
  assert.equal(s.won, true);
});
test("platformer finale cannot be bypassed with boss alive", () => {
  const s = createGame("platformer", "boss", 9);
  s.player.x = s.length - 2;
  tick(s, 0);
  assert.equal(s.won, false);
  s.enemies = [];
  tick(s, 0);
  assert.equal(s.won, true);
});
test("all campaign levels can be completed by an action replay", () => {
  for (let level = 1; level <= 9; level++) {
    const s = createGame("platformer", "campaign", level);
    // Recorded input-only solutions for the current nine layouts; each entry is six ticks.
    for (const input of campaignReplays[level - 1]) {
      for (let tickIndex = 0; tickIndex < 6 && !s.over; tickIndex++)
        tick(s, input);
    }
    assert.ok(
      s.won,
      `level ${level}: x=${s.player.x} hp=${s.hp} tick=${s.tick}`,
    );
  }
});
test("loot pity guarantees legendary; weights cover low and high roll", () => {
  assert.equal(rollLoot(19, defaultConfig, () => 0).skin.rarity, "LEGENDARY");
  assert.equal(rollLoot(0, defaultConfig, () => 0).skin.rarity, "COMMON");
  assert.equal(
    rollLoot(0, defaultConfig, (n) => n - 1).skin.rarity,
    "LEGENDARY",
  );
});
test("Telegram HMAC validates authentic data and rejects alterations/age", () => {
  const now = Date.now(),
    token = "123:test";
  const fields = {
    auth_date: String(Math.floor(now / 1000)),
    user: JSON.stringify({ id: 42, first_name: "Ada" }),
  };
  const text = Object.entries(fields)
    .sort()
    .map(([k, v]) => k + "=" + v)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(text).digest("hex");
  const raw = new URLSearchParams({ ...fields, hash }).toString();
  assert.equal(validateTelegram(raw, token, now).id, 42);
  assert.throws(() => validateTelegram(raw.replace("Ada", "Eve"), token, now));
  assert.throws(() => validateTelegram(raw, token, now + 4000000));
  assert.throws(() => validateTelegram(raw + "&auth_date=1", token, now));
});

test("mines first reveal is safe and 2048 starts with two tiles", () => {
  const m = createGame("mines", "safe");
  for (let i = 0; i < 4; i++) tick(m, 32);
  assert.equal(m.over, false);
  assert.ok(m.open.length > 0);
  assert.equal(m.mines.length, 12);
  const g = createGame("merge2048", "tiles");
  assert.equal(g.board.flat().filter(Boolean).length, 2);
  assert.ok(g.board.flat().every((v) => v === 0 || v === 2 || v === 4));
});

test("racer advances and tanks can clear arena", () => {
  const r = createGame("racer", "race");
  for (let i = 0; i < 120; i++) tick(r, 16 | 2);
  assert.ok(r.distance > 0);
  assert.ok(r.speed > 0);
  const t = createGame("tanks", "arena");
  assert.equal(t.bots.length, 7);
  assert.equal(t.player.hp, 3);
  t.bots.forEach((b) => (b.hp = 0));
  tick(t, 0);
  assert.equal(t.won, true);
  assert.equal(t.over, true);
});

test("snake boost and slow action change speed and survive JSON restore", () => {
  const normal = createGame("snake", "speed"),
    fast = structuredClone(normal),
    slow = structuredClone(normal);
  replay(normal, Array(12).fill(0));
  replay(fast, Array(12).fill(16));
  replay(slow, [32, ...Array(11).fill(0)]);
  assert.ok(fast.body[0].x > normal.body[0].x);
  assert.ok(slow.body[0].x < normal.body[0].x);
  const restored = JSON.parse(JSON.stringify(slow));
  replay(slow, Array(20).fill(32));
  replay(restored, Array(20).fill(32));
  assert.deepEqual(restored, slow);
  assert.equal(slow.slowUntil, 91, "holding action must not reset cooldown");
});

test("Snake head mirrors upright to the left and its render spine stays contiguous", () => {
  assert.deepEqual(headPose(1), { rotation: 0, flipX: false });
  assert.deepEqual(headPose(3), { rotation: 0, flipX: true });
  const moving = [
    { x: 7.5, y: 7 },
    { x: 8, y: 7.5 },
    { x: 8, y: 8.5 },
    { x: 8.5, y: 9 },
    { x: 9.5, y: 9 },
  ];
  const spine = snakeSpine(moving);
  assert.equal(spine.length, moving.length);
  for (let i = 1; i < spine.length; i++) {
    assert.ok(
      Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y) <=
        1.01,
    );
  }
  const stationary = [
    { x: 7, y: 8 },
    { x: 6, y: 8 },
  ];
  assert.equal(
    visualHeading(stationary, 0),
    1,
    "queued upward turn cannot spin the stationary head",
  );
  assert.equal(
    visualHeading(
      [
        { x: 7, y: 7.3 },
        { x: 6.7, y: 8 },
      ],
      1,
    ),
    0,
  );
});

test("legacy tanks saves recover collision from the persisted maze", () => {
  const fresh = createGame("tanks", "legacy"),
    legacy = structuredClone(fresh);
  legacy.walls = {}; // The old Set serialized as an empty object.
  for (const input of [2, 2, 4, 16, 32, 8, 1]) {
    for (let i = 0; i < 20; i++) {
      tick(fresh, input);
      tick(legacy, input);
    }
  }
  assert.deepEqual(legacy.player, fresh.player);
  assert.deepEqual(legacy.bots, fresh.bots);
});

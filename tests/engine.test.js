import test from "node:test";
import assert from "node:assert/strict";
import { generate, validate, reachable } from "../games/maze/generator.js";
import { createGame, tick, replay } from "../shared/engine.js";
import { rollLoot } from "../server/economy.js";
import { defaultConfig } from "../shared/content.js";
import { validateTelegram } from "../server/auth.js";
import { createHmac } from "node:crypto";
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
test("five games replay identically after serialization", () => {
  for (const game of ["snake", "maze", "platformer", "mines", "merge2048"]) {
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
    for (let i = 0; i < 5000 && !s.over; i++) {
      let input = 2 | 32;
      if (
        s.ground &&
        (s.player.x % 12 > 5 ||
          (s.player.x > 13 && s.player.x < 20) ||
          (s.player.x > 31 && s.player.x < 38) ||
          (s.player.x > 49 && s.player.x < 56))
      )
        input |= 16;
      const boss = s.enemies.find((e) => e.type === "boss");
      if (boss && s.player.x > s.length - 14) {
        input =
          32 | (s.player.x < boss.x - 1 ? 2 : s.player.x > boss.x + 1 ? 8 : 0);
        if (s.ground) input |= 16;
      }
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
  const m=createGame("mines","safe"); for(let i=0;i<4;i++) tick(m,32);
  assert.equal(m.over,false); assert.ok(m.open.length>0); assert.equal(m.mines.length,12);
  const g=createGame("merge2048","tiles");
  assert.equal(g.board.flat().filter(Boolean).length,2);
  assert.ok(g.board.flat().every(v=>v===0||v===2||v===4));
});

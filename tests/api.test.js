import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.TEST_PGLITE = process.env.DATABASE_URL ? "false" : "true";
process.env.DEV_AUTH = "true";
process.env.ADMIN_TELEGRAM_IDS = "1";
const { api } = await import("../server/api.js");
const { pool } = await import("../database/db.js");
const { migrate } = await import("../database/migrate.js");
await migrate();
let token;
const call = (path, b, auth = token) =>
  api(
    {
      method: b ? "POST" : "GET",
      headers: auth ? { authorization: "Bearer " + auth } : {},
    },
    path,
    b || {},
    new URLSearchParams(path.split("?")[1] || ""),
  );
test("transactional API integration", async (t) => {
  await t.test("dev login creates profile and base cosmetics", async () => {
    ({ token } = await call("/api/auth", { dev: true }));
    const me = await call("/api/me");
    assert.equal(me.owned.length, 7);
    assert.equal(String(me.user.id), "1");
  });
  await t.test(
    "session start, optimistic concurrency, finish idempotency",
    async () => {
      const s = await call("/api/session/start", { game: "snake" });
      await assert.rejects(() => call("/api/session/start", { game: "maze" }));
      await assert.rejects(() =>
        call("/api/session/sync", {
          id: s.id,
          version: 0,
          inputs: Array(1800).fill(2),
        }),
      );
      const r = await call("/api/session/sync", {
        id: s.id,
        version: 0,
        inputs: [2, 2],
      });
      assert.equal(r.version, 1);
      const conflict = await call("/api/session/sync", {
        id: s.id,
        version: 0,
        inputs: [2, 2],
      });
      assert.equal(conflict.conflict, true);
      const result = await call("/api/session/sync", {
        id: s.id,
        version: 1,
        inputs: [],
        finish: true,
      });
      const xp = (await call("/api/me")).user.xp;
      const again = await call("/api/session/sync", {
        id: s.id,
        version: 1,
        inputs: [],
        finish: true,
      });
      assert.deepEqual(again.result, result.result);
      assert.equal((await call("/api/me")).user.xp, xp);
    },
  );
  await t.test(
    "loot concurrent retries consume only one cartridge",
    async () => {
      await pool.query(
        "INSERT INTO inventory(user_id,item,quantity) VALUES(1,'arcade',2) ON CONFLICT(user_id,item) DO UPDATE SET quantity=2",
      );
      const id = randomUUID();
      const [a, b] = await Promise.all([
        call("/api/loot/open", { id }),
        call("/api/loot/open", { id }),
      ]);
      assert.equal(a.skin.id, b.skin.id);
      assert.equal(
        (
          await pool.query(
            "SELECT quantity FROM inventory WHERE user_id=1 AND item='arcade'",
          )
        ).rows[0].quantity,
        1,
      );
      assert.equal(
        Number(
          (await pool.query("SELECT count(*) FROM loot_drops")).rows[0].count,
        ),
        1,
      );
    },
  );
  await t.test("rarity chests charge once and guarantee their listed tier", async () => {
    await pool.query("UPDATE users SET coins=5000 WHERE id=1");
    const before = (await call("/api/me")).user.coins;
    for (const [type, price, rank] of [["rare",250,1],["epic",600,2],["legendary",1200,3]]) {
      const bought = await call("/api/loot/buy", { type });
      assert.equal(bought.price, price);
      assert.equal((await call("/api/me")).inventory.find((x) => x.item === type)?.quantity, 1);
      const id = randomUUID();
      const opened = await call("/api/loot/open", { id, type });
      assert.ok(["COMMON","RARE","EPIC","LEGENDARY"].indexOf(opened.skin.rarity) >= rank);
      assert.deepEqual(await call("/api/loot/open", { id, type }), opened);
      await assert.rejects(() => call("/api/loot/open", { id: randomUUID(), type }));
    }
    assert.equal((await call("/api/me")).user.coins, before - 2050);
    await assert.rejects(() => call("/api/loot/buy", { type: "unknown" }));
    await assert.rejects(() => call("/api/loot/open", { id: randomUUID(), type: "unknown" }));
  });
  await t.test("ownership enforced and locked campaign rejected", async () => {
    await assert.rejects(() =>
      call("/api/skin/equip", { skin: "platformer-secret" }),
    );
    await assert.rejects(() =>
      call("/api/session/start", { game: "platformer", level: 9 }),
    );
  });
  await t.test("challenge double claim prevented", async () => {
    await pool.query(
      "INSERT INTO challenge_progress VALUES(1,'daily-snake',CURRENT_DATE,3,false) ON CONFLICT(user_id,challenge,period) DO UPDATE SET value=3",
    );
    await call("/api/challenges/claim", { id: "daily-snake" });
    await assert.rejects(() =>
      call("/api/challenges/claim", { id: "daily-snake" }),
    );
  });
  await t.test(
    "leaderboard, daily seed and admin queries execute",
    async () => {
      await call("/api/leaderboard");
      const d = await call("/api/daily-maze");
      assert.equal((await call("/api/daily-maze")).seed, d.seed);
      const a = await call("/api/admin");
      assert.equal(Number(a.totals.total), 1);
      await call("/api/admin/config", { config: a.config });
      a.catalog.skins.push({
        id: "snake-custom",
        game: "snake",
        name: "Custom",
        rarity: "RARE",
        color: "#abcdef",
        cost: 90,
      });
      await call("/api/admin/catalog", { catalog: a.catalog });
      assert.ok(
        (await call("/api/me")).skins.some((s) => s.id === "snake-custom"),
      );
      await assert.rejects(() => call("/api/admin/catalog", { catalog: {} }));
    },
  );
  await t.test("auth and admin cannot be bypassed", async () => {
    await assert.rejects(() => call("/api/me", undefined, "fake"));
    process.env.ADMIN_TELEGRAM_IDS = "99";
    await assert.rejects(() => call("/api/admin"));
    process.env.ADMIN_TELEGRAM_IDS = "1";
  });
});
test.after(async () => pool.end());

import { catalog } from "./catalog.js";
import { randomInt } from "node:crypto";
import {
  skins,
  defaultConfig,
  achievements,
  challenges,
  dayKey,
  weekKey,
  levelFromXP,
} from "../shared/content.js";
export async function config(c) {
  const r = await c.query("SELECT value FROM settings WHERE key='config'");
  return r.rows[0]?.value || structuredClone(defaultConfig);
}
export async function box(c, uid, type = "arcade", n = 1) {
  await c.query(
    "INSERT INTO inventory(user_id,item,quantity) VALUES($1,$2,$3) ON CONFLICT(user_id,item) DO UPDATE SET quantity=inventory.quantity+$3",
    [uid, type, n],
  );
}
export async function achievement(c, u, id) {
  const a = (await catalog(c)).achievements.find((x) => x.id === id);
  if (!a) return null;
  const r = await c.query(
    "INSERT INTO user_achievements(user_id,achievement) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING achievement",
    [u.id, id],
  );
  if (r.rowCount) {
    u.xp += a.xp;
    await box(c, u.id);
    return a.name;
  }
  return null;
}
export async function reward(c, u, s, settings) {
  const st = s.state;
  if (st.tick < 90)
    return {
      score: st.score,
      won: false,
      xp: 0,
      boxes: 0,
      secrets: 0,
      achievements: [],
      level: s.level,
      game: s.game,
      ticks: st.tick,
    };
  const earned = Math.min(
    1500,
    Math.floor(st.score * settings.xpPerScore) +
      (st.won ? settings.completionXP : 10),
  );
  const before = levelFromXP(u.xp, settings.levelXP);
  u.xp += earned;
  const coins = Math.min(75, Math.max(1, Math.floor(st.score / 20)) + (st.won ? 10 : 0));
  u.coins = (u.coins || 0) + coins;
  u.stats.runs = (u.stats.runs || 0) + 1;
  u.stats[s.game] = (u.stats[s.game] || 0) + 1;
  u.stats.secrets = (u.stats.secrets || 0) + st.secrets;
  if (st.won && s.game === "platformer")
    u.progress = Math.max(u.progress, Math.min(10, s.level + 1));
  const newAchievements = [];
  for (const [yes, id] of [
    [true, "first"],
    [u.stats.runs >= 100, "hundred"],
    [st.secrets > 0, "explorer"],
    [st.won && s.game === "platformer" && s.level === 9, "boss"],
  ])
    if (yes) {
      const a = await achievement(c, u, id);
      if (a) newAchievements.push(a);
    }
  if (st.secrets) {
    await c.query(
      "INSERT INTO user_secrets(user_id,secret) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [u.id, s.game + "-signal"],
    );
    const secrets = await c.query(
      "SELECT secret FROM user_secrets WHERE user_id=$1",
      [u.id],
    );
    if (
      ["maze-signal", "platformer-signal"].every((k) =>
        secrets.rows.some((r) => r.secret === k),
      )
    ) {
      const a = await achievement(c, u, "signal");
      if (a) {
        newAchievements.push(a);
        await c.query(
          "INSERT INTO user_skins(user_id,skin) VALUES($1,'snake-secret') ON CONFLICT DO NOTHING",
          [u.id],
        );
      }
    }
  }
  for (const a of (await catalog(c)).achievements) {
    if (a.metric && (u.stats[a.metric] || 0) >= a.target) {
      const name = await achievement(c, u, a.id);
      if (name) newAchievements.push(name);
    }
  }
  const bestBefore = u.stats["best-" + s.game] || 0;
  const newRecord = st.score > bestBefore;
  u.stats["best-" + s.game] = Math.max(bestBefore, st.score);
  if (st.won && s.game === "platformer" && s.level === 9)
    await c.query(
      "INSERT INTO user_skins(user_id,skin) VALUES($1,'platformer-secret') ON CONFLICT DO NOTHING",
      [u.id],
    );
  if (s.game === "maze" && st.rare && st.secretFound && st.won)
    await c.query(
      "INSERT INTO user_skins(user_id,skin) VALUES($1,'maze-secret') ON CONFLICT DO NOTHING",
      [u.id],
    );
  const gainedBoxes =
    Math.min(2, st.boxes) +
    (st.won && s.game === "platformer" && s.level % 3 === 0 ? 1 : 0) +
    Math.max(0, levelFromXP(u.xp, settings.levelXP) - before);
  if (gainedBoxes) await box(c, u.id, "arcade", gainedBoxes);
  const metrics = {
    snake: s.game === "snake" ? 1 : 0,
    daily: s.daily && st.won ? 1 : 0,
    secrets: st.secrets,
    platformer: s.game === "platformer" && st.won ? 1 : 0,
  };
  for (const ch of (await catalog(c)).challenges) {
    const n = metrics[ch.metric];
    if (n)
      await c.query(
        "INSERT INTO challenge_progress(user_id,challenge,period,value) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,challenge,period) DO UPDATE SET value=challenge_progress.value+$4",
        [u.id, ch.id, ch.period === "day" ? dayKey() : weekKey(), n],
      );
  }
  await c.query("UPDATE users SET xp=$2,progress=$3,stats=$4,coins=$5 WHERE id=$1", [
    u.id,
    u.xp,
    u.progress,
    u.stats,
    u.coins,
  ]);
  return {
    score: st.score,
    best: u.stats["best-" + s.game],
    newRecord,
    won: st.won,
    xp: earned,
    coins,
    boxes: gainedBoxes,
    secrets: st.secrets,
    achievements: newAchievements,
    level: s.level,
    game: s.game,
    ticks: st.tick,
  };
}
export function rollLoot(
  pity,
  settings,
  rand = (n) => randomInt(n),
  skinList = skins,
  minimumRarity = "COMMON",
) {
  const order = ["COMMON", "RARE", "EPIC", "LEGENDARY"];
  const weighted = Object.entries(settings.lootWeights).filter(
    ([rarity]) => order.indexOf(rarity) >= order.indexOf(minimumRarity) && skinList.some((skin) => skin.rarity === rarity),
  );
  let rarity = "LEGENDARY";
  const audit = { pityBefore: pity, pityTriggered: pity + 1 >= settings.pity };
  if (!audit.pityTriggered) {
    const total = weighted.reduce((a, [, w]) => a + w, 0);
    let roll = rand(total);
    audit.roll = roll;
    audit.total = total;
    for (const [r, w] of weighted) {
      roll -= w;
      if (roll < 0) {
        rarity = r;
        break;
      }
    }
  }
  const list = skinList.filter((x) => x.rarity === rarity);
  return { skin: list[rand(list.length)], audit };
}

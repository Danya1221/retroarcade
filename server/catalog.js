import { skins, achievements, challenges } from "../shared/content.js";
import { ApiError } from "./errors.js";
export const defaults = { skins, achievements, challenges };
export async function catalog(c) {
  const r = await c.query("SELECT value FROM settings WHERE key='catalog'");
  return r.rows[0]?.value || structuredClone(defaults);
}
export function validateCatalog(value) {
  const bad = (message) => {
    throw new ApiError(400, message);
  };
  if (!value || typeof value !== "object") bad("Неверный каталог");
  for (const kind of Object.keys(defaults)) {
    if (!Array.isArray(value[kind]) || value[kind].length > 500)
      bad("Неверный раздел " + kind);
    const ids = new Set();
    for (const item of value[kind]) {
      if (
        !item ||
        typeof item.id !== "string" ||
        !/^[a-z0-9-]{1,64}$/.test(item.id) ||
        ids.has(item.id) ||
        typeof item.name !== "string" ||
        item.name.length > 100
      )
        bad("Неверное имя или ID");
      ids.add(item.id);
      if (kind === "skins") {
        if (
          !["snake", "maze", "platformer"].includes(item.game) ||
          !["COMMON", "RARE", "EPIC", "LEGENDARY", "SECRET"].includes(
            item.rarity,
          ) ||
          !/^#[0-9a-f]{6}$/i.test(item.color) ||
          (item.theme !== undefined && (typeof item.theme !== "string" || item.theme.length > 32)) ||
          (item.background !== undefined && !/^#[0-9a-f]{6}$/i.test(item.background)) ||
          (item.enemy !== undefined && !/^#[0-9a-f]{6}$/i.test(item.enemy)) ||
          (item.terrain !== undefined && !/^#[0-9a-f]{6}$/i.test(item.terrain)) ||
          !Number.isInteger(item.cost) ||
          item.cost < 0 ||
          item.cost > 100000
        )
          bad("Неверный скин");
      } else {
        if (!Number.isInteger(item.xp) || item.xp < 0 || item.xp > 10000)
          bad("Неверный XP");
        if (
          kind === "achievements" &&
          !defaults.achievements.some((a) => a.id === item.id) &&
          (!["runs", "snake", "maze", "platformer", "secrets"].includes(
            item.metric,
          ) ||
            !Number.isInteger(item.target) ||
            item.target < 1)
        )
          bad("Новое достижение требует metric и target");
        if (
          kind === "challenges" &&
          (!["day", "week"].includes(item.period) ||
            !["snake", "daily", "secrets", "platformer"].includes(
              item.metric,
            ) ||
            !Number.isInteger(item.target) ||
            item.target < 1 ||
            item.target > 10000 ||
            !Number.isInteger(item.shards) ||
            item.shards < 0 ||
            item.shards > 10000 ||
            ![0, 1].includes(item.box))
        )
          bad("Неверное испытание");
      }
    }
    for (const required of defaults[kind])
      if (!ids.has(required.id))
        bad("Нельзя удалять встроенный ID " + required.id);
  }
  for (const rarity of ["COMMON", "RARE", "EPIC", "LEGENDARY"])
    if (!value.skins.some((s) => s.rarity === rarity))
      bad("Нет скинов редкости " + rarity);
  return value;
}

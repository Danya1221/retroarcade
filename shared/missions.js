import { dayKey, weekKey } from "./content.js";

const dailyVariants = [
  { metric: "snake", target: 1, name: "Сыграй в Snake", xp: 35, shards: 6, box: 0 },
  { metric: "snake", target: 2, name: "Два забега в Snake", xp: 50, shards: 9, box: 0 },
  { metric: "platformer", target: 1, name: "Пройди уровень Afterlight", xp: 70, shards: 12, box: 0 },
  { metric: "secrets", target: 1, name: "Найди секрет", xp: 75, shards: 14, box: 0 },
];
const weeklyVariants = [
  { metric: "snake", target: 8, name: "Восемь забегов в Snake", xp: 160, shards: 28, box: 1 },
  { metric: "platformer", target: 5, name: "Пройди пять уровней Afterlight", xp: 200, shards: 35, box: 1 },
  { metric: "secrets", target: 5, name: "Найди пять секретов", xp: 200, shards: 35, box: 1 },
  { metric: "daily", target: 2, name: "Пройди два ежедневных лабиринта", xp: 180, shards: 30, box: 1 },
];
function seed(key) {
  return [...key].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}
function rotate(pool, key, count, period) {
  const offset = seed(key) % pool.length;
  return Array.from({ length: count }, (_, i) => ({
    ...pool[(offset + i) % pool.length],
    id: `generated-${period}-${i + 1}`,
    period,
  }));
}
// IDs are stable within their period, and targets change only on UTC reset.
// Generated missions join the admin catalog, retaining existing progress.
export function activeMissions(catalogChallenges, now = new Date()) {
  return [
    ...catalogChallenges,
    ...rotate(dailyVariants, dayKey(now), 3, "day"),
    ...rotate(weeklyVariants, weekKey(now), 2, "week"),
  ];
}

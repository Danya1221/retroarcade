export const games = [
  {
    id: "snake",
    name: "NEON SERPENT",
    tag: "SNAKE",
    description: "Один поворот. Ещё один рекорд.",
    color: "#b9ff66",
  },
  {
    id: "maze",
    name: "THE LOST SIGNAL",
    tag: "MAZE",
    description: "Найди ключ. Услышь то, что скрыто.",
    color: "#bc9bff",
  },
  {
    id: "platformer",
    name: "AFTERLIGHT",
    tag: "PLATFORMER",
    description: "Три мира за краем старого экрана.",
    color: "#ffbd76",
  },
];
export const worlds = [
  {
    name: "Заросшая станция",
    sky: "#142e31",
    tile: "#537760",
    accent: "#b9ff66",
  },
  {
    name: "Нулевая лаборатория",
    sky: "#222044",
    tile: "#655185",
    accent: "#c5a0ff",
  },
  {
    name: "Последняя частота",
    sky: "#321f32",
    tile: "#83525b",
    accent: "#ffbd76",
  },
];
export const skins = games.flatMap((g) => [
  {
    id: g.id + "-base",
    game: g.id,
    name: "Original",
    rarity: "COMMON",
    color: g.color,
    cost: 0,
  },
  {
    id: g.id + "-mint",
    game: g.id,
    name: "Mint circuit",
    rarity: "RARE",
    color: "#68ffd7",
    cost: 60,
  },
  {
    id: g.id + "-ember",
    game: g.id,
    name: "Ember tape",
    rarity: "EPIC",
    color: "#ff8766",
    cost: 150,
  },
  {
    id: g.id + "-ghost",
    game: g.id,
    name: "Ghost frequency",
    rarity: "LEGENDARY",
    color: "#eef0ff",
    cost: 400,
    hidden: true,
  },
  {
    id: g.id + "-secret",
    game: g.id,
    name: "Signal 09",
    rarity: "SECRET",
    color: "#fe6fce",
    cost: 0,
    hidden: true,
  },
]);
export const defaultConfig = {
  enabled: { snake: true, maze: true, platformer: true },
  xpPerScore: 0.08,
  completionXP: 80,
  pity: 20,
  rareEvent: 0.08,
  compensation: { COMMON: 5, RARE: 15, EPIC: 40, LEGENDARY: 100, SECRET: 150 },
  lootWeights: { COMMON: 60, RARE: 28, EPIC: 10, LEGENDARY: 2 },
  levelXP: 250,
};
export const achievements = [
  {
    id: "first",
    name: "INSERT COIN",
    description: "Заверши первый забег",
    xp: 40,
  },
  {
    id: "hundred",
    name: "Старый знакомый",
    description: "Заверши 100 забегов",
    xp: 500,
  },
  { id: "explorer", name: "За стеной", description: "Найди секрет", xp: 80 },
  {
    id: "boss",
    name: "END OF TRANSMISSION",
    description: "Победи финального босса",
    xp: 300,
  },
  {
    id: "week",
    name: "Семь частот",
    description: "Заходи 7 дней подряд",
    xp: 150,
  },
  {
    id: "signal",
    name: "Общий сигнал",
    description: "Найди символ в Afterlight и тайник в Maze",
    xp: 200,
    hidden: true,
  },
];
export const challenges = [
  {
    id: "daily-snake",
    period: "day",
    metric: "snake",
    target: 3,
    name: "Три попытки в Snake",
    xp: 60,
    shards: 10,
    box: 0,
  },
  {
    id: "daily-maze",
    period: "day",
    metric: "daily",
    target: 1,
    name: "Пройди ежедневный лабиринт",
    xp: 100,
    shards: 15,
    box: 1,
  },
  {
    id: "weekly-secrets",
    period: "week",
    metric: "secrets",
    target: 3,
    name: "Найди три секрета",
    xp: 180,
    shards: 30,
    box: 1,
  },
  {
    id: "weekly-platformer",
    period: "week",
    metric: "platformer",
    target: 3,
    name: "Пройди три уровня Afterlight",
    xp: 180,
    shards: 30,
    box: 1,
  },
];
export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
export function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return dayKey(d);
}
export const levelFromXP = (xp, unit = 250) =>
  1 + Math.floor(Math.sqrt(xp / unit));

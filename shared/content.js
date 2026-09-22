export const games = [
  { id:"mines", name:"VOID MINES", tag:"MINES", description:"Разминируй поле. Ошибка — и сигнал погас.", color:"#72d7ff" },
  { id:"merge2048", name:"SIGNAL 2048", tag:"2048", description:"Соединяй частоты. Доберись до 2048.", color:"#ffd36b" },
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
export const skins = [
  ...[
    ["snake","base","Original","COMMON","#b9ff66",0,"base","#142e31","#649842","#ff839b"],
    ["snake","mint","Mint circuit","RARE","#68ffd7",60,"circuit","#102d32","#43bca3","#ffdf79"],
    ["snake","ember","Ember tape","EPIC","#ff8766",150,"ember","#321b22","#c45f45","#ffd36b"],
    ["snake","ghost","Ghost frequency","LEGENDARY","#eef0ff",400,"ghost","#18192c","#a7a9d8","#c69eff"],
    ["snake","secret","Signal 09","SECRET","#fe6fce",0,"signal","#250f2b","#a33f91","#78f8ff"],
    ["maze","base","Original","COMMON","#bc9bff",0,"base","#26233b","#f28dad","#47445e"],
    ["maze","mint","Mint circuit","RARE","#68ffd7",60,"circuit","#102d32","#ffb66d","#285d5b"],
    ["maze","ember","Ember tape","EPIC","#ff8766",150,"ember","#351b22","#ffd06e","#70424b"],
    ["maze","ghost","Ghost frequency","LEGENDARY","#eef0ff",400,"ghost","#18192c","#c5a2ff","#565b7a"],
    ["maze","secret","Signal 09","SECRET","#fe6fce",0,"signal","#260f30","#78f8ff","#67366f"],
    ["platformer","base","Original","COMMON","#ffbd76",0,"base","#322735","#fa9977","#665d61"],
    ["platformer","mint","Mint circuit","RARE","#68ffd7",60,"circuit","#102d32","#ffb56b","#39736a"],
    ["platformer","ember","Ember tape","EPIC","#ff8766",150,"ember","#351b22","#ffd06e","#844a3d"],
    ["platformer","ghost","Ghost frequency","LEGENDARY","#eef0ff",400,"ghost","#18192c","#c5a2ff","#666b87"],
    ["platformer","secret","Signal 09","SECRET","#fe6fce",0,"signal","#260f30","#78f8ff","#733a78"],
  ].map(([game,key,name,rarity,color,cost,theme,background,enemy,terrain]) => ({
    id: game + "-" + key, game, name, rarity, color, cost, theme, background, enemy, terrain,
    hidden: rarity === "LEGENDARY" || rarity === "SECRET",
  })),
];
export const defaultConfig = {
  enabled: { snake: true, maze: true, platformer: true, mines: true, merge2048: true },
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

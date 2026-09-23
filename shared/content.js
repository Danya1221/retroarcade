export const games = [
  { id:"racer", name:"TURBO FORMULA", tag:"RACING", description:"Чемпионат на пределе. Обгони всех.", color:"#ff5b55" },
  { id:"tanks", name:"STEEL ARENA", tag:"TANKS", description:"Арена сверху: боты, разрушения и бой.", color:"#d8c86c" },
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
    name: "CHRONICLE OF GREEN HILLS",
    tag: "PLATFORMER",
    description: "Одна долина. Четыре эпохи. Пропавший медальон.",
    color: "#ffbd76",
  },
];
export const worlds = [
  {
    name: "Green Hills · Средневековье",
    sky: "#328bd0",
    tile: "#537760",
    accent: "#b9ff66",
  },
  {
    name: "Green Hills · Древность",
    sky: "#3e7883",
    tile: "#78715a",
    accent: "#f0c477",
  },
  {
    name: "Green Hills · Индустриальная эпоха",
    sky: "#66574e",
    tile: "#71665d",
    accent: "#ffc377",
  },
  {
    name: "Green Hills · Будущее",
    sky: "#23496b",
    tile: "#536d79",
    accent: "#78dfff",
  },
];
export const skins = [
  ...[
    ["racer","base","Redline","COMMON","#ff5b55",0,"base","#182433","#ff5b55","#707a82"],
    ["tanks","base","Field unit","COMMON","#d8c86c",0,"base","#263126","#c7b85d","#58634e"],
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
    ["platformer","base","Красный капюшон","COMMON","#f8483a",0,"base","#328bd0","#fa9977","#665d61"],
    ["platformer","blue","Синий капюшон","COMMON","#287fef",60,"blue","#328bd0","#fa9977","#665d61"],
    ["platformer","green","Зелёный капюшон","COMMON","#5fbf66",60,"green","#328bd0","#fa9977","#665d61"],
    ["platformer","yellow","Золотой капюшон","RARE","#ffc94c",110,"yellow","#328bd0","#fa9977","#665d61"],
    ["platformer","black","Теневой капюшон","RARE","#414455",110,"black","#328bd0","#fa9977","#665d61"],
    ["platformer","white","Белый капюшон","EPIC","#e9f1f8",190,"white","#328bd0","#fa9977","#665d61"],
    ["platformer","purple","Фиолетовый капюшон","EPIC","#b847dc",190,"purple","#328bd0","#fa9977","#665d61"],
    ["platformer","mint","Mint circuit","RARE","#68ffd7",60,"circuit","#102d32","#ffb56b","#39736a"],
    ["platformer","ember","Ember tape","EPIC","#ff8766",150,"ember","#351b22","#ffd06e","#844a3d"],
    ["platformer","ghost","Ghost frequency","LEGENDARY","#eef0ff",400,"ghost","#18192c","#c5a2ff","#666b87"],
    ["platformer","secret","Signal 09","SECRET","#fe6fce",0,"signal","#260f30","#78f8ff","#733a78"],
    ["mines","base","Bomb squad","COMMON","#72d7ff",0,"base","#101d26","#ff6d78","#334754"],
    ["mines","mint","Deep scanner","RARE","#68ffd7",60,"circuit","#0d2929","#ffca70","#28605c"],
    ["mines","ember","Red alert","EPIC","#ff8766",150,"ember","#2d171b","#ffd36b","#784138"],
    ["mines","ghost","Cold mine","LEGENDARY","#eef0ff",400,"ghost","#171a2c","#8da4ff","#505873"],
    ["mines","secret","Black site","SECRET","#fe6fce",0,"signal","#210d27","#78f8ff","#633469"],
    ["merge2048","base","Signal tiles","COMMON","#ffd36b",0,"base","#211d2a","#ff9675","#66574a"],
    ["merge2048","mint","Data merge","RARE","#68ffd7",60,"circuit","#0e292b","#ffd36b","#2f6b63"],
    ["merge2048","ember","Overclock","EPIC","#ff8766",150,"ember","#32191d","#ffd36b","#7c443a"],
    ["merge2048","ghost","Null stack","LEGENDARY","#eef0ff",400,"ghost","#17192b","#a8b7ff","#555b75"],
    ["merge2048","secret","Forbidden 4096","SECRET","#fe6fce",0,"signal","#240d2a","#78f8ff","#69366f"],
  ].map(([game,key,name,rarity,color,cost,theme,background,enemy,terrain]) => ({
    id: game + "-" + key, game, name, rarity, color, cost, theme, background, enemy, terrain,
    hidden: rarity === "LEGENDARY" || rarity === "SECRET",
  })),
];
export const defaultConfig = {
  enabled: { snake: true, maze: true, platformer: true, mines: true, merge2048: true, racer: true, tanks: true },
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

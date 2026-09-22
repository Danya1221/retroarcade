export const levels = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  world: Math.floor(i / 3),
  name: [
    "Первые искры",
    "Над туманом",
    "Зелёный сторож",
    "Холодный пуск",
    "Разрыв цепи",
    "Сердце лаборатории",
    "Пепельный мост",
    "Обратная сторона",
    "Последний передатчик",
  ][i],
  length: 76 + i * 6,
  boss: i === 8,
}));
export function buildLevel(level) {
  const def = levels[level - 1];
  if (!def) throw Error("Unknown level");
  const platforms = [
    { x: 0, y: 14, w: 14, type: "ground" },
    { x: 19, y: 14, w: 13, type: "ground" },
    { x: 37, y: 14, w: 13, type: "ground" },
    { x: 55, y: 14, w: def.length - 55, type: "ground" },
  ];
  for (const x of [14, 32, 50])
    platforms.push({
      x,
      y: 12,
      w: 5,
      type: level > 3 ? "moving" : "normal",
      baseX: x,
    });
  for (let x = 8; x < def.length - 10; x += 12)
    platforms.push({
      x,
      y: 10,
      w: 5,
      type: x % 3 === 0 ? "falling" : "normal",
      baseX: x,
    });
  const enemies = Array.from({ length: 3 + Math.floor(level / 2) }, (_, i) => ({
    x: 22 + i * 10,
    y: 12.8,
    vx: i % 2 ? 0.045 : -0.045,
    type: ["patrol", "flying", "jumping", "ranged", "armored", "fast"][i % 6],
    hp: i % 6 === 4 ? 2 : 1,
    home: 22 + i * 10,
  })).filter((e) => e.x < def.length - 6);
  if (def.boss)
    enemies.push({
      x: def.length - 7,
      y: 12,
      vx: 0.04,
      type: "boss",
      hp: 8,
      home: def.length - 7,
    });
  return {
    ...def,
    platforms,
    enemies,
    coins: Array.from({ length: 12 }, (_, i) => ({
      x: 5 + i * 5,
      y: i % 2 ? 9 : 12,
    })),
    traps: [
      { x: 27, y: 13, type: "spikes" },
      { x: 44, y: 13, type: level > 3 ? "laser" : "spikes" },
      { x: 62, y: 13, type: level > 6 ? "crusher" : "spikes" },
    ],
    secret: { x: 11, y: 8 },
    checkpoint: { x: 40, y: 12 },
  };
}

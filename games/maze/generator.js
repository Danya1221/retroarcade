import { random, seedNumber, directions } from "../../shared/random.js";
export function reachable(map, start, blocked = []) {
  const q = [start],
    seen = new Set([start.x + "," + start.y]);
  for (let i = 0; i < q.length; i++)
    for (const [dx, dy] of directions) {
      const p = { x: q[i].x + dx, y: q[i].y + dy },
        k = p.x + "," + p.y;
      if (
        map[p.y]?.[p.x] !== 0 ||
        seen.has(k) ||
        blocked.some((b) => b.x === p.x && b.y === p.y)
      )
        continue;
      seen.add(k);
      q.push(p);
    }
  return { seen, cells: q };
}
export function generate(seed, rareEvent = 0.08) {
  const r = { rng: seedNumber(seed) },
    w = 31,
    h = 23,
    map = Array.from({ length: h }, () => Array(w).fill(1)),
    stack = [{ x: 1, y: 1 }];
  map[1][1] = 0;
  while (stack.length) {
    const p = stack.at(-1),
      ds = directions.filter(
        ([dx, dy]) =>
          p.x + dx * 2 > 0 &&
          p.x + dx * 2 < w - 1 &&
          p.y + dy * 2 > 0 &&
          p.y + dy * 2 < h - 1 &&
          map[p.y + dy * 2][p.x + dx * 2] === 1,
      );
    if (!ds.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = ds[Math.floor(random(r) * ds.length)];
    map[p.y + dy][p.x + dx] = 0;
    map[p.y + dy * 2][p.x + dx * 2] = 0;
    stack.push({ x: p.x + dx * 2, y: p.y + dy * 2 });
  }
  // Carve connected rooms around existing maze cells, retaining the outer shell.
  const rooms = [];
  for (let i = 0; i < 7; i++) {
    const x = 3 + 2 * Math.floor(random(r) * 12),
      y = 3 + 2 * Math.floor(random(r) * 8);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) map[y + dy][x + dx] = 0;
    rooms.push({
      x,
      y,
      type: [
        "enemy",
        "treasure",
        "trap",
        "challenge",
        "rare",
        "secret",
        "event",
      ][i],
    });
  }
  const cells = reachable(map, { x: 1, y: 1 }).cells,
    exit = cells.at(-1),
    before = reachable(map, { x: 1, y: 1 }, [exit]).cells;
  const key = before[Math.floor(before.length * 0.65)];
  const secret = before[Math.floor(before.length * 0.85)];
  // Spawn enemies in distant rooms/corridors, never on top of the player.
  // This creates a readable "dungeon" opening instead of Pac-Man-like contact spawns.
  const spawnCells = before.filter((p, i) =>
    i > 25 &&
    Math.abs(p.x - 1) + Math.abs(p.y - 1) >= 10 &&
    Math.abs(p.x - exit.x) + Math.abs(p.y - exit.y) >= 3 &&
    !((p.x === key.x && p.y === key.y) || (p.x === secret.x && p.y === secret.y))
  );
  const enemies = spawnCells
    .filter((_, i) => i % 37 === 0)
    .slice(0, 8)
    .map((p, i) => ({
      ...p, home: { ...p },
      type: ["chaser","patrol","ambusher","guard","hunter","ranged"][i % 6],
      hp: i % 5 === 4 ? 3 : 2, dir: i % 4,
      wake: 22 + i * 9,
    }));
  const keyMode = Math.floor(random(r) * 3);
  if (keyMode === 1)
    enemies.push({
      ...key,
      home: { ...key },
      type: "guard",
      hp: 3,
      dir: 0,
      key: true,
    });
  // Optional fake walls hide short side passages. They remain ordinary
  // walls for path validation until the player reveals them with ACT.
  const fakeWalls = [];
  for (const p of before.slice(20)) {
    if (fakeWalls.length >= 4) break;
    for (const [dx, dy] of directions) {
      const wx=p.x+dx, wy=p.y+dy, bx=wx+dx, by=wy+dy;
      if (map[wy]?.[wx] === 1 && map[by]?.[bx] === 0 && wx>1 && wy>1 && wx<w-2 && wy<h-2) {
        if (random(r) < .035) fakeWalls.push({x:wx,y:wy,revealed:false});
      }
    }
  }
  const result = {
    map,
    rooms,
    fakeWalls,
    exit,
    key,
    secret,
    keyMode,
    enemies,
    rare: random(r) < rareEvent,
  };
  if (!validate(result)) throw Error("Invalid maze seed: " + seed);
  return result;
}
export function validate(m) {
  const a = reachable(m.map, { x: 1, y: 1 }, [m.exit]);
  return (
    a.seen.has(m.key.x + "," + m.key.y) &&
    a.seen.has(m.secret.x + "," + m.secret.y) &&
    reachable(m.map, { x: 1, y: 1 }).seen.has(m.exit.x + "," + m.exit.y)
  );
}

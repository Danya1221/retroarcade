import { random, direction, directions, same } from "../../shared/random.js";
function empty(s) {
  for (let i = 0; i < 1000; i++) {
    const p = {
      x: 1 + Math.floor(random(s) * 22),
      y: 1 + Math.floor(random(s) * 16),
    };
    if (
      !s.body.some((b) => same(b, p)) &&
      !s.walls.some((b) => same(b, p)) &&
      !(s.moving || []).some((b) => same(b, p)) &&
      (!s.bonus || !same(s.bonus, p)) &&
      (!s.food || !same(s.food, p))
    )
      return p;
  }
  return null;
}
export function init(s) {
  Object.assign(s, {
    width: 24,
    height: 18,
    body: [
      { x: 7, y: 9 },
      { x: 6, y: 9 },
      { x: 5, y: 9 },
    ],
    dir: 1,
    moveTick: 0,
    turnTick: -1,
    walls: [],
    food: null,
    eaten: 0,
    boost: 0,
    moving: [],
    bonus: null,
    shield: 0,
  });
  s.food = empty(s);
  return s;
}
export function moveInterval(s) {
  const base = Math.max(3, 9 - Math.floor(s.eaten / 6));
  return s.tick < (s.slowUntil || 0)
    ? base + 4
    : s.sprinting
      ? Math.max(2, base - 3)
      : base;
}
export function step(s, input) {
  s.sprinting = !!(input & 16);
  if (input & 32 && s.tick >= (s.slowReady || 0)) {
    s.slowUntil = s.tick + 90;
    s.slowReady = s.tick + 450;
  }
  const d = direction(input);
  if (d >= 0 && d !== (s.dir + 2) % 4 && s.turnTick !== s.moveTick) {
    s.dir = d;
    s.turnTick = s.moveTick;
  }
  if (s.eaten >= 12 && s.tick % 60 === 0) {
    const obstacle = { x: 2 + Math.floor((s.tick / 60) % 19), y: 3 };
    if (
      ![...s.body, ...s.walls, s.food, s.bonus].some(
        (p) => p && same(p, obstacle),
      )
    )
      s.moving = [obstacle];
  }
  if (s.eaten >= 5 && !s.bonus && s.tick % 180 === 0) {
    s.bonus = empty(s);
  }
  const interval = moveInterval(s);
  s.interval = interval;
  if (s.tick % interval) return;
  s.moveTick = s.tick;
  const [dx, dy] = directions[s.dir],
    p = { x: s.body[0].x + dx, y: s.body[0].y + dy };
  const eat = s.food && same(p, s.food);
  if (
    p.x < 1 ||
    p.y < 1 ||
    p.x >= 23 ||
    p.y >= 17 ||
    [...s.walls, ...s.moving].some((w) => same(w, p)) ||
    s.body.slice(0, eat ? undefined : -1).some((b) => same(b, p))
  ) {
    s.over = true;
    return;
  }
  if (s.bonus && same(p, s.bonus)) {
    s.bonus = null;
    s.boost = s.tick + 240;
    s.score += 25;
  }
  s.body.unshift(p);
  if (!eat) s.body.pop();
  else {
    s.eaten++;
    s.score += (s.rare ? 50 : 10) * (s.tick < s.boost ? 2 : 1);
    s.food = empty(s);
    s.rare = random(s) < 0.12;
    if (!s.food) {
      s.over = true;
      s.won = true;
    }
    if (s.eaten % 7 === 0) {
      const w = empty(s);
      if (w && (!s.food || !same(w, s.food))) s.walls.push(w);
    }
  }
}

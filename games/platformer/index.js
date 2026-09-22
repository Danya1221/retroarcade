import { buildLevel } from "./levels.js";
export function init(s) {
  Object.assign(s, buildLevel(s.level), {
    width: 24,
    height: 17,
    player: { x: 2, y: 12, vx: 0, vy: 0 },
    hp: 4,
    ground: false,
    jumpWas: false,
    invulnerable: 0,
    spawn: { x: 2, y: 12 },
    checkpointTaken: false,
    secretFound: false,
    kills: 0,
    projectiles: [],
  });
  return s;
}
function hit(s, fall = false) {
  if (s.tick < s.invulnerable && !fall) return;
  s.hp--;
  s.invulnerable = s.tick + 50;
  if (s.hp <= 0) {
    s.over = true;
    return;
  }
  if (fall) {
    s.player = { ...s.spawn, vx: 0, vy: 0 };
  }
}
export function step(s, input) {
  const p = s.player,
    oldY = p.y;
  let moving = 0;
  if (input & 2) moving++;
  if (input & 8) moving--;
  p.vx = moving * 0.17;
  if (
    input & 16 &&
    !s.jumpWas &&
    (s.ground || s.tick - (s.lastGround || -100) < 4)
  ) {
    p.vy = -0.43;
    s.ground = false;
  }
  s.jumpWas = !!(input & 16);
  p.vy = Math.min(p.vy + 0.024, 0.6);
  p.x = Math.max(0, Math.min(s.length - 1, p.x + p.vx));
  p.y += p.vy;
  s.ground = false;
  for (const f of s.platforms) {
    if (f.type === "moving") f.x = f.baseX + Math.sin(s.tick / 45) * 1.3;
    if (f.type === "falling" && f.trigger && s.tick - f.trigger > 22) continue;
    if (
      p.x + 0.7 > f.x &&
      p.x < f.x + f.w &&
      oldY + 0.9 <= f.y + 0.06 &&
      p.y + 0.9 >= f.y &&
      p.vy >= 0
    ) {
      p.y = f.y - 0.9;
      p.vy = 0;
      s.ground = true;
      s.lastGround = s.tick;
      if (f.type === "falling") f.trigger ||= s.tick;
      if (f.type === "moving") p.x += (Math.cos(s.tick / 45) * 1.3) / 45;
    }
  }
  if (p.y > 18) hit(s, true);
  if (s.over) return;
  if (s.boss && p.x > s.length - 16 && !s.arenaEntered) {
    s.arenaEntered = true;
    s.hp = 4;
    s.spawn = { x: s.length - 17, y: 12 };
  }
  if (p.x > s.checkpoint.x && !s.checkpointTaken) {
    s.checkpointTaken = true;
    s.hp = 4;
    s.spawn = { ...s.checkpoint };
    s.score += 50;
  }
  for (const c of s.coins)
    if (!c.taken && Math.abs(c.x - p.x) < 0.9 && Math.abs(c.y - p.y) < 1.2) {
      c.taken = true;
      s.score += 20;
    }
  if (
    !s.secretFound &&
    Math.abs(p.x - s.secret.x) < 1 &&
    Math.abs(p.y - s.secret.y) < 1.6 &&
    input & 32
  ) {
    s.secretFound = true;
    s.secrets++;
    s.boxes++;
    s.score += 150;
  }
  for (const t of s.traps) {
    const on = t.type === "spikes" || s.tick % 100 < 45;
    if (on && Math.abs(t.x - p.x) < 0.75 && p.y > 11.8) hit(s);
  }
  for (const e of s.enemies) {
    if (["flying", "jumping"].includes(e.type))
      e.y = 11.5 - Math.abs(Math.sin(s.tick / 18)) * 2;
    else e.y = 12.8;
    if (e.type === "fast") e.x += e.vx * 2;
    else e.x += e.vx;
    if (Math.abs(e.x - e.home) > 3) e.vx *= -1;
    if (["ranged", "boss"].includes(e.type) && s.tick % 60 === 0)
      s.projectiles.push({ x: e.x, y: e.y, dx: Math.sign(p.x - e.x) * 0.16 });
    if (Math.abs(p.x - e.x) < 0.85 && Math.abs(p.y - e.y) < 1) {
      if (p.vy > 0 && oldY + 0.5 < e.y) {
        e.hp--;
        p.vy = -0.33;
        s.score += 30;
      } else hit(s);
    }
    if (
      input & 32 &&
      s.tick % 20 === 0 &&
      Math.abs(p.x - e.x) < 1.8 &&
      Math.abs(p.y - e.y) < 1.8
    ) {
      e.hp--;
      s.score += 10;
    }
  }
  s.kills += s.enemies.filter((e) => e.hp <= 0).length;
  s.enemies = s.enemies.filter((e) => e.hp > 0);
  for (const b of s.projectiles) {
    b.x += b.dx;
    if (Math.abs(b.x - p.x) < 0.6 && Math.abs(b.y - p.y) < 0.7) {
      hit(s);
      b.dead = true;
    }
  }
  s.projectiles = s.projectiles.filter(
    (b) => !b.dead && b.x > 0 && b.x < s.length,
  );
  if (
    p.x > s.length - 3 &&
    (!s.boss || !s.enemies.some((e) => e.type === "boss"))
  ) {
    s.over = true;
    s.won = true;
    s.score += 500 + (s.boss ? 1000 : 0);
  }
}

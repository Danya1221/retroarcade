import { buildLevel } from "./levels.js";
export function init(s) {
  const layout=buildLevel(s.level);
  Object.assign(s, layout, {
    width: 24,
    height: 17,
    player: { x: 2, y: layout.mainY-2, vx: 0, vy: 0 },
    hp: 4,
    keysHeld: 0,
    ground: false,
    jumpWas: false,
    invulnerable: 0,
    spawn: { x: 2, y: layout.mainY-2 },
    checkpointTaken: false,
    secretFound: false,
    kills: 0,
    projectiles: [],
    facing: 1,
    attackingUntil: 0,
    attackStarted: 0,
    storyIndex: 0,
    storyQueue: [],
    storyCue: null,
    medallionLost: s.level !== 1,
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
  // Older active runs can be resumed after the story update.
  s.storyQueue ||= [];
  s.storyIndex ??= 0;
  if(s.layoutVersion!==3){
    const layout=buildLevel(s.level);
    s.platforms=layout.platforms;
    s.mainY=layout.mainY;
    s.ladders=layout.ladders;
    s.chests=layout.chests.map((c,i)=>({...c,opened:!!s.chests?.[i]?.opened}));
    s.keys=layout.keys.map((key,i)=>({...key,taken:!!s.keys?.[i]?.taken}));
    s.layoutVersion=3;
  }
  const p = s.player,
    oldY = p.y;
  const actionPressed=!!(input&32) && !s.actionWas;
  s.actionWas=!!(input&32);
  if(actionPressed){s.attackStarted=s.tick;s.attackingUntil=s.tick+12;}
  let moving = 0;
  if (input & 2) moving++;
  if (input & 8) moving--;
  p.vx = moving * 0.17;
  if (moving) s.facing = Math.sign(moving);
  if (
    input & 16 &&
    !s.jumpWas &&
    (s.ground || s.tick - (s.lastGround || -100) < 4)
  ) {
    p.vy = -0.43;
    s.ground = false;
  }
  s.jumpWas = !!(input & 16);
  const ladder=(s.ladders||[]).find(l=>Math.abs(p.x-l.x)<.7 && p.y+0.9>=l.y-.2 && p.y<=l.bottom);
  const climbing=ladder && (input&1 || input&4);
  if (climbing) {
    p.vy=(input&1 ? -.13 : 0)+(input&4 ? .13 : 0);
    p.x+=(ladder.x-p.x)*.18;
  } else p.vy = Math.min(p.vy + 0.024, 0.6);
  p.x = Math.max(0, Math.min(s.length - 1, p.x + p.vx));
  p.y += p.vy;
  // Chests rest on solid ground or a ledge. Open them beside the hero with E;
  // upward hits remain supported for previously saved runs and arcade blocks.
  for (const chest of s.chests || []) {
    const adjacent=actionPressed && Math.abs(p.x+.35-(chest.x+.5))<1.15 &&
      Math.abs(p.y+.45-(chest.y+.5))<1.1;
    const headbutt=p.vy<0 && p.x+.7>chest.x && p.x<chest.x+1 &&
      oldY>=chest.y+.9 && p.y<=chest.y+.9;
    if(chest.opened || !(adjacent || headbutt))continue;
    if(chest.locked && !s.keysHeld){
      if(adjacent && s.tick>(s.lockHintUntil||0)){
        s.storyQueue.push({line:"Цепь не поддаётся. Найди ключ на уровне.",kind:"clue"});
        s.lockHintUntil=s.tick+100;
      }
      continue;
    }
    if (chest.locked) s.keysHeld--;
    chest.opened = true;
    s.score += chest.locked ? 180 : 80;
    if (chest.locked) s.boxes++;
    else if (s.hp < 4 && s.chests.indexOf(chest) % 3 === 0) s.hp++;
    if (chest.locked && s.chests.indexOf(chest) === 1)
      s.storyQueue.push({line:["На дне сундука — обрывок карты той же долины.","Метка стоит там, где в другую эпоху был замок."][s.world%2],kind:"clue"});
    if(headbutt)p.vy=0.05;
  }
  s.ground = false;
  for (const f of s.platforms) {
    if (f.type === "moving") f.x = f.baseX + Math.sin(s.tick / 45) * 1.3;
    if (f.type === "falling" && f.trigger && s.tick - f.trigger > 22) continue;
    if (f.type === "vanish" && Math.floor(s.tick / 45) % 2) continue;
    if (
      p.x + 0.7 > f.x &&
      p.x < f.x + f.w &&
      oldY + 0.9 <= f.y + 0.06 &&
      p.y + 0.9 >= f.y &&
      p.vy >= 0 &&
      !(climbing && p.vy>0 && Math.abs(f.y-ladder.y)<.01 &&
        p.x+0.7>ladder.x-.4 && p.x<ladder.x+.4)
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
  const event=s.events?.[s.storyIndex];
  if (event && p.x >= event.x && (event.kind!=="encounter" || !s.enemies.some(e=>e.type==="boss"))) {
    s.storyIndex++;
    for (const line of event.lines) s.storyQueue.push({line,kind:event.kind});
    if (event.kind==="theft") s.medallionLost=true;
  }
  if (!s.storyCue || s.tick>=s.storyCue.until) {
    const next=s.storyQueue.shift();
    s.storyCue=next?{...next,until:s.tick+100}:null;
  }
  if (s.boss && p.x > s.length - 16 && !s.arenaEntered) {
    s.arenaEntered = true;
    s.hp = 4;
    s.spawn = { x: s.length - 17, y: s.mainY-2 };
  }
  if (p.x > s.checkpoint.x && !s.checkpointTaken) {
    s.checkpointTaken = true;
    s.hp = 4;
    s.spawn = { ...s.checkpoint };
    s.score += 50;
  }
  for (const key of s.keys || [])
    if (!key.taken && Math.abs(key.x - p.x) < 0.85 && Math.abs(key.y - p.y) < 1.2) {
      key.taken = true;
      s.keysHeld++;
      s.score += 25;
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
    const phase = s.tick % 120;
    const on =
      t.type === "spikes" ||
      (t.type === "laser" && phase < 48) ||
      (t.type === "crusher" && phase > 65) ||
      (t.type === "fire" && phase > 22 && phase < 72) ||
      (t.type === "pendulum" && Math.abs(Math.sin(s.tick / 20)) > .45);
    const reach = t.type === "pendulum" ? 1.25 : .8;
    if (on && Math.abs(t.x - p.x) < reach && Math.abs(t.y-p.y)<2.1) hit(s);
  }
  for (const e of s.enemies) {
    if (["flying", "jumping"].includes(e.type))
      e.y = s.mainY-2.5 - Math.abs(Math.sin(s.tick / 18)) * 2;
    else e.y = s.mainY-1.2;
    if (e.type === "fast") e.x += e.vx * 2;
    else e.x += e.vx;
    if (Math.abs(e.x - e.home) > 3) e.vx *= -1;
    if (["ranged", "boss"].includes(e.type) && s.tick % 60 === 0)
      s.projectiles.push({ x: e.x, y: e.y, dx: Math.sign(p.x - e.x) * 0.16 });
    if (
      actionPressed && Math.sign(e.x-p.x)===s.facing &&
      Math.abs(p.x - e.x) < 2.1 &&
      Math.abs(p.y - e.y) < 1.8
    ) {
      e.hp--;
      s.score += 10;
    }
    if(e.hp<=0)continue;
    if (Math.abs(p.x - e.x) < 0.85 && Math.abs(p.y - e.y) < 1) {
      if (p.vy > 0 && oldY + 0.5 < e.y) {
        e.hp--;
        p.vy = -0.33;
        s.score += 30;
      } else hit(s);
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

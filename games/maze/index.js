import { generate } from "./generator.js";
import { direction, directions, same, random } from "../../shared/random.js";
export function init(s, options) {
  const dungeon = generate(s.seed, options.rareEvent);
  const pellets = [];
  for (let y=1;y<dungeon.map.length-1;y++) for(let x=1;x<dungeon.map[y].length-1;x++)
    if(dungeon.map[y][x]===0 && !(x===1&&y===1) && !(x===dungeon.exit.x&&y===dungeon.exit.y))
      pellets.push({x,y,taken:false});
  const powers = [pellets[Math.floor(pellets.length*.18)],pellets[Math.floor(pellets.length*.42)],pellets[Math.floor(pellets.length*.68)],pellets[Math.floor(pellets.length*.88)]]
    .filter(Boolean).map(p=>({x:p.x,y:p.y,taken:false}));
  for(const p of powers){const dot=pellets.find(d=>same(d,p));if(dot)dot.taken=true;}
  Object.assign(s, dungeon, {
    width: 31,
    height: 23,
    player: { x: 1, y: 1 },
    hp: 6,
    keys: 0,
    keyTaken: false,
    secretFound: false,
    cooldown: 0,
    invulnerable: 0,
    kills: 0,
    projectiles: [],
    chests: 0,
    powerUntil: 0,
    lootedRooms: [],
    pellets,
    powers,
    pelletsLeft: pellets.filter(p=>!p.taken).length,
    facing: 1,
  });
  return s;
}
function route(s, from, to) {
  const q = [{ x: from.x, y: from.y, first: null }],
    seen = new Set([from.x + "," + from.y]);
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    if (p.x === to.x && p.y === to.y) return p.first;
    for (const [dx, dy] of directions) {
      const next = { x: p.x + dx, y: p.y + dy },
        k = next.x + "," + next.y;
      if (s.map[next.y]?.[next.x] !== 0 || seen.has(k) || same(next, s.exit))
        continue;
      seen.add(k);
      q.push({ ...next, first: p.first || next });
    }
  }
  return null;
}
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
function hit(s) {
  if (s.tick < s.invulnerable) return;
  s.hp--;
  s.invulnerable = s.tick + 40;
  if (s.hp <= 0) s.over = true;
}
export function step(s, input) {
  if (input & 32 && s.tick >= s.cooldown) {
    s.cooldown = s.tick + 18;
    for (const wall of s.fakeWalls || []) {
      if (!wall.revealed && distance(s.player, wall) <= 1) {
        wall.revealed = true;
        s.map[wall.y][wall.x] = 0;
        s.score += 35;
      }
    }
    for (const e of s.enemies) {
      if (distance(e, s.player) <= 2) {
        e.hp -= s.tick < s.powerUntil ? 2 : 1;
        if (e.hp <= 0) {
          s.kills++;
          s.score += 50;
          if (e.key) {
            s.keyTaken = true;
            s.keys++;
          }
        }
      }
    }
    s.enemies = s.enemies.filter((e) => e.hp > 0);
    for (let i = 0; i < s.rooms.length; i++) {
      const r = s.rooms[i];
      if (distance(s.player, r) <= 1 && !s.lootedRooms.includes(i)) {
        if (r.type === "treasure") {
          s.hp = Math.min(6, s.hp + 2);
          s.score += 40;
          s.lootedRooms.push(i);
        }
        if (r.type === "challenge") {
          s.powerUntil = s.tick + 300;
          s.lootedRooms.push(i);
        }
        if (r.type === "event" && s.rare && s.keyTaken) {
          s.boxes++;
          s.score += 100;
          s.lootedRooms.push(i);
        }
        if (r.type === "rare" && s.rare) {
          s.hp = 6;
          s.powerUntil = s.tick + 450;
          s.score += 175;
          s.lootedRooms.push(i);
        }
        if (r.type === "secret") {
          s.secrets++;
          s.score += 125;
          s.lootedRooms.push(i);
        }
      }
    }
    if (distance(s.player, s.secret) <= 1 && !s.secretFound) {
      s.secretFound = true;
      s.secrets++;
      s.score += 200;
      s.boxes++;
    }
    if (s.keyMode === 2 && !s.keyTaken && distance(s.player, s.key) <= 1) {
      s.keyTaken = true;
      s.keys++;
      s.chests++;
    }
  }
  if (s.tick % 5 === 0) {
    const d = direction(input);
    if (d >= 0) {
      s.facing = d;
      const [dx, dy] = directions[d],
        p = { x: s.player.x + dx, y: s.player.y + dy };
      if (s.map[p.y]?.[p.x] === 0) {
        if (same(p, s.exit)) {
          if (s.keys) {
            s.keys--;
            s.won = true;
            s.over = true;
            s.score += 500;
          }
        } else s.player = p;
      }
    }
    const dot=s.pellets.find(q=>!q.taken&&same(q,s.player));
    if(dot){dot.taken=true;s.pelletsLeft--;s.score+=5;}
    const power=s.powers.find(q=>!q.taken&&same(q,s.player));
    if(power){
      power.taken=true;s.powerUntil=s.tick+270;s.score+=50;
    }
    if (s.keyMode === 0 && !s.keyTaken && same(s.player, s.key)) {
      s.keyTaken = true;
      s.keys++;
      s.score += 25;
    }
  }
  if (s.tick % 12 === 0)
    for (const e of s.enemies) {
      const dist = distance(e, s.player);
      const frightened = s.tick < s.powerUntil;
      if (s.tick < (e.wake || 0)) continue;
      // Enemies outside the encounter radius patrol their own room instead of
      // knowing the player's position through walls.
      const alerted = dist <= (e.type === "hunter" ? 10 : e.type === "ranged" ? 8 : 7);
      let target = alerted ? s.player : e.home;
      if (frightened) target = e.home;
      if (e.type === "guard" && dist > 4) target = e.home;
      if (e.type === "hunter" && !s.keyTaken && !alerted) target = e.home;
      if (e.type === "ambusher" && alerted) {
        const d = direction(input), [dx,dy] = directions[d >= 0 ? d : 1];
        target = {x:s.player.x+dx*2,y:s.player.y+dy*2};
      }
      const choices = directions
        .map(([dx,dy])=>({x:e.x+dx,y:e.y+dy}))
        .filter((p)=>s.map[p.y]?.[p.x]===0 && !same(p,s.exit) &&
          !s.enemies.some((other)=>other!==e && same(other,p)));
      if (!choices.length) continue;
      if (frightened) {
        choices.sort((a,b)=>distance(b,s.player)-distance(a,s.player));
      } else if (e.type === "ranged" && alerted) {
        if (dist < 9 && (e.x===s.player.x || e.y===s.player.y) && s.tick % 36===0)
          s.projectiles.push({x:e.x,y:e.y,dx:Math.sign(s.player.x-e.x),dy:Math.sign(s.player.y-e.y)});
        // Ranged enemies actively back away if the player gets close.
        choices.sort((a,b)=>dist < 5 ? distance(b,s.player)-distance(a,s.player) : distance(a,target)-distance(b,target));
      } else if (alerted && ["chaser","hunter"].includes(e.type)) {
        const routed=route(s,e,target);
        if(routed && !s.enemies.some((other)=>other!==e && same(other,routed))){e.x=routed.x;e.y=routed.y;continue;}
        choices.sort((a,b)=>distance(a,target)-distance(b,target));
      } else if (alerted) choices.sort((a,b)=>distance(a,target)-distance(b,target));
      else {
        // Patrol locally, preferring cells near home and occasionally changing route.
        choices.sort((a,b)=>distance(a,e.home)-distance(b,e.home)+(random(s)-.5)*2);
      }
      const p=choices[0]; e.x=p.x; e.y=p.y; e.dir=(e.dir+1)%4;
    }
  if (s.tick % 5 === 0) {
    for (const p of s.projectiles) {
      p.x += p.dx;
      p.y += p.dy;
      if (same(p, s.player)) hit(s);
    }
    s.projectiles = s.projectiles.filter((p) => s.map[p.y]?.[p.x] === 0);
  }
  for(const e of [...s.enemies]) if(same(e,s.player)){
    if(s.tick<s.powerUntil){
      s.score+=200;s.kills++;s.enemies=s.enemies.filter(x=>x!==e);
    } else hit(s);
  }
  // Pulsing hazard room, visibly lit before activation.
  if (
    s.tick % 90 < 25 &&
    s.rooms.some((r) => r.type === "trap" && same(r, s.player))
  )
    hit(s);
}

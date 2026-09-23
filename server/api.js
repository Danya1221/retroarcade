import { catalog, validateCatalog } from "./catalog.js";
import { randomUUID, randomBytes } from "node:crypto";
import { pool, transaction } from "../database/db.js";
import { validateTelegram, newToken, hashToken, isAdmin } from "./auth.js";
import { config, box, reward, achievement, rollLoot } from "./economy.js";
import {
  games,
  skins,
  achievements,
  challenges,
  dayKey,
  weekKey,
  levelFromXP,
  defaultConfig,
} from "../shared/content.js";
import { createGame, replay } from "../shared/engine.js";
import { levels } from "../games/platformer/levels.js";
import { ApiError } from "./errors.js";
import { lootBoxes } from "../shared/loot.js";
import { activeMissions } from "../shared/missions.js";
export { ApiError } from "./errors.js";
const fail = (status, msg) => {
  throw new ApiError(status, msg);
};
const uuid = (x) =>
  typeof x === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
async function daily(c) {
  const day = dayKey();
  await c.query(
    "INSERT INTO daily_mazes(day,seed) VALUES($1,$2) ON CONFLICT DO NOTHING",
    [day, randomBytes(12).toString("hex")],
  );
  return (await c.query("SELECT seed FROM daily_mazes WHERE day=$1", [day]))
    .rows[0].seed;
}
async function lockedUser(c, id) {
  return (await c.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [id]))
    .rows[0];
}
export async function authenticate(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token || token.length > 200)
    fail(401, "Открой приложение заново через Telegram");
  const r = await pool.query(
    "SELECT u.* FROM auth_sessions a JOIN users u ON u.id=a.user_id WHERE a.token_hash=$1 AND a.expires_at>now()",
    [hashToken(token)],
  );
  if (!r.rowCount) fail(401, "Сессия истекла. Открой приложение заново");
  if (r.rows[0].banned) fail(403, "Аккаунт заблокирован");
  return r.rows[0];
}
export async function api(req, path, b, q) {
  if (path === "/api/auth" && req.method === "POST") {
    let tg;
    try {
      if (
        process.env.NODE_ENV !== "production" &&
        process.env.DEV_AUTH === "true" &&
        b.dev === true
      )
        tg = { id: 1, first_name: "LOCAL PLAYER" };
      else
        tg = validateTelegram(b.initData, process.env.TELEGRAM_BOT_TOKEN || "");
    } catch {
      fail(
        401,
        "Не удалось проверить Telegram. Открой приложение через кнопку PLAY в боте",
      );
    }
    return transaction(async (c) => {
      const today = dayKey();
      await c.query(
        "INSERT INTO users(id,name,username,avatar,login_day) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=$2,username=$3,avatar=$4,last_seen=now()",
        [
          tg.id,
          tg.first_name.slice(0, 100),
          tg.username || null,
          tg.photo_url || null,
          today,
        ],
      );
      const u = await lockedUser(c, tg.id);
      if (u.banned) fail(403, "Аккаунт заблокирован");
      const last = dayKey(new Date(u.login_day));
      if (last !== today) {
        u.streak =
          last === dayKey(new Date(Date.now() - 86400000)) ? u.streak + 1 : 1;
        u.xp += 10;
        if (u.streak % 7 === 0) {
          await box(c, u.id);
          await achievement(c, u, "week");
        }
        await c.query(
          "UPDATE users SET streak=$2,login_day=$3,xp=$4 WHERE id=$1",
          [u.id, u.streak, today, u.xp],
        );
      }
      for (const skin of (await catalog(c)).skins.filter(
        (x) => x.cost === 0 && x.rarity === "COMMON",
      ))
        await c.query(
          "INSERT INTO user_skins(user_id,skin) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [u.id, skin.id],
        );
      const token = newToken();
      await c.query("DELETE FROM auth_sessions WHERE expires_at<now()");
      await c.query(
        "INSERT INTO auth_sessions VALUES($1,$2,now()+interval '24 hours')",
        [hashToken(token), u.id],
      );
      return { token };
    });
  }
  const user = await authenticate(req);
  const method = req.method;
  const { skins, achievements, challenges } = await catalog(pool);
  if (method === "GET" && path === "/api/me") {
    const cfg = await config(pool);
    const [owned, inv, awards, active, history] = await Promise.all([
      pool.query("SELECT skin FROM user_skins WHERE user_id=$1", [user.id]),
      pool.query("SELECT item,quantity FROM inventory WHERE user_id=$1", [
        user.id,
      ]),
      pool.query("SELECT achievement FROM user_achievements WHERE user_id=$1", [
        user.id,
      ]),
      pool.query(
        "SELECT id,game,state,version,level,daily FROM game_sessions WHERE user_id=$1 AND finished_at IS NULL",
        [user.id],
      ),
      pool.query(
        "SELECT result FROM loot_drops WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10",
        [user.id],
      ),
    ]);
    return {
      user: {
        ...user,
        level: levelFromXP(user.xp, cfg.levelXP),
        xpFloor: (levelFromXP(user.xp, cfg.levelXP) - 1) ** 2 * cfg.levelXP,
        xpNext: levelFromXP(user.xp, cfg.levelXP) ** 2 * cfg.levelXP,
        admin: isAdmin(user.id),
      },
      games: games.map((g) => ({ ...g, enabled: cfg.enabled[g.id] })),
      skins: skins.map((s) =>
        s.hidden && !owned.rows.some((x) => x.skin === s.id)
          ? {
              id: s.id,
              game: s.game,
              rarity: s.rarity,
              hidden: true,
              cost: s.cost,
            }
          : s,
      ),
      owned: owned.rows.map((x) => x.skin),
      inventory: inv.rows,
      lootBoxes,
      achievements: achievements.map((a) =>
        a.hidden && !awards.rows.some((x) => x.achievement === a.id)
          ? { id: a.id, hidden: true }
          : a,
      ),
      awards: awards.rows.map((x) => x.achievement),
      active: active.rows[0] || null,
      lootHistory: history.rows.map(({ result: { audit, ...result } }) => ({
        result,
      })),
      levels,
    };
  }
  if (method === "GET" && path === "/api/challenges") {
    const rows = (
      await pool.query(
        "SELECT * FROM challenge_progress WHERE user_id=$1 AND period>=$2",
        [user.id, weekKey()],
      )
    ).rows;
    return activeMissions(challenges).map((ch) => {
      const progress = rows.find(
        (r) =>
          r.challenge === ch.id &&
          dayKey(new Date(r.period)) ===
            (ch.period === "day" ? dayKey() : weekKey()),
      );
      return { ...ch, value: progress?.value || 0, claimed: Boolean(progress?.claimed) };
    });
  }
  if (method === "POST" && path === "/api/multiplayer/create") {
    if (!["racer","tanks"].includes(b.game) || !["online","mixed"].includes(b.mode)) fail(400,"Неверный режим");
    return transaction(async c => {
      const id=randomUUID(), seed=randomBytes(12).toString("hex"), code=randomBytes(3).toString("hex").toUpperCase();
      await c.query("INSERT INTO multiplayer_rooms(id,code,game,mode,host_id,max_players,seed) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,code,b.game,b.mode,user.id,Math.max(2,Math.min(4,Number(b.maxPlayers)||4)),seed]);
      await c.query("INSERT INTO multiplayer_players(room_id,user_id,name,slot) VALUES($1,$2,$3,0)",[id,user.id,user.name]);
      return {id,code,game:b.game,mode:b.mode,host:true};
    });
  }
  if (method === "POST" && path === "/api/multiplayer/join") {
    const code=String(b.code||"").trim().toUpperCase(); if(!/^[A-F0-9]{6}$/.test(code)) fail(400,"Неверный код комнаты");
    return transaction(async c => {
      const room=(await c.query("SELECT * FROM multiplayer_rooms WHERE code=$1 FOR UPDATE",[code])).rows[0];
      if(!room||room.status!=="lobby") fail(404,"Комната недоступна");
      const rows=(await c.query("SELECT * FROM multiplayer_players WHERE room_id=$1 ORDER BY slot",[room.id])).rows;
      if(rows.some(x=>String(x.user_id)===String(user.id))) return {room,players:rows};
      if(rows.length>=room.max_players) fail(409,"Комната заполнена");
      const used=new Set(rows.map(x=>x.slot));let slot=0;while(used.has(slot))slot++;
      await c.query("INSERT INTO multiplayer_players(room_id,user_id,name,slot) VALUES($1,$2,$3,$4)",[room.id,user.id,user.name,slot]);
      return {room,players:(await c.query("SELECT user_id,name,ready,slot FROM multiplayer_players WHERE room_id=$1 ORDER BY slot",[room.id])).rows};
    });
  }
  if (method === "POST" && path === "/api/multiplayer/ready") {
    if(!uuid(b.id)) fail(400,"Неверная комната");
    await pool.query("UPDATE multiplayer_players SET ready=$3,last_seen=now() WHERE room_id=$1 AND user_id=$2",[b.id,user.id,b.ready!==false]);
    return {ok:true};
  }
  if (method === "POST" && path === "/api/multiplayer/start") {
    if(!uuid(b.id)) fail(400,"Неверная комната");
    return transaction(async c=>{
      const room=(await c.query("SELECT * FROM multiplayer_rooms WHERE id=$1 FOR UPDATE",[b.id])).rows[0];
      if(!room||String(room.host_id)!==String(user.id)||room.status!=="lobby") fail(403,"Запуск недоступен");
      const players=(await c.query("SELECT * FROM multiplayer_players WHERE room_id=$1 ORDER BY slot",[room.id])).rows;
      if(players.length<2&&room.mode!=="mixed") fail(409,"Нужно минимум два игрока");
      if(players.some(x=>!x.ready&&String(x.user_id)!==String(user.id))) fail(409,"Не все игроки готовы");
      await c.query("UPDATE multiplayer_rooms SET status='playing',started_at=now(),updated_at=now() WHERE id=$1",[room.id]);
      return {ok:true,seed:room.seed,botSlots:room.mode==="mixed"?Math.max(0,room.max_players-players.length):0};
    });
  }
  if (method === "GET" && path === "/api/multiplayer/room") {
    if(!uuid(q.get("id"))) fail(400,"Неверная комната");
    const room=(await pool.query("SELECT id,code,game,mode,host_id,status,max_players,seed,started_at FROM multiplayer_rooms WHERE id=$1",[q.get("id")])).rows[0];
    if(!room) fail(404,"Комната не найдена");
    const players=(await pool.query("SELECT user_id,name,ready,slot,seq,input,last_seen,state,finished,score,finish_position FROM multiplayer_players WHERE room_id=$1 ORDER BY slot",[room.id])).rows;
    return {room,players,botSlots:room.mode==="mixed"?Math.max(0,room.max_players-players.length):0};
  }
  if (method === "POST" && path === "/api/multiplayer/input") {
    if(!uuid(b.id)||!Number.isInteger(b.seq)||!Number.isInteger(b.input)||b.input<0||b.input>63) fail(400,"Неверный ввод");
    const st=b.state&&typeof b.state==="object"?b.state:{}; const safeState={x:Number(st.x)||0,y:Number(st.y)||0,dir:Number(st.dir)||0,speed:Number(st.speed)||0,distance:Number(st.distance)||0,lap:Number(st.lap)||1,hp:Number(st.hp)||0,shots:Array.isArray(st.shots)?st.shots.slice(0,20):[]};
    const r=await pool.query("UPDATE multiplayer_players SET input=$3,seq=$4,last_seen=now(),state=$5,score=$6,finished=$7 WHERE room_id=$1 AND user_id=$2 AND seq<$4 RETURNING seq",[b.id,user.id,b.input,b.seq,safeState,Math.max(0,Number(b.score)||0),b.finished===true]);
    if(!r.rowCount) return {ok:true,ignored:true};
    return {ok:true,seq:r.rows[0].seq};
  }
  if (method === "POST" && path === "/api/multiplayer/hit") {
    if(!uuid(b.id)||!/^\d+$/.test(String(b.target))) fail(400,"Неверное попадание");
    return transaction(async c=>{
      const room=(await c.query("SELECT game,status FROM multiplayer_rooms WHERE id=$1 FOR UPDATE",[b.id])).rows[0];
      if(!room||room.game!=="tanks"||room.status!=="playing") fail(409,"Матч не активен");
      const target=(await c.query("SELECT state,finished FROM multiplayer_players WHERE room_id=$1 AND user_id=$2 FOR UPDATE",[b.id,b.target])).rows[0];
      if(!target||target.finished) return {ok:true,ignored:true};
      const st=target.state||{},hp=Math.max(0,(Number(st.hp)||3)-1);st.hp=hp;
      await c.query("UPDATE multiplayer_players SET state=$3,finished=CASE WHEN $4=0 THEN true ELSE finished END WHERE room_id=$1 AND user_id=$2",[b.id,b.target,st,hp]);
      if(hp===0)await c.query("UPDATE multiplayer_players SET score=score+250 WHERE room_id=$1 AND user_id=$2",[b.id,user.id]);
      return {ok:true,hp};
    });
  }
  if (method === "POST" && path === "/api/multiplayer/finish") {
    if(!uuid(b.id)) fail(400,"Неверная комната");
    return transaction(async c=>{
      const room=(await c.query("SELECT * FROM multiplayer_rooms WHERE id=$1 FOR UPDATE",[b.id])).rows[0]; if(!room) fail(404,"Комната не найдена");
      await c.query("UPDATE multiplayer_players SET finished=true,score=GREATEST(score,$3),last_seen=now() WHERE room_id=$1 AND user_id=$2",[b.id,user.id,Math.max(0,Number(b.score)||0)]);
      const ps=(await c.query("SELECT user_id,score,finished,last_seen FROM multiplayer_players WHERE room_id=$1 ORDER BY score DESC,last_seen",[b.id])).rows;
      if(ps.every(p=>p.finished||Date.now()-new Date(p.last_seen).getTime()>15000)){
        for(let i=0;i<ps.length;i++)await c.query("UPDATE multiplayer_players SET finish_position=$3 WHERE room_id=$1 AND user_id=$2",[b.id,ps[i].user_id,i+1]);
        await c.query("UPDATE multiplayer_rooms SET status='finished',updated_at=now() WHERE id=$1",[b.id]);
      }
      return {ok:true};
    });
  }
  if (method === "GET" && path === "/api/daily-maze")
    return { day: dayKey(), seed: await daily(pool) };
  if (method === "POST" && path === "/api/session/start")
    return transaction(async (c) => {
      const u = await lockedUser(c, user.id),
        cfg = await config(c);
      if (!games.some((g) => g.id === b.game) || !cfg.enabled[b.game])
        fail(400, "Игра недоступна");
      const existing = await c.query(
        "SELECT id,state,version FROM game_sessions WHERE user_id=$1 AND finished_at IS NULL",
        [u.id],
      );
      if (existing.rowCount)
        fail(409, "Сначала продолжи или заверши текущий забег");
      const level = b.game === "platformer" ? Number(b.level || 1) : 1;
      if (
        !Number.isInteger(level) ||
        level < 1 ||
        level > 9 ||
        level > u.progress
      )
        fail(403, "Уровень ещё закрыт");
      const isDaily = b.game === "maze" && b.daily === true,
        seed = isDaily ? await daily(c) : randomBytes(12).toString("hex"),
        state = createGame(b.game, seed, level, cfg),
        id = randomUUID();
      await c.query(
        "INSERT INTO game_sessions(id,user_id,game,seed,level,daily,state) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [id, u.id, b.game, seed, level, isDaily ? dayKey() : null, state],
      );
      return { id, state, version: 0 };
    });
  if (method === "POST" && path === "/api/session/sync") {
    if (
      !uuid(b.id) ||
      !Number.isInteger(b.version) ||
      !Array.isArray(b.inputs) ||
      b.inputs.length > 1800 ||
      b.inputs.some((x) => !Number.isInteger(x) || x < 0 || x > 63)
    )
      fail(400, "Неверные игровые действия");
    return transaction(async (c) => {
      const u = await lockedUser(c, user.id);
      const s = (
        await c.query(
          "SELECT * FROM game_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE",
          [b.id, u.id],
        )
      ).rows[0];
      if (!s) fail(404, "Забег не найден");
      if (s.finished_at)
        return {
          id: s.id,
          state: s.state,
          version: s.version,
          result: s.result,
        };
      if (s.version !== b.version)
        return { id: s.id, state: s.state, version: s.version, conflict: true };
      const elapsed = (Date.now() - new Date(s.started_at).getTime()) / 1000;
      if (s.state.tick + b.inputs.length > (elapsed + 3) * 30)
        fail(422, "Действия приходят быстрее игрового времени");
      replay(s.state, b.inputs);
      let result = null;
      if (s.state.over || b.finish === true) {
        s.state.over = true;
        result = await reward(c, u, s, await config(c));
      }
      await c.query(
        "UPDATE game_sessions SET state=$2,version=version+1,updated_at=now(),finished_at=CASE WHEN $3::jsonb IS NOT NULL THEN now() ELSE NULL END,result=$3 WHERE id=$1",
        [s.id, s.state, result],
      );
      return { id: s.id, state: s.state, version: s.version + 1, result };
    });
  }
  if (method === "POST" && path === "/api/loot/buy") {
    const choice = lootBoxes.find((x) => x.id === (b.type || "arcade"));
    if (!choice) fail(400, "Неизвестный сундук");
    return transaction(async (c) => {
      const u = await lockedUser(c, user.id);
      const price = choice.price;
      if ((u.coins || 0) < price) fail(400, "Недостаточно монет");
      await c.query("UPDATE users SET coins=coins-$2 WHERE id=$1", [u.id, price]);
      await box(c, u.id, choice.id, 1);
      return { ok: true, price, type: choice.id };
    });
  }
  if (method === "POST" && path === "/api/loot/open") {
    if (!uuid(b.id)) fail(400, "Неверный идентификатор открытия");
    const choice = lootBoxes.find((x) => x.id === (b.type || "arcade"));
    if (!choice) fail(400, "Неизвестный сундук");
    return transaction(async (c) => {
      const u = await lockedUser(c, user.id),
        prior = await c.query(
          "SELECT result FROM loot_drops WHERE id=$1 AND user_id=$2",
          [b.id, u.id],
        );
      if (prior.rowCount) {
        const { audit, ...result } = prior.rows[0].result;
        return result;
      }
      const cfg = await config(c),
        removed = await c.query(
          "UPDATE inventory SET quantity=quantity-1 WHERE user_id=$1 AND item=$2 AND quantity>0 RETURNING quantity",
          [u.id, choice.id],
        );
      if (!removed.rowCount) fail(400, "Нет картриджей");
      const { skin, audit } = rollLoot(u.pity, cfg, undefined, skins, choice.rarity);
      const inserted = await c.query(
        "INSERT INTO user_skins(user_id,skin) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING skin",
        [u.id, skin.id],
      );
      const duplicate = !inserted.rowCount,
        shards = duplicate ? cfg.compensation[skin.rarity] : 0,
        result = { skin, duplicate, shards, type: choice.id };
      await c.query("UPDATE users SET shards=shards+$2,pity=$3 WHERE id=$1", [
        u.id,
        shards,
        skin.rarity === "LEGENDARY" ? 0 : u.pity + 1,
      ]);
      await c.query(
        "INSERT INTO loot_drops(id,user_id,box,result) VALUES($1,$2,$3,$4)",
        [b.id, u.id, choice.id, { ...result, audit }],
      );
      return result;
    });
  }
  if (
    method === "POST" &&
    ["/api/skin/equip", "/api/skin/buy"].includes(path)
  ) {
    const skin = skins.find((s) => s.id === b.skin);
    if (!skin) fail(400, "Скин не найден");
    return transaction(async (c) => {
      const u = await lockedUser(c, user.id);
      let owned = (
        await c.query("SELECT 1 FROM user_skins WHERE user_id=$1 AND skin=$2", [
          u.id,
          skin.id,
        ])
      ).rowCount;
      if (path.endsWith("/buy") && !owned) {
        if (!skin.cost || u.shards < skin.cost)
          fail(400, "Недостаточно осколков");
        await c.query("UPDATE users SET shards=shards-$2 WHERE id=$1", [
          u.id,
          skin.cost,
        ]);
        await c.query("INSERT INTO user_skins(user_id,skin) VALUES($1,$2)", [
          u.id,
          skin.id,
        ]);
        owned = 1;
      }
      if (!owned) fail(403, "Скин ещё не получен");
      u.equipped[skin.game] = skin.id;
      await c.query("UPDATE users SET equipped=$2 WHERE id=$1", [
        u.id,
        u.equipped,
      ]);
      return { ok: true };
    });
  }
  if (method === "POST" && path === "/api/challenges/claim") {
    const ch = activeMissions(challenges).find((x) => x.id === b.id);
    if (!ch) fail(404, "Испытание не найдено");
    return transaction(async (c) => {
      await lockedUser(c, user.id);
      const r = await c.query(
        "UPDATE challenge_progress SET claimed=true WHERE user_id=$1 AND challenge=$2 AND period=$3 AND value>=$4 AND claimed=false RETURNING *",
        [user.id, ch.id, ch.period === "day" ? dayKey() : weekKey(), ch.target],
      );
      if (!r.rowCount) fail(409, "Награда уже получена или цель не достигнута");
      await c.query("UPDATE users SET xp=xp+$2,shards=shards+$3 WHERE id=$1", [
        user.id,
        ch.xp,
        ch.shards,
      ]);
      if (ch.box) await box(c, user.id);
      return { ok: true };
    });
  }
  if (method === "GET" && path === "/api/leaderboard") {
    const mode = q.get("game") || "snake",
      period = q.get("period") || "all";
    if (
      !["global", "snake", "maze", "daily", "platformer", "mines", "merge2048", "racer", "tanks", "speedrun"].includes(
        mode,
      ) ||
      !["today", "week", "all"].includes(period)
    )
      fail(400, "Неверный рейтинг");
    const since =
      mode === "daily"
        ? dayKey()
        : period === "today"
          ? dayKey()
          : period === "week"
            ? weekKey()
            : "1970-01-01";
    const game =
      mode === "daily" ? "maze" : mode === "speedrun" ? "platformer" : mode;
    const sql =
      mode === "global"
        ? `SELECT id,name,xp AS score FROM users WHERE banned=false`
        : `SELECT u.id,u.name,${mode === "speedrun" ? "MIN((s.result->>'ticks')::int)" : "MAX((s.result->>'score')::int)"} AS score FROM game_sessions s JOIN users u ON u.id=s.user_id WHERE s.game=$1 AND s.finished_at>=$2 AND s.result IS NOT NULL AND s.excluded=false AND s.suspicious IS NULL AND u.banned=false ${mode === "daily" ? "AND s.daily=$2::date AND (s.result->>'won')::boolean=true" : ""} ${mode === "speedrun" ? "AND s.level=9 AND (s.result->>'won')::boolean=true" : ""} GROUP BY u.id,u.name`;
    const rows = await pool.query(
      `WITH scores AS (${sql}), ranked AS (SELECT *,rank() OVER(ORDER BY score ${mode === "speedrun" ? "ASC" : "DESC"}) AS position FROM scores) SELECT * FROM ranked WHERE position<=50 OR id=$${mode === "global" ? 1 : 3} ORDER BY position,id`,
      mode === "global" ? [user.id] : [game, since, user.id],
    );
    return rows.rows;
  }
  if (path.startsWith("/api/admin")) {
    if (!isAdmin(user.id)) fail(403, "Только для администратора");
    return admin(path, method, b, user);
  }
  fail(404, "Маршрут не найден");
}
async function admin(path, method, b, user) {
  if (method === "GET" && path === "/api/admin") {
    const [totals, sessions, loot, users, recent, settings] = await Promise.all(
      [
        pool.query(
          "SELECT count(*) AS total,count(*) FILTER(WHERE last_seen>now()-interval '1 day') AS dau,count(*) FILTER(WHERE last_seen>now()-interval '7 days') AS wau,sum(shards) AS shards FROM users",
        ),
        pool.query(
          "SELECT game,count(*) AS sessions,avg((state->>'tick')::int)/30 AS seconds FROM game_sessions GROUP BY game",
        ),
        pool.query(
          "SELECT result->'skin'->>'rarity' AS rarity,count(*) AS drops,count(*) FILTER(WHERE (result->>'duplicate')::boolean) AS duplicates FROM loot_drops GROUP BY 1",
        ),
        pool.query(
          "SELECT id,name,xp,streak,progress,banned FROM users ORDER BY last_seen DESC LIMIT 100",
        ),
        pool.query(
          "SELECT id,user_id,game,result,excluded,suspicious FROM game_sessions WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 100",
        ),
        config(pool),
      ],
    );
    return {
      catalog: await catalog(pool),
      totals: totals.rows[0],
      sessions: sessions.rows,
      loot: loot.rows,
      users: users.rows,
      recent: recent.rows,
      config: settings,
    };
  }
  if (method === "POST" && path === "/api/admin/catalog") {
    const value = validateCatalog(b.catalog);
    return transaction(async (c) => {
      await c.query(
        "INSERT INTO settings(key,value) VALUES('catalog',$1) ON CONFLICT(key) DO UPDATE SET value=$1",
        [value],
      );
      await c.query(
        "INSERT INTO admin_audit(user_id,action,payload) VALUES($1,$2,$3)",
        [user.id, "catalog", value],
      );
      return { ok: true };
    });
  }
  if (method === "POST" && path === "/api/admin/config") {
    const cfg = b.config;
    if (!cfg || typeof cfg !== "object") fail(400, "Неверная конфигурация");
    for (const k of Object.keys(defaultConfig.enabled))
      if (typeof cfg.enabled?.[k] !== "boolean")
        fail(400, "Неверные переключатели");
    for (const [k, min, max] of [
      ["xpPerScore", 0, 2],
      ["completionXP", 0, 1000],
      ["pity", 1, 200],
      ["rareEvent", 0, 1],
      ["levelXP", 1, 10000],
    ])
      if (!Number.isFinite(cfg[k]) || cfg[k] < min || cfg[k] > max)
        fail(400, "Неверное значение " + k);
    for (const k of Object.keys(defaultConfig.lootWeights))
      if (
        !Number.isInteger(cfg.lootWeights?.[k]) ||
        cfg.lootWeights[k] < 0 ||
        cfg.lootWeights[k] > 10000
      )
        fail(400, "Неверные веса");
    if (Object.values(cfg.lootWeights).reduce((a, b) => a + b, 0) <= 0)
      fail(400, "Пустая таблица");
    for (const k of Object.keys(defaultConfig.compensation))
      if (
        !Number.isInteger(cfg.compensation?.[k]) ||
        cfg.compensation[k] < 0 ||
        cfg.compensation[k] > 10000
      )
        fail(400, "Неверная компенсация");
    return transaction(async (c) => {
      await c.query(
        "INSERT INTO settings(key,value) VALUES('config',$1) ON CONFLICT(key) DO UPDATE SET value=$1",
        [cfg],
      );
      await c.query(
        "INSERT INTO admin_audit(user_id,action,payload) VALUES($1,$2,$3)",
        [user.id, "config", cfg],
      );
      return { ok: true };
    });
  }
  if (method === "POST" && path === "/api/admin/moderate") {
    if (!["ban", "xp", "exclude"].includes(b.action))
      fail(400, "Неверное действие");
    return transaction(async (c) => {
      if (b.action === "exclude") {
        if (!uuid(b.id)) fail(400, "Неверный ID");
        await c.query("UPDATE game_sessions SET excluded=$2 WHERE id=$1", [
          b.id,
          b.value === true,
        ]);
      } else {
        if (!/^\d+$/.test(String(b.id))) fail(400, "Неверный ID");
        if (b.action === "xp") {
          if (!Number.isInteger(b.value) || b.value < 0 || b.value > 10000000)
            fail(400, "Неверный XP");
          await c.query("UPDATE users SET xp=$2 WHERE id=$1", [b.id, b.value]);
        } else
          await c.query("UPDATE users SET banned=$2 WHERE id=$1", [
            b.id,
            b.value === true,
          ]);
      }
      await c.query(
        "INSERT INTO admin_audit(user_id,action,payload) VALUES($1,$2,$3)",
        [user.id, b.action, b],
      );
      return { ok: true };
    });
  }
  fail(404, "Маршрут не найден");
}

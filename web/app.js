import { preview } from "./render.js";
import { sound } from "./audio.js";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
let token = sessionStorage.getItem("arcade-token"),
  data,
  view = "games",
  gameRuntime;
const settings = Object.assign(
  {
    crt: true,
    lighting: true,
    particles: true,
    shake: true,
    quality: "HIGH",
    music: false,
    sfx: true,
    volume: 0.3,
  },
  JSON.parse(localStorage.getItem("arcade-settings") || "{}"),
);
const names = {
  games: "АРКАДА",
  leaderboard: "РЕЙТИНГ",
  challenges: "ИСПЫТАНИЯ",
  cases: "КЕЙСЫ",
  collection: "СКИНЫ",
  profile: "ПРОФИЛЬ",
  settings: "НАСТРОЙКИ",
  admin: "ADMIN",
};
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").style.display = "none"), 4200);
}
async function api(path, body) {
  const r = await fetch("/api" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json();
  if (!r.ok) {
    if (r.status === 401) {
      sessionStorage.removeItem("arcade-token");
      token = null;
    }
    throw Error(d.error || "Ошибка сервера");
  }
  return d;
}
function bind(action, fn) {
  document.querySelectorAll(action).forEach(
    (el) =>
      (el.onclick = async () => {
        el.disabled = true;
        try {
          await fn(el);
        } catch (e) {
          toast(e.message);
        } finally {
          el.disabled = false;
        }
      }),
  );
}
function modal(html) {
  const d = $("#modal");
  d.innerHTML = html;
  d.showModal();
  return d;
}
function equippedSkin(game) {
  return (
    data.skins.find(
      (s) => s.id === (data.user.equipped[game] || game + "-base"),
    ) || { id: game + "-base", game, color: "#bdff70", theme: "base" }
  );
}
async function refresh() {
  data = await api("/me");
}
function shell() {
  const u = data.user;
  $("#app").innerHTML =
    `<div class="layout arcade-shell"><aside class="sidebar console-rail"><div class="brand"><span class="brand-mark">R</span><span>RETRO<br>ARCADE<span style="color:var(--green)">.</span></span></div><nav>${Object.entries(
      names,
    )
      .filter(([k]) => k !== "admin" || u.admin)
      .map(
        ([k, n], i) =>
          `<button data-nav="${k}" class="${view === k ? "active" : ""}"><b>${["▦", "♜", "◎", "◈", "▣", "☺", "⚙", "⌘"][i]}</b>${n}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-foot"><span class="online-dot"></span>SYSTEM ONLINE<br>НАЙДИ СВОЮ ЧАСТОТУ<br><br>RETRO ARCADE / V.01</div></aside><main class="main console-main"><header class="topbar console-topbar"><span class="breadcrumbs">ARCADE / ${names[view] || "GAMES"}</span><div class="user-pill"><span class="wallet-coin">● ${u.coins || 0}</span><span style="color:var(--green)">◈ ${u.shards}</span><div class="avatar">${esc(u.name.slice(0, 2).toUpperCase())}</div><div>${esc(u.name)} <span class="muted">LVL ${u.level}</span><div class="xp-line"><i style="width:${Math.min(100, (u.xp % 250) / 2.5)}%"></i></div></div></div></header><div class="console-screen-shell"><div class="screen-leds"><i></i><span>RETROGAME OS / ONLINE</span></div><div id="page"></div></div></main></div>`;
  bind("[data-nav]", (el) => navigate(el.dataset.nav));
}
async function navigate(next = "games") {
  view = next;
  shell();
  try {
    if (next === "games") hub();
    if (next === "cases") cases();
    if (next === "collection") collection();
    if (next === "profile") profile();
    if (next === "settings") preferences();
    if (next === "leaderboard") await leaderboard();
    if (next === "challenges") await challengePage();
    if (next === "admin") await admin();
  } catch (e) {
    $("#page").innerHTML =
      `<div class="notice">${esc(e.message)}</div><button id="retry">Повторить</button>`;
    $("#retry").onclick = () => navigate(next);
  }
}
function hub() {
  $("#page").innerHTML =
    `${data.active ? `<div class="notice row"><span>СОХРАНЁННЫЙ ЗАБЕГ · ${esc(data.active.game).toUpperCase()}</span><button id="resume" class="small">ПРОДОЛЖИТЬ</button><button id="abandon" class="small">ЗАВЕРШИТЬ</button></div>` : ""}<section class="console-home"><div class="console-home-head"><div><div class="eyebrow">SELECT GAME / PLAYER 01</div><h1>Выбери игру</h1></div><div class="home-wallet"><b>● ${data.user.coins||0}</b><span>МОНЕТЫ</span></div></div><div class="game-selector">${data.games.map((g,i)=>`<button class="game-tile" data-play="${g.id}" ${g.enabled?"":"disabled"} style="--accent:${g.color}"><canvas data-preview="${g.id}"></canvas><span class="game-number">0${i+1}</span><div><small>${g.tag}</small><strong>${g.name}</strong><em>${g.id==="platformer"?"LEVEL "+Math.min(9,data.user.progress)+"/9":"BEST "+(data.user.stats["best-"+g.id]||0)}</em></div><i>▶</i></button>`).join("")}</div><div class="console-actions"><button class="console-action daily-action" data-play="maze" data-daily="true"><b>DAILY</b><span>НОВЫЙ ЛАБИРИНТ</span><i>↗</i></button><button class="console-action" id="home-cases"><b>КЕЙСЫ</b><span>${boxes()} В ИНВЕНТАРЕ</span><i>▣</i></button><button class="console-action" id="home-skins"><b>СКИНЫ</b><span>${data.owned.length} ОТКРЫТО</span><i>◆</i></button></div></section>`;
  document.querySelectorAll("[data-preview]").forEach(c=>preview(c,c.dataset.preview));
  bind("[data-play]",el=>{const g=el.dataset.play;if(["racer","tanks"].includes(g)){multiplayerChoice(g);return;}return start(g,1,el.dataset.daily==="true")});
  $("#home-cases").onclick=()=>navigate("cases");
  $("#home-skins").onclick=()=>navigate("collection");
  if(data.active){
    $("#resume").onclick=()=>launch(data.active);
    bind("#abandon",async()=>{const r=await api("/session/sync",{id:data.active.id,version:data.active.version,inputs:[],finish:true});if(r.conflict)throw Error("Забег изменился. Обнови страницу");await refresh();hub()});
  }
}
const boxes = () =>
  data.inventory.find((x) => x.item === "arcade")?.quantity || 0;
async function start(game, level = 1, daily = false) {
  if (data.active) {
    toast("Сначала продолжи или заверши сохранённый забег");
    return;
  }
  if (game === "platformer" && level === 1) {
    levelSelect();
    return;
  }
  await launch(await api("/session/start", { game, level, daily }));
}
function multiplayerChoice(game){
  const d=modal(`<div class="eyebrow">MULTIPLAYER / ${game.toUpperCase()}</div><h2>${game==="racer"?"Turbo Formula":"Steel Arena"}</h2><div class="stack"><button id="solo" class="primary">SOLO / БОТЫ</button><button id="create-online">ONLINE · СОЗДАТЬ</button><button id="create-mixed">ONLINE + BOTS</button><label>КОД КОМНАТЫ<input id="room-code" maxlength="6" placeholder="A1B2C3" autocomplete="off"></label><button id="join-room">ВОЙТИ ПО КОДУ</button></div><div class="actions"><button id="mp-close">Назад</button></div>`);
  $("#mp-close").onclick=()=>d.close(); $("#solo").onclick=()=>{d.close();start(game)};
  $("#create-online").onclick=()=>createRoom(game,"online",d); $("#create-mixed").onclick=()=>createRoom(game,"mixed",d);
  $("#join-room").onclick=async()=>{const r=await api("/multiplayer/join",{code:$("#room-code").value});showRoom(r.room||r,false,d)};
}
async function createRoom(game,mode,d){const r=await api("/multiplayer/create",{game,mode,maxPlayers:4});showRoom(r,true,d)}
async function showRoom(room,host,d){
  let timer; const render=async()=>{
    const x=await api("/multiplayer/room?id="+room.id), me=x.players.find(p=>String(p.user_id)===String(data.user.id));
    d.innerHTML=`<div class="eyebrow">ONLINE LOBBY · ${x.room.game.toUpperCase()}</div><h2>КОМНАТА <span class="mono">${x.room.code}</span></h2><p class="muted">${x.room.mode==="mixed"?"ONLINE + BOTS":"ONLINE"} · ${x.players.length}/${x.room.max_players} ИГРОКОВ${x.botSlots?" · "+x.botSlots+" БОТОВ":""}</p><div class="stack">${x.players.map(p=>`<div class="panel row"><b>#${Number(p.slot)+1} ${esc(p.name)}</b><span>${p.ready||String(p.user_id)===String(x.room.host_id)?"READY":"WAITING"}</span></div>`).join("")}</div><div class="actions">${String(x.room.host_id)===String(data.user.id)?'<button id="room-start" class="primary">START</button>':`<button id="room-ready" class="primary">${me?.ready?"NOT READY":"READY"}</button>`}<button id="room-close">В меню</button></div>`;
    $("#room-close").onclick=()=>{clearInterval(timer);d.close()};
    if($("#room-ready"))$("#room-ready").onclick=async()=>{await api("/multiplayer/ready",{id:x.room.id,ready:!me?.ready});await render()};
    if($("#room-start"))$("#room-start").onclick=async()=>{await api("/multiplayer/start",{id:x.room.id});await render()};
    if(x.room.status==="playing"){clearInterval(timer);d.close();const session=await api("/session/start",{game:x.room.game,level:1,daily:false});await launch(session,{roomId:x.room.id,slot:Number(me?.slot||0),players:x.players})}
  }; await render(); timer=setInterval(()=>render().catch(()=>{}),1500);
}
function levelSelect() {
  const d = modal(
    `<div class="eyebrow">AFTERLIGHT / CAMPAIGN</div><h2>За краем экрана</h2><p class="muted">Три мира. Девять уровней. Один последний передатчик.</p><div class="level-grid">${data.levels.map((l) => `<button data-level="${l.id}" ${l.id > data.user.progress ? "disabled" : ""}>${l.id > data.user.progress ? "🔒" : "▶"} ${l.id}. ${esc(l.name)}<small>МИР ${l.world + 1}${l.final ? " · ФИНАЛ" : l.boss ? " · МИНИ-БОСС" : ""}</small></button>`).join("")}</div><div class="actions"><button id="close-levels">Назад</button></div>`,
  );
  $("#close-levels").onclick = () => d.close();
  bind("[data-level]", async (el) => {
    d.close();
    await launch(
      await api("/session/start", {
        game: "platformer",
        level: Number(el.dataset.level),
      }),
    );
  });
}
async function launch(session, multiplayer = null) {
  const { play } = await import("./play.js");
  gameRuntime?.destroy();
  gameRuntime = play(
    session,
    api,
    settings,
    equippedSkin(session.state.game),
    async () => {
      await refresh();
      navigate();
    },
    async (result) => {
      await refresh();
      await navigate();
      const finale =
        result.won && result.game === "platformer" && result.level === 9;
      const d = modal(
        `<div class="eyebrow">${finale ? "END OF TRANSMISSION" : result.won ? "LEVEL COMPLETE" : "RUN COMPLETE"}</div><h2>${finale ? "Сигнал снова звучит." : result.won ? "Ты нашёл выход." : "Ещё одна попытка?"}</h2>${finale ? '<p class="muted">Старый передатчик ожил. За пустыми экранами снова зажглись огни. Но в помехах остались голоса, которых ты ещё не слышал…</p>' : ""}<div class="stats"><div class="stat"><strong>${result.score}</strong><span>ОЧКИ</span></div><div class="stat"><strong>+${result.xp}</strong><span>XP</span></div></div><p class="muted">${result.newRecord ? "✧ НОВЫЙ РЕКОРД · " : ""}Секреты: ${result.secrets} · Картриджи: ${result.boxes}</p>${result.achievements.map((a) => `<p>✧ ${esc(a)}</p>`).join("")}<div class="actions"><button id="again" class="primary">${result.won && result.game === "platformer" && result.level < 9 ? "Следующий уровень" : "Ещё раз"}</button><button id="result-close">В меню</button></div>`,
      );
      $("#result-close").onclick = () => d.close();
      bind("#again", async () => {
        d.close();
        await launch(
          await api("/session/start", {
            game: result.game,
            level:
              result.won && result.level < 9 ? result.level + 1 : result.level,
          }),
        );
      });
    },
    toast,
    multiplayer,
  );
}
function cases() {
  const count=boxes(), price=100;
  $("#page").innerHTML=`<div class="eyebrow">ARCADE VAULT</div><div class="section-heading"><h2>Кейсы</h2><span class="wallet-coin">● ${data.user.coins || 0} МОНЕТ</span></div><div class="case-shop"><article class="case-card"><div class="case-visual"><i></i><b>?</b><span>RETRO<br>CASE</span></div><div class="case-info"><small>БАЗОВЫЙ КЕЙС</small><h3>UNKNOWN SIGNAL</h3><p>Случайный скин. Чем выше редкость — тем реже сигнал.</p><div class="case-price">● ${price}</div><button id="buy-case" class="primary" ${(data.user.coins||0)<price?"disabled":""}>КУПИТЬ КЕЙС</button></div></article></div><div class="panel row case-owned"><div><div class="eyebrow">ИНВЕНТАРЬ</div><h3>Кейсов: ${count}</h3></div><button id="open-case" ${count?"":"disabled"}>ОТКРЫТЬ</button></div>`;
  bind("#buy-case", async()=>{await api("/loot/buy",{});await refresh();cases()});
  bind("#open-case", openBox);
}
function collection(filter = "ALL") {
  $("#page").innerHTML =
    `<div class="eyebrow">SKIN LOCKER</div><div class="section-heading"><h2>Скины</h2><span>${data.owned.length} / ??? DISCOVERED</span></div><div class="filters">${["ALL", "OWNED", "LOCKED", "COMMON", "RARE", "EPIC", "LEGENDARY", "SECRET"].map((f) => `<button class="small ${filter === f ? "active" : ""}" data-filter="${f}">${f}</button>`).join("")}</div><div class="collection">${data.skins
      .filter(
        (s) =>
          filter === "ALL" ||
          (filter === "OWNED" && data.owned.includes(s.id)) ||
          (filter === "LOCKED" && !data.owned.includes(s.id)) ||
          s.rarity === filter,
      )
      .map((s) => {
        const owned = data.owned.includes(s.id),
          equipped = (data.user.equipped[s.game] || s.game + "-base") === s.id;
        return `<article class="skin"><div class="skin-preview theme-preview" style="--skin:${s.color || "#52596b"};--skin-bg:${s.background || "#151923"};--skin-enemy:${s.enemy || "#f28dad"};--skin-terrain:${s.terrain || "#47445e"}">${s.hidden ? '<b class="skin-unknown">?</b>' : '<i class="preview-moon"></i><i class="preview-ground"></i><i class="preview-enemy">◆</i><i class="preview-player">●</i>'}</div><small style="color:${s.color || "#989cae"}">${s.rarity} / ${s.game.toUpperCase()}</small><strong>${esc(s.name || "UNKNOWN")}</strong><span class="muted" style="font-size:10px">ПЕРСОНАЖ · МИР · ВРАГИ</span><button class="small" data-skin="${s.id}" data-owned="${owned}" ${equipped || (!owned && !s.cost) ? "disabled" : ""}>${equipped ? "НАДЕТО" : owned ? "НАДЕТЬ" : s.cost ? "◈ " + s.cost : "НАЙДИ В ИГРЕ"}</button></article>`;
      })
      .join(
        "",
      )}</div><h3 style="margin-top:30px">Последние открытия</h3>${data.lootHistory.map((x) => `<p class="muted">${esc(x.result.skin.name)} · ${x.result.duplicate ? "Повтор → " + x.result.shards + " осколков" : "Новый скин"}</p>`).join("") || '<p class="muted">История появится после первого открытия.</p>'}`;
  bind("[data-filter]", (el) => collection(el.dataset.filter));
  bind("[data-skin]", async (el) => {
    await api(el.dataset.owned === "true" ? "/skin/equip" : "/skin/buy", {
      skin: el.dataset.skin,
    });
    await refresh();
    collection(filter);
  });
}
async function openBox() {
  let id = localStorage.getItem("pending-loot");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pending-loot", id);
  }
  const result = await api("/loot/open", { id });
  localStorage.removeItem("pending-loot");
  const d = modal(
    '<div class="loot-reveal"><div class="cartridge">▣</div><h2>READING CARTRIDGE…</h2></div><button id="skip-loot">Пропустить</button>',
  );
  let shown = false;
  const reveal = async () => {
    if (shown) return;
    shown = true;
    sound("loot", settings);
    d.innerHTML = `<div class="loot-reveal"><div class="eyebrow">${result.duplicate ? "DUPLICATE" : "NEW SIGNAL DISCOVERED"}</div><div style="font:80px monospace;color:${result.skin.color}">▟▙</div><h2>${esc(result.skin.name)}</h2><p class="muted">${result.skin.rarity} · ${result.skin.game}</p>${result.duplicate ? `<p>+${result.shards} PIXEL SHARDS</p>` : ""}</div><button id="loot-close" class="primary">Забрать</button>`;
    $("#loot-close").onclick = async () => {
      d.close();
      await refresh();
      navigate("collection");
    };
  };
  $("#skip-loot").onclick = reveal;
  setTimeout(reveal, 1000);
}
async function leaderboard(game = "snake", period = "all") {
  const rows = await api("/leaderboard?game=" + game + "&period=" + period);
  $("#page").innerHTML =
    `<div class="eyebrow">HIGH SCORES</div><h2>Таблица рекордов</h2><div class="filters">${["global", "snake", "maze", "daily", "platformer", "speedrun"].map((g) => `<button class="small ${g === game ? "active" : ""}" data-board="${g}">${g.toUpperCase()}</button>`).join("")}</div><div class="filters">${["today", "week", "all"].map((p) => `<button class="small ${p === period ? "active" : ""}" data-period="${p}">${{ today: "Сегодня", week: "Неделя", all: "Всё время" }[p]}</button>`).join("")}</div>${game === "global" ? '<p class="muted">Общий рейтинг по накопленному XP за всё время.</p>' : ""}${game === "speedrun" ? '<p class="muted">Время прохождения финального уровня.</p>' : ""}<div class="panel"><table><thead><tr><th>МЕСТО</th><th>ИГРОК</th><th>${game === "speedrun" ? "ВРЕМЯ" : "ОЧКИ"}</th></tr></thead><tbody>${rows.map((r) => `<tr class="${String(r.id) === String(data.user.id) ? "you" : ""}"><td>#${r.position}</td><td>${esc(r.name)} ${String(r.id) === String(data.user.id) ? "← ТЫ" : ""}</td><td class="mono">${game === "speedrun" ? (r.score / 30).toFixed(2) + " сек." : r.score}</td></tr>`).join("")}</tbody></table>${!rows.length ? '<div class="empty">Здесь пока тихо. Оставь первый рекорд.</div>' : ""}</div>`;
  bind("[data-board]", (el) => leaderboard(el.dataset.board, period));
  bind("[data-period]", (el) => leaderboard(game, el.dataset.period));
}
async function challengePage() {
  const list = await api("/challenges");
  $("#page").innerHTML =
    `<div class="eyebrow">ЕЩЁ ОДИН ПОВОД ВЕРНУТЬСЯ</div><h2>Испытания</h2><div class="stack">${list.map((ch) => `<article class="panel row"><div><div class="eyebrow">${ch.period === "day" ? "DAILY" : "WEEKLY"}</div><h3 style="margin:12px 0">${ch.name}</h3><span class="muted">${Math.min(ch.value || 0, ch.target)} / ${ch.target} · ${ch.xp} XP · ◈ ${ch.shards}${ch.box ? " · ▣ Картридж" : ""}</span></div><button data-claim="${ch.id}" ${ch.claimed || (ch.value || 0) < ch.target ? "disabled" : ""}>${ch.claimed ? "ПОЛУЧЕНО" : "ЗАБРАТЬ"}</button></article>`).join("")}</div>`;
  bind("[data-claim]", async (el) => {
    await api("/challenges/claim", { id: el.dataset.claim });
    await refresh();
    navigate("challenges");
  });
}
function profile() {
  $("#page").innerHTML =
    `<div class="eyebrow">PLAYER ONE</div><h2>${esc(data.user.name)}</h2><div class="stats">${[
      [data.user.level, "УРОВЕНЬ"],
      [data.user.xp, "XP"],
      [data.user.stats.runs || 0, "ЗАБЕГОВ"],
      [data.user.streak, "ДНЕЙ ПОДРЯД"],
    ]
      .map(
        ([v, l]) =>
          `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`,
      )
      .join(
        "",
      )}</div><button id="profile-settings">⚙ Настройки звука и графики</button><h3 style="margin-top:30px">Достижения</h3><div class="stack">${data.achievements.map((a) => `<div class="panel row"><span>${data.awards.includes(a.id) ? "✧" : "◇"} ${esc(a.name || "???")}</span><span class="muted">${esc(a.description || "Сигнал ещё не расшифрован")}</span></div>`).join("")}</div>`;
  $("#profile-settings").onclick = () => navigate("settings");
}
function preferences() {
  $("#page").innerHTML =
    `<div class="eyebrow">SYSTEM SETTINGS</div><h2>Настрой свой автомат</h2><div class="panel settings-grid"><label>Качество<select id="quality">${["LOW", "MEDIUM", "HIGH"].map((x) => `<option ${x === settings.quality ? "selected" : ""}>${x}</option>`).join("")}</select></label>${[
      ["crt", "CRT / scanlines"],
      ["lighting", "Освещение"],
      ["music", "Музыка"],
      ["sfx", "Звуковые эффекты"],
    ]
      .map(
        ([k, l]) =>
          `<label>${l}<input type="checkbox" data-setting="${k}" ${settings[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<label>Громкость<input type="range" id="volume" min="0" max="1" step="0.05" value="${settings.volume}"></label></div>`;
  const save = () =>
    localStorage.setItem("arcade-settings", JSON.stringify(settings));
  document.querySelectorAll("[data-setting]").forEach(
    (el) =>
      (el.onchange = () => {
        settings[el.dataset.setting] = el.checked;
        save();
      }),
  );
  $("#quality").onchange = (e) => {
    settings.quality = e.target.value;
    settings.lighting = settings.quality !== "LOW";
    save();
    preferences();
  };
  $("#volume").onchange = (e) => {
    settings.volume = Number(e.target.value);
    save();
  };
}
async function admin() {
  const a = await api("/admin");
  $("#page").innerHTML =
    `<div class="eyebrow">CONTROL ROOM</div><h2>Управление аркадой</h2><div class="stats">${[
      [a.totals.total, "ИГРОКОВ"],
      [a.totals.dau, "DAU"],
      [a.totals.wau, "WAU"],
      [a.totals.shards || 0, "ОСКОЛКОВ"],
    ]
      .map(
        ([v, l]) =>
          `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`,
      )
      .join(
        "",
      )}</div><div class="panel"><h3>Игры и длительность</h3>${a.sessions.map((s) => `<p>${esc(s.game)} · ${s.sessions} сессий · ${Math.round(s.seconds || 0)} сек. в среднем</p>`).join("")}<h3>Открытия</h3>${a.loot.map((l) => `<p>${esc(l.rarity)}: ${l.drops} · повторы ${l.duplicates}</p>`).join("")}</div><h3 style="margin-top:25px">Конфигурация</h3><p class="muted">Игры, XP, редкие комнаты, pity, компенсация дубликатов и веса выпадения.</p><textarea id="config-json">${esc(JSON.stringify(a.config, null, 2))}</textarea><button id="save-config" class="primary">Сохранить конфигурацию</button><h3 style="margin-top:25px">Контент: скины, достижения, испытания</h3><p class="muted">Редактируй каталог JSON: новые скины участвуют в выпадениях; новые испытания используют выбранную игровую метрику. Встроенные ID сохраняются.</p><textarea id="catalog-json">${esc(JSON.stringify(a.catalog, null, 2))}</textarea><button id="save-catalog">Сохранить каталог</button><h3 style="margin-top:25px">Игроки</h3><div style="overflow:auto"><table><tr><th>Игрок</th><th>XP</th><th>Уровень кампании</th><th>Действия</th></tr>${a.users.map((u) => `<tr><td>${esc(u.name)}<br><small>${u.id}</small></td><td>${u.xp}</td><td>${u.progress}</td><td><button class="small" data-ban="${u.id}" data-value="${!u.banned}">${u.banned ? "Разблокировать" : "Блокировать"}</button> <button class="small" data-xp="${u.id}">XP</button></td></tr>`).join("")}</table></div><h3 style="margin-top:25px">Последние результаты</h3><div class="stack">${a.recent.map((s) => `<div class="panel row"><span>${s.user_id} · ${s.game} · ${s.result?.score || 0}${s.suspicious ? " · " + esc(s.suspicious) : ""}</span><button class="small" data-exclude="${s.id}" data-value="${!s.excluded}">${s.excluded ? "Вернуть в рейтинг" : "Исключить"}</button></div>`).join("")}</div>`;
  bind("#save-catalog", async () => {
    await api("/admin/catalog", {
      catalog: JSON.parse($("#catalog-json").value),
    });
    toast("Каталог сохранён");
  });
  bind("#save-config", async () => {
    await api("/admin/config", { config: JSON.parse($("#config-json").value) });
    toast("Конфигурация сохранена");
  });
  bind("[data-ban]", async (el) => {
    await api("/admin/moderate", {
      action: "ban",
      id: el.dataset.ban,
      value: el.dataset.value === "true",
    });
    admin();
  });
  bind("[data-exclude]", async (el) => {
    await api("/admin/moderate", {
      action: "exclude",
      id: el.dataset.exclude,
      value: el.dataset.value === "true",
    });
    admin();
  });
  bind("[data-xp]", async (el) => {
    const value = prompt("Новый XP");
    if (value !== null) {
      await api("/admin/moderate", {
        action: "xp",
        id: el.dataset.xp,
        value: Number(value),
      });
      admin();
    }
  });
}
async function mobileConsoleIntro(){
  const mobile=matchMedia("(pointer: coarse)").matches || innerWidth<820;
  if(!mobile || sessionStorage.getItem("console-intro")) return;
  sessionStorage.setItem("console-intro","1");
  $("#app").innerHTML=`<div class="console-intro"><div class="console-device"><div class="console-speaker"></div><div class="console-screen"><div class="console-glow"></div><div class="console-logo">RETRO<br><span>ARCADE</span></div><div class="console-status">SYSTEM READY</div><div class="console-progress"><i></i></div></div><div class="console-controls"><span class="console-cross">✚</span><span class="console-buttons">● ●</span></div></div><div class="console-caption">INSERT YOURSELF</div></div>`;
  await new Promise(r=>setTimeout(r,1850));
}
async function boot() {
  try {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    tg?.disableVerticalSwipes?.();
    if (!token) {
      const boot = await api("/boot");
      if (tg?.initData) {
        ({ token } = await api("/auth", { initData: tg.initData }));
      } else if (boot.dev) {
        ({ token } = await api("/auth", { dev: true }));
      } else throw Error("Открой игру через кнопку PLAY в Telegram-боте.");
      sessionStorage.setItem("arcade-token", token);
    }
    await refresh();
    await mobileConsoleIntro();
    await navigate();
    if (localStorage.getItem("pending-loot")) {
      toast("Восстанавливаю результат открытия");
      await openBox();
    }
  } catch (e) {
    $("#app").innerHTML =
      `<div class="boot"><div class="pixel-logo">R◈A</div><p>${esc(e.message)}</p><button id="boot-retry">Повторить подключение</button></div>`;
    $("#boot-retry").onclick = boot;
  }
}
boot();

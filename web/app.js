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
  inventory: "ИНВЕНТАРЬ",
  achievements: "ДОСТИЖЕНИЯ",
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
function playerBar() {
  const u = data.user;
  return `<header class="reference-playerbar"><button id="profile-card" class="reference-player"><span class="reference-avatar">${esc(u.name.slice(0,2))}</span><span><b>${esc(u.name)}</b><small>★ LV. ${u.level}</small><progress max="${u.xpNext-u.xpFloor}" value="${u.xp-u.xpFloor}" aria-label="Опыт"></progress></span></button><div class="reference-wallet"><button id="coin-shop" aria-label="Магазин сундуков"><span class="pixel-coin"></span><b>${Number(u.coins||0).toLocaleString('ru-RU')}</b><span class="wallet-plus">+</span></button><button id="home-settings" aria-label="Настройки">⚙</button></div></header>`;
}
function roomNav(selected = view) {
  if (selected === 'inventory') selected = 'collection';
  if (selected === 'achievements') selected = 'profile';
  return `<nav class="reference-nav" aria-label="Навигация меню">${[['games','HOME','home'],['leaderboard','SCORES','leaderboard'],['collection','SKINS','collection'],['challenges','MISSIONS','missions'],['cases','CASES','cases'],['profile','PROFILE','profile']].map(([dest,label,icon])=>`<button data-dest="${dest}" class="${dest===selected?'active':''}"><i class="nav-sprite" aria-hidden="true"><img src="/assets/retro-ui/nav/${icon}.webp" alt=""></i><span>${label}</span></button>`).join('')}</nav>`;
}
function shell() {
  const home = view === "games";
  $("#app").innerHTML = `<div class="layout arcade-shell reference-home"><main class="main console-main"><div class="console-screen-shell">${home ? '<div id="page"></div>' : `<section class="reference-room reference-subpage">${playerBar()}<div class="reference-subhead"><button data-dest="games" aria-label="На главную">‹ HOME</button><span>PLAY › COLLECT › COMPETE</span></div><div id="page" class="reference-page-content"></div>${roomNav()}${data.user.admin?'<button class="reference-admin" data-dest="admin">ADMIN</button>':''}</section>`}</div></main></div>`;
  if (!home) {
    bind('[data-dest]', el => navigate(el.dataset.dest));
    $('#profile-card').onclick = () => navigate('profile');
    $('#home-settings').onclick = () => navigate('settings');
    $('#coin-shop').onclick = () => navigate('cases');
  }
}
async function navigate(next = "games") {
  view = next;
  shell();
  try {
    if (next === "games") hub();
    if (next === "cases") cases();
    if (next === "collection") collection();
    if (next === "inventory") inventoryPage();
    if (next === "achievements") achievementsPage();
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
  const order=["snake","platformer","racer","tanks","maze"], labels={snake:"SNAKE",platformer:"PLATFORMER",racer:"RACING",tanks:"TANKS",maze:"MAZE"};
  const cards=order.map(id=>data.games.find(g=>g.id===id)).filter(Boolean);
  $(".arcade-shell").classList.add("reference-home");
  $("#page").innerHTML=`<section class="reference-room">
    ${playerBar()}
    <div class="reference-logo"><img src="/assets/retro-ui/IMG_9417.png" alt="Retro Arcade — Play Collect Compete"></div>
    ${data.active?`<div class="notice row"><span>Сохранённый забег · ${esc(data.active.game)}</span><button id="resume">Продолжить</button><button id="abandon">Завершить</button></div>`:''}
    <div class="reference-content"><div class="reference-grid">${cards.map((g,i)=>`<button class="reference-card" data-play="${g.id}" style="--col:${i%3};--row:${Math.floor(i/3)};--edge:${g.color||'#879db8'}" ${g.enabled?'':'disabled'}><span class="reference-cover"></span><b>${labels[g.id]}</b><small>${g.id==='platformer'?'LV '+Math.min(data.levels.length,data.user.progress):'BEST '+(data.user.stats['best-'+g.id]||0)}</small></button>`).join('')}<button class="reference-card" id="more-games" style="--col:2;--row:1;--edge:#8993a2"><span class="reference-cover"></span><b>MORE GAMES</b></button></div>
    <aside class="reference-shortcuts"><button data-dest="inventory"><img class="shortcut-icon" src="/assets/retro-ui/nav/cases.webp" alt=""><span>INVENTORY</span></button><button data-dest="achievements"><img class="shortcut-icon" src="/assets/retro-ui/nav/leaderboard.webp" alt=""><span>ACHIEVEMENTS</span></button><button data-dest="cases"><img class="shortcut-icon" src="/assets/loot/arcade.webp" alt=""><span>SHOP</span></button><button data-dest="challenges"><img class="shortcut-icon" src="/assets/retro-ui/nav/missions.webp" alt=""><span>MISSIONS</span></button></aside></div>
    <button class="reference-loot" id="loot-banner"><span class="loot-sprite"><img src="/assets/loot/arcade.webp" alt="Аркадный сундук"></span><span><b>RANDOM LOOTBOX</b><small>Сундуки и новые скины</small></span><strong>›</strong></button>
    ${roomNav('games')}
    ${data.user.admin?'<button class="reference-admin" data-dest="admin">ADMIN</button>':''}
  </section>`;
  bind('[data-dest]',el=>navigate(el.dataset.dest));
  bind('[data-play]',el=>['racer','tanks'].includes(el.dataset.play)?multiplayerChoice(el.dataset.play):start(el.dataset.play));
  $('#more-games').onclick=()=>{const extras=data.games.filter(g=>!order.includes(g.id));const d=modal(`<div class="more-games-modal"><div class="eyebrow">EXTRA ARCADE</div><h2>Больше игр</h2><div class="extra-games">${extras.map(g=>`<button data-extra="${g.id}" ${g.enabled?'':'disabled'}><img src="/assets/retro-ui/extra/${g.id}.webp" alt=""><span><b>${esc(g.name)}</b><small>НАЧАТЬ ИГРУ ›</small></span></button>`).join('')}<button id="daily-maze"><img src="/assets/retro-ui/extra/daily.webp" alt=""><span><b>DAILY MAZE</b><small>НОВЫЙ ЛАБИРИНТ КАЖДЫЙ ДЕНЬ ›</small></span></button></div><button id="extra-close">‹ Вернуться в аркаду</button></div>`);$('#extra-close').onclick=()=>d.close();bind('[data-extra]',async el=>{d.close();await start(el.dataset.extra)});$('#daily-maze').onclick=()=>{d.close();start('maze',1,true)};};
  $('#profile-card').onclick=()=>navigate('profile');$('#home-settings').onclick=()=>navigate('settings');$('#coin-shop').onclick=$('#loot-banner').onclick=()=>navigate('cases');
  if(data.active){$('#resume').onclick=()=>launch(data.active);bind('#abandon',async()=>{const r=await api('/session/sync',{id:data.active.id,version:data.active.version,inputs:[],finish:true});if(r.conflict)throw Error('Забег изменился. Обнови страницу');await refresh();hub();});}
}

const boxes = (type = "arcade") =>
  data.inventory.find((x) => x.item === type)?.quantity || 0;
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
    if(x.room.status==="playing"){clearInterval(timer);d.close();const session=await api("/session/start",{game:x.room.game,level:1,daily:false});await launch(session,{roomId:x.room.id,slot:Number(me?.slot||0),userId:data.user.id,players:x.players})}
  }; await render(); timer=setInterval(()=>render().catch(()=>{}),1500);
}
function levelSelect() {
  const d = modal(
    `<div class="eyebrow">GREEN HILLS / ХРОНИКИ ВРЕМЕНИ</div><h2>Одна долина. Четыре эпохи.</h2><p class="muted">${data.levels.length} уровней. В Green Hills пропал медальон. Пройди через знакомые места в разные века и узнай, кто открыл разлом.</p><div class="level-grid">${data.levels.map((l) => `<button data-level="${l.id}" ${l.id > data.user.progress ? "disabled" : ""}>${l.id > data.user.progress ? "🔒" : "▶"} ${l.id}. ${l.id>data.user.progress?"???":l.id===2&&data.user.progress===2?"WORLD ???":esc(l.name)}<small>${l.id>data.user.progress?"НЕИЗВЕСТНО":["GREEN HILLS","ДРЕВНЕЕ ПРОШЛОЕ","ИНДУСТРИАЛЬНОЕ ВРЕМЯ","БУДУЩЕЕ"][l.world]}${l.id>data.user.progress?"":l.final ? " · ФИНАЛ" : l.boss ? " · МИНИ-БОСС" : ""}</small>${l.id < data.user.progress ? `<small>${esc(l.story)}</small>` : ""}</button>`).join("")}</div><div class="actions"><button id="close-levels">Назад</button></div>`,
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
  gameRuntime = await play(
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
        result.won && result.game === "platformer" && result.level === data.levels.length;
      const chapter = data.levels.find((l) => l.id === result.level);
      const d = modal(
        `<div class="eyebrow">${finale ? "CHRONICLE COMPLETE" : result.won ? "LEVEL COMPLETE" : "RUN COMPLETE"}</div><h2>${finale ? "Петля разорвана." : result.won ? "Путь продолжается." : "Ещё одна попытка?"}</h2>${result.won && chapter ? `<p class="muted">${esc(chapter.story)}</p>` : ""}${finale ? '<p class="muted">Путешественник забрал медальон в первый день по просьбе тебя самого из будущего. Он пытался не дать разлому снова поглотить Green Hills.</p>' : ""}<div class="stats"><div class="stat"><strong>${result.score}</strong><span>ОЧКИ</span></div><div class="stat"><strong>+${result.xp}</strong><span>XP</span></div></div><p class="muted">${result.newRecord ? "✧ НОВЫЙ РЕКОРД · " : ""}Секреты: ${result.secrets} · Картриджи: ${result.boxes}</p>${result.achievements.map((a) => `<p>✧ ${esc(a)}</p>`).join("")}<div class="actions"><button id="again" class="primary">${result.won && result.game === "platformer" && result.level < data.levels.length ? "Следующий уровень" : "Ещё раз"}</button><button id="result-close">В меню</button></div>`,
      );
      $("#result-close").onclick = () => d.close();
      bind("#again", async () => {
        d.close();
        await launch(
          await api("/session/start", {
            game: result.game,
            level:
              result.won && result.game === "platformer" && result.level < data.levels.length ? result.level + 1 : result.level,
          }),
        );
      });
    },
    toast,
    multiplayer,
  );
}
function cases() {
  $("#page").innerHTML=`<div class="eyebrow">ARCADE VAULT / SHOP</div><div class="section-heading"><h2>Сундуки</h2><span class="wallet-coin">● ${data.user.coins || 0} МОНЕТ</span></div><p class="vault-intro">Выбери редкость. В каждом сундуке один скин: редкий и выше, эпический и выше или гарантированно легендарный.</p><div class="case-shop">${data.lootBoxes.map(box=>`<article class="case-card tier-${box.id}"><div class="case-visual"><img src="/assets/loot/${box.id}.webp" alt="Сундук ${esc(box.name)}"></div><div class="case-info"><small>${box.rarity} / ${esc(box.name)}</small><h3>${esc(box.name)}</h3><p>${esc(box.description)}</p><div class="case-price">● ${box.price}</div><div class="case-actions"><button class="primary" data-buy-box="${box.id}" ${(data.user.coins||0)<box.price?"disabled":""}>КУПИТЬ</button><button data-open-box="${box.id}" ${boxes(box.id)?"":"disabled"}>ОТКРЫТЬ ${boxes(box.id)?`· ${boxes(box.id)}`:""}</button></div></div></article>`).join("")}</div><p class="vault-footnote">Монеты выдаются за забеги. Повторный скин превращается в осколки. Бесплатные сундуки из испытаний имеют случайную редкость.</p>`;
  bind("[data-buy-box]", async(el)=>{await api("/loot/buy",{type:el.dataset.buyBox});await refresh();cases();toast("Сундук добавлен в инвентарь")});
  bind("[data-open-box]", el=>openBox(el.dataset.openBox));
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
        const heroColor=["base","blue","green","yellow","black","white","purple"].indexOf(s.id.slice("platformer-".length));
        const heroPreview=s.game==="platformer" && heroColor>=0;
        return `<article class="skin"><div class="skin-preview theme-preview" style="--skin:${s.color || "#52596b"};--skin-bg:${s.background || "#151923"};--skin-enemy:${s.enemy || "#f28dad"};--skin-terrain:${s.terrain || "#47445e"}">${s.hidden ? '<b class="skin-unknown">?</b>' : `<i class="preview-moon"></i><i class="preview-ground"></i><i class="preview-enemy">◆</i>${heroPreview?`<span class="preview-hero" style="--hero-col:${heroColor}"></span>`:'<i class="preview-player">●</i>'}`}</div><small style="color:${s.color || "#989cae"}">${s.rarity} / ${s.game.toUpperCase()}</small><strong>${esc(s.name || "UNKNOWN")}</strong><span class="muted" style="font-size:10px">ПЕРСОНАЖ · МИР · ВРАГИ</span><button class="small" data-skin="${s.id}" data-owned="${owned}" ${equipped || (!owned && !s.cost) ? "disabled" : ""}>${equipped ? "НАДЕТО" : owned ? "НАДЕТЬ" : s.cost ? "◈ " + s.cost : "НАЙДИ В ИГРЕ"}</button></article>`;
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
function inventoryPage() {
  const owned = data.skins.filter(s => data.owned.includes(s.id));
  $("#page").innerHTML = `<div class="eyebrow">PLAYER STORAGE</div><h2>Инвентарь</h2><div class="inventory-actions"><button data-inventory-link="collection">Все скины ›</button><button data-inventory-link="cases">Магазин сундуков ›</button></div><h3>Мои сундуки</h3><div class="inventory-grid">${data.lootBoxes.map(box=>`<article class="panel inventory-box"><img src="/assets/loot/${box.id}.webp" alt=""><div><strong>${esc(box.name)}</strong><small>${esc(box.rarity)} · ${boxes(box.id)} ШТ.</small></div><button data-open-box="${box.id}" ${boxes(box.id)?'':'disabled'}>Открыть</button></article>`).join('')}</div><h3>Полученные скины · ${owned.length}</h3><div class="inventory-skins">${owned.map(s=>`<span style="--item-color:${s.color||'#fff'}">${esc(s.name||s.id)} <small>${esc(s.game)}</small></span>`).join('')}</div>`;
  bind('[data-open-box]', el => openBox(el.dataset.openBox));
  bind('[data-inventory-link]', el => navigate(el.dataset.inventoryLink));
}
function achievementsPage() {
  const earned = data.achievements.filter(a => data.awards.includes(a.id)).length;
  $("#page").innerHTML = `<div class="eyebrow">TROPHY ROOM</div><h2>Достижения</h2><p class="muted">Открыто ${earned} из ${data.achievements.length}</p><div class="achievement-grid">${data.achievements.map(a=>`<article class="panel achievement-card ${data.awards.includes(a.id)?'unlocked':''}"><img src="/assets/retro-ui/nav/leaderboard.webp" alt=""><div><strong>${esc(a.name||'???')}</strong><small>${esc(a.description||'Сигнал ещё не расшифрован')}</small></div><span>${data.awards.includes(a.id)?'ОТКРЫТО':'ЗАКРЫТО'}</span></article>`).join('')}</div>`;
}
async function openBox(type = "arcade") {
  let pending;
  try { pending = JSON.parse(localStorage.getItem("pending-loot")); } catch { pending = localStorage.getItem("pending-loot"); }
  if (typeof pending === "string") pending = { id: pending, type: "arcade" };
  if (!pending?.id) {
    pending = { id: crypto.randomUUID(), type };
    localStorage.setItem("pending-loot", JSON.stringify(pending));
  }
  const result = await api("/loot/open", pending);
  localStorage.removeItem("pending-loot");
  const d = modal(
    `<div class="loot-reveal"><img class="reveal-chest" src="/assets/loot/${result.type || 'arcade'}.webp" alt=""><h2>Открываем сундук…</h2></div><button id="skip-loot">Пропустить</button>`,
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
async function challengePage(period = 'all') {
  const list = await api("/challenges");
  const shown = list.filter(ch => period === 'all' || ch.period === period);
  $("#page").innerHTML = `<div class="eyebrow">ARCADE QUEST BOARD</div><h2>Миссии</h2><p class="muted">Новые задания появляются каждый день и каждую неделю. Прогресс записывается после завершения забега.</p><div class="mission-summary"><span>ВЫПОЛНЕНО <b>${list.filter(ch=>ch.value>=ch.target).length}/${list.length}</b></span><span>ОСТАЛОСЬ <b>${list.filter(ch=>!ch.claimed).length}</b></span></div><div class="filters">${[['all','ВСЕ'],['day','СЕГОДНЯ'],['week','НЕДЕЛЯ']].map(([value,label])=>`<button class="small ${period===value?'active':''}" data-mission-filter="${value}">${label}</button>`).join('')}</div><div class="mission-grid">${shown.map(ch=>`<article class="panel mission-card ${ch.claimed?'claimed':''}"><div class="mission-icon">${ch.metric==='snake'?'◈':ch.metric==='secrets'?'✧':ch.metric==='platformer'?'▣':'✦'}</div><div class="mission-copy"><small>${ch.period==='day'?'ЕЖЕДНЕВНАЯ':'ЕЖЕНЕДЕЛЬНАЯ'} · ${ch.id.startsWith('generated-')?'НОВАЯ':'АРКАДА'}</small><h3>${esc(ch.name)}</h3><div class="mission-progress"><i style="width:${Math.min(100,Math.round((ch.value||0)/ch.target*100))}%"></i></div><span>${Math.min(ch.value||0,ch.target)} / ${ch.target} · ${ch.xp} XP · ◈ ${ch.shards}${ch.box?' · СУНДУК':''}</span></div><button data-claim="${ch.id}" ${ch.claimed||(ch.value||0)<ch.target?'disabled':''}>${ch.claimed?'ПОЛУЧЕНО':'ЗАБРАТЬ'}</button></article>`).join('')}</div>`;
  bind('[data-mission-filter]', el => challengePage(el.dataset.missionFilter));
  bind("[data-claim]", async (el) => {
    await api("/challenges/claim", { id: el.dataset.claim });
    await refresh();
    await challengePage(period);
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
      )}</div><div class="inventory-actions"><button id="profile-achievements">Достижения ›</button><button id="profile-settings">⚙ Настройки звука и графики</button></div>`;
  $("#profile-achievements").onclick = () => navigate("achievements");
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

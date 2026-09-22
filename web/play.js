import { tick } from "/shared/engine.js";
import { render, setupCanvas } from "./render.js";
import { sound, music, silence } from "./audio.js";
export function play(session, api, settings, skin, onExit, onResult, toast, multiplayer = null) {
  const color = skin?.color || "#bdff70";
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mobile = coarse || innerWidth < 820 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const app = document.querySelector("#app");
  app.innerHTML = `<main class="play-shell ${mobile ? "is-mobile" : "is-desktop"}"><div class="play-top"><button id="pause">Ⅱ Пауза</button><span id="hud"></span><button id="exit"><span class="menu-icon">▤</span> В меню</button></div><div class="play-stage ${settings.crt ? "crt" : ""}"><canvas id="game" aria-label="Игровое поле"></canvas></div><div class="controls"><div class="dpad" aria-label="Управление движением"><button class="dpad-up" data-key="1" aria-label="Вверх">▲</button><button class="dpad-left" data-key="8" aria-label="Влево">◀</button><span class="dpad-center" aria-hidden="true"></span><button class="dpad-right" data-key="2" aria-label="Вправо">▶</button><button class="dpad-down" data-key="4" aria-label="Вниз">▼</button></div><div class="action-buttons"><button class="action act" data-key="32" aria-label="Действие"><b class="action-symbol">${session.state.game==="racer"?"▲":"♣"}</b><span>${session.state.game==="racer"?"GAS":"ACT"}</span><small>${session.state.game==="racer"?"E":"E"}</small></button><button class="action jump" data-key="16" aria-label="Прыжок"><b class="action-symbol">${session.state.game==="racer"?"▼":"⌃"}</b><span>${session.state.game==="racer"?"BRAKE":"JUMP"}</span><small>SPACE</small></button></div></div><div class="play-hint control-strip"><span>▦ WASD / СТРЕЛКИ — движение</span><span>SPACE — ускорение</span><span>${session.state.game==="racer"?"▣ E — газ":"▣ E — действие"}</span><span>${session.state.game==="racer"?"SPACE — тормоз":"ESC — пауза"}</span></div><p class="play-hint" id="sync-status">Прогресс сохраняется автоматически</p></main>`;
  const gameSize = session.state.game === "maze" ? [744,552] : session.state.game === "mines" ? [648,648] : session.state.game === "merge2048" ? [640,640] : session.state.game === "snake" ? [720,560] : session.state.game === "racer" ? [768,544] : session.state.game === "tanks" ? [768,544] : [768,544];
  const stage = document.querySelector(".play-stage");
  stage.style.setProperty("--game-ratio", gameSize[0] + " / " + gameSize[1]);
  const c = setupCanvas(document.querySelector("#game"), gameSize[0], gameSize[1]),
    hud = document.querySelector("#hud");
  let state = structuredClone(session.state),
    version = session.version,
    inputs = [],
    pending = null,
    busy = false,
    paused = false,
    closed = false,
    last = performance.now(),
    acc = 0,
    lastSave = last,
    snakeVisual = null,
    snakeFrom = null,
    snakeTo = null,
    snakeMoveTick = null,
    keys = new Set(),
    touch = new Map(),
    swipe = 0,
    tapQueue = 0,
    mpSeq = 0,
    mpLastSend = 0,
    mpPoll = 0,
    remotePlayers = [],
    mpHitSeen = new Set(),
    mpFinishedSent = false;
  const keyMap = {
    ArrowUp: 1,
    KeyW: 1,
    ArrowRight: 2,
    KeyD: 2,
    ArrowDown: 4,
    KeyS: 4,
    ArrowLeft: 8,
    KeyA: 8,
    Space: 16,
    KeyE: 32,
    KeyX: 32,
  };
  function keydown(e) {
    if (keyMap[e.code]) {
      e.preventDefault();
      keys.add(keyMap[e.code]);
    }
    if (e.code === "Escape") toggle();
  }
  function keyup(e) {
    keys.delete(keyMap[e.code]);
  }
  function visibility() {
    if (document.hidden) {
      paused = true;
      keys.clear();
      touch.clear();
      document.querySelector("#pause").textContent = "▶ Продолжить";
      silence();
      save();
    }
  }
  function blur() {
    keys.clear();
    touch.clear();
  }
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  document.querySelectorAll("[data-key]").forEach((b) => {
    const release = (e) => {
      touch.delete(e.pointerId);
      b.classList.remove("pressed");
      try { b.releasePointerCapture(e.pointerId); } catch {}
    };
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      const value = Number(b.dataset.key);
      touch.set(e.pointerId, value);
      // Queue a short tap as well: a press/release between two 30 Hz ticks
      // must still reach the game (common on Telegram/iOS WebView).
      tapQueue |= value;
      b.classList.add("pressed");
    };
    b.onpointerup = b.onpointercancel = b.onlostpointercapture = release;
    b.oncontextmenu = (e) => e.preventDefault();
  });
  let start;
  const canvas = c.canvas;
  canvas.onpointerdown = (e) => {
    start = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointercancel = () => { start = null; };
  canvas.onpointerup = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x,
      dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > 12)
      swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 8) : dy > 0 ? 4 : 1;
    start = null;
  };
  function toggle() {
    paused = !paused;
    keys.clear();
    touch.clear();
    document.querySelector("#pause").textContent = paused
      ? "▶ Продолжить"
      : "Ⅱ Пауза";
    if (paused) {
      silence();
      save();
    } else music(settings);
  }
  document.querySelector("#pause").onclick = toggle;
  function destroy() {
    closed = true;
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    silence();
  }
  async function save(finish = false) {
    if (busy) return false;
    busy = true;
    try {
      if (!pending) {
        const chunk = inputs.splice(0, 1800);
        pending = {
          id: session.id,
          version,
          inputs: chunk,
          finish: finish && inputs.length === 0,
        };
      }
      const r = await api("/session/sync", pending);
      if (closed) return false;
      version = r.version;
      pending = null;
      if (r.conflict) {
        state = structuredClone(r.state);
        inputs = [];
        toast("Забег восстановлен с сервера");
      } else if (r.result) {
        destroy();
        await onResult(r.result);
        return true;
      }
      document.querySelector("#sync-status").textContent = "Сохранено ✓";
      return true;
    } catch (e) {
      document.querySelector("#sync-status").textContent =
        "Нет связи: нажми «Продолжить», чтобы повторить сохранение";
      paused = true;
      document.querySelector("#pause").textContent = "▶ Продолжить";
      toast(e.message);
      return false;
    } finally {
      busy = false;
    }
  }
  document.querySelector("#exit").onclick = async () => {
    paused = true;
    document.querySelector("#pause").textContent = "▶ Продолжить";
    if (busy) {
      toast("Подожди завершения сохранения");
      return;
    }
    if (await save()) {
      destroy();
      onExit();
    }
  };
  music(settings);
  function frame(now) {
    if (closed) return;
    const delta = Math.min(now - last, 150);
    last = now;
    if (!paused && !state.over) {
      acc += delta;
      while (acc >= 1000 / 30) {
        const input = [...keys, ...touch.values(), swipe, tapQueue].reduce(
          (a, b) => a | b,
          0,
        );
        tapQueue = 0;
        if (multiplayer && performance.now()-mpLastSend>65) { mpLastSend=performance.now(); const st=state.game==="racer"?{x:state.x,speed:state.speed,distance:state.distance,lap:state.lap}:{x:state.player.x,y:state.player.y,dir:state.player.dir,hp:state.player.hp,shots:state.shots.filter(q=>!q.enemy).slice(-12)}; api("/multiplayer/input",{id:multiplayer.roomId,seq:++mpSeq,input,state:st,score:state.score,finished:state.over}).catch(()=>{}); }
        const score = state.score,
          hp = state.hp;
        tick(state, input);
        inputs.push(input);
        if (state.game !== "snake") swipe = 0;
        if (state.score > score) sound("pickup", settings);
        if (state.hp < hp) sound("hit", settings);
        acc -= 1000 / 30;
        if (state.over) break;
        if (inputs.length >= 1500) {
          paused = true;
          toast("Сохраняю длинный забег");
          save().then((ok) => {
            if (ok) paused = false;
          });
          break;
        }
      }
    } else acc = 0;
    if (state.game === "snake") {
      const interval = Math.max(3, 9 - Math.floor(state.eaten / 6));
      if (!snakeTo) {
        snakeTo = state.body.map((p) => ({ x: p.x, y: p.y }));
        snakeFrom = snakeTo.map((p) => ({ ...p }));
        snakeMoveTick = state.moveTick;
      }
      if (state.moveTick !== snakeMoveTick) {
        const previous = snakeTo;
        snakeTo = state.body.map((p) => ({ x: p.x, y: p.y }));
        snakeFrom = snakeTo.map((p, i) => {
          if (i === 0) return previous[0] ? { ...previous[0] } : { ...p };
          return previous[Math.min(i, previous.length - 1)]
            ? { ...previous[Math.min(i, previous.length - 1)] }
            : { ...p };
        });
        snakeMoveTick = state.moveTick;
      }
      const elapsedTicks = state.tick - state.moveTick + acc / (1000 / 30);
      const t = Math.max(0, Math.min(1, elapsedTicks / interval));
      // Constant-speed interpolation: no easing at cell boundaries, so the
      // snake never appears to brake and accelerate every grid step.
      const smooth = t;
      snakeVisual = snakeTo.map((target, i) => {
        const from = snakeFrom[i] || target;
        return {
          x: from.x + (target.x - from.x) * smooth,
          y: from.y + (target.y - from.y) * smooth,
        };
      });
      state._visualBody = snakeVisual;
    }
    if(multiplayer && now-mpPoll>180){mpPoll=now;api("/multiplayer/room?id="+multiplayer.roomId).then(x=>{
      const me=x.players.find(p=>Number(p.slot)===Number(multiplayer.slot));remotePlayers=x.players.filter(p=>Number(p.slot)!==Number(multiplayer.slot));
      if(state.game==="tanks"&&me?.state?.hp!==undefined&&Number(me.state.hp)<state.player.hp)state.player.hp=Number(me.state.hp);
      if(state.game==="tanks"){for(const p of remotePlayers){for(const q of p.state?.shots||[]){const key=p.user_id+":"+p.seq+":"+Math.round(q.x*10)+":"+Math.round(q.y*10);if(!mpHitSeen.has(key)&&Math.hypot((q.x||0)-state.player.x,(q.y||0)-state.player.y)<.7){mpHitSeen.add(key);api("/multiplayer/hit",{id:multiplayer.roomId,target:String(multiplayer.userId)}).catch(()=>{})}}}}
      if(x.room.status==="finished"&&!mpFinishedSent){mpFinishedSent=true;toast("ONLINE · матч завершён");}
    }).catch(()=>{});}
    state._remotePlayers=remotePlayers;
    render(c, state, color, settings, skin);
    hud.textContent =
      String(state.score).padStart(5, "0") +
      (state.hp !== undefined ? " · ♥ " + state.hp : "") +
      (state.game === "maze" ? " · ⚿ " + state.keys + " · ● " + state.pelletsLeft + (state.exitOpen ? " · EXIT OPEN" : "") : "") +
      (state.game === "mines" ? " · ⚑ " + state.flags.length + "/12" : "") +
      (state.game === "merge2048" ? " · MAX " + Math.max(...state.board.flat()) : "") +
      (state.game === "racer" ? " · P" + state.position + " · LAP " + Math.min(state.lap,state.laps) + "/" + state.laps + " · G" + state.gear + " · " + Math.round(state.speed*115) + " KM/H" : "") +
      (state.game === "tanks" ? " · ♥ " + state.player.hp + " · ENEMY " + state.bots.filter(x=>x.hp>0).length + " · ● " + state.coins : "");
    if (now - lastSave > 4000 && !busy) {
      lastSave = now;
      if (inputs.length || pending) save();
    }
    if (state.over && !busy && !paused) { if(multiplayer) api("/multiplayer/finish",{id:multiplayer.roomId,score:state.score}).catch(()=>{}); save(true); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { destroy };
}

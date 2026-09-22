import { tick } from "/shared/engine.js";
import { render, setupCanvas } from "./render.js";
import { sound, music, silence } from "./audio.js";
export function play(session, api, settings, color, onExit, onResult, toast) {
  const app = document.querySelector("#app");
  app.innerHTML = `<main class="play-shell"><div class="play-top"><button id="pause">Ⅱ Пауза</button><span id="hud"></span><button id="exit">В меню</button></div><div class="play-stage ${settings.crt ? "crt" : ""}"><canvas id="game" aria-label="Игровое поле"></canvas></div><div class="controls"><div class="dpad"><button data-key="1" aria-label="Вверх">▲</button><button data-key="8" aria-label="Влево">◀</button><button data-key="4" aria-label="Вниз">▼</button><button data-key="2" aria-label="Вправо">▶</button></div><div class="action-buttons"><button data-key="32">ACT</button><button data-key="16">JUMP</button></div></div><div class="play-hint">WASD / СТРЕЛКИ · SPACE — ПРЫЖОК · E — ДЕЙСТВИЕ · ESC — ПАУЗА<br>Maze: ACT рядом с врагом, сундуком или подозрительным символом.</div><p class="play-hint" id="sync-status">Прогресс сохраняется автоматически</p></main>`;
  const c = setupCanvas(
      document.querySelector("#game"),
      768,
      session.state.game === "maze" ? 640 : 544,
    ),
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
    keys = new Set(),
    touch = new Map(),
    swipe = 0;
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
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      touch.set(e.pointerId, Number(b.dataset.key));
    };
    b.onpointerup = b.onpointercancel = (e) => touch.delete(e.pointerId);
  });
  let start;
  const canvas = c.canvas;
  canvas.onpointerdown = (e) => {
    start = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
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
        const input = [...keys, ...touch.values(), swipe].reduce(
          (a, b) => a | b,
          0,
        );
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
    render(c, state, color, settings);
    hud.textContent =
      String(state.score).padStart(5, "0") +
      (state.hp !== undefined ? " · ♥ " + state.hp : "") +
      (state.game === "maze" ? " · ⚿ " + state.keys : "");
    if (now - lastSave > 4000 && !busy) {
      lastSave = now;
      if (inputs.length || pending) save();
    }
    if (state.over && !busy && !paused) save(true);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { destroy };
}

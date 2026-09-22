// Production images are loaded only when the Snake game is opened.
let arena, atlas, frames, ready;
export function loadSnakeArt() {
  if (ready) return ready;
  const image = (src) =>
    new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(Error("Не удалось загрузить графику змейки"));
      im.src = src;
    });
  ready = Promise.all([
    image("/assets/snake/forest-arena.webp"),
    image("/assets/snake/sprites.webp"),
    fetch("/assets/snake/frames.json").then((r) => {
      if (!r.ok) throw Error("Sprite manifest unavailable");
      return r.json();
    }),
  ])
    .then(([a, b, f]) => {
      arena = a;
      atlas = b;
      frames = f;
    })
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}
function sprite(c, id, x, y, z, rotation = 0, scale = 1) {
  const f = frames[id];
  c.save();
  c.translate((x + 0.5) * z, (y + 0.5) * z);
  c.rotate(rotation);
  const ratio = f[2] / f[3],
    w = z * scale,
    h = id === 1 ? z * 0.85 : id === 3 ? z * 0.75 : w / ratio;
  c.drawImage(atlas, ...f, -w / 2, -h / 2, w, h);
  c.restore();
}
export function drawSnake(c, s, z, skin, settings) {
  if (!arena || !atlas) return;
  c.imageSmoothingEnabled = false;
  c.drawImage(arena, 0, 0, s.width * z, s.height * z);
  // Exact logical cells overlay the image, so rendering and collision bounds coincide.
  for (let y = 1; y < s.height - 1; y++)
    for (let x = 1; x < s.width - 1; x++) {
      c.fillStyle = (x + y) % 2 ? "#001e1780" : "#204e2b85";
      c.fillRect(x * z, y * z, z, z);
    }
  for (const [i, p] of s.walls.entries())
    sprite(c, 12 + (i % 3), p.x, p.y, z, 0, 0.94);
  for (const p of s.moving || []) sprite(c, 14, p.x, p.y, z, 0, 0.94);
  if (s.bonus) sprite(c, 15, s.bonus.x, s.bonus.y, z, 0, 0.85);
  if (s.food)
    sprite(c, 4 + ((s.eaten || 0) % 8), s.food.x, s.food.y, z, 0, 0.82);
  const body = s._visualBody || s.body;
  c.save();
  if (skin?.theme && skin.theme !== "base") {
    const hues = { mint: 55, ember: 260, ghost: 100, secret: 170 };
    const part = skin.id?.split("-").at(-1);
    c.filter =
      part === "ghost"
        ? "saturate(.1) brightness(1.5)"
        : `hue-rotate(${hues[part] || 0}deg)`;
  }
  for (let i = body.length - 1; i >= 0; i--) {
    const p = body[i],
      logical = s.body[i];
    if (!i) {
      sprite(c, 0, p.x, p.y, z, ((s.dir - 1) * Math.PI) / 2, 1.2);
      continue;
    }
    const prev = s.body[i - 1],
      dx = prev.x - logical.x,
      dy = prev.y - logical.y,
      angle = Math.atan2(dy, dx);
    if (i === body.length - 1) {
      sprite(c, 3, p.x, p.y, z, angle, 1.14);
      continue;
    }
    const next = s.body[i + 1],
      nx = next.x - logical.x,
      ny = next.y - logical.y;
    if (dx * nx + dy * ny === 0) {
      const set = new Set([
        dx > 0 ? 1 : dx < 0 ? 3 : dy > 0 ? 2 : 0,
        nx > 0 ? 1 : nx < 0 ? 3 : ny > 0 ? 2 : 0,
      ]);
      let turn = 0;
      for (let k = 0; k < 4; k++)
        if (set.has((3 + k) % 4) && set.has((2 + k) % 4)) {
          turn = k;
          break;
        }
      sprite(c, 2, p.x, p.y, z, (turn * Math.PI) / 2, 1.14);
    } else sprite(c, 1, p.x, p.y, z, angle, 1.15);
  }
  c.restore();
  if (settings.lighting) {
    const g = c.createRadialGradient(
      (s.width * z) / 2,
      (s.height * z) / 2,
      z * 4,
      (s.width * z) / 2,
      (s.height * z) / 2,
      z * 15,
    );
    g.addColorStop(0, "#0000");
    g.addColorStop(1, "#0008");
    c.fillStyle = g;
    c.fillRect(0, 0, s.width * z, s.height * z);
  }
}

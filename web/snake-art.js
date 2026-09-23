// Production images are loaded only when the Snake game is opened.
let arena, atlas, frames, scaleTexture, bellyTexture, ready;
function textureTile(image, crop, width, height) {
  const tile = document.createElement("canvas");
  tile.width = width;
  tile.height = height;
  const ctx = tile.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, ...crop, 0, 0, width, height);
  return tile;
}
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
      // Sample the original hand-drawn scale and belly artwork once. Canvas
      // repeats it inside one joined body shape, without stamping full tiles.
      scaleTexture = textureTile(atlas, [398, 151, 105, 51], 20, 10);
      bellyTexture = textureTile(atlas, [410, 216, 100, 32], 20, 8);
    })
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}
function sprite(c, id, x, y, z, rotation = 0, scale = 1, flipX = false, trimNeck = false) {
  const f = frames[id];
  c.save();
  c.translate((x + 0.5) * z, (y + 0.5) * z);
  c.rotate(rotation);
  if (flipX) c.scale(-1, 1);
  const ratio = f[2] / f[3],
    w = z * scale,
    h = w / ratio;
  if (trimNeck) {
    // The atlas head includes a dangling cream throat beneath its rear half.
    // Trim just that flap; the joined body already supplies the neck and belly.
    c.beginPath();
    c.moveTo(-w / 2, -h / 2);
    c.lineTo(w / 2, -h / 2);
    c.lineTo(w / 2, h / 2);
    c.lineTo(w * 0.2, h * 0.45);
    c.quadraticCurveTo(-w * 0.05, h * 0.24, -w * 0.3, h * 0.24);
    c.quadraticCurveTo(-w * 0.48, h * 0.25, -w / 2, h * 0.17);
    c.closePath();
    c.clip();
  }
  c.drawImage(atlas, ...f, -w / 2, -h / 2, w, h);
  c.restore();
}
// The source head faces right, with its eyes above its light belly. A 180°
// rotation would make it crawl upside down when travelling left.
export function headPose(dir) {
  return dir === 3
    ? { rotation: 0, flipX: true }
    : { rotation: ((dir - 1) * Math.PI) / 2, flipX: false };
}

export function snakeSpine(body) {
  return body.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
}

// Read the direction from visible positions, not the queued input. The engine
// may accept a turn several ticks before the head actually enters that cell.
export function visualHeading(body, fallback) {
  if (body.length < 2) return fallback;
  const dx = body[0].x - body[1].x;
  const dy = body[0].y - body[1].y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3;
  return dy >= 0 ? 2 : 0;
}

function continuousBody(c, body, z, direction) {
  if (body.length < 2) return;
  const spine = snakeSpine(body);
  const path = (points) => {
    c.beginPath();
    c.moveTo(points[0].x * z, points[0].y * z);
    for (let i = 1; i < points.length - 1; i++) {
      const before = points[i - 1], p = points[i], after = points[i + 1];
      const inLength = Math.hypot(p.x - before.x, p.y - before.y);
      const outLength = Math.hypot(after.x - p.x, after.y - p.y);
      const turn = (p.x - before.x) * (after.y - p.y) - (p.y - before.y) * (after.x - p.x);
      if (Math.abs(turn) < 0.01 || !inLength || !outLength) {
        c.lineTo(p.x * z, p.y * z);
        continue;
      }
      const radius = Math.min(0.38, inLength * 0.42, outLength * 0.42);
      c.lineTo((p.x - (p.x - before.x) / inLength * radius) * z, (p.y - (p.y - before.y) / inLength * radius) * z);
      c.quadraticCurveTo(p.x * z, p.y * z, (p.x + (after.x - p.x) / outLength * radius) * z, (p.y + (after.y - p.y) / outLength * radius) * z);
    }
    c.lineTo(points.at(-1).x * z, points.at(-1).y * z);
  };
  c.save();
  c.lineCap = "round";
  c.lineJoin = "round";
  path(spine);
  c.lineWidth = z * 0.94;
  c.strokeStyle = "#173d12";
  c.stroke();
  c.lineWidth = z * 0.81;
  c.strokeStyle = "#65b627";
  c.stroke();
  c.lineWidth = z * 0.64;
  c.strokeStyle = c.createPattern(scaleTexture, "repeat") || "#82d43b";
  c.stroke();

  // One continuous pale edge follows the *curve*, instead of a belly stripe
  // restarting at every grid cell. Average the normals at corners.
  const side = direction === 0 || direction === 3 ? 1 : -1;
  const normals = spine.map((point, i) => {
    const a = spine[Math.max(0, i - 1)],
      b = spine[Math.min(i + 1, spine.length - 1)];
    const vx = b.x - a.x,
      vy = b.y - a.y,
      length = Math.hypot(vx, vy) || 1;
    return { x: (-vy / length) * side, y: (vx / length) * side };
  });
  const offset = spine.map((p, i) => ({
    x: p.x + normals[i].x * 0.27,
    y: p.y + normals[i].y * 0.27,
  }));
  path(offset);
  c.lineWidth = z * 0.2;
  c.strokeStyle = c.createPattern(bellyTexture, "repeat") || "#f1d587";
  c.stroke();
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
  const direction = visualHeading(body, s.dir);
  continuousBody(c, body, z, direction);
  const pose = headPose(direction),
    head = body[0];
  // The artwork has a pale throat at its back. Overlap the first body segment
  // with the larger head so that throat blends into the continuous spine.
  const overlap = [
    { x: 0, y: 0.32 },
    { x: -0.32, y: 0 },
    { x: 0, y: -0.32 },
    { x: 0.32, y: 0 },
  ][direction];
  sprite(c, 0, head.x + overlap.x, head.y + overlap.y, z, pose.rotation, 2.25, pose.flipX, true);
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

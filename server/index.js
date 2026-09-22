import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { api, ApiError } from "./api.js";
import { pool, transaction } from "../database/db.js";
import { migrate } from "../database/migrate.js";
const production = process.env.NODE_ENV === "production";
if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is required");
if (
  production &&
  (!process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.APP_URL?.startsWith("https://") ||
    !process.env.BOT_WEBHOOK_SECRET ||
    process.env.BOT_WEBHOOK_SECRET.length < 24)
)
  throw Error(
    "Production requires TELEGRAM_BOT_TOKEN, HTTPS APP_URL and BOT_WEBHOOK_SECRET (24+ chars)",
  );
await migrate();
const root = resolve("."),
  rates = new Map();
const cleanup = setInterval(() => {
  for (const [k, v] of rates) if (v.until < Date.now()) rates.delete(k);
}, 60000);
cleanup.unref();
function limit(key, max = 240) {
  const now = Date.now(),
    r = rates.get(key) || { n: 0, until: now + 60000 };
  if (r.until < now) {
    r.n = 0;
    r.until = now + 60000;
  }
  r.n++;
  rates.set(key, r);
  if (r.n > max)
    throw new ApiError(429, "Слишком много запросов. Подожди минуту");
}
async function body(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256000) throw new ApiError(413, "Запрос слишком большой");
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
      throw Error("Invalid object");
    return parsed;
  } catch {
    throw new ApiError(400, "Неверный JSON");
  }
}
function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'",
  );
  try {
    const url = new URL(req.url, "http://localhost"),
      path = url.pathname;
    if (path === "/health") {
      await pool.query("SELECT 1");
      return send(res, 200, { ok: true });
    }
    if (path === "/api/boot")
      return send(res, 200, {
        dev: !production && process.env.DEV_AUTH === "true",
      });
    if (path === "/telegram/webhook" && req.method === "POST") {
      const expected = process.env.BOT_WEBHOOK_SECRET || "",
        actual = req.headers["x-telegram-bot-api-secret-token"] || "";
      if (
        !expected ||
        actual.length !== expected.length ||
        !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
      )
        throw new ApiError(403, "Forbidden");
      const update = await body(req);
      if (!Number.isSafeInteger(update.update_id))
        throw new ApiError(400, "Invalid update");
      await transaction(async (c) => {
        const r = await c.query(
          "INSERT INTO bot_updates(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
          [update.update_id],
        );
        if (!r.rowCount) return;
        const m = update.message;
        if (
          m?.text?.split(" ")[0].split("@")[0] === "/start" &&
          m.chat?.type === "private"
        ) {
          const response = await fetch(
            "https://api.telegram.org/bot" +
              process.env.TELEGRAM_BOT_TOKEN +
              "/sendMessage",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: m.chat.id,
                text: "RETRO ARCADE\nТри игры. Один потерянный сигнал.\nНажми PLAY и начни исследование.",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🎮 PLAY",
                        web_app: { url: process.env.APP_URL },
                      },
                    ],
                  ],
                },
              }),
              signal: AbortSignal.timeout(8000),
            },
          );
          const result = await response.json();
          if (!result.ok) throw Error("Telegram sendMessage failed");
        }
      });
      return send(res, 200, { ok: true });
    }
    if (path.startsWith("/api/")) {
      limit(
        req.socket.remoteAddress +
          (req.headers.authorization || "").slice(0, 100),
      );
      if (path === "/api/auth") limit("auth:" + req.socket.remoteAddress, 30);
      if (!["GET", "POST"].includes(req.method))
        throw new ApiError(405, "Method not allowed");
      if (
        req.method === "POST" &&
        req.headers.origin &&
        req.headers.origin !==
          new URL(process.env.APP_URL || "http://localhost:3000").origin
      )
        throw new ApiError(403, "Invalid origin");
      const result = await api(
        req,
        path,
        req.method === "POST" ? await body(req) : {},
        url.searchParams,
      );
      return send(res, 200, result);
    }
    if (!["GET", "HEAD"].includes(req.method))
      throw new ApiError(405, "Method not allowed");
    let relative = path === "/" ? "web/index.html" : path.slice(1);
    if (relative.startsWith("assets/")) relative = "public/" + relative;
    else if (!["web/", "shared/", "games/", "public/"].some((p) => relative.startsWith(p)))
      relative = "web/" + relative;
    const file = resolve(root, relative);
    if (
      !["web", "shared", "games", "public"].some((p) =>
        file.startsWith(resolve(root, p) + sep),
      )
    )
      throw new ApiError(404, "Not found");
    const content = await readFile(file);
    const mime =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".json": "application/json",
      }[extname(file)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime.startsWith("image/") ? mime : mime + "; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (e) {
    const status = e.status || (e.code === "ENOENT" ? 404 : 500);
    if (status === 500)
      console.error(
        JSON.stringify({
          event: "request_error",
          path: req.url,
          error: e.message,
        }),
      );
    send(res, status, {
      error:
        status === 500
          ? "Сервер временно недоступен. Прогресс сохранён."
          : e.message,
    });
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("Retro Arcade listening"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );

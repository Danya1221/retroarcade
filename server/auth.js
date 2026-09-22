import {
  createHmac,
  createHash,
  timingSafeEqual,
  randomBytes,
} from "node:crypto";
export const hashToken = (t) => createHash("sha256").update(t).digest("hex");
export function validateTelegram(raw, token, now = Date.now()) {
  if (typeof raw !== "string" || raw.length > 16384)
    throw Error("Invalid Telegram data");
  const p = new URLSearchParams(raw);
  if (new Set(p.keys()).size !== [...p.keys()].length)
    throw Error("Duplicate auth fields");
  const hash = p.get("hash");
  p.delete("hash");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash))
    throw Error("Invalid Telegram signature");
  const text = [...p]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => k + "=" + v)
    .join("\n");
  const key = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", key).update(text).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex")))
    throw Error("Invalid Telegram signature");
  const age = now / 1000 - Number(p.get("auth_date"));
  if (!Number.isFinite(age) || age < -30 || age > 3600)
    throw Error("Expired Telegram data");
  const user = JSON.parse(p.get("user") || "null");
  if (
    !user ||
    !Number.isSafeInteger(user.id) ||
    user.id <= 0 ||
    typeof user.first_name !== "string"
  )
    throw Error("Invalid user");
  return user;
}
export const newToken = () => randomBytes(32).toString("base64url");
export function isAdmin(id) {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .includes(String(id));
}

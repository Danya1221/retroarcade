const {
  TELEGRAM_BOT_TOKEN: token,
  APP_URL: url,
  BOT_WEBHOOK_SECRET: secret,
} = process.env;
if (!token || !url?.startsWith("https://") || !secret || secret.length < 24)
  throw Error(
    "Set TELEGRAM_BOT_TOKEN, HTTPS APP_URL and BOT_WEBHOOK_SECRET (24+ chars)",
  );
for (const [method, data] of [
  [
    "setWebhook",
    {
      url: url.replace(/\/$/, "") + "/telegram/webhook",
      secret_token: secret,
      allowed_updates: ["message"],
    },
  ],
  [
    "setChatMenuButton",
    { menu_button: { type: "web_app", text: "🎮 PLAY", web_app: { url } } },
  ],
  [
    "setMyCommands",
    { commands: [{ command: "start", description: "Открыть Retro Arcade" }] },
  ],
]) {
  const r = await fetch("https://api.telegram.org/bot" + token + "/" + method, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const d = await r.json();
  if (!d.ok) throw Error(method + ": " + d.description);
  console.log(method + " OK");
}

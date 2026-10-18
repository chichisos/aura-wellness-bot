// Скрипт управления Telegram webhook: set / info / delete.
// Использование:
//   BOT_TOKEN=... WEBHOOK_SECRET=... WORKER_URL=https://xxx.workers.dev node scripts/webhook.mjs set
//   BOT_TOKEN=... node scripts/webhook.mjs info
//   BOT_TOKEN=... node scripts/webhook.mjs delete
//
// Можно положить значения в `.dev.vars` (не коммитить!) — скрипт подхватит их автоматически.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDevVars() {
	const path = resolve(process.cwd(), ".dev.vars");
	if (!existsSync(path)) return;
	const lines = readFileSync(path, "utf8").split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (key && !(key in process.env)) process.env[key] = value;
	}
}

loadDevVars();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const WORKER_URL = (process.env.WORKER_URL ?? "").replace(/\/$/, "");

async function tg(method, payload) {
	const res = await fetch(
		`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		},
	);
	const data = await res.json();
	console.log(JSON.stringify(data, null, 2));
	if (!data.ok) process.exitCode = 1;
}

const cmd = process.argv[2];

if (!BOT_TOKEN) {
	console.error(
		"Нет BOT_TOKEN. Задайте env BOT_TOKEN или добавьте его в .dev.vars",
	);
	process.exit(1);
}

if (cmd === "set") {
	if (!WEBHOOK_SECRET || !WORKER_URL) {
		console.error(
			"Для set нужны WEBHOOK_SECRET и WORKER_URL (например https://aura-wellness-bot.username.workers.dev)",
		);
		process.exit(1);
	}
	await tg("setWebhook", {
		url: `${WORKER_URL}/webhook`,
		secret_token: WEBHOOK_SECRET,
		allowed_updates: ["message", "callback_query"],
	});
} else if (cmd === "info") {
	await tg("getWebhookInfo", {});
} else if (cmd === "delete") {
	await tg("deleteWebhook", { drop_pending_updates: true });
} else {
	console.error("Использование: node scripts/webhook.mjs <set|info|delete>");
	process.exit(1);
}

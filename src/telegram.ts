import type { Env } from "./types";
import type { InlineKeyboard } from "./keyboards";

const API = "https://api.telegram.org";

async function callApi(
	env: Env,
	method: string,
	payload: unknown,
): Promise<void> {
	const res = await fetch(`${API}/bot${env.BOT_TOKEN}/${method}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		console.error(`Telegram API error ${method}: ${res.status} ${text}`);
	}
}

interface SendOptions {
	reply_markup?: InlineKeyboard;
	parse_mode?: "HTML";
}

export async function sendMessage(
	env: Env,
	chatId: number | string,
	text: string,
	opts: SendOptions = {},
): Promise<void> {
	await callApi(env, "sendMessage", {
		chat_id: chatId,
		text,
		parse_mode: opts.parse_mode ?? "HTML",
		reply_markup: opts.reply_markup,
	});
}

export async function editMessageText(
	env: Env,
	chatId: number | string,
	messageId: number,
	text: string,
	replyMarkup?: InlineKeyboard,
): Promise<void> {
	await callApi(env, "editMessageText", {
		chat_id: chatId,
		message_id: messageId,
		text,
		parse_mode: "HTML",
		reply_markup: replyMarkup,
	});
}

export async function answerCallbackQuery(
	env: Env,
	callbackQueryId: string,
): Promise<void> {
	await callApi(env, "answerCallbackQuery", {
		callback_query_id: callbackQueryId,
	});
}

/** Экранирование для HTML parse_mode. */
export function esc(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export async function sendPhoto(
env: Env,
chatId: number,
photo: string,
caption?: string,
extra: Record<string, any> = {}
) {
return fetch(https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
chat_id: chatId,
photo,
caption,
...extra,
}),
});
}

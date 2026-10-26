import type { Env, TgMessage } from "./types";
import type { InlineKeyboard } from "./keyboards";

const API = "https://api.telegram.org";

export class TelegramApiError extends Error {
	constructor(public readonly method: string, public readonly code: number, description: string) {
		super(`Telegram ${method}: ${code} ${description}`);
	}
}

async function callApi<T>(env: Env, method: string, payload: unknown): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${API}/bot${env.BOT_TOKEN}/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	} catch {
		// Network errors can contain the request URL, including the bot token.
		throw new TelegramApiError(method, 0, "Network request failed");
	}
	let data: { ok: boolean; result: T; error_code?: number; description?: string };
	try {
		data = await res.json();
	} catch {
		throw new TelegramApiError(method, res.status, "Invalid API response");
	}
	if (!res.ok || !data.ok) {
		const description = (data.description ?? "API request failed").split(env.BOT_TOKEN).join("[redacted]");
		// Repeated taps may legitimately request an identical screen.
		if ((method === "editMessageText" || method === "editMessageMedia") &&
			data.error_code === 400 && description.includes("message is not modified")) {
			return undefined as T;
		}
		throw new TelegramApiError(method, data.error_code ?? res.status, description);
	}
	return data.result;
}

interface SendOptions {
	reply_markup?: InlineKeyboard;
	parse_mode?: "HTML";
}

export async function sendMessage(env: Env, chatId: number | string, text: string, opts: SendOptions = {}): Promise<TgMessage> {
	return callApi<TgMessage>(env, "sendMessage", {
		chat_id: chatId, text, parse_mode: opts.parse_mode ?? "HTML", reply_markup: opts.reply_markup,
	});
}

export async function editMessageText(env: Env, chatId: number | string, messageId: number, text: string, replyMarkup?: InlineKeyboard): Promise<void> {
	await callApi(env, "editMessageText", {
		chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup: replyMarkup,
	});
}

export async function answerCallbackQuery(env: Env, callbackQueryId: string): Promise<void> {
	await callApi(env, "answerCallbackQuery", { callback_query_id: callbackQueryId });
}

/** Экранирование для HTML parse_mode. */
export function esc(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Telegram counts caption characters after parsing entities. Never truncate HTML. */
function validateCaption(caption: string): void {
	const plain = caption.replace(/<[^>]*>/g, "").replace(/&(?:amp|lt|gt|quot);|&#(?:\d+|x[\da-f]+);/gi, "_");
	if (plain.length > 1024) throw new RangeError("Telegram photo caption exceeds 1024 characters");
}

export async function sendPhoto(env: Env, chatId: number, photo: string, caption = "", extra: SendOptions = {}): Promise<TgMessage> {
	validateCaption(caption);
	return callApi<TgMessage>(env, "sendPhoto", { chat_id: chatId, photo, caption, ...extra });
}

export async function editMessageMedia(env: Env, chatId: number, messageId: number, photo: string, caption: string, replyMarkup?: InlineKeyboard): Promise<void> {
	validateCaption(caption);
	await callApi(env, "editMessageMedia", {
		chat_id: chatId, message_id: messageId,
		media: { type: "photo", media: photo, caption, parse_mode: "HTML" },
		reply_markup: replyMarkup,
	});
}

export async function deleteMessage(env: Env, chatId: number, messageId: number): Promise<void> {
	await callApi(env, "deleteMessage", { chat_id: chatId, message_id: messageId });
}

/** One navigation message. The next callback carries the replacement's actual ID/type. */
export async function renderSection(env: Env, message: TgMessage, text: string, replyMarkup: InlineKeyboard, photo?: string): Promise<void> {
	if (photo) validateCaption(text); // Reject oversized captions before any mutation.
	const hasPhoto = Boolean(message.photo?.length);
	if (photo && hasPhoto) {
		await editMessageMedia(env, message.chat.id, message.message_id, photo, text, replyMarkup);
		return;
	}
	if (!photo && !hasPhoto) {
		await editMessageText(env, message.chat.id, message.message_id, text, replyMarkup);
		return;
	}
	// Send first so an API failure leaves the old screen usable. Roll back if deletion fails.
	const replacement = photo
		? await sendPhoto(env, message.chat.id, photo, text, { parse_mode: "HTML", reply_markup: replyMarkup })
		: await sendMessage(env, message.chat.id, text, { reply_markup: replyMarkup });
	try {
		await deleteMessage(env, message.chat.id, message.message_id);
	} catch (error) {
		await deleteMessage(env, message.chat.id, replacement.message_id);
		throw error;
	}
	message.message_id = replacement.message_id;
	message.photo = photo ? (replacement.photo ?? [{ file_id: photo }]) : undefined;
}

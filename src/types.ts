export interface Env {
	BOT_TOKEN: string;
	ADMIN_CHAT_ID: string;
	WEBHOOK_SECRET: string;
	BOT_STATE: KVNamespace;
}

/** Временное состояние одного пользователя (хранится в KV, TTL 24 ч). */
export interface UserState {
	step: "idle" | "await_name" | "await_phone" | "await_review" | "await_admin";
	serviceId?: string;
	specialistId?: string; // id специалиста или "any"
	date?: string; // YYYY-MM-DD
	time?: string; // HH:MM
	name?: string;
	phone?: string;
	fromPromo?: boolean;
	promoLabel?: string;
}

/** Telegram update (минимальный набор полей, который нам нужен). */
export interface TgUpdate {
	update_id?: number;
	message?: TgMessage;
	callback_query?: TgCallbackQuery;
}

export interface TgUser {
	id: number;
	first_name?: string;
	last_name?: string;
	username?: string;
}

export interface TgChat {
	id: number;
	type?: string;
}

export interface TgMessage {
	message_id: number;
	chat: TgChat;
	from?: TgUser;
	text?: string;
	date?: number;
}

export interface TgCallbackQuery {
	id: string;
	from: TgUser;
	message?: TgMessage;
	data?: string;
}

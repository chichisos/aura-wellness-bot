import {
	CATEGORIES,
	PROMOS,
	REVIEWS,
	WELCOME_TEXT,
	categoryTitle,
	faqById,
	serviceById,
	servicesByCategory,
	specialistById,
	SPECIALISTS,
} from "./data";
import {
	afterBookingKeyboard,
	backToMenuKeyboard,
	bookingConfirmKeyboard,
	bookingDatesKeyboard,
	bookingServicesKeyboard,
	bookingSpecialistsKeyboard,
	bookingTimesKeyboard,
	cancelKeyboard,
	categoriesKeyboard,
	faqAnswerKeyboard,
	faqKeyboard,
	mainMenuKeyboard,
	promosKeyboard,
	reviewsKeyboard,
	serviceCardKeyboard,
	specialistCardKeyboard,
	specialistsKeyboard,
	servicesKeyboard,
} from "./keyboards";
import { formatDateRu, isValidSlot, nextDays } from "./booking";
import { clearState, getState, saveState } from "./state";
import {
	answerCallbackQuery,
	editMessageText,
	esc,
	sendMessage,
} from "./telegram";
import type { Env, TgCallbackQuery, TgMessage } from "./types";

function userLabel(msg: TgMessage): string {
	const from = msg.from;
	if (!from) return "гость";
	const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
	return name || (from.username ? `@${from.username}` : `id ${from.id}`);
}

function usernameOf(msg: TgMessage): string {
	const u = msg.from?.username;
	return u ? `@${u}` : "—";
}

export async function showMainMenu(env: Env, chatId: number): Promise<void> {
	await sendMessage(env, chatId, esc(WELCOME_TEXT), {
		reply_markup: mainMenuKeyboard(),
	});
}

export async function handleMessage(env: Env, msg: TgMessage): Promise<void> {
	const chatId = msg.chat.id;
	const userId = msg.from?.id ?? chatId;
	const text = (msg.text ?? "").trim();

	// Временная команда для получения chat.id (легко удаляется: блок ниже).
	// --- BEGIN /chatid (TEMP) ---
	if (text === "/chatid") {
		await sendMessage(env, chatId, `Ваш chat.id: <code>${chatId}</code>`);
		return;
	}
	// --- END /chatid (TEMP) ---

	if (text === "/start") {
		await clearState(env, userId);
		await showMainMenu(env, chatId);
		return;
	}

	const state = await getState(env, userId);

	if (state.step === "await_name") {
		if (!text || text.startsWith("/")) {
			await sendMessage(env, chatId, "Пожалуйста, напишите ваше имя текстом.", {
				reply_markup: cancelKeyboard(),
			});
			return;
		}
		state.name = text.slice(0, 80);
		state.step = "await_phone";
		await saveState(env, userId, state);
		await sendMessage(
			env,
			chatId,
			`Спасибо, ${esc(state.name)}! Теперь напишите номер телефона для связи.`,
			{ reply_markup: cancelKeyboard() },
		);
		return;
	}

	if (state.step === "await_phone") {
		const phone = text.replace(/\s+/g, " ").slice(0, 40);
		if (!isPlausiblePhone(phone)) {
			await sendMessage(
				env,
				chatId,
				"Похоже, это не номер телефона. Напишите номер в формате +7 900 123-45-67.",
				{ reply_markup: cancelKeyboard() },
			);
			return;
		}
		state.phone = phone;
		state.step = "idle";
		await saveState(env, userId, state);
		await showBookingPreview(env, chatId, userId);
		return;
	}

	if (state.step === "await_review") {
		if (!text) {
			await sendMessage(
				env,
				chatId,
				"Напишите отзыв текстом одним сообщением.",
				{
					reply_markup: cancelKeyboard(),
				},
			);
			return;
		}
		await clearState(env, userId);
		await forwardToAdmin(
			env,
			`⭐ <b>Новый отзыв</b>\nОт: ${esc(userLabel(msg))} (${esc(usernameOf(msg))}, id <code>${userId}</code>)\n\n${esc(text.slice(0, 1500))}`,
		);
		await sendMessage(env, chatId, "Спасибо за ваш отзыв 🤍", {
			reply_markup: backToMenuKeyboard(),
		});
		return;
	}

	if (state.step === "await_admin") {
		if (!text) {
			await sendMessage(
				env,
				chatId,
				"Напишите ваш вопрос текстом одним сообщением.",
				{
					reply_markup: cancelKeyboard(),
				},
			);
			return;
		}
		await clearState(env, userId);
		await forwardToAdmin(
			env,
			`💬 <b>Обращение к администратору</b>\nИмя: ${esc(userLabel(msg))}\nUsername: ${esc(usernameOf(msg))}\nTelegram user id: <code>${userId}</code>\n\n${esc(text.slice(0, 1500))}`,
		);
		await sendMessage(
			env,
			chatId,
			"Спасибо. Администратор получил ваше сообщение и ответит вам в ближайшее время.",
			{ reply_markup: backToMenuKeyboard() },
		);
		return;
	}

	// Любой другой текст — мягко возвращаем в меню.
	await sendMessage(env, chatId, "Выберите действие в меню ниже:", {
		reply_markup: mainMenuKeyboard(),
	});
}

function isPlausiblePhone(phone: string): boolean {
	const digits = phone.replace(/\D/g, "");
	return digits.length >= 6 && digits.length <= 15;
}

async function forwardToAdmin(env: Env, html: string): Promise<void> {
	if (!env.ADMIN_CHAT_ID) {
		console.error("ADMIN_CHAT_ID is not set, skipping admin notification");
		return;
	}
	await sendMessage(env, env.ADMIN_CHAT_ID, html);
}

export async function handleCallback(
	env: Env,
	cb: TgCallbackQuery,
): Promise<void> {
	const data = cb.data ?? "";
	const msg = cb.message;
	if (!msg) {
		await answerCallbackQuery(env, cb.id);
		return;
	}
	const chatId = msg.chat.id;
	const messageId = msg.message_id;
	const userId = cb.from.id;
	await answerCallbackQuery(env, cb.id);

	if (data === "menu:home" || data === "menu:start") {
		await clearState(env, userId);
		await editMessageText(
			env,
			chatId,
			messageId,
			esc(WELCOME_TEXT),
			mainMenuKeyboard(),
		);
		return;
	}

	if (data === "menu:book") {
		await editMessageText(
			env,
			chatId,
			messageId,
			"Выберите услугу для записи:",
			bookingServicesKeyboard(),
		);
		return;
	}

	if (data === "menu:services") {
		await editMessageText(
			env,
			chatId,
			messageId,
			"Наши направления — выберите категорию:",
			categoriesKeyboard(),
		);
		return;
	}

	if (data === "menu:team") {
		await editMessageText(
			env,
			chatId,
			messageId,
			"Наши специалисты:",
			specialistsKeyboard(),
		);
		return;
	}

	if (data === "menu:promos") {
		const text = ["🎁 <b>Акции AURA</b>", ""]
			.concat(
				PROMOS.flatMap((p) => [`<b>${esc(p.title)}</b>`, esc(p.text), ""]),
			)
			.join("\n");
		await editMessageText(env, chatId, messageId, text, promosKeyboard());
		return;
	}

	if (data === "promo:book") {
		const state = await getState(env, userId);
		state.fromPromo = true;
		await saveState(env, userId, state);
		await editMessageText(
			env,
			chatId,
			messageId,
			"Выберите услугу для записи по акции:",
			bookingServicesKeyboard(),
		);
		return;
	}

	if (data === "menu:reviews") {
		const lines = ["⭐ <b>Отзывы наших гостей</b>", ""];
		for (const r of REVIEWS) {
			lines.push(`<b>${esc(r.author)}</b>`, esc(r.text), "");
		}
		await editMessageText(
			env,
			chatId,
			messageId,
			lines.join("\n"),
			reviewsKeyboard(),
		);
		return;
	}

	if (data === "reviews:leave") {
		await saveState(env, userId, { step: "await_review" });
		await editMessageText(
			env,
			chatId,
			messageId,
			"Напишите ваш отзыв одним сообщением — мы передадим его администратору.",
			cancelKeyboard(),
		);
		return;
	}

	if (data === "menu:faq") {
		await editMessageText(
			env,
			chatId,
			messageId,
			"Частые вопросы — выберите тему:",
			faqKeyboard(),
		);
		return;
	}

	if (data === "menu:admin") {
		await saveState(env, userId, { step: "await_admin" });
		await editMessageText(
			env,
			chatId,
			messageId,
			"Напишите ваш вопрос одним сообщением — администратор скоро ответит.",
			cancelKeyboard(),
		);
		return;
	}

	if (data.startsWith("cat:")) {
		const categoryId = data.slice(4);
		const list = servicesByCategory(categoryId);
		if (list.length === 0) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Категория не найдена.",
				categoriesKeyboard(),
			);
			return;
		}
		const lines = [
			`<b>${esc(categoryTitle(categoryId))}</b> — выберите услугу:`,
			"",
		];
		for (const s of list) {
			lines.push(
				`<b>${esc(s.name)}</b> · ${esc(s.duration)} · ${esc(s.price)}`,
			);
			lines.push(esc(s.description), "");
		}
		await editMessageText(
			env,
			chatId,
			messageId,
			lines.join("\n"),
			servicesKeyboard(categoryId),
		);
		return;
	}

	if (data.startsWith("svc:")) {
		const service = serviceById(data.slice(4));
		if (!service) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Услуга не найдена.",
				categoriesKeyboard(),
			);
			return;
		}
		const text = [
			`<b>${esc(service.name)}</b>`,
			`${esc(categoryTitle(service.category))} · ${esc(service.duration)} · ${esc(service.price)}`,
			"",
			esc(service.description),
		].join("\n");
		await editMessageText(
			env,
			chatId,
			messageId,
			text,
			serviceCardKeyboard(service.id),
		);
		return;
	}

	if (data.startsWith("team:")) {
		const spec = specialistById(data.slice(5));
		if (!spec) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Специалист не найден.",
				specialistsKeyboard(),
			);
			return;
		}
		await editMessageText(
			env,
			chatId,
			messageId,
			specialistCard(spec),
			specialistCardKeyboard(spec.id),
		);
		return;
	}

	if (data.startsWith("faq:")) {
		const item = faqById(data.slice(4));
		if (!item) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Вопрос не найден.",
				faqKeyboard(),
			);
			return;
		}
		await editMessageText(
			env,
			chatId,
			messageId,
			[`<b>${esc(item.question)}</b>`, "", esc(item.answer)].join("\n"),
			faqAnswerKeyboard(),
		);
		return;
	}

	// --- Booking flow ---
	if (data.startsWith("booksvc:")) {
		const service = serviceById(data.slice(8));
		if (!service) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Услуга не найдена.",
				bookingServicesKeyboard(),
			);
			return;
		}
		const state = await getState(env, userId);
		await saveState(env, userId, {
			...state,
			step: "idle",
			serviceId: service.id,
			specialistId: undefined,
			date: undefined,
			time: undefined,
			name: undefined,
			phone: undefined,
		});
		await editMessageText(
			env,
			chatId,
			messageId,
			`Услуга: <b>${esc(service.name)}</b>\nВыберите специалиста:`,
			bookingSpecialistsKeyboard(),
		);
		return;
	}

	if (data.startsWith("bookspec:")) {
		const spec = specialistById(data.slice(9));
		if (!spec) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Специалист не найден.",
				specialistsKeyboard(),
			);
			return;
		}
		const state = await getState(env, userId);
		await saveState(env, userId, {
			...state,
			step: "idle",
			specialistId: spec.id,
			date: undefined,
			time: undefined,
			name: undefined,
			phone: undefined,
		});
		await editMessageText(
			env,
			chatId,
			messageId,
			`Специалист: <b>${esc(spec.name)}</b>\nТеперь выберите услугу:`,
			bookingServicesKeyboard(),
		);
		return;
	}

	if (data.startsWith("bsvc:")) {
		const service = serviceById(data.slice(5));
		if (!service) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Услуга не найдена.",
				bookingServicesKeyboard(),
			);
			return;
		}
		const state = await getState(env, userId);
		state.serviceId = service.id;
		await saveState(env, userId, state);
		if (state.specialistId) {
			await askDate(env, chatId, messageId);
		} else {
			await editMessageText(
				env,
				chatId,
				messageId,
				`Услуга: <b>${esc(service.name)}</b>\nВыберите специалиста:`,
				bookingSpecialistsKeyboard(),
			);
		}
		return;
	}

	if (data.startsWith("bspec:")) {
		const specId = data.slice(6);
		const spec = specialistById(specId);
		if (!spec) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Специалист не найден.",
				bookingSpecialistsKeyboard(),
			);
			return;
		}
		const state = await getState(env, userId);
		state.specialistId = spec.id;
		await saveState(env, userId, state);
		if (state.serviceId) {
			await askDate(env, chatId, messageId);
		} else {
			await editMessageText(
				env,
				chatId,
				messageId,
				`Специалист: <b>${esc(spec.name)}</b>\nТеперь выберите услугу:`,
				bookingServicesKeyboard(),
			);
		}
		return;
	}

	if (data.startsWith("bdate:")) {
		const value = data.slice(6);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Выберите дату:",
				bookingDatesKeyboard(nextDays(5)),
			);
			return;
		}
		const state = await getState(env, userId);
		state.date = value;
		await saveState(env, userId, state);
		await editMessageText(
			env,
			chatId,
			messageId,
			`Дата: <b>${esc(formatDateRu(value))}</b>\nВыберите время:`,
			bookingTimesKeyboard(),
		);
		return;
	}

	if (data.startsWith("btime:")) {
		const time = data.slice(6);
		if (!isValidSlot(time)) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Выберите время:",
				bookingTimesKeyboard(),
			);
			return;
		}
		const state = await getState(env, userId);
		state.time = time;
		state.step = "await_name";
		await saveState(env, userId, state);
		await editMessageText(
			env,
			chatId,
			messageId,
			`Время: <b>${esc(time)}</b>\n\nКак к вам обращаться? Напишите ваше имя.`,
			cancelKeyboard(),
		);
		return;
	}

	if (data === "book:confirm") {
		const state = await getState(env, userId);
		const service = serviceById(state.serviceId);
		const spec = specialistById(state.specialistId);
		if (
			!service ||
			!spec ||
			!state.date ||
			!state.time ||
			!state.name ||
			!state.phone
		) {
			await editMessageText(
				env,
				chatId,
				messageId,
				"Данные записи неполные. Начнём заново:",
				bookingServicesKeyboard(),
			);
			await clearState(env, userId);
			return;
		}
		await clearState(env, userId);
		const username = cb.from.username ? `@${cb.from.username}` : "—";
		const humanName =
			[cb.from.first_name, cb.from.last_name].filter(Boolean).join(" ") ||
			state.name;

		await editMessageText(
			env,
			chatId,
			messageId,
			[
				"Запись подтверждена ✓",
				"",
				`Услуга: <b>${esc(service.name)}</b>`,
				`Специалист: <b>${esc(spec.name)}</b>`,
				`Дата: <b>${esc(formatDateRu(state.date))}</b>`,
				`Время: <b>${esc(state.time)}</b>`,
				`Имя: <b>${esc(state.name)}</b>`,
			].join("\n"),
			afterBookingKeyboard(),
		);

		await forwardToAdmin(
			env,
			[
				"🔔 <b>Новая запись</b>",
				`Клиент: ${esc(state.name)}`,
				`Телефон: ${esc(state.phone)}`,
				`Услуга: ${esc(service.name)}`,
				`Специалист: ${esc(spec.name)}`,
				`Дата: ${esc(formatDateRu(state.date))}`,
				`Время: ${esc(state.time)}`,
				`Telegram: ${esc(username)} (${esc(humanName)}, id <code>${userId}</code>)${state.fromPromo ? "\nПо акции: да" : ""}`,
			].join("\n"),
		);
		return;
	}

	if (data === "book:cancel") {
		await clearState(env, userId);
		await editMessageText(
			env,
			chatId,
			messageId,
			"Запись отменена. Чем ещё помочь?",
			mainMenuKeyboard(),
		);
		return;
	}

	// Неизвестный callback — возвращаем в меню.
	await editMessageText(
		env,
		chatId,
		messageId,
		esc(WELCOME_TEXT),
		mainMenuKeyboard(),
	);
}

function specialistCard(spec: {
	name: string;
	role: string;
	experience: string;
	about: string;
}): string {
	const lines = [`<b>${esc(spec.name)}</b>`, esc(spec.role)];
	if (spec.experience) lines.push(esc(spec.experience));
	lines.push("", esc(spec.about));
	return lines.join("\n");
}

async function askDate(
	env: Env,
	chatId: number,
	messageId: number,
): Promise<void> {
	await editMessageText(
		env,
		chatId,
		messageId,
		"Выберите дату (ближайшие 5 дней):",
		bookingDatesKeyboard(nextDays(5)),
	);
}

async function showBookingPreview(
	env: Env,
	chatId: number,
	userId: number,
): Promise<void> {
	const state = await getState(env, userId);
	const service = serviceById(state.serviceId);
	const spec = specialistById(state.specialistId);
	if (
		!service ||
		!spec ||
		!state.date ||
		!state.time ||
		!state.name ||
		!state.phone
	) {
		await clearState(env, userId);
		await sendMessage(env, chatId, "Данные записи неполные. Начнём заново:", {
			reply_markup: bookingServicesKeyboard(),
		});
		return;
	}
	await sendMessage(
		env,
		chatId,
		[
			"<b>Проверьте данные записи:</b>",
			"",
			`Услуга: <b>${esc(service.name)}</b> · ${esc(service.price)}`,
			`Специалист: <b>${esc(spec.name)}</b>`,
			`Дата: <b>${esc(formatDateRu(state.date))}</b>`,
			`Время: <b>${esc(state.time)}</b>`,
			`Имя: <b>${esc(state.name)}</b>`,
			`Телефон: <b>${esc(state.phone)}</b>`,
		].join("\n"),
		{ reply_markup: bookingConfirmKeyboard() },
	);
}

export function listCategoriesText(): string {
	return CATEGORIES.map((c) => c.title).join(", ");
}

export function allSpecialists(): typeof SPECIALISTS {
	return SPECIALISTS;
}

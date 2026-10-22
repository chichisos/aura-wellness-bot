import { FAQ, SERVICES, TIME_SLOTS, servicesByCategory } from "./data";

export interface InlineKeyboardButton {
	text: string;
	callback_data: string;
}

export interface InlineKeyboard {
	inline_keyboard: InlineKeyboardButton[][];
}

function btn(text: string, callback_data: string): InlineKeyboardButton {
	return { text, callback_data };
}

export function mainMenuKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Записаться →", "menu:book")],
			[btn("Услуги и цены", "menu:services")],
			[btn("Специалисты", "menu:team")],
			[btn("Акции", "menu:promos")],
			[btn("Отзывы", "menu:reviews")],
			[btn("Частые вопросы", "menu:faq")],
			[btn("Связаться с администратором", "menu:admin")],
		],
	};
}

export function backToMenuKeyboard(): InlineKeyboard {
	return { inline_keyboard: [[btn("В главное меню", "menu:home")]] };
}

export function afterBookingKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("В главное меню", "menu:home")],
			[btn("Связаться с администратором", "menu:admin")],
		],
	};
}

export function categoriesKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[{ text: "Массаж", callback_data: "cat:massage" }],
			[{ text: "SPA", callback_data: "cat:spa" }],
			[{ text: "Уход за лицом", callback_data: "cat:face" }],
			[{ text: "Коррекция фигуры", callback_data: "cat:body" }],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function servicesKeyboard(categoryId: string): InlineKeyboard {
	const rows = servicesByCategory(categoryId).map((s) => [
		btn(`${s.name} · ${s.price}`, `svc:${s.id}`),
	]);
	rows.push([btn("← К услугам", "menu:services")]);
	rows.push([btn("В главное меню", "menu:home")]);
	return { inline_keyboard: rows };
}

export function serviceCardKeyboard(serviceId: string): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Записаться", `booksvc:${serviceId}`)],
			[btn("← К услугам", "menu:services")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function specialistsKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Анна Воронцова · массажист", "team:anna")],
			[btn("Екатерина Морозова · SPA-терапевт", "team:ekaterina")],
			[btn("Мария Соколова · косметолог-эстетист", "team:maria")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function specialistCardKeyboard(specialistId: string): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Записаться к специалисту", `bookspec:${specialistId}`)],
			[btn("← К специалистам", "menu:team")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function bookingServicesKeyboard(): InlineKeyboard {
	const rows = SERVICES.map((s) => [
		btn(`${s.name} · ${s.price}`, `bsvc:${s.id}`),
	]);
	rows.push([btn("В главное меню", "menu:home")]);
	return { inline_keyboard: rows };
}

export function bookingSpecialistsKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Анна Воронцова", "bspec:anna")],
			[btn("Екатерина Морозова", "bspec:ekaterina")],
			[btn("Мария Соколова", "bspec:maria")],
			[btn("Любой свободный", "bspec:any")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function bookingDatesKeyboard(
	dates: { value: string; label: string }[],
): InlineKeyboard {
	const rows = dates.map((d) => [btn(d.label, `bdate:${d.value}`)]);
	rows.push([btn("В главное меню", "menu:home")]);
	return { inline_keyboard: rows };
}

export function bookingTimesKeyboard(): InlineKeyboard {
	const rows: InlineKeyboardButton[][] = [];
	for (let i = 0; i < TIME_SLOTS.length; i += 2) {
		const row = [btn(TIME_SLOTS[i], `btime:${TIME_SLOTS[i]}`)];
		if (TIME_SLOTS[i + 1])
			row.push(btn(TIME_SLOTS[i + 1], `btime:${TIME_SLOTS[i + 1]}`));
		rows.push(row);
	}
	rows.push([btn("В главное меню", "menu:home")]);
	return { inline_keyboard: rows };
}

export function bookingConfirmKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Подтвердить запись", "book:confirm")],
			[btn("Отменить", "book:cancel")],
		],
	};
}

export function faqKeyboard(): InlineKeyboard {
	const rows = FAQ.map((f) => [btn(f.question, `faq:${f.id}`)]);
	rows.push([btn("В главное меню", "menu:home")]);
	return { inline_keyboard: rows };
}

export function faqAnswerKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("← К вопросам", "menu:faq")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function promosKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Записаться по акции", "promo:book")],
			[btn("← Назад", "menu:home")],
		],
	};
}

export function reviewsKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [
			[btn("Оставить отзыв", "reviews:leave")],
			[btn("В главное меню", "menu:home")],
		],
	};
}

export function cancelKeyboard(): InlineKeyboard {
	return {
		inline_keyboard: [[btn("Отменить", "book:cancel")]],
	};
}

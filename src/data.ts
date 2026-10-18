export interface Service {
	id: string;
	category: string;
	name: string;
	description: string;
	duration: string;
	price: string;
}

export interface Specialist {
	id: string;
	name: string;
	role: string;
	experience: string;
	about: string;
}

export interface FaqItem {
	id: string;
	question: string;
	answer: string;
}

export const STUDIO_NAME = "AURA Wellness Studio";

export const WELCOME_TEXT =
	"Добро пожаловать в AURA — пространство восстановления, ухода и заботы о себе.\n" +
	"Выберите, чем мы можем помочь.";

export const CATEGORIES: { id: string; title: string }[] = [
	{ id: "massage", title: "Массаж" },
	{ id: "spa", title: "SPA" },
	{ id: "face", title: "Уход за лицом" },
	{ id: "body", title: "Коррекция фигуры" },
];

export const SERVICES: Service[] = [
	{
		id: "relax",
		category: "massage",
		name: "Relax massage",
		description:
			"Мягкий расслабляющий массаж для снятия напряжения и восстановления сна.",
		duration: "60 мин",
		price: "3 500 ₽",
	},
	{
		id: "deep-tissue",
		category: "massage",
		name: "Deep tissue",
		description:
			"Глубокая проработка мышц спины, шеи и плеч. Для тех, кто много сидит и устаёт.",
		duration: "60 мин",
		price: "4 000 ₽",
	},
	{
		id: "aroma",
		category: "massage",
		name: "Aroma massage",
		description:
			"Массаж с натуральными маслами и ароматерапией. Полное расслабление и уход за кожей.",
		duration: "90 мин",
		price: "5 500 ₽",
	},
	{
		id: "spa-reset",
		category: "spa",
		name: "SPA Reset",
		description:
			"Фирменный ритуал: скраб, обёртывание и лёгкий массаж. Перезагрузка за один визит.",
		duration: "90 мин",
		price: "5 900 ₽",
	},
	{
		id: "body-ritual",
		category: "spa",
		name: "Body Ritual",
		description:
			"Расширенный SPA-уход: парение, скраб, массаж тела и чайная церемония.",
		duration: "120 мин",
		price: "7 500 ₽",
	},
	{
		id: "deep-hydration",
		category: "face",
		name: "Deep Hydration",
		description:
			"Глубокое увлажнение и восстановление кожи лица. Сияние уже после первой процедуры.",
		duration: "60 мин",
		price: "4 500 ₽",
	},
	{
		id: "glow-therapy",
		category: "face",
		name: "Glow Therapy",
		description:
			"Комплексный уход: очищение, массаж лица, маска и сыворотка по типу кожи.",
		duration: "75 мин",
		price: "5 500 ₽",
	},
	{
		id: "sculpt",
		category: "body",
		name: "Sculpt massage",
		description: "Активный моделирующий массаж для тонуса и контуров тела.",
		duration: "60 мин",
		price: "4 500 ₽",
	},
	{
		id: "body-balance",
		category: "body",
		name: "Body Balance",
		description:
			"Комплексная программа: лимфодренаж, моделирующий массаж и обёртывание.",
		duration: "90 мин",
		price: "6 500 ₽",
	},
];

export const ANY_SPECIALIST: Specialist = {
	id: "any",
	name: "Любой свободный специалист",
	role: "подберём под вашу услугу",
	experience: "",
	about:
		"Администратор подберёт лучшего специалиста под выбранную услугу и время.",
};

export const SPECIALISTS: Specialist[] = [
	{
		id: "anna",
		name: "Анна Воронцова",
		role: "массажист",
		experience: "7 лет практики",
		about:
			"Специализация — классический и relax-массаж, работа с напряжением спины и шеи.",
	},
	{
		id: "ekaterina",
		name: "Екатерина Морозова",
		role: "SPA-терапевт",
		experience: "SPA-ритуалы и уходы за телом",
		about:
			"Специализация — SPA Reset и Body Ritual, аромамассаж и обёртывания.",
	},
	{
		id: "maria",
		name: "Мария Соколова",
		role: "косметолог-эстетист",
		experience: "уход за лицом",
		about:
			"Специализация — Deep Hydration и Glow Therapy, подбор домашнего ухода.",
	},
];

export const FAQ: FaqItem[] = [
	{
		id: "prepare",
		question: "Как подготовиться к процедуре?",
		answer:
			"Приходите за 10–15 минут, не ешьте плотно за 1,5–2 часа и предупредите мастера о самочувствии. Всё остальное — полотенца, чай, косметика — мы предоставим.",
	},
	{
		id: "contra",
		question: "Есть ли противопоказания?",
		answer:
			"Острые воспаления, температура, обострение хронических заболеваний, беременность (для ряда процедур). Если сомневаетесь — напишите администратору, подскажем.",
	},
	{
		id: "cancel",
		question: "Как отменить или перенести запись?",
		answer:
			"Напишите администратору минимум за 12 часов — перенесём визит на удобное время без потери предоплаты.",
	},
	{
		id: "payment",
		question: "Какие способы оплаты?",
		answer:
			"Принимаем карты, переводы и наличные. Предоплата для новых гостей — 500 ₽.",
	},
	{
		id: "address",
		question: "Где находится студия?",
		answer:
			"Мы находимся в центре города, точный адрес и схему проезда пришлёт администратор после записи. Работаем ежедневно с 10:00 до 21:00.",
	},
];

export const PROMOS: { title: string; text: string }[] = [
	{
		title: "−15% на первое посещение",
		text: "Скидка 15% на любую процедуру при первом визите. Скажите администратору, что вы впервые в AURA.",
	},
	{
		title: "SPA Reset + Aroma Massage",
		text: "Комбо: SPA Reset + Aroma Massage — 7 900 ₽ вместо 9 400 ₽. Идеально для полного восстановления.",
	},
];

export const REVIEWS: { author: string; text: string }[] = [
	{
		author: "Ольга",
		text: "Была на Relax massage у Анны — уснула от расслабления. Очень бережное отношение, вернусь точно.",
	},
	{
		author: "Дарья",
		text: "Делала Glow Therapy — кожа сияет уже третий день. Мария подробно рассказала про уход.",
	},
	{
		author: "Ирина",
		text: "SPA Reset — лучший подарок себе за год. Тихо, тепло, вкусный чай. Спасибо Екатерине!",
	},
	{
		author: "Наталья",
		text: "Хожу на Sculpt massage курсом — минус 4 см в талии и лёгкость в теле. Рекомендую.",
	},
];

export const TIME_SLOTS = ["10:00", "12:00", "14:30", "17:00", "19:00"];

export function serviceById(id: string | undefined): Service | undefined {
	return SERVICES.find((s) => s.id === id);
}

export function specialistById(id: string | undefined): Specialist | undefined {
	if (id === "any") return ANY_SPECIALIST;
	return SPECIALISTS.find((s) => s.id === id);
}

export function servicesByCategory(categoryId: string): Service[] {
	return SERVICES.filter((s) => s.category === categoryId);
}

export function categoryTitle(id: string): string {
	return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

export function faqById(id: string | undefined): FaqItem | undefined {
	return FAQ.find((f) => f.id === id);
}

import { TIME_SLOTS } from "./data";

const WEEKDAYS_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS_RU = [
	"января",
	"февраля",
	"марта",
	"апреля",
	"мая",
	"июня",
	"июля",
	"августа",
	"сентября",
	"октября",
	"ноября",
	"декабря",
];

export interface DayOption {
	value: string; // YYYY-MM-DD
	label: string; // "Пн, 20 октября"
}

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

export function nextDays(count = 5): DayOption[] {
	const result: DayOption[] = [];
	const now = new Date();
	for (let i = 1; i <= count; i++) {
		const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
		const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		const weekday = WEEKDAYS_RU[d.getDay()];
		const label = `${weekday}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
		result.push({ value, label });
	}
	return result;
}

export function formatDateRu(value: string): string {
	const [y, m, d] = value.split("-").map(Number);
	if (!y || !m || !d) return value;
	const date = new Date(y, m - 1, d);
	const weekday = WEEKDAYS_RU[date.getDay()];
	return `${weekday}, ${d} ${MONTHS_RU[m - 1]}`;
}

export function isValidSlot(time: string): boolean {
	return TIME_SLOTS.includes(time);
}

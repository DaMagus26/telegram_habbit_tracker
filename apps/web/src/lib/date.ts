const WEEKDAY_SHORT_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTH_NAMES_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTH_SHORT_RU = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const WEEKDAY_LONG_RU = [
  "воскресенье", "понедельник", "вторник", "среда",
  "четверг", "пятница", "суббота",
];

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateShort(dateStr: string): string {
  const date = parseLocal(dateStr);
  return `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDateLong(dateStr: string): string {
  const date = parseLocal(dateStr);
  const wd = WEEKDAY_LONG_RU[date.getDay()];
  return `${wd}, ${date.getDate()} ${MONTH_NAMES_RU[date.getMonth()]}`;
}

export function formatWeekdayShort(dateStr: string): string {
  const date = parseLocal(dateStr);
  return WEEKDAY_SHORT_RU[date.getDay()];
}

export function getISOWeekStart(dateStr: string): string {
  const date = parseLocal(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return toISO(monday);
}

export function weekDays(weekStartStr: string): string[] {
  const start = parseLocal(weekStartStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISO(d);
  });
}

export function getWeekLabel(weekStartStr: string): string {
  const days = weekDays(weekStartStr);
  const first = parseLocal(days[0]);
  const last = parseLocal(days[6]);

  const firstMonth = first.getMonth();
  const lastMonth = last.getMonth();

  if (firstMonth === lastMonth) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_SHORT_RU[firstMonth]}`;
  }
  return `${first.getDate()} ${MONTH_SHORT_RU[firstMonth]} – ${last.getDate()} ${MONTH_SHORT_RU[lastMonth]}`;
}

export function canGoToNextWeek(weekStartStr: string): boolean {
  const days = weekDays(weekStartStr);
  const lastDay = parseLocal(days[6]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return lastDay < today;
}

export function todayISO(): string {
  return toISO(new Date());
}

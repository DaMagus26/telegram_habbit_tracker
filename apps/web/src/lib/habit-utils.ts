import type { Habit, WeekStatPoint } from "./types";
import { weekDays } from "./date";

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits
    .filter((h) => h.status === "active")
    .sort((a, b) => a.order - b.order);
}

export function getArchivedHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => h.status === "archived");
}

export function getCompletedSetForDate(
  completionsByDate: Record<string, string[]>,
  date: string,
): Set<string> {
  return new Set(completionsByDate[date] ?? []);
}

export function getWeekStats(
  weekStart: string,
  activeHabits: Habit[],
  completionsByDate: Record<string, string[]>,
): WeekStatPoint[] {
  const days = weekDays(weekStart);
  const activeIds = new Set(activeHabits.map((h) => h.id));

  return days.map((date) => {
    const completions = completionsByDate[date] ?? [];
    const completed = completions.filter((id) => activeIds.has(id)).length;
    return { date, completed };
  });
}

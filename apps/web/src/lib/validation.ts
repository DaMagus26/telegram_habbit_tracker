import { z } from "zod";
import { MAX_HABIT_TITLE_LENGTH } from "./constants";

export const habitSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(MAX_HABIT_TITLE_LENGTH),
  order: z.number().int().nonnegative(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  color: z.string().optional(),
});

export const completionsByDateSchema = z.record(z.string(), z.array(z.string()));

export const persistedDataSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  habits: z.array(habitSchema),
  completionsByDate: completionsByDateSchema,
});

export function normalizeHabitTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function validateHabitTitle(value: string): string | null {
  const normalized = normalizeHabitTitle(value);
  if (!normalized) {
    return "Введите название привычки.";
  }
  if (normalized.length > MAX_HABIT_TITLE_LENGTH) {
    return `Сократите до ${MAX_HABIT_TITLE_LENGTH} символов.`;
  }
  return null;
}

export function hasDuplicateTitle(titles: string[], nextValue: string): boolean {
  const normalized = normalizeHabitTitle(nextValue).toLocaleLowerCase("ru-RU");
  return titles.some((title) => normalizeHabitTitle(title).toLocaleLowerCase("ru-RU") === normalized);
}

import { create } from "zustand";
import type { Habit } from "./types";
import { getISOWeekStart, todayISO } from "./date";
import { CLOUD_UNAVAILABLE_MESSAGE, MAX_HABIT_TITLE_LENGTH, SYNC_ERROR_MESSAGE } from "./constants";
import { getWebApp } from "./telegram";

interface ActionResult {
  ok: boolean;
  error?: string;
}

interface AppState {
  status: "idle" | "loading" | "error" | "ready";
  loadError: string | null;
  notice: string | null;
  readOnly: boolean;
  syncState: "synced" | "syncing" | "error";
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
  selectedDate: string;
  selectedWeekStart: string;
  showFirstUseHint: boolean;

  initialize: () => Promise<void>;
  retryLoad: () => Promise<void>;
  retrySync: () => Promise<void>;
  selectDate: (date: string) => void;
  shiftWeek: (delta: number) => void;
  addHabit: (title: string) => Promise<ActionResult>;
  toggleHabit: (habitId: string) => Promise<void>;
  resetSelectedDay: () => Promise<void>;
  dismissFirstUseHint: () => void;
  renameHabit: (habitId: string, newTitle: string) => Promise<ActionResult>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  reorderActiveHabits: (orderedIds: string[]) => Promise<void>;
}

const STORAGE_KEY_HABITS = "habits_v1";
const STORAGE_KEY_COMPLETIONS = "completions_v1";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function nowISO(): string {
  return new Date().toISOString();
}

function cloudGet(key: string): Promise<string | null> {
  const cs = getWebApp()?.CloudStorage;
  if (!cs) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    cs.getItem(key, (err, val) => {
      if (err) reject(err);
      else resolve(val ?? null);
    });
  });
}

function cloudSet(key: string, value: string): Promise<void> {
  const cs = getWebApp()?.CloudStorage;
  if (!cs) return Promise.resolve();
  return new Promise((resolve, reject) => {
    cs.setItem(key, value, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function loadFromStorage(): Promise<{
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
  fromCloud: boolean;
}> {
  try {
    const [habitsRaw, completionsRaw] = await Promise.all([
      cloudGet(STORAGE_KEY_HABITS),
      cloudGet(STORAGE_KEY_COMPLETIONS),
    ]);

    if (habitsRaw !== null) {
      return {
        habits: JSON.parse(habitsRaw) as Habit[],
        completionsByDate: completionsRaw ? (JSON.parse(completionsRaw) as Record<string, string[]>) : {},
        fromCloud: true,
      };
    }
  } catch {
    // Fall through to localStorage
  }

  try {
    const habitsRaw = localStorage.getItem(STORAGE_KEY_HABITS);
    const completionsRaw = localStorage.getItem(STORAGE_KEY_COMPLETIONS);
    return {
      habits: habitsRaw ? (JSON.parse(habitsRaw) as Habit[]) : [],
      completionsByDate: completionsRaw ? (JSON.parse(completionsRaw) as Record<string, string[]>) : {},
      fromCloud: false,
    };
  } catch {
    return { habits: [], completionsByDate: {}, fromCloud: false };
  }
}

async function saveToStorage(
  habits: Habit[],
  completionsByDate: Record<string, string[]>,
): Promise<boolean> {
  const habitsStr = JSON.stringify(habits);
  const completionsStr = JSON.stringify(completionsByDate);

  localStorage.setItem(STORAGE_KEY_HABITS, habitsStr);
  localStorage.setItem(STORAGE_KEY_COMPLETIONS, completionsStr);

  try {
    await Promise.all([
      cloudSet(STORAGE_KEY_HABITS, habitsStr),
      cloudSet(STORAGE_KEY_COMPLETIONS, completionsStr),
    ]);
    return true;
  } catch {
    return false;
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const persist = async () => {
    const { habits, completionsByDate } = get();
    set({ syncState: "syncing" });
    const ok = await saveToStorage(habits, completionsByDate);
    set({ syncState: ok ? "synced" : "error", notice: ok ? null : SYNC_ERROR_MESSAGE });
  };

  const today = todayISO();

  return {
    status: "idle",
    loadError: null,
    notice: null,
    readOnly: false,
    syncState: "synced",
    habits: [],
    completionsByDate: {},
    selectedDate: today,
    selectedWeekStart: getISOWeekStart(today),
    showFirstUseHint: false,

    initialize: async () => {
      set({ status: "loading", loadError: null });
      try {
        const data = await loadFromStorage();
        const isFirstUse = data.habits.length === 0;
        set({
          status: "ready",
          habits: data.habits,
          completionsByDate: data.completionsByDate,
          notice: data.fromCloud ? null : (data.habits.length > 0 ? CLOUD_UNAVAILABLE_MESSAGE : null),
          showFirstUseHint: isFirstUse,
        });
      } catch (err) {
        set({
          status: "error",
          loadError: "Не удалось загрузить данные. Проверьте интернет и попробуйте снова.",
        });
      }
    },

    retryLoad: async () => {
      await get().initialize();
    },

    retrySync: async () => {
      await persist();
    },

    selectDate: (date: string) => {
      set({ selectedDate: date });
    },

    shiftWeek: (delta: number) => {
      const current = get().selectedWeekStart;
      const d = new Date(current + "T00:00:00");
      d.setDate(d.getDate() + delta * 7);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const newWeekStart = `${year}-${month}-${day}`;
      set({
        selectedWeekStart: newWeekStart,
        selectedDate: newWeekStart,
      });
    },

    addHabit: async (title: string): Promise<ActionResult> => {
      const trimmed = title.trim();
      if (!trimmed) return { ok: false, error: "Введите название привычки." };
      if (trimmed.length > MAX_HABIT_TITLE_LENGTH) return { ok: false, error: `Сократите до ${MAX_HABIT_TITLE_LENGTH} символов.` };

      const { habits } = get();
      const duplicate = habits.some(
        (h) => h.status === "active" && h.title.toLowerCase().trim() === trimmed.toLowerCase(),
      );
      if (duplicate) return { ok: false, error: "Такая привычка уже есть." };

      const maxOrder = habits.reduce((max, h) => Math.max(max, h.order), 0);
      const newHabit: Habit = {
        id: generateId(),
        title: trimmed,
        order: maxOrder + 1,
        status: "active",
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      set({ habits: [...habits, newHabit], showFirstUseHint: false });
      await persist();
      return { ok: true };
    },

    toggleHabit: async (habitId: string) => {
      const { completionsByDate, selectedDate } = get();
      const dayCompletions = completionsByDate[selectedDate] ?? [];
      const newCompletions = dayCompletions.includes(habitId)
        ? dayCompletions.filter((id) => id !== habitId)
        : [...dayCompletions, habitId];

      set({
        completionsByDate: {
          ...completionsByDate,
          [selectedDate]: newCompletions,
        },
      });
      await persist();
    },

    resetSelectedDay: async () => {
      const { completionsByDate, selectedDate } = get();
      const updated = { ...completionsByDate };
      delete updated[selectedDate];
      set({ completionsByDate: updated });
      await persist();
    },

    dismissFirstUseHint: () => {
      set({ showFirstUseHint: false });
    },

    renameHabit: async (habitId: string, newTitle: string): Promise<ActionResult> => {
      const trimmed = newTitle.trim();
      if (!trimmed) return { ok: false, error: "Введите название привычки." };
      if (trimmed.length > MAX_HABIT_TITLE_LENGTH) return { ok: false, error: `Сократите до ${MAX_HABIT_TITLE_LENGTH} символов.` };

      const { habits } = get();
      const duplicate = habits.some(
        (h) => h.id !== habitId && h.status === "active" && h.title.toLowerCase().trim() === trimmed.toLowerCase(),
      );
      if (duplicate) return { ok: false, error: "Такая привычка уже есть." };

      set({
        habits: habits.map((h) =>
          h.id === habitId ? { ...h, title: trimmed, updatedAt: nowISO() } : h,
        ),
      });
      await persist();
      return { ok: true };
    },

    archiveHabit: async (habitId: string) => {
      const { habits } = get();
      set({
        habits: habits.map((h) =>
          h.id === habitId ? { ...h, status: "archived" as const, updatedAt: nowISO() } : h,
        ),
      });
      await persist();
    },

    unarchiveHabit: async (habitId: string) => {
      const { habits } = get();
      const maxOrder = habits.reduce((max, h) => Math.max(max, h.order), 0);
      set({
        habits: habits.map((h) =>
          h.id === habitId ? { ...h, status: "active" as const, order: maxOrder + 1, updatedAt: nowISO() } : h,
        ),
      });
      await persist();
    },

    deleteHabit: async (habitId: string) => {
      const { habits } = get();
      set({ habits: habits.filter((h) => h.id !== habitId) });
      await persist();
    },

    reorderActiveHabits: async (orderedIds: string[]) => {
      const { habits } = get();
      const reordered = habits.map((h) => {
        const idx = orderedIds.indexOf(h.id);
        return idx >= 0 ? { ...h, order: idx, updatedAt: nowISO() } : h;
      });
      set({ habits: reordered });
      await persist();
    },
  };
});

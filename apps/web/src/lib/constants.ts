export const APP_TITLE = "Трекер привычек";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.0.0";
export const CLOUD_UNAVAILABLE_MESSAGE = "Синхронизация временно недоступна. Данные сохранены на устройстве.";
export const SYNC_ERROR_MESSAGE = "Не удалось сохранить изменения. Нажмите «Повторить».";
export const MAX_HABIT_TITLE_LENGTH = 60;
export const MAX_ACTIVE_HABITS = 50;


export const CURRENT_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  schemaVersion: "schema_version",
  habits: "habits",
  completions: "completions_by_date",
  fallbackSnapshot: "fallback_snapshot_v1",
} as const;

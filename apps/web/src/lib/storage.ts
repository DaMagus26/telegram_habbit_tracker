import {
  CLOUD_UNAVAILABLE_MESSAGE,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEYS,
  SYNC_ERROR_MESSAGE,
} from "./constants";
import { getWebApp } from "./telegram";
import type { LoadResult, PersistedDataV1, SaveResult } from "./types";
import { persistedDataSchemaV1 } from "./validation";

const RETRY_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T>(operation: () => Promise<T>, attempts = RETRY_ATTEMPTS): Promise<T> {
  let error: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (nextError) {
      error = nextError;
      if (index < attempts - 1) {
        await sleep(250 * 2 ** index);
      }
    }
  }
  throw error;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function defaultData(): PersistedDataV1 {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits: [],
    completionsByDate: {},
  };
}

function parseRecord(values: Record<string, string>): LoadResult {
  const schemaVersionRaw = values[STORAGE_KEYS.schemaVersion];
  const habitsRaw = values[STORAGE_KEYS.habits];
  const completionsRaw = values[STORAGE_KEYS.completions];

  if (!schemaVersionRaw && !habitsRaw && !completionsRaw) {
    return {
      data: defaultData(),
      mode: "cloud",
      readOnly: false,
    };
  }

  const schemaVersion = Number(schemaVersionRaw ?? CURRENT_SCHEMA_VERSION);
  const habits = habitsRaw ? JSON.parse(habitsRaw) : [];
  const completionsByDate = completionsRaw ? JSON.parse(completionsRaw) : {};

  if (!Number.isFinite(schemaVersion)) {
    throw new Error("schema_version invalid");
  }

  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    const data = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      habits: Array.isArray(habits) ? habits : [],
      completionsByDate:
        completionsByDate && typeof completionsByDate === "object" ? completionsByDate : {},
    };
    const parsed = persistedDataSchemaV1.safeParse(data);
    return {
      data: parsed.success ? parsed.data : defaultData(),
      mode: "cloud",
      readOnly: true,
      warning: "Обнаружена более новая версия данных. Приложение запущено в режиме чтения.",
    };
  }

  const candidate = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits,
    completionsByDate,
  };

  const parsed = persistedDataSchemaV1.safeParse(candidate);
  if (!parsed.success) {
    throw new Error("invalid data format");
  }

  return {
    data: parsed.data,
    mode: "cloud",
    readOnly: false,
  };
}

function getLocalSnapshot(): LoadResult {
  const raw = localStorage.getItem(STORAGE_KEYS.fallbackSnapshot);
  if (!raw) {
    return {
      data: defaultData(),
      mode: "local",
      readOnly: false,
      warning: CLOUD_UNAVAILABLE_MESSAGE,
    };
  }

  const parsed = persistedDataSchemaV1.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("local snapshot invalid");
  }

  return {
    data: parsed.data,
    mode: "local",
    readOnly: false,
    warning: CLOUD_UNAVAILABLE_MESSAGE,
  };
}

function writeLocalSnapshot(data: PersistedDataV1): void {
  localStorage.setItem(STORAGE_KEYS.fallbackSnapshot, JSON.stringify(data));
}

async function cloudGetItems(keys: string[]): Promise<Record<string, string>> {
  const cloud = getWebApp()?.CloudStorage;
  if (!cloud) {
    throw new Error("cloud storage unavailable");
  }

  return withTimeout(
    new Promise<Record<string, string>>((resolve, reject) => {
      cloud.getItems(keys, (error, values) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve(values ?? {});
      });
    }),
  );
}

async function cloudSetItem(key: string, value: string): Promise<void> {
  const cloud = getWebApp()?.CloudStorage;
  if (!cloud) {
    throw new Error("cloud storage unavailable");
  }

  await withTimeout(
    new Promise<void>((resolve, reject) => {
      cloud.setItem(key, value, (error) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve();
      });
    }),
  );
}

async function loadFromCloud(): Promise<LoadResult> {
  const values = await retry(() =>
    cloudGetItems([STORAGE_KEYS.schemaVersion, STORAGE_KEYS.habits, STORAGE_KEYS.completions]),
  );
  return parseRecord(values);
}

async function saveToCloud(data: PersistedDataV1): Promise<void> {
  await retry(async () => {
    await Promise.all([
      cloudSetItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION)),
      cloudSetItem(STORAGE_KEYS.habits, JSON.stringify(data.habits)),
      cloudSetItem(STORAGE_KEYS.completions, JSON.stringify(data.completionsByDate)),
    ]);
  });
}

export async function loadPersistedData(): Promise<LoadResult> {
  try {
    const cloudResult = await loadFromCloud();
    writeLocalSnapshot(cloudResult.data);
    return cloudResult;
  } catch {
    try {
      return getLocalSnapshot();
    } catch {
      throw new Error("Не удалось загрузить данные. Проверьте интернет и попробуйте снова.");
    }
  }
}

export async function savePersistedData(data: PersistedDataV1): Promise<SaveResult> {
  writeLocalSnapshot(data);

  try {
    await saveToCloud(data);
    return {
      mode: "cloud",
      synced: true,
    };
  } catch {
    return {
      mode: "local",
      synced: false,
      warning: SYNC_ERROR_MESSAGE,
    };
  }
}

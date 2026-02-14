export interface Habit {
  id: string;
  title: string;
  order: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface WeekStatPoint {
  date: string;
  completed: number;
}

export interface AppData {
  schema_version: number;
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
}


export interface PersistedDataV1 {
  schemaVersion: 1;
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
}

export interface LoadResult {
  data: PersistedDataV1;
  mode: "cloud" | "local";
  readOnly: boolean;
  warning?: string;
}

export interface SaveResult {
  mode: "cloud" | "local";
  synced: boolean;
  warning?: string;
}

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

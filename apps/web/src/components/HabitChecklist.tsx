import type { Habit } from "../lib/types";

interface HabitChecklistProps {
  habits: Habit[];
  completedIds: Set<string>;
  disabled?: boolean;
  syncError?: boolean;
  onToggle: (habitId: string) => void;
  onAdd: () => void;
}

function CheckIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HabitChecklist({
  habits,
  completedIds,
  disabled = false,
  syncError = false,
  onToggle,
  onAdd,
}: HabitChecklistProps): JSX.Element {
  if (habits.length === 0) {
    return (
      <section className="panel empty-state">
        <h3>Пока нет привычек</h3>
        <p>Создайте 1-3 привычки, которые хотите выполнять ежедневно.</p>
        <button type="button" className="btn btn-primary" onClick={onAdd} disabled={disabled}>
          Добавить привычку
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel__header panel__header--between">
        <h3>Привычки</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd} disabled={disabled}>
          + Добавить
        </button>
      </div>
      <ul className="habit-list">
        {habits.map((habit, index) => {
          const checked = completedIds.has(habit.id);
          return (
            <li
              key={habit.id}
              className="habit-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <label>
                <span className={`habit-item__title ${checked ? "habit-item__title--done" : ""}`}>
                  {habit.title}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {syncError ? (
                    <span className="sync-warning-dot" title="Сохранение не завершено, повторите синхронизацию">
                      !
                    </span>
                  ) : null}
                  <span className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      aria-label={`Отметить привычку ${habit.title}`}
                      onChange={() => onToggle(habit.id)}
                    />
                    <span className="checkbox-visual">
                      <CheckIcon />
                    </span>
                  </span>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

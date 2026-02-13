import type { Habit } from "../lib/types";

interface HabitChecklistProps {
  habits: Habit[];
  completedIds: Set<string>;
  disabled?: boolean;
  syncError?: boolean;
  onToggle: (habitId: string) => void;
  onAdd: () => void;
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
        <button type="button" className="btn btn-secondary" onClick={onAdd} disabled={disabled}>
          + Добавить
        </button>
      </div>
      <ul className="habit-list">
        {habits.map((habit) => {
          const checked = completedIds.has(habit.id);
          return (
            <li key={habit.id} className="habit-item">
              <label>
                <span>{habit.title}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  aria-label={`Отметить привычку ${habit.title}`}
                  onChange={() => onToggle(habit.id)}
                />
                {syncError ? (
                  <span className="sync-warning-dot" title="Сохранение не завершено, повторите синхронизацию">
                    !
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

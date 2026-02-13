import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner } from "../components/Banner";
import { APP_TITLE } from "../lib/constants";
import { getActiveHabits, getArchivedHabits } from "../lib/habit-utils";
import { getWebApp } from "../lib/telegram";
import { useAppStore } from "../lib/useAppStore";

function reorderByMove(list: string[], fromId: string, toId: string): string[] {
  const fromIndex = list.indexOf(fromId);
  const toIndex = list.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) {
    return list;
  }

  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ManageHabitsPage(): JSX.Element {
  const navigate = useNavigate();

  const status = useAppStore((state) => state.status);
  const loadError = useAppStore((state) => state.loadError);
  const notice = useAppStore((state) => state.notice);
  const readOnly = useAppStore((state) => state.readOnly);
  const habits = useAppStore((state) => state.habits);
  const initialize = useAppStore((state) => state.initialize);
  const retryLoad = useAppStore((state) => state.retryLoad);
  const addHabit = useAppStore((state) => state.addHabit);
  const renameHabit = useAppStore((state) => state.renameHabit);
  const archiveHabit = useAppStore((state) => state.archiveHabit);
  const unarchiveHabit = useAppStore((state) => state.unarchiveHabit);
  const deleteHabit = useAppStore((state) => state.deleteHabit);
  const reorderActiveHabits = useAppStore((state) => state.reorderActiveHabits);

  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);
  const archivedHabits = useMemo(() => getArchivedHabits(habits), [habits]);

  const [newTitle, setNewTitle] = useState("");
  const [newTitleError, setNewTitleError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [draggingHabitId, setDraggingHabitId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "idle") {
      void initialize();
    }
  }, [initialize, status]);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) {
      return;
    }

    const onBack = () => navigate("/");
    const onDone = () => navigate("/");

    webApp.BackButton?.show();
    webApp.BackButton?.onClick(onBack);

    webApp.MainButton?.setText("Готово").show();
    webApp.MainButton?.onClick(onDone);

    return () => {
      webApp.BackButton?.offClick(onBack);
      webApp.BackButton?.hide();
      webApp.MainButton?.offClick(onDone);
      webApp.MainButton?.hide();
    };
  }, [navigate]);

  if (status === "loading" || status === "idle") {
    return (
      <main className="page page--centered">
        <div className="panel">Загрузка...</div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="page page--centered">
        <section className="panel empty-state">
          <h3>Ошибка загрузки</h3>
          <p>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void retryLoad()}>
            Повторить
          </button>
        </section>
      </main>
    );
  }

  const handleAddHabit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await addHabit(newTitle);
    if (!result.ok) {
      setNewTitleError(result.error ?? "Не удалось добавить привычку");
      return;
    }
    setNewTitle("");
    setNewTitleError(null);
  };

  const handleRename = async () => {
    if (!editingId) {
      return;
    }
    const result = await renameHabit(editingId, editingTitle);
    if (!result.ok) {
      setEditingError(result.error ?? "Не удалось переименовать привычку");
      return;
    }
    setEditingError(null);
    setEditingId(null);
    setEditingTitle("");
  };

  const handleDrop = async (targetId: string) => {
    if (!draggingHabitId || draggingHabitId === targetId) {
      return;
    }
    const order = reorderByMove(
      activeHabits.map((habit) => habit.id),
      draggingHabitId,
      targetId,
    );
    await reorderActiveHabits(order);
    setDraggingHabitId(null);
  };

  return (
    <main className="page">
      <header className="header">
        <button type="button" className="icon-button" onClick={() => navigate("/")} aria-label="Назад">
          ←
        </button>
        <h1>{APP_TITLE}</h1>
        <span className="header__spacer" />
      </header>

      {notice ? <Banner tone="warning">{notice}</Banner> : null}

      <section className="panel">
        <h3>+ Добавить привычку</h3>
        <form className="stack" onSubmit={handleAddHabit}>
          <input
            value={newTitle}
            onChange={(event) => {
              setNewTitle(event.target.value);
              setNewTitleError(null);
            }}
            placeholder="Название привычки"
            disabled={readOnly}
          />
          {newTitleError ? <p className="field-error">{newTitleError}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={readOnly}>
            Добавить привычку
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Активные привычки</h3>
        {activeHabits.length === 0 ? <p className="muted">Нет активных привычек.</p> : null}

        <ul className="manage-list">
          {activeHabits.map((habit) => {
            const isEditing = editingId === habit.id;
            return (
              <li
                key={habit.id}
                draggable={!readOnly}
                className="manage-item"
                onDragStart={() => setDraggingHabitId(habit.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleDrop(habit.id)}
              >
                <span className="drag-handle" aria-hidden>
                  ⋮⋮
                </span>

                {isEditing ? (
                  <div className="manage-item__editor">
                    <input
                      value={editingTitle}
                      onChange={(event) => {
                        setEditingTitle(event.target.value);
                        setEditingError(null);
                      }}
                      autoFocus
                    />
                    {editingError ? <p className="field-error">{editingError}</p> : null}
                  </div>
                ) : (
                  <span className="manage-item__title">{habit.title}</span>
                )}

                <div className="manage-item__actions">
                  {isEditing ? (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={() => void handleRename()}>
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="btn btn-tertiary"
                        onClick={() => {
                          setEditingId(null);
                          setEditingTitle("");
                          setEditingError(null);
                        }}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-tertiary"
                        onClick={() => {
                          setEditingId(habit.id);
                          setEditingTitle(habit.title);
                          setEditingError(null);
                        }}
                        disabled={readOnly}
                      >
                        Переименовать
                      </button>
                      <button
                        type="button"
                        className="btn btn-tertiary"
                        onClick={() => void archiveHabit(habit.id)}
                        disabled={readOnly}
                      >
                        Архивировать
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          if (window.confirm("Удалить привычку?")) {
                            void deleteHabit(habit.id);
                          }
                        }}
                        disabled={readOnly}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h3>Архив</h3>
        {archivedHabits.length === 0 ? <p className="muted">Архив пуст.</p> : null}
        <ul className="manage-list">
          {archivedHabits.map((habit) => (
            <li key={habit.id} className="manage-item">
              <span className="manage-item__title">{habit.title}</span>
              <div className="manage-item__actions">
                <button
                  type="button"
                  className="btn btn-tertiary"
                  onClick={() => void unarchiveHabit(habit.id)}
                  disabled={readOnly}
                >
                  Разархивировать
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm("Удалить привычку?")) {
                      void deleteHabit(habit.id);
                    }
                  }}
                  disabled={readOnly}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

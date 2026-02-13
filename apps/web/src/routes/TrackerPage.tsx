import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner } from "../components/Banner";
import { DayNavigator } from "../components/DayNavigator";
import { DrawerMenu } from "../components/DrawerMenu";
import { HabitChecklist } from "../components/HabitChecklist";
import { Modal } from "../components/Modal";
import { WeekChart } from "../components/WeekChart";
import {
  APP_TITLE,
  APP_VERSION,
  CLOUD_UNAVAILABLE_MESSAGE,
  SYNC_ERROR_MESSAGE,
} from "../lib/constants";
import { canGoToNextWeek, formatDateLong, getWeekLabel, weekDays } from "../lib/date";
import {
  getActiveHabits,
  getCompletedSetForDate,
  getWeekStats,
} from "../lib/habit-utils";
import { getCurrentUserLabel, getWebApp } from "../lib/telegram";
import { useAppStore } from "../lib/useAppStore";

export function TrackerPage(): JSX.Element {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const status = useAppStore((state) => state.status);
  const loadError = useAppStore((state) => state.loadError);
  const notice = useAppStore((state) => state.notice);
  const readOnly = useAppStore((state) => state.readOnly);
  const syncState = useAppStore((state) => state.syncState);
  const habits = useAppStore((state) => state.habits);
  const completionsByDate = useAppStore((state) => state.completionsByDate);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const selectedWeekStart = useAppStore((state) => state.selectedWeekStart);
  const showFirstUseHint = useAppStore((state) => state.showFirstUseHint);

  const initialize = useAppStore((state) => state.initialize);
  const retryLoad = useAppStore((state) => state.retryLoad);
  const retrySync = useAppStore((state) => state.retrySync);
  const selectDate = useAppStore((state) => state.selectDate);
  const shiftWeek = useAppStore((state) => state.shiftWeek);
  const addHabit = useAppStore((state) => state.addHabit);
  const toggleHabit = useAppStore((state) => state.toggleHabit);
  const resetSelectedDay = useAppStore((state) => state.resetSelectedDay);
  const dismissFirstUseHint = useAppStore((state) => state.dismissFirstUseHint);

  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);
  const selectedDayCompleted = useMemo(
    () => getCompletedSetForDate(completionsByDate, selectedDate),
    [completionsByDate, selectedDate],
  );
  const weeklyPoints = useMemo(
    () => getWeekStats(selectedWeekStart, activeHabits, completionsByDate),
    [selectedWeekStart, activeHabits, completionsByDate],
  );
  const weekDates = useMemo(() => weekDays(selectedWeekStart), [selectedWeekStart]);

  useEffect(() => {
    if (status === "idle") {
      void initialize();
    }
  }, [initialize, status]);

  useEffect(() => {
    const webApp = getWebApp();
    if (!webApp?.MainButton) {
      return;
    }

    const onMainButton = () => setCreateOpen(true);
    webApp.MainButton.setText("Добавить привычку").show();
    webApp.MainButton.onClick(onMainButton);

    return () => {
      webApp.MainButton?.offClick(onMainButton);
      webApp.MainButton?.hide();
    };
  }, []);

  const handleCreateHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await addHabit(newTitle);
    if (!result.ok) {
      setFormError(result.error ?? "Не удалось добавить привычку");
      return;
    }
    setNewTitle("");
    setFormError(null);
    setCreateOpen(false);
  };

  const handleResetDay = () => {
    const confirmed = window.confirm("Сбросить отметки за выбранный день?");
    if (!confirmed) {
      return;
    }
    void resetSelectedDay();
  };

  if (status === "loading" || status === "idle") {
    return (
      <main className="page page--centered">
        <div className="panel">Загрузка данных...</div>
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

  return (
    <main className="page">
      <header className="header">
        <h1>{APP_TITLE}</h1>
        <button type="button" className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Открыть меню">
          ☰
        </button>
      </header>

      {showFirstUseHint ? (
        <Banner tone="info" actionLabel="Понятно" onAction={dismissFirstUseHint}>
          Нажимайте на чекбоксы, чтобы отмечать выполнение.
        </Banner>
      ) : null}

      {notice ? (
        <Banner
          tone={notice === SYNC_ERROR_MESSAGE ? "error" : "warning"}
          actionLabel={
            syncState === "error" || notice === CLOUD_UNAVAILABLE_MESSAGE ? "Повторить" : undefined
          }
          onAction={
            syncState === "error" || notice === CLOUD_UNAVAILABLE_MESSAGE
              ? () => void retrySync()
              : undefined
          }
        >
          {notice}
        </Banner>
      ) : null}

      {readOnly ? <Banner tone="warning">Режим только чтение. Обновите приложение и перезапустите.</Banner> : null}

      <section className="week-controls">
        <button type="button" className="btn btn-secondary" onClick={() => shiftWeek(-1)}>
          ← Предыдущая
        </button>
        <strong>{getWeekLabel(selectedWeekStart)}</strong>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => shiftWeek(1)}
          disabled={!canGoToNextWeek(selectedWeekStart)}
        >
          Следующая →
        </button>
      </section>

      <section className="content-grid">
        <HabitChecklist
          habits={activeHabits}
          completedIds={selectedDayCompleted}
          disabled={readOnly}
          syncError={syncState === "error"}
          onToggle={(habitId) => void toggleHabit(habitId)}
          onAdd={() => setCreateOpen(true)}
        />

        <WeekChart
          points={weeklyPoints}
          selectedDate={selectedDate}
          activeHabitsCount={activeHabits.length}
          onSelectDate={selectDate}
        />
      </section>

      <DayNavigator days={weekDates} selectedDate={selectedDate} onSelect={selectDate} />

      <p className="muted page__footer">Выбранный день: {formatDateLong(selectedDate)}</p>

      <DrawerMenu
        open={drawerOpen}
        canGoNextWeek={canGoToNextWeek(selectedWeekStart)}
        onClose={() => setDrawerOpen(false)}
        onManage={() => navigate("/manage")}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
        onResetDay={handleResetDay}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      <Modal title="Добавить привычку" open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="stack" onSubmit={handleCreateHabit}>
          <label className="stack">
            <span>Название</span>
            <input
              value={newTitle}
              onChange={(event) => {
                setNewTitle(event.target.value);
                setFormError(null);
              }}
              maxLength={60}
              placeholder="Например: Пить воду"
              autoFocus
            />
          </label>
          {formError ? <p className="field-error">{formError}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={readOnly}>
            Сохранить
          </button>
        </form>
      </Modal>

      <Modal title="Справка" open={helpOpen} onClose={() => setHelpOpen(false)}>
        <ol className="stack stack--numbered">
          <li>Добавьте привычки через кнопку «Добавить».</li>
          <li>Выберите день внизу или на графике.</li>
          <li>Отмечайте выполненные привычки чекбоксами.</li>
          <li>Переключайте недели стрелками.</li>
          <li>Управляйте архивом и порядком в разделе «Управление привычками».</li>
          <li>Если сеть пропала, данные сохраняются на устройстве.</li>
        </ol>
      </Modal>

      <Modal title="О приложении" open={aboutOpen} onClose={() => setAboutOpen(false)}>
        <div className="stack">
          <p>Версия: {APP_VERSION}</p>
          <p>Пользователь: {getCurrentUserLabel() ?? "не определён"}</p>
          <p>Формат: Telegram Mini App</p>
        </div>
      </Modal>
    </main>
  );
}

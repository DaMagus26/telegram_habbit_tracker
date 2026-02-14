interface DrawerMenuProps {
  open: boolean;
  canGoNextWeek: boolean;
  onClose: () => void;
  onManage: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetDay: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
}

export function DrawerMenu({
  open,
  canGoNextWeek,
  onClose,
  onManage,
  onPrevWeek,
  onNextWeek,
  onResetDay,
  onOpenHelp,
  onOpenAbout,
}: DrawerMenuProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  const run = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label="Меню" onClick={(event) => event.stopPropagation()}>
        <div className="drawer__handle" />
        <button type="button" className="drawer__item" onClick={() => run(onManage)}>
          Управление привычками
        </button>
        <button type="button" className="drawer__item" onClick={() => run(onPrevWeek)}>
          Предыдущая неделя
        </button>
        <button
          type="button"
          className="drawer__item"
          onClick={() => run(onNextWeek)}
          disabled={!canGoNextWeek}
        >
          Следующая неделя
        </button>
        <div className="drawer__separator" />
        <button type="button" className="drawer__item drawer__item--danger" onClick={() => run(onResetDay)}>
          Сброс отметок за день
        </button>
        <div className="drawer__separator" />
        <button type="button" className="drawer__item" onClick={() => run(onOpenHelp)}>
          Справка
        </button>
        <button type="button" className="drawer__item" onClick={() => run(onOpenAbout)}>
          О приложении
        </button>
      </aside>
    </div>
  );
}

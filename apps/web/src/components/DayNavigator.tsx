import { formatDateShort, formatWeekdayShort } from "../lib/date";

interface DayNavigatorProps {
  days: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DayNavigator({ days, selectedDate, onSelect }: DayNavigatorProps): JSX.Element {
  return (
    <nav className="day-nav" aria-label="Дни недели">
      {days.map((date) => (
        <button
          key={date}
          type="button"
          className={`day-nav__item ${selectedDate === date ? "is-selected" : ""}`}
          onClick={() => onSelect(date)}
        >
          <span>{formatWeekdayShort(date)}</span>
          <strong>{formatDateShort(date)}</strong>
        </button>
      ))}
    </nav>
  );
}

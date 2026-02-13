import { formatDateShort, formatWeekdayShort } from "../lib/date";
import type { WeekStatPoint } from "../lib/types";

interface WeekChartProps {
  points: WeekStatPoint[];
  selectedDate: string;
  activeHabitsCount: number;
  onSelectDate: (date: string) => void;
}

export function WeekChart({
  points,
  selectedDate,
  activeHabitsCount,
  onSelectDate,
}: WeekChartProps): JSX.Element {
  const width = 680;
  const height = 260;
  const paddingX = 44;
  const paddingY = 30;
  const maxY = Math.max(activeHabitsCount, 1);

  const chartPoints = points.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
    const y = height - paddingY - (point.completed / maxY) * (height - paddingY * 2);
    return {
      ...point,
      x,
      y,
    };
  });

  const path = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="panel chart-panel" aria-label="Прогресс по неделе">
      <div className="panel__header">
        <h3>Выполнено привычек за неделю</h3>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label="Линейный график">
        {Array.from({ length: maxY + 1 }, (_, index) => {
          const y = height - paddingY - (index / maxY) * (height - paddingY * 2);
          return <line key={index} x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="chart__grid" />;
        })}
        <polyline points={path} className="chart__line" />

        {chartPoints.map((point) => (
          <g key={point.date} onClick={() => onSelectDate(point.date)} className="chart__point-group">
            <circle
              cx={point.x}
              cy={point.y}
              r={selectedDate === point.date ? 8 : 6}
              className={`chart__point ${selectedDate === point.date ? "is-selected" : ""}`}
              tabIndex={0}
              role="button"
              aria-label={`${formatDateShort(point.date)} выполнено ${point.completed} из ${activeHabitsCount}`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDate(point.date);
                }
              }}
            >
              <title>{`${formatDateShort(point.date)} — выполнено ${point.completed} из ${activeHabitsCount}`}</title>
            </circle>
            <text x={point.x} y={height - 6} textAnchor="middle" className="chart__label">
              {formatWeekdayShort(point.date)}
            </text>
          </g>
        ))}
      </svg>

      {activeHabitsCount === 0 ? (
        <p className="muted">Добавьте привычки и отметьте выполнение.</p>
      ) : null}

      <p className="muted">
        Нажмите на точку графика, чтобы выбрать день: <strong>{formatDateShort(selectedDate)}</strong>
      </p>
    </section>
  );
}

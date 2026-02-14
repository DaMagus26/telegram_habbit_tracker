import { formatDateShort, formatWeekdayShort } from "../lib/date";
import type { WeekStatPoint } from "../lib/types";

interface WeekChartProps {
  points: WeekStatPoint[];
  selectedDate: string;
  activeHabitsCount: number;
  onSelectDate: (date: string) => void;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) {
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
  }

  let d = `M${pts[0].x},${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx = (curr.x + next.x) / 2;
    d += ` C${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
  }

  return d;
}

function areaPath(pts: { x: number; y: number }[], baseY: number): string {
  if (pts.length < 2) return "";

  let d = `M${pts[0].x},${baseY} L${pts[0].x},${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx = (curr.x + next.x) / 2;
    d += ` C${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
  }

  d += ` L${pts[pts.length - 1].x},${baseY} Z`;
  return d;
}

export function WeekChart({
  points,
  selectedDate,
  activeHabitsCount,
  onSelectDate,
}: WeekChartProps): JSX.Element {
  const width = 340;
  const height = 180;
  const paddingX = 28;
  const paddingTop = 16;
  const paddingBottom = 28;
  const maxY = Math.max(activeHabitsCount, 1);

  const chartPoints = points.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
    const y = height - paddingBottom - (point.completed / maxY) * (height - paddingTop - paddingBottom);
    return {
      ...point,
      x,
      y,
    };
  });

  const baseY = height - paddingBottom;
  const curvePath = smoothPath(chartPoints);
  const fillPath = areaPath(chartPoints, baseY);

  return (
    <section className="panel chart-panel" aria-label="Прогресс по неделе">
      <div className="panel__header">
        <h3>Прогресс за неделю</h3>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label="Линейный график">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: maxY + 1 }, (_, index) => {
          const y = height - paddingBottom - (index / maxY) * (height - paddingTop - paddingBottom);
          return (
            <line
              key={index}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              className="chart__grid"
            />
          );
        })}

        {fillPath ? (
          <path d={fillPath} fill="url(#chartGradient)" className="chart__area" />
        ) : null}

        <path d={curvePath} className="chart__line" />

        {chartPoints.map((point) => {
          const isSelected = selectedDate === point.date;
          return (
            <g key={point.date} onClick={() => onSelectDate(point.date)} style={{ cursor: "pointer" }}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isSelected ? 7 : 5}
                className={`chart__point ${isSelected ? "is-selected" : ""}`}
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
              <text
                x={point.x}
                y={height - 6}
                textAnchor="middle"
                className={`chart__label ${isSelected ? "is-selected" : ""}`}
              >
                {formatWeekdayShort(point.date)}
              </text>
            </g>
          );
        })}
      </svg>

      {activeHabitsCount === 0 ? (
        <p className="muted" style={{ textAlign: "center", marginTop: 8 }}>
          Добавьте привычки и отметьте выполнение.
        </p>
      ) : null}
    </section>
  );
}

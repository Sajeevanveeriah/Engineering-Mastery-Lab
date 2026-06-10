export interface Series {
  name: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
}

interface LinePlotProps {
  series: Series[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  /** Optional fixed y-range; otherwise auto-scaled with padding. */
  yMin?: number;
  yMax?: number;
  title?: string;
}

/** Lightweight SVG line plot with axes, used by all labs. */
export function LinePlot({ series, width = 640, height = 280, xLabel, yLabel, yMin, yMax, title }: LinePlotProps) {
  const pad = { l: 48, r: 12, t: 14, b: 30 };
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" />;

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs) || 1;
  let y0 = yMin ?? Math.min(...ys);
  let y1 = yMax ?? Math.max(...ys);
  if (y0 === y1) {
    y0 -= 1;
    y1 += 1;
  }
  const spanPad = yMin === undefined && yMax === undefined ? (y1 - y0) * 0.08 : 0;
  y0 -= spanPad;
  y1 += spanPad;

  const sx = (x: number) => pad.l + ((x - x0) / (x1 - x0)) * (width - pad.l - pad.r);
  const sy = (y: number) => height - pad.b - ((y - y0) / (y1 - y0)) * (height - pad.t - pad.b);

  const ticksY = 4;
  const ticksX = 5;
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toExponential(1) : Number(v.toPrecision(3)).toString());

  return (
    <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title ?? "line plot"}>
      {Array.from({ length: ticksY + 1 }, (_, i) => {
        const yv = y0 + ((y1 - y0) * i) / ticksY;
        return (
          <g key={`y${i}`}>
            <line x1={pad.l} x2={width - pad.r} y1={sy(yv)} y2={sy(yv)} stroke="currentColor" opacity={0.12} />
            <text x={pad.l - 6} y={sy(yv) + 4} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.6}>
              {fmt(yv)}
            </text>
          </g>
        );
      })}
      {Array.from({ length: ticksX + 1 }, (_, i) => {
        const xv = x0 + ((x1 - x0) * i) / ticksX;
        return (
          <text key={`x${i}`} x={sx(xv)} y={height - pad.b + 16} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
            {fmt(xv)}
          </text>
        );
      })}
      {series.map((s) => (
        <polyline
          key={s.name}
          fill="none"
          stroke={s.color}
          strokeWidth={1.8}
          strokeDasharray={s.dashed ? "5 4" : undefined}
          points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
        />
      ))}
      {series.map((s, i) => (
        <g key={`leg-${s.name}`}>
          <rect x={pad.l + 8 + i * 110} y={pad.t} width={12} height={3} fill={s.color} />
          <text x={pad.l + 24 + i * 110} y={pad.t + 5} fontSize={10} fill="currentColor" opacity={0.8}>
            {s.name}
          </text>
        </g>
      ))}
      {xLabel && (
        <text x={(pad.l + width - pad.r) / 2} y={height - 4} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={12} y={pad.t + 8} fontSize={10} fill="currentColor" opacity={0.6}>
          {yLabel}
        </text>
      )}
    </svg>
  );
}

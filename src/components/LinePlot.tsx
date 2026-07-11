import { useId } from "react";

export interface Series {
  name: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
  kind?: "line" | "scatter";
}

export interface FinitePlotData {
  series: Series[];
  totalPoints: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Filters invalid points and derives bounds in one iterative pass. Keeping the
 * extrema calculation iterative avoids JavaScript engine argument limits for
 * large engineering data sets.
 */
export function prepareFinitePlotData(series: Series[]): FinitePlotData | null {
  let totalPoints = 0;
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  const finiteSeries = series.map((item) => {
    const points: Series["points"] = [];
    for (const point of item.points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
      points.push(point);
      totalPoints += 1;
      if (point.x < xMin) xMin = point.x;
      if (point.x > xMax) xMax = point.x;
      if (point.y < yMin) yMin = point.y;
      if (point.y > yMax) yMax = point.y;
    }
    return { ...item, points };
  });

  if (totalPoints === 0) return null;
  return { series: finiteSeries, totalPoints, xMin, xMax, yMin, yMax };
}

/**
 * Produces a bounded visual sample while retaining the first, last and local
 * extrema from each source-order bucket. The caller keeps the full data set for
 * ranges, descriptions and evidence tables.
 */
export function downsamplePlotPoints(points: Series["points"], maxPoints: number): Series["points"] {
  const limit = Number.isFinite(maxPoints) ? Math.max(2, Math.floor(maxPoints)) : 2;
  if (points.length <= limit) return points;
  if (limit === 2) return [points[0], points[points.length - 1]];

  if (limit === 3) {
    const first = points[0];
    const last = points[points.length - 1];
    let selectedIndex = 1;
    let largestDeviation = Number.NEGATIVE_INFINITY;
    for (let index = 1; index < points.length - 1; index += 1) {
      const progress = index / (points.length - 1);
      const interpolatedY = first.y + (last.y - first.y) * progress;
      const deviation = Math.abs(points[index].y - interpolatedY);
      if (deviation > largestDeviation) {
        largestDeviation = deviation;
        selectedIndex = index;
      }
    }
    return [first, points[selectedIndex], last];
  }

  const bucketCount = Math.max(1, Math.floor((limit - 2) / 2));
  const interiorCount = points.length - 2;
  const sampled: Series["points"] = [points[0]];

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = 1 + Math.floor((bucket * interiorCount) / bucketCount);
    const end = Math.min(points.length - 1, 1 + Math.floor(((bucket + 1) * interiorCount) / bucketCount));
    if (start >= end) continue;

    let minIndex = start;
    let maxIndex = start;
    for (let index = start + 1; index < end; index += 1) {
      if (points[index].y < points[minIndex].y) minIndex = index;
      if (points[index].y > points[maxIndex].y) maxIndex = index;
    }

    if (minIndex === maxIndex) sampled.push(points[minIndex]);
    else if (minIndex < maxIndex) sampled.push(points[minIndex], points[maxIndex]);
    else sampled.push(points[maxIndex], points[minIndex]);
  }

  sampled.push(points[points.length - 1]);
  return sampled;
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
  const titleId = useId().replace(/:/g, "");
  const descriptionId = useId().replace(/:/g, "");
  const pad = { l: 48, r: 12, t: 14, b: 30 };
  const plotData = prepareFinitePlotData(series);
  const chartTitle = title ?? "Line plot";
  if (!plotData) {
    return (
      <div className="plot-frame">
        <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
          <title id={titleId}>{chartTitle}</title>
          <desc id={descriptionId}>No data points are available yet.</desc>
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="currentColor" opacity={0.62}>
            No data yet
          </text>
        </svg>
      </div>
    );
  }

  const plotSeries = plotData.series;
  let x0 = plotData.xMin;
  let x1 = plotData.xMax;
  if (x0 === x1) {
    x0 -= 1;
    x1 += 1;
  }
  let y0 = yMin ?? plotData.yMin;
  let y1 = yMax ?? plotData.yMax;
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
  const totalPoints = plotData.totalPoints;
  const visualPointLimit = Math.max(256, Math.min(2_000, Math.floor((width - pad.l - pad.r) * 2)));
  const visualSeries = plotSeries.map((item) => ({
    ...item,
    points: downsamplePlotPoints(item.points, visualPointLimit)
  }));
  const visualPointCount = visualSeries.reduce((count, item) => count + item.points.length, 0);
  const description = `${plotSeries.length} data series with ${totalPoints} finite points. ` +
    `X range ${fmt(x0)} to ${fmt(x1)}${xLabel ? ` ${xLabel}` : ""}. ` +
    `Y range ${fmt(y0)} to ${fmt(y1)}${yLabel ? ` ${yLabel}` : ""}. ` +
    (visualPointCount < totalPoints
      ? `The visual is sampled to ${visualPointCount} points; accessible ranges and totals use all ${totalPoints} finite points.`
      : "All finite points are shown in the visual.");
  const tableRows: Array<{ series: string; x: number; y: number }> = [];
  for (const item of plotSeries) {
    for (const point of item.points) {
      tableRows.push({ series: item.name, x: point.x, y: point.y });
      if (tableRows.length === 50) break;
    }
    if (tableRows.length === 50) break;
  }

  return (
    <div className="plot-frame">
    <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{chartTitle}</title>
      <desc id={descriptionId}>{description}</desc>
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
      {visualSeries.map((s) =>
        s.kind === "scatter" ? (
          <g key={s.name} fill={s.color}>
            {s.points.map((p, index) => <circle key={index} cx={sx(p.x)} cy={sy(p.y)} r={3} opacity={0.82} />)}
          </g>
        ) : (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            vectorEffect="non-scaling-stroke"
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
          />
        )
      )}
      {plotSeries.map((s, i) => (
        <g key={`leg-${s.name}`}>
          {s.kind === "scatter" ? (
            <circle cx={pad.l + 14 + i * 110} cy={pad.t + 1.5} r={3} fill={s.color} />
          ) : (
            <line
              x1={pad.l + 8 + i * 110}
              x2={pad.l + 20 + i * 110}
              y1={pad.t + 1.5}
              y2={pad.t + 1.5}
              stroke={s.color}
              strokeWidth={3}
              strokeDasharray={s.dashed ? "4 3" : undefined}
            />
          )}
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
      <details className="plot-data">
        <summary>View plot data</summary>
        <div className="table-scroll" tabIndex={0} aria-label={`${chartTitle} data table`}>
          <table>
            <thead>
              <tr>
                <th scope="col">Series</th>
                <th scope="col">{xLabel ?? "x"}</th>
                <th scope="col">{yLabel ?? "y"}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`${row.series}-${index}`}>
                  <th scope="row">{row.series}</th>
                  <td>{fmt(row.x)}</td>
                  <td>{fmt(row.y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPoints > tableRows.length && (
          <p className="small muted">Showing the first {tableRows.length} of {totalPoints} points across all series.</p>
        )}
      </details>
    </div>
  );
}

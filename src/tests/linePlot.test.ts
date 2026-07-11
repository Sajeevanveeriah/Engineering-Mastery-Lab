import { describe, expect, it } from "vitest";
import { downsamplePlotPoints, prepareFinitePlotData, type Series } from "../components/LinePlot";

describe("large plot data", () => {
  it("derives finite extrema iteratively for 250,000 values", () => {
    const points = Array.from({ length: 250_000 }, (_, index) => ({
      x: index,
      y: index === 123_456 ? -9_999 : index === 200_000 ? 8_888 : Math.sin(index / 100)
    }));
    points.push({ x: Number.NaN, y: 4 }, { x: 250_001, y: Number.POSITIVE_INFINITY });
    const series: Series[] = [{ name: "stress data", color: "currentColor", points }];

    const result = prepareFinitePlotData(series);

    expect(result).not.toBeNull();
    expect(result?.totalPoints).toBe(250_000);
    expect(result?.xMin).toBe(0);
    expect(result?.xMax).toBe(249_999);
    expect(result?.yMin).toBe(-9_999);
    expect(result?.yMax).toBe(8_888);
  });

  it("keeps visual samples bounded and preserves bucket extrema", () => {
    const points = Array.from({ length: 250_000 }, (_, index) => ({ x: index, y: Math.sin(index / 50) }));
    points[81_234] = { x: 81_234, y: -20_000 };
    points[172_345] = { x: 172_345, y: 30_000 };

    const sampled = downsamplePlotPoints(points, 1_200);

    expect(sampled.length).toBeLessThanOrEqual(1_200);
    expect(sampled[0]).toBe(points[0]);
    expect(sampled.at(-1)).toBe(points.at(-1));
    expect(sampled).toContain(points[81_234]);
    expect(sampled).toContain(points[172_345]);
  });
});

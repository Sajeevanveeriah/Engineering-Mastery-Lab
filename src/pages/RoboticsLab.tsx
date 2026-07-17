import { useEffect, useMemo, useRef, useState } from "react";
import { ModuleShell } from "../components/ModuleShell";
import { Slider } from "../components/Slider";
import { useTabPanelActive } from "../components/Tabs";
import { moduleById } from "../data/modules";
import {
  diffDriveStep,
  noisyOdometryStep,
  steerToWaypoint,
  makeRng,
  aStar,
  nearestObstacleDistance,
  type Pose
} from "../lib/simulations/robotics";
import { round } from "../lib/metrics";

const WHEEL_BASE = 0.3;
const DT = 0.05;
const ARENA = 10; // metres, square

const obstacles = [
  { x: 3.5, y: 4, r: 0.7 },
  { x: 6.5, y: 6.5, r: 0.9 },
  { x: 5, y: 2, r: 0.6 }
];

const defaultWaypoints: [number, number][] = [
  [3, 1.5],
  [8, 3],
  [8, 8],
  [2, 8]
];

type Mode = "manual" | "waypoints" | "astar";

function buildGrid(): boolean[][] {
  const n = 20;
  const cell = ARENA / n;
  const grid: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) {
      const cx = (c + 0.5) * cell;
      const cy = (r + 0.5) * cell;
      row.push(obstacles.some((o) => Math.hypot(o.x - cx, o.y - cy) < o.r + 0.25));
    }
    grid.push(row);
  }
  return grid;
}

function Simulator() {
  const panelActive = useTabPanelActive();
  const [mode, setMode] = useState<Mode>("manual");
  const [vl, setVl] = useState(0.5);
  const [vr, setVr] = useState(0.5);
  const [noiseStd, setNoiseStd] = useState(0.05);
  const [running, setRunning] = useState(false);
  const [pose, setPose] = useState<Pose>({ x: 1, y: 1, theta: 0 });
  const [odom, setOdom] = useState<Pose>({ x: 1, y: 1, theta: 0 });
  const [truePath, setTruePath] = useState<Pose[]>([]);
  const [odomPath, setOdomPath] = useState<Pose[]>([]);
  const [wpIndex, setWpIndex] = useState(0);
  const rng = useRef(makeRng(42));

  const grid = useMemo(buildGrid, []);
  const cell = ARENA / grid.length;
  const plannedPath = useMemo(() => {
    if (mode !== "astar") return null;
    const start: [number, number] = [
      Math.min(grid.length - 1, Math.max(0, Math.floor(pose.y / cell))),
      Math.min(grid.length - 1, Math.max(0, Math.floor(pose.x / cell)))
    ];
    const goal: [number, number] = [17, 17];
    return aStar(grid, start, goal);
    // Re-plan only when entering A* mode, not every pose update:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const waypoints: [number, number][] = useMemo(() => {
    if (mode === "astar" && plannedPath) {
      return plannedPath.map(([r, c]) => [(c + 0.5) * cell, (r + 0.5) * cell]);
    }
    return defaultWaypoints;
  }, [mode, plannedPath, cell]);

  useEffect(() => {
    if (!running || !panelActive) return;
    const id = setInterval(() => {
      setPose((p) => {
        let cmdL = vl;
        let cmdR = vr;
        if (mode !== "manual") {
          const target = waypoints[wpIndex];
          if (!target) {
            setRunning(false);
            return p;
          }
          const cmd = steerToWaypoint(p, target[0], target[1], 0.8, 1.2, mode === "astar" ? 0.3 : 0.25);
          if (cmd.reached) {
            setWpIndex((i) => i + 1);
            return p;
          }
          // Basic obstacle avoidance: slow and veer when close to an obstacle.
          const clearance = nearestObstacleDistance(p, obstacles);
          if (clearance < 0.4 && mode === "waypoints") {
            cmdL = cmd.vLeft * 0.5 + 0.3;
            cmdR = cmd.vRight * 0.5 - 0.1;
          } else {
            cmdL = cmd.vLeft;
            cmdR = cmd.vRight;
          }
        }
        const next = diffDriveStep(p, cmdL, cmdR, WHEEL_BASE, DT);
        next.x = Math.min(ARENA, Math.max(0, next.x));
        next.y = Math.min(ARENA, Math.max(0, next.y));
        setOdom((o) => {
          const nextOdom = noisyOdometryStep(o, cmdL, cmdR, WHEEL_BASE, DT, noiseStd, rng.current);
          setOdomPath((op) => [...op.slice(-1500), nextOdom]);
          return nextOdom;
        });
        setTruePath((tp) => [...tp.slice(-1500), next]);
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [running, panelActive, vl, vr, mode, waypoints, wpIndex, noiseStd]);

  const reset = () => {
    setRunning(false);
    setPose({ x: 1, y: 1, theta: 0 });
    setOdom({ x: 1, y: 1, theta: 0 });
    setTruePath([]);
    setOdomPath([]);
    setWpIndex(0);
    rng.current = makeRng(42);
  };

  const S = 46; // px per metre in the SVG
  const toSvg = (x: number, y: number) => ({ sx: x * S, sy: (ARENA - y) * S });
  const robotSvg = toSvg(pose.x, pose.y);
  const odomSvg = toSvg(odom.x, odom.y);
  const driftDist = Math.hypot(pose.x - odom.x, pose.y - odom.y);

  return (
    <div className="lab-layout">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Robot control</h3>
        <p>
          {(["manual", "waypoints", "astar"] as Mode[]).map((m) => (
            <button
              key={m}
              style={{ marginRight: "0.4rem", marginBottom: "0.3rem" }}
              aria-pressed={mode === m}
              className={mode === m ? "primary" : ""}
              onClick={() => {
                setMode(m);
                setWpIndex(0);
              }}
            >
              {m === "manual" ? "Manual" : m === "waypoints" ? "Waypoints" : "A* plan"}
            </button>
          ))}
        </p>
        {mode === "manual" && (
          <>
            <Slider label="Left wheel speed" value={vl} min={-1} max={1} step={0.05} unit="m/s" onChange={setVl} />
            <Slider label="Right wheel speed" value={vr} min={-1} max={1} step={0.05} unit="m/s" onChange={setVr} />
          </>
        )}
        <Slider label="Odometry noise σ" value={noiseStd} min={0} max={0.2} step={0.01} onChange={setNoiseStd} />
        <p>
          <button className="primary" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Run"}</button>{" "}
          <button onClick={reset}>Reset</button>
        </p>
        <div className="metric-grid">
          <div className="metric"><div className="label">True pose</div><div className="val" style={{ fontSize: "0.85rem" }}>({round(pose.x, 2)}, {round(pose.y, 2)}) θ={round(pose.theta, 2)}</div></div>
          <div className="metric"><div className="label">Odometry pose</div><div className="val" style={{ fontSize: "0.85rem" }}>({round(odom.x, 2)}, {round(odom.y, 2)})</div></div>
          <div className="metric"><div className="label">Odometry drift</div><div className="val">{round(driftDist, 2)} m</div></div>
          {mode !== "manual" && (
            <div className="metric"><div className="label">Waypoint</div><div className="val">{Math.min(wpIndex + 1, waypoints.length)}/{waypoints.length}</div></div>
          )}
        </div>
        {mode === "astar" && plannedPath === null && (
          <p className="small" style={{ color: "var(--danger)" }}>A* found no path from the current cell - reset the robot first.</p>
        )}
      </div>
      <div className="card">
        <svg className="plot" viewBox={`0 0 ${ARENA * S} ${ARENA * S}`} role="img" aria-label="Robot arena: blue robot, dashed grey odometry estimate, orange waypoints, red obstacles">
          {mode === "astar" &&
            grid.map((row, r) =>
              row.map((blocked, c) =>
                blocked ? (
                  <rect key={`g${r}-${c}`} x={c * cell * S} y={(grid.length - 1 - r) * cell * S} width={cell * S} height={cell * S} fill="currentColor" opacity={0.08} />
                ) : null
              )
            )}
          {obstacles.map((o, i) => {
            const p = toSvg(o.x, o.y);
            return <circle key={i} cx={p.sx} cy={p.sy} r={o.r * S} fill="var(--chart-5)" opacity={0.72} />;
          })}
          {waypoints.map(([wx, wy], i) => {
            const p = toSvg(wx, wy);
            return <circle key={`w${i}`} cx={p.sx} cy={p.sy} r={4} fill={i < wpIndex ? "var(--chart-3)" : "var(--chart-4)"} />;
          })}
          <polyline fill="none" stroke="var(--chart-1)" strokeWidth={2.2} points={truePath.map((p) => { const s = toSvg(p.x, p.y); return `${s.sx},${s.sy}`; }).join(" ")} />
          <polyline fill="none" stroke="var(--chart-2)" strokeDasharray="6 4" strokeWidth={2.2} points={odomPath.map((p) => { const s = toSvg(p.x, p.y); return `${s.sx},${s.sy}`; }).join(" ")} />
          <g transform={`translate(${robotSvg.sx},${robotSvg.sy}) rotate(${(-pose.theta * 180) / Math.PI})`}>
            <rect x={-9} y={-7} width={18} height={14} rx={3} fill="var(--chart-1)" />
            <polygon points="9,0 3,-4 3,4" fill="var(--text)" />
          </g>
          <circle cx={odomSvg.sx} cy={odomSvg.sy} r={5} fill="none" stroke="var(--chart-2)" strokeWidth={2.2} />
        </svg>
        <p className="small muted">
          Solid blue: true path. Dashed grey: where odometry <em>thinks</em> the robot is. Orange dots: waypoints
          (green when reached). Red circles: obstacles. A* mode plans on a 20×20 grid to the top-right corner.
        </p>
      </div>
    </div>
  );
}

export function RoboticsLab() {
  const mod = moduleById("robotics")!;
  return <ModuleShell module={mod} simulator={<Simulator />} />;
}

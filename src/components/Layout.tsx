import { NavLink, Outlet } from "react-router-dom";
import { useProgress } from "./ProgressContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/skills", label: "Skills Matrix" },
  { to: "/pathways", label: "Pathways" },
  { to: "/labs/pid", label: "PID" },
  { to: "/labs/electrical", label: "Electrical" },
  { to: "/labs/embedded", label: "Embedded" },
  { to: "/labs/plc", label: "PLC/SCADA" },
  { to: "/labs/robotics", label: "Robotics" },
  { to: "/labs/ml", label: "AI/ML" },
  { to: "/labs/mechanical", label: "Mechanical" },
  { to: "/labs/practice", label: "Practice" },
  { to: "/workbench", label: "Workbench" },
  { to: "/diagnostics", label: "Diagnostics" }
];

export function Layout() {
  const { progress, update } = useProgress();
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">Engineering Mastery Lab</span>
        <nav className="nav" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          aria-label="Toggle dark or light theme"
          onClick={() => update((p) => ({ ...p, theme: p.theme === "dark" ? "light" : "dark" }))}
        >
          {progress.theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        Educational simulations only. This site supports learning and portfolio building — it does not replace
        professional engineering judgement, formal standards compliance, or validated safety systems. All data is
        synthetic. Never apply procedures from simulations directly to live machinery.
      </footer>
    </div>
  );
}

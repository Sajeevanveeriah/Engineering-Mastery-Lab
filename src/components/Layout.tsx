import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { modules } from "../data/modules";
import { overallProgress } from "../lib/metrics";
import { Icon, type IconName } from "./Icon";
import { useProgress } from "./ProgressContext";
import { useWorkbenchSession } from "./WorkbenchContext";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const overviewLinks: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/labs", label: "All laboratories", icon: "labs" },
  { to: "/skills", label: "Skills matrix", icon: "skills" },
  { to: "/pathways", label: "Learning pathways", icon: "pathways" }
];

const labIcons: Record<string, IconName> = {
  pid: "control",
  electrical: "electrical",
  embedded: "embedded",
  plc: "plc",
  robotics: "robotics",
  ml: "ml",
  mechanical: "mechanical",
  practice: "practice"
};

const labLinks: NavItem[] = modules.map((module) => ({
  to: module.route,
  label: module.title.replace(" Lab", ""),
  icon: labIcons[module.id] ?? "labs"
}));

const toolLinks: NavItem[] = [
  { to: "/workbench", label: "Project workbench", icon: "workbench" },
  { to: "/diagnostics", label: "Tool diagnostics", icon: "diagnostics" }
];

const routeNames: Array<[string, string]> = [
  ["/labs/electrical", "Electrical and Electronics Lab"],
  ["/labs/embedded", "Embedded Systems Lab"],
  ["/labs/mechanical", "Mechanical and Dynamics Lab"],
  ["/labs/robotics", "Robotics Lab"],
  ["/labs/practice", "Systems and Practice Lab"],
  ["/labs/plc", "PLC and SCADA Lab"],
  ["/labs/pid", "PID Control Lab"],
  ["/labs/ml", "AI and ML Lab"],
  ["/diagnostics", "Tool Diagnostics"],
  ["/workbench", "Project Workbench"],
  ["/pathways", "Learning Pathways"],
  ["/skills", "Skills Matrix"],
  ["/labs", "Laboratories"],
  ["/", "Dashboard"]
];

function routeName(pathname: string): string {
  return routeNames.find(([route]) => (route === "/" ? pathname === route : pathname.startsWith(route)))?.[1] ?? "Not Found";
}

function NavigationSection({ label, links, onNavigate }: { label: string; links: NavItem[]; onNavigate: (event: MouseEvent<HTMLAnchorElement>, target: string) => void }) {
  return (
    <div className="sidebar-section">
      <p className="sidebar-section__label">{label}</p>
      <div className="sidebar-links">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link--active" : ""}`}
            onClick={(event) => onNavigate(event, item.to)}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Layout() {
  const { progress, update, persistenceAvailable } = useProgress();
  const { dirty: workbenchDirty, unsavedSummary } = useWorkbenchSession();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowNavigation, setNarrowNavigation] = useState(() => window.matchMedia("(max-width: 980px)").matches);
  const mainRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstRoute = useRef(true);
  const summary = overallProgress(progress);
  const currentRouteName = routeName(location.pathname);
  const modalNavigationOpen = narrowNavigation && menuOpen;

  useEffect(() => {
    document.title = `${currentRouteName} | Engineering Workbench`;
    setMenuOpen(false);
    if (firstRoute.current) {
      firstRoute.current = false;
    } else {
      requestAnimationFrame(() => mainRef.current?.focus());
    }
  }, [currentRouteName, location.pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 980px)");
    const onChange = (event: MediaQueryListEvent) => {
      setNarrowNavigation(event.matches);
      if (!event.matches) setMenuOpen(false);
    };
    setNarrowNavigation(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !sidebarRef.current) return;
      const focusable = [...sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((element) => !element.hasAttribute("hidden"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>("button, a")?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    if (narrowNavigation && !menuOpen) sidebar.setAttribute("inert", "");
    else sidebar.removeAttribute("inert");
  }, [menuOpen, narrowNavigation]);

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.toggleAttribute("inert", modalNavigationOpen);
    return () => workspace.removeAttribute("inert");
  }, [modalNavigationOpen]);

  const closeMenu = () => setMenuOpen(false);
  const navigateFromWorkbench = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (
      location.pathname.startsWith("/workbench") &&
      !target.startsWith("/workbench") &&
      workbenchDirty &&
      !window.confirm(`Leave Project Workbench? Unsaved ${unsavedSummary} changes or drafts will be discarded where they are not already held in the project session.`)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    closeMenu();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <aside
        ref={sidebarRef}
        className={`sidebar${menuOpen ? " sidebar--open" : ""}`}
        id="application-navigation"
        aria-hidden={narrowNavigation && !menuOpen ? true : undefined}
        aria-label={modalNavigationOpen ? "Application navigation" : undefined}
        aria-modal={modalNavigationOpen ? true : undefined}
        role={modalNavigationOpen ? "dialog" : undefined}
      >
        <div className="sidebar__header">
          <Link to="/" className="brand" onClick={(event) => navigateFromWorkbench(event, "/")}>
            <span className="brand__mark" aria-hidden="true">EW</span>
            <span>
              <strong>Engineering Workbench</strong>
              <small>Mastery Lab</small>
            </span>
          </Link>
          <button className="icon-button sidebar__close" type="button" aria-label="Close navigation" onClick={() => { closeMenu(); requestAnimationFrame(() => menuButtonRef.current?.focus()); }}>
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Application navigation">
          <NavigationSection label="Overview" links={overviewLinks} onNavigate={navigateFromWorkbench} />
          <NavigationSection label="Laboratories" links={labLinks} onNavigate={navigateFromWorkbench} />
          <NavigationSection label="Engineering tools" links={toolLinks} onNavigate={navigateFromWorkbench} />
        </nav>

        <div className="sidebar-progress">
          <div className="sidebar-progress__label">
            <span>Overall progress</span>
            <strong>{summary.percent}%</strong>
          </div>
          <div className="progress-bar progress-bar--sidebar" role="progressbar" aria-label="Overall learning progress" aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
            <div style={{ width: `${summary.percent}%` }} />
          </div>
          <p>{summary.completedModules}/{summary.totalModules} modules complete</p>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" type="button" aria-hidden="true" tabIndex={-1} onClick={() => { closeMenu(); requestAnimationFrame(() => menuButtonRef.current?.focus()); }} />}

      <div ref={workspaceRef} className="workspace-shell" aria-hidden={modalNavigationOpen ? true : undefined}>
        <header className="workspace-topbar">
          <div className="workspace-topbar__route">
            <button
              ref={menuButtonRef}
              className="icon-button mobile-menu"
              type="button"
              aria-label="Open navigation"
              aria-controls="application-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <div>
              <span className="workspace-topbar__context">Engineering Workbench</span>
              <strong>{currentRouteName}</strong>
            </div>
          </div>
          <div className="workspace-topbar__actions">
            {!persistenceAvailable && (
              <span className="storage-warning" role="status" title="Changes are active for this session but browser storage is unavailable.">
                <Icon name="alert" size={16} /> Session only
              </span>
            )}
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${progress.theme === "dark" ? "light" : "dark"} mode`}
              onClick={() => update((state) => ({ ...state, theme: state.theme === "dark" ? "light" : "dark" }))}
            >
              <Icon name={progress.theme === "dark" ? "sun" : "moon"} size={18} />
              <span>{progress.theme === "dark" ? "Light" : "Dark"} mode</span>
            </button>
          </div>
        </header>

        <main id="main-content" ref={mainRef} tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="footer">
          <span>Engineering Workbench v0.1</span>
          <span>Educational models and engineering workflow support only. Validate every real-world decision independently.</span>
        </footer>
      </div>
    </div>
  );
}

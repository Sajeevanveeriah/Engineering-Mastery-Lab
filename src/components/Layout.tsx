import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { useProgress } from "./ProgressContext";
import { useWorkbenchSession } from "./WorkbenchContext";
import { CommandPalette } from "./CommandPalette";
import { Onboarding } from "./Onboarding";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const primaryNavigation: NavItem[] = [
  { to: "/", label: "Home", icon: "dashboard", end: true },
  { to: "/learn", label: "Learn", icon: "labs" },
  { to: "/projects", label: "Projects", icon: "practice" },
  { to: "/tools", label: "Tools", icon: "workbench" },
  { to: "/portfolio", label: "Portfolio", icon: "report" }
];

const routeTitles: Array<[string, string]> = [
  ["/learn/pathways/", "Pathway"],
  ["/learn/labs/", "Laboratory"],
  ["/projects/", "Project"],
  ["/tools/calculators", "Engineering Calculators"],
  ["/tools/converter", "Unit Converter"],
  ["/tools/materials", "Materials Reference"],
  ["/tools/cad", "CAD Studio"],
  ["/tools/workbench", "Project Workbench"],
  ["/tools/diagnostics", "Desktop Diagnostics"],
  ["/learn/pathways", "Learning Pathways"],
  ["/learn/labs", "Laboratories"],
  ["/learn/skills", "Skills"],
  ["/learn/bookmarks", "Bookmarks"],
  ["/learn", "Learn"],
  ["/projects", "Projects"],
  ["/tools", "Tools"],
  ["/portfolio", "Portfolio"],
  ["/pricing", "Pricing"],
  ["/settings", "Settings"],
  ["/about", "About"],
  ["/", "Home"]
];

function routeTitle(pathname: string): string {
  return routeTitles.find(([route]) => route === "/" ? pathname === route : pathname.startsWith(route))?.[1] ?? "Not Found";
}

export function Layout() {
  const { progress, persistenceAvailable } = useProgress();
  const { dirty: workbenchDirty, unsavedSummary } = useWorkbenchSession();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRoute = useRef(true);
  const currentTitle = routeTitle(location.pathname);

  useEffect(() => {
    document.title = `${currentTitle} | Engineering Mastery Lab`;
    setMobileMenuOpen(false);
    if (firstRoute.current) firstRoute.current = false;
    else requestAnimationFrame(() => mainRef.current?.focus());
  }, [currentTitle, location.pathname]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase("en-AU") === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = progress.accessibility.reducedMotion ? "reduced" : "standard";
    document.documentElement.dataset.contrast = progress.accessibility.highContrast ? "high" : "standard";
  }, [progress.accessibility]);

  const navigateFromWorkbench = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    const inWorkbench = location.pathname === "/workbench" || location.pathname.startsWith("/tools/workbench");
    if (inWorkbench && !target.includes("workbench") && workbenchDirty && !window.confirm(
      `Leave Project Workbench? Unsaved ${unsavedSummary} changes or drafts may be discarded where they are not already held in the project session.`
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className={`product-shell${collapsed ? " product-shell--collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className={`product-rail${mobileMenuOpen ? " product-rail--open" : ""}`} aria-label="Primary">
        <div className="product-brand">
          <Link to="/" aria-label="Engineering Mastery Lab home" onClick={(event) => navigateFromWorkbench(event, "/")}>
            <span className="product-brand__mark" aria-hidden="true">EM</span>
            <span className="product-brand__copy"><strong>Engineering Mastery Lab</strong><small>Build. Simulate. Prove.</small></span>
          </Link>
          <button className="icon-button product-rail__mobile-close" type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><Icon name="close" /></button>
        </div>
        <nav className="primary-navigation" aria-label="Primary navigation">
          {primaryNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `primary-navigation__item${isActive ? " active" : ""}`}
              onClick={(event) => navigateFromWorkbench(event, item.to)}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="product-rail__footer">
          <button className="rail-collapse" type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((value) => !value)}>
            <Icon name="chevron" size={18} /><span>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <p className="local-mode"><span aria-hidden="true" /> Local open-source preview</p>
        </div>
      </aside>
      {mobileMenuOpen && <button className="product-rail-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}

      <div className="product-workspace">
        <header className="product-topbar">
          <div className="product-topbar__route">
            <button className="icon-button product-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><Icon name="menu" /></button>
            <div><span>Engineering Mastery Lab</span><strong>{currentTitle}</strong></div>
          </div>
          <div className="product-topbar__actions">
            <button className="search-trigger" type="button" aria-label="Open global search" onClick={() => setSearchOpen(true)}>
              <Icon name="search" size={18} /><span>Search</span><kbd>Ctrl K</kbd>
            </button>
            <nav className="utility-navigation" aria-label="Product information">
              <Link to="/pricing">Pricing</Link>
              <Link to="/about">About</Link>
            </nav>
            {!persistenceAvailable && <span className="storage-warning" role="status"><Icon name="alert" size={16} /> Session only</span>}
            <Link className="profile-trigger" to="/settings" aria-label="Open local profile and settings">
              <span aria-hidden="true">{progress.profile?.displayName?.slice(0, 1).toUpperCase() || "G"}</span>
              <small>{progress.profile?.displayName || "Guest"}</small>
            </Link>
          </div>
        </header>

        <main id="main-content" ref={mainRef} tabIndex={-1}><Outlet /></main>
        <footer className="product-footer">
          <span>Engineering Mastery Lab v0.1</span>
          <span>Educational models and learner-generated evidence only. Validate real-world engineering decisions independently.</span>
        </footer>
      </div>

      <nav className="mobile-bottom-navigation" aria-label="Primary mobile navigation">
        {primaryNavigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={(event) => navigateFromWorkbench(event, item.to)}>
            <Icon name={item.icon} size={20} /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {!progress.onboardingComplete && <Onboarding />}
    </div>
  );
}

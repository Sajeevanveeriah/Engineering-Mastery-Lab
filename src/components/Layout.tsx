import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useMatch } from "react-router";
import {
  mobilePrimaryDestinations,
  primaryDestinations
} from "../data/displayLabels";
import { getRouteInterfaceMode } from "../lib/routeInterfaceMode";
import { Icon } from "./Icon";
import { useProgress } from "./ProgressContext";
import { useWorkbenchSession } from "./WorkbenchContext";
import { CommandPalette } from "./CommandPalette";
import { AcademyHandoffBanner } from "./academy/AcademyHandoffBanner";

const routeTitles: Array<[string, string]> = [
  ["/learn/review", "Learn: Academy Review"],
  ["/learn/courses", "Learn: Engineering Academy"],
  ["/practice", "Practice"],
  ["/progress", "Progress"],
  ["/more", "More"],
  ["/learn/reboot/sessions/", "Learn: Reboot Session"],
  ["/learn/modules/", "Learn: Curriculum Module"],
  ["/learn/roadmap", "Learn: Complete Curriculum"],
  ["/learn/reboot", "Learn: Accelerated Reboot"],
  ["/learn/diagnostics", "Learn: Curriculum Diagnostics"],
  ["/learn/resources", "Learn: Curriculum Resources"],
  ["/learn/pathways/", "Learn: Pathway"],
  ["/learn/labs/", "Learn: Laboratory"],
  ["/learn/flagships/", "Learn: Flagship Workflow"],
  ["/projects/releases/", "Build: Rover Release"],
  ["/projects/", "Build: Project"],
  ["/portfolio/capstone", "Prove: Rover Capstone"],
  ["/tools/progress", "Analyse: Learning Progress"],
  ["/tools/engineering", "Analyse: Engineering Project Workspace"],
  ["/tools/calculators", "Analyse: Engineering Calculators"],
  ["/tools/converter", "Analyse: Unit Converter"],
  ["/tools/materials", "Analyse: Materials Reference"],
  ["/tools/cad", "Analyse: CAD Studio"],
  ["/tools/workbench", "Analyse: Project Workbench"],
  ["/tools/diagnostics", "Analyse: Desktop Diagnostics"],
  ["/learn/pathways", "Learn: Pathways"],
  ["/learn/labs", "Learn: Laboratories"],
  ["/learn/skills", "Learn: Skills"],
  ["/learn/bookmarks", "Learn: Bookmarks"],
  ["/learn", "Learn"],
  ["/projects", "Projects"],
  ["/tools", "More: Tools"],
  ["/portfolio", "Progress: Evidence"],
  ["/pricing", "Pricing"],
  ["/settings", "Settings"],
  ["/about", "About"],
  ["/", "Engineering Mastery Lab"]
];

const contextualNavigation = {
  learn: [
    ["/learn", "Academy path"],
    ["/learn?browse=1", "Browse curriculum"]
  ],
  practice: [
    ["/practice", "Recommended"],
    ["/learn/review", "Review queue"],
    ["/learn/bookmarks", "Bookmarks"]
  ],
  projects: [
    ["/projects", "Projects"],
    ["/projects/releases/P1", "P1"],
    ["/projects/releases/P2", "P2"],
    ["/projects/releases/P3", "P3"],
    ["/projects/releases/P4", "P4"]
  ],
  progress: [
    ["/progress", "Overview"],
    ["/tools/progress", "Progress"],
    ["/portfolio", "Evidence"]
  ],
  more: [
    ["/more", "More"],
    ["/settings", "Settings"],
    ["/tools", "Tools"]
  ]
} as const;

function routeTitle(pathname: string): string {
  if (/^\/learn\/courses\/[^/]+\/units\/[^/]+\/lessons\/[^/]+$/.test(pathname)) {
    return "Learn: Academy Lesson";
  }
  if (/^\/learn\/courses\/[^/]+\/units\/[^/]+\/assessments\/(?:quiz|test)$/.test(pathname)) {
    return "Learn: Academy Assessment";
  }
  if (/^\/learn\/courses\/[^/]+\/challenge$/.test(pathname)) {
    return "Learn: Academy Challenge";
  }
  if (/^\/learn\/courses\/[^/]+\/units\/[^/]+$/.test(pathname)) {
    return "Learn: Academy Unit";
  }
  if (/^\/learn\/courses\/[^/]+$/.test(pathname)) {
    return "Learn: Academy Course";
  }
  return routeTitles.find(([route]) => (
    route === "/" ? pathname === route : route.endsWith("/") ? pathname.startsWith(route) : pathname === route
  ))?.[1] ?? "Not Found";
}

function routeFamily(pathname: string): "home" | "learn" | "practice" | "projects" | "progress" | "more" | "secondary" {
  if (pathname === "/") return "home";
  const matchesRouteRoot = (root: string) => pathname === root || pathname.startsWith(`${root}/`);
  if (matchesRouteRoot("/learn")) return "learn";
  if (matchesRouteRoot("/practice")) return "practice";
  if (matchesRouteRoot("/projects")) return "projects";
  if (matchesRouteRoot("/progress")) return "progress";
  if (matchesRouteRoot("/more")) return "more";
  return "secondary";
}

export function Layout() {
  const {
    progress,
    persistenceAvailable,
    progressRecoveryRequired
  } = useProgress();
  const { dirty: workbenchDirty, unsavedSummary } = useWorkbenchSession();
  const location = useLocation();
  const laboratoryMatch = useMatch("/learn/labs/:labId");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(() =>
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(max-width: 900px)").matches
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuCloseRef = useRef<HTMLButtonElement>(null);
  const mobileMenuReturnFocusRef = useRef<HTMLElement | null>(null);
  const restoreMobileFocusRef = useRef(false);
  const firstRoute = useRef(true);
  const currentTitle = routeTitle(location.pathname);
  const currentFamily = routeFamily(location.pathname);
  const interfaceMode = getRouteInterfaceMode(location.pathname);
  const contextLinks = currentFamily === "learn"
    || currentFamily === "practice"
    || currentFamily === "projects"
    || currentFamily === "progress"
    || currentFamily === "more"
    ? contextualNavigation[currentFamily]
    : [];
  const academyLessonRoute = /^\/learn\/courses\/[^/]+\/units\/[^/]+\/lessons\/[^/]+$/
    .test(location.pathname);
  const shellMode = laboratoryMatch || academyLessonRoute ? "focused" : "standard";
  const drawerMode = mobileViewport;

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    restoreMobileFocusRef.current = restoreFocus;
    setMobileMenuOpen(false);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    document.title = `${currentTitle} | Engineering Mastery Lab`;
    restoreMobileFocusRef.current = false;
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
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 900px)");
    const updateViewport = () => {
      setMobileViewport(query.matches);
      if (!query.matches) {
        restoreMobileFocusRef.current = false;
        setMobileMenuOpen(false);
      }
    };
    updateViewport();
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.inert = drawerMode && !mobileMenuOpen;
    return () => {
      rail.inert = false;
    };
  }, [drawerMode, mobileMenuOpen]);

  useEffect(() => {
    if (!drawerMode || !mobileMenuOpen) return;
    const rail = railRef.current;
    if (!rail) return;
    mobileMenuReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : mobileMenuTriggerRef.current;
    restoreMobileFocusRef.current = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => mobileMenuCloseRef.current?.focus());

    const handleDrawerKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu(true);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...rail.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !rail.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !rail.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleDrawerKeyDown);
    };
  }, [closeMobileMenu, drawerMode, mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen || !restoreMobileFocusRef.current) return;
    restoreMobileFocusRef.current = false;
    const target = mobileMenuReturnFocusRef.current ?? mobileMenuTriggerRef.current;
    requestAnimationFrame(() => target?.focus());
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.documentElement.dataset.motion = progress.accessibility.reducedMotion ? "reduced" : "standard";
    document.documentElement.dataset.contrast = progress.accessibility.highContrast ? "high" : "standard";
  }, [progress.accessibility]);

  const requestNavigation = useCallback((target: string): boolean => {
    const normaliseRoute = (route: string) => {
      const path = route.split(/[?#]/, 1)[0].replace(/\/+$/, "");
      return path || "/";
    };
    const isWorkbenchRoute = (route: string) => {
      const path = normaliseRoute(route);
      return path === "/workbench" || path === "/tools/workbench" || path.startsWith("/tools/workbench/");
    };
    if (!isWorkbenchRoute(location.pathname) || isWorkbenchRoute(target) || !workbenchDirty) return true;
    return window.confirm(
      `Leave Project Workbench? Unsaved ${unsavedSummary} changes or drafts may be discarded where they are not already held in the project session.`
    );
  }, [location.pathname, unsavedSummary, workbenchDirty]);

  const navigateFromShell = (event: MouseEvent<HTMLAnchorElement>, target: string, closeDrawer = false) => {
    if (!requestNavigation(target)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (closeDrawer && mobileMenuOpen) {
      closeMobileMenu(false);
      if (target === location.pathname) requestAnimationFrame(() => mainRef.current?.focus());
    }
  };

  return (
    <div
      className={`product-shell${shellMode === "focused" ? " product-shell--focused" : ""}`}
      data-shell-mode={shellMode}
      data-route-family={currentFamily}
      data-interface-mode={interfaceMode}
    >
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div
        id="primary-navigation-drawer"
        ref={railRef}
        className={`product-rail${mobileMenuOpen ? " product-rail--open" : ""}`}
        role={drawerMode ? "region" : "banner"}
        aria-label={drawerMode ? "Navigation drawer" : undefined}
        aria-hidden={drawerMode && !mobileMenuOpen ? true : undefined}
      >
        <div className="product-brand">
          <Link to="/" aria-label="Engineering Mastery Lab: Today" onClick={(event) => navigateFromShell(event, "/", true)}>
            <span className="product-brand__mark" aria-hidden="true">EM</span>
            <span className="product-brand__copy"><strong>Engineering Mastery Lab</strong><small>Learn. Practise. Build. Progress.</small></span>
          </Link>
          {drawerMode && (
            <button ref={mobileMenuCloseRef} className="icon-button product-rail__mobile-close" type="button" aria-label="Close navigation" onClick={() => closeMobileMenu(true)}><Icon name="close" /></button>
          )}
        </div>
        <nav className="primary-navigation" aria-label="Primary navigation">
          {primaryDestinations.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              className={({ isActive }) => `primary-navigation__item${isActive ? " active" : ""}`}
              onClick={(event) => navigateFromShell(event, item.route, true)}
              aria-label={item.label}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="product-topbar__actions">
          <button className="search-trigger" type="button" aria-label="Open global search" onClick={() => setSearchOpen(true)}>
            <Icon name="search" size={18} /><span>Search</span><kbd>Ctrl K</kbd>
          </button>
          <nav className="utility-navigation" aria-label="Product information">
            <Link to="/pricing" onClick={(event) => navigateFromShell(event, "/pricing")}>Pricing</Link>
            <Link to="/about" onClick={(event) => navigateFromShell(event, "/about")}>About</Link>
          </nav>
          {progressRecoveryRequired
            ? (
                <span className="storage-warning" role="status">
                  <Icon name="alert" size={16} />
                  <Link
                    to="/settings"
                    aria-label="Progress recovery required. Open Settings."
                    onClick={(event) => navigateFromShell(event, "/settings", true)}
                  >
                    Recovery needed
                  </Link>
                </span>
              )
            : !persistenceAvailable && (
                <span className="storage-warning" role="status">
                  <Icon name="alert" size={16} /> Session only
                </span>
              )}
          <Link className="profile-trigger" to="/settings" aria-label="Open local profile and settings" onClick={(event) => navigateFromShell(event, "/settings", true)}>
            <span aria-hidden="true">{progress.profile?.displayName?.slice(0, 1).toUpperCase() || "G"}</span>
            <small>{progress.profile?.displayName || "Guest"}</small>
          </Link>
        </div>
        <div className="product-rail__footer">
          <p className="local-mode"><span aria-hidden="true" /> Local open-source preview</p>
        </div>
      </div>
      {mobileMenuOpen && <button className="product-rail-backdrop" type="button" aria-label="Close navigation" onClick={() => closeMobileMenu(true)} />}

      <div className="product-workspace">
        <div
          className="product-topbar"
          role={drawerMode ? "banner" : "region"}
          aria-label={drawerMode ? undefined : "Current workspace context"}
        >
          <div className="product-topbar__route">
            {drawerMode && (
              <button
                ref={mobileMenuTriggerRef}
                className="icon-button product-menu-button"
                type="button"
                aria-label="Open navigation"
                aria-controls="primary-navigation-drawer"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
              >
                <Icon name="menu" />
              </button>
            )}
            <Link className="product-mobile-brand" to="/" aria-label="Engineering Mastery Lab: Today" onClick={(event) => navigateFromShell(event, "/")}>
              <span className="product-brand__mark" aria-hidden="true">EM</span>
              <strong>Mastery Lab</strong>
            </Link>
            <div className="product-route-label"><span>Current workspace</span><strong>{currentTitle}</strong></div>
          </div>
          {contextLinks.length > 0 && (
            <nav className="context-navigation" aria-label={`Context navigation for ${currentTitle}`}>
              {contextLinks.map(([route, label]) => (
                <NavLink
                  key={route}
                  to={route}
                  end={route === "/learn"
                    || route === "/practice"
                    || route === "/projects"
                    || route === "/progress"
                    || route === "/more"}
                  onClick={(event) => navigateFromShell(event, route)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
          <button className="icon-button product-topbar__mobile-search" type="button" aria-label="Open global search" onClick={() => setSearchOpen(true)}>
            <Icon name="search" />
          </button>
        </div>

        <main id="main-content" ref={mainRef} tabIndex={-1}>
          <AcademyHandoffBanner />
          <Outlet />
        </main>
        <footer className="product-footer">
          <span>Engineering Mastery Lab</span>
          <span>Local learning workspace. Validate real-world engineering decisions independently.</span>
        </footer>
      </div>

      <nav className="mobile-bottom-navigation" aria-label="Primary mobile navigation">
        {mobilePrimaryDestinations.map((item) => (
          <NavLink key={item.route} to={item.route} aria-label={item.label} onClick={(event) => navigateFromShell(event, item.route)}>
            <Icon name={item.icon} size={20} /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={searchOpen} onClose={closeSearch} onRequestNavigate={requestNavigation} />
    </div>
  );
}

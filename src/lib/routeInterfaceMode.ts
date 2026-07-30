export type InterfaceMode = "editorial" | "workspace";

const workspaceRouteRoots = [
  "/projects",
  "/tools",
  "/portfolio",
  "/settings",
  "/learn/labs",
  "/learn/flagships",
  "/learn/diagnostics",
  "/learn/courses",
  "/learn/review",
  "/learn/reboot/sessions",
  "/learn/modules",
  "/learn/skills",
  "/learn/resources",
  "/labs",
  "/toolbox",
  "/cad",
  "/workbench",
  "/diagnostics",
  "/skills"
] as const;

function normalisePathname(pathname: string): string {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function isRouteOrDescendant(pathname: string, routeRoot: string): boolean {
  return pathname === routeRoot || pathname.startsWith(`${routeRoot}/`);
}

export function getRouteInterfaceMode(pathname: string): InterfaceMode {
  const normalisedPathname = normalisePathname(pathname);
  return workspaceRouteRoots.some((routeRoot) => isRouteOrDescendant(normalisedPathname, routeRoot))
    ? "workspace"
    : "editorial";
}

import { describe, expect, it } from "vitest";
import { getRouteInterfaceMode } from "../lib/routeInterfaceMode";

describe("route interface mode", () => {
  it.each([
    "/",
    "/learn",
    "/learn/",
    "/learn/roadmap",
    "/learn/reboot",
    "/learn/pathways",
    "/learn/pathways/robotics-autonomy",
    "/learn/bookmarks",
    "/pathways",
    "/about",
    "/pricing",
    "/not-a-route"
  ])("classifies %s as editorial", (pathname) => {
    expect(getRouteInterfaceMode(pathname)).toBe("editorial");
  });

  it.each([
    "/projects",
    "/projects/releases/P1",
    "/projects/rover-autonomy",
    "/tools",
    "/tools/calculators",
    "/tools/engineering/project",
    "/portfolio",
    "/portfolio/capstone",
    "/settings",
    "/settings/profile",
    "/learn/labs",
    "/learn/labs/robotics",
    "/learn/flagships/robotics-autonomy",
    "/learn/diagnostics",
    "/learn/courses",
    "/learn/courses/ACADEMY-E0",
    "/learn/courses/ACADEMY-E0/units/EML-E0-D01",
    "/learn/courses/ACADEMY-E0/units/EML-E0-D01/lessons/EML-E0-D01-L01",
    "/learn/courses/ACADEMY-E0/units/EML-E0-D01/assessments/quiz",
    "/learn/courses/ACADEMY-E0/challenge",
    "/learn/review",
    "/learn/reboot/sessions/S001",
    "/learn/modules/EML-E3-D18",
    "/learn/skills",
    "/learn/resources/",
    "/labs",
    "/labs/pid",
    "/toolbox",
    "/cad",
    "/workbench",
    "/diagnostics",
    "/skills"
  ])("classifies %s as workspace", (pathname) => {
    expect(getRouteInterfaceMode(pathname)).toBe("workspace");
  });

  it.each([
    "/project",
    "/projects-archive",
    "/toolshed",
    "/portfolio-preview",
    "/settings-preview",
    "/learn/laboratories",
    "/learn/resources-preview",
    "/learn/courses-preview",
    "/learn/reviewer",
    "/cadence",
    "/skills-preview"
  ])("does not treat the partial segment %s as a workspace route", (pathname) => {
    expect(getRouteInterfaceMode(pathname)).toBe("editorial");
  });
});

import {
  academyCourses,
  academyUnits
} from "../../data/academy/catalogue";
import { loadAcademyLesson } from "./curriculum";
import type { Lesson } from "./types";

const ACADEMY_HANDOFF_TEXT_LIMIT = 2_000;
const ACADEMY_HANDOFF_ROUTE_LIMIT = 2_000;
const academyIdentifierPattern = /^[A-Za-z0-9][A-Za-z0-9._~-]{0,119}$/;
const academyDestinationPatterns = [
  /^\/learn\/labs\/[A-Za-z0-9][A-Za-z0-9._~-]*$/,
  /^\/learn\/flagships\/[A-Za-z0-9][A-Za-z0-9._~-]*$/,
  /^\/projects\/[A-Za-z0-9][A-Za-z0-9._~/-]*$/,
  /^\/tools\/[A-Za-z0-9][A-Za-z0-9._~/-]*$/,
  /^\/portfolio\/[A-Za-z0-9][A-Za-z0-9._~/-]*$/
] as const;
const handoffParameterNames = [
  "academyReturn",
  "lesson",
  "block",
  "task",
  "expected"
] as const;

export interface AcademyHandoffContext {
  academyReturn: string;
  courseId: string;
  unitId: string;
  lessonId: string;
  blockId: string;
  task: string;
  expectedOutcome: string;
  destinationRoute: string;
  labId: string;
}

export type AcademyHandoffParseResult =
  | { status: "absent" }
  | { status: "invalid"; message: string }
  | { status: "valid"; context: AcademyHandoffContext };

export interface BuildAcademyHandoffRouteInput {
  destinationRoute: string;
  academyReturn: string;
  lessonId: string;
  blockId: string;
  task: string;
  expectedOutcome: string;
}

interface AcademyReturnIdentity {
  route: string;
  courseId: string;
  unitId: string;
  lessonId: string;
  blockId: string;
}

function validateInternalDestination(route: unknown): string {
  if (
    typeof route !== "string"
    || route.length === 0
    || route.length > ACADEMY_HANDOFF_ROUTE_LIMIT
    || route.includes("\\")
    || route.includes("?")
    || route.includes("#")
    || route.includes("\0")
    || route.startsWith("//")
    || !academyDestinationPatterns.some((pattern) => pattern.test(route))
  ) {
    throw new Error("Academy activity destination must be an approved canonical internal route.");
  }
  return route;
}

function validateIdentifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !academyIdentifierPattern.test(value)) {
    throw new Error(`${label} must be a canonical Academy identifier.`);
  }
  return value;
}

function validateContextText(value: unknown, label: string): string {
  const hasDisallowedControlCharacter = typeof value === "string"
    && [...value].some((character) => {
      const code = character.charCodeAt(0);
      return (
        (code >= 0 && code <= 8)
        || code === 11
        || code === 12
        || (code >= 14 && code <= 31)
        || code === 127
      );
    });
  if (
    typeof value !== "string"
    || value.length > ACADEMY_HANDOFF_TEXT_LIMIT
    || hasDisallowedControlCharacter
  ) {
    throw new Error(`${label} is not valid Academy activity text.`);
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function validateAcademyReturn(value: unknown): AcademyReturnIdentity {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > ACADEMY_HANDOFF_ROUTE_LIMIT
    || value.includes("\\")
    || value.includes("#")
    || value.startsWith("//")
  ) {
    throw new Error("academyReturn must be a canonical internal lesson route.");
  }
  const separator = value.indexOf("?");
  if (separator < 1) {
    throw new Error("academyReturn must include the exact lesson block resume target.");
  }
  const pathname = value.slice(0, separator);
  const query = value.slice(separator + 1);
  const routeMatch =
    /^\/learn\/courses\/([^/]+)\/units\/([^/]+)\/lessons\/([^/]+)$/.exec(pathname);
  if (!routeMatch) {
    throw new Error("academyReturn must target a canonical Academy lesson.");
  }
  const returnParameters = new URLSearchParams(query);
  const resumeValues = returnParameters.getAll("resume");
  if (
    resumeValues.length !== 1
    || [...returnParameters.keys()].some((key) => key !== "resume")
  ) {
    throw new Error("academyReturn must contain one resume parameter and no other query fields.");
  }

  const courseId = validateIdentifier(routeMatch[1], "academyReturn course");
  const unitId = validateIdentifier(routeMatch[2], "academyReturn unit");
  const lessonId = validateIdentifier(routeMatch[3], "academyReturn lesson");
  const blockId = validateIdentifier(resumeValues[0], "academyReturn resume block");
  const course = academyCourses.find((candidate) => candidate.id === courseId);
  const unit = academyUnits.find((candidate) => candidate.id === unitId);
  if (
    !course
    || !unit
    || unit.courseId !== course.id
    || !unit.lessonIds.includes(lessonId)
  ) {
    throw new Error("academyReturn does not resolve through the Academy catalogue.");
  }
  const canonicalRoute = `${pathname}?${new URLSearchParams({ resume: blockId }).toString()}`;
  if (value !== canonicalRoute) {
    throw new Error("academyReturn is not canonically encoded.");
  }
  return {
    route: canonicalRoute,
    courseId,
    unitId,
    lessonId,
    blockId
  };
}

function getSingleParameter(parameters: URLSearchParams, name: string): string {
  const values = parameters.getAll(name);
  if (values.length !== 1) {
    throw new Error(`${name} must appear exactly once.`);
  }
  return values[0];
}

export function buildAcademyHandoffRoute(
  input: BuildAcademyHandoffRouteInput
): string {
  const destinationRoute = validateInternalDestination(input.destinationRoute);
  const academyReturn = validateAcademyReturn(input.academyReturn);
  const lessonId = validateIdentifier(input.lessonId, "lesson");
  const blockId = validateIdentifier(input.blockId, "block");
  const task = validateContextText(input.task, "task");
  const expectedOutcome = validateContextText(input.expectedOutcome, "expected");
  if (
    lessonId !== academyReturn.lessonId
    || blockId !== academyReturn.blockId
    || blockId !== `${lessonId}-BLOCK-LAB`
  ) {
    throw new Error("Academy handoff identity does not match its return route.");
  }
  const parameters = new URLSearchParams({
    academyReturn: academyReturn.route,
    lesson: lessonId,
    block: blockId,
    task,
    expected: expectedOutcome
  });
  return `${destinationRoute}?${parameters.toString()}`;
}

export function parseAcademyHandoffContext(
  search: string,
  destinationRoute: string
): AcademyHandoffParseResult {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const presentCount = handoffParameterNames.filter((name) => parameters.has(name)).length;
  if (presentCount === 0) return { status: "absent" };
  try {
    if (presentCount !== handoffParameterNames.length) {
      throw new Error("Academy activity context is incomplete.");
    }
    const destination = validateInternalDestination(destinationRoute);
    const academyReturn = validateAcademyReturn(
      getSingleParameter(parameters, "academyReturn")
    );
    const lessonId = validateIdentifier(
      getSingleParameter(parameters, "lesson"),
      "lesson"
    );
    const blockId = validateIdentifier(
      getSingleParameter(parameters, "block"),
      "block"
    );
    const task = validateContextText(getSingleParameter(parameters, "task"), "task");
    const expectedOutcome = validateContextText(
      getSingleParameter(parameters, "expected"),
      "expected"
    );
    if (
      lessonId !== academyReturn.lessonId
      || blockId !== academyReturn.blockId
      || blockId !== `${lessonId}-BLOCK-LAB`
    ) {
      throw new Error("Academy activity identity does not match academyReturn.");
    }
    return {
      status: "valid",
      context: {
        academyReturn: academyReturn.route,
        courseId: academyReturn.courseId,
        unitId: academyReturn.unitId,
        lessonId,
        blockId,
        task,
        expectedOutcome,
        destinationRoute: destination,
        labId: blockId
      }
    };
  } catch (caught) {
    return {
      status: "invalid",
      message: caught instanceof Error
        ? caught.message
        : "Academy activity context is invalid."
    };
  }
}

export function validateAcademyHandoffLesson(
  context: AcademyHandoffContext,
  lesson: Lesson
): AcademyHandoffContext {
  if (lesson.id !== context.lessonId || lesson.unitId !== context.unitId) {
    throw new Error("Academy activity context does not match the authored lesson.");
  }
  const block = lesson.blocks.find((candidate) => candidate.id === context.blockId);
  if (
    !block
    || block.kind !== "laboratory-callout"
    || block.route !== context.destinationRoute
    || block.task !== context.task
    || block.expectedOutcome !== context.expectedOutcome
  ) {
    throw new Error("Academy activity context does not match the authored laboratory task.");
  }
  return context;
}

export async function resolveAcademyHandoffContext(
  context: AcademyHandoffContext
): Promise<AcademyHandoffContext> {
  const lesson = await loadAcademyLesson(context.lessonId);
  if (!lesson) {
    throw new Error("Academy activity lesson could not be loaded.");
  }
  return validateAcademyHandoffLesson(context, lesson);
}

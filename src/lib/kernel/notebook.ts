import { KERNEL_LIMITS } from "./limits";
import {
  assertOnlyKeys,
  assertUniqueIds,
  requireArray,
  requireIdentifier,
  requireRecord,
  requireText
} from "./validation";

export type NotebookBlockKind =
  | "note"
  | "assumption"
  | "reflection"
  | "variable"
  | "calculation"
  | "dataset"
  | "scenario"
  | "table"
  | "evidence";

export interface NotebookBlock {
  version: 1;
  id: string;
  kind: NotebookBlockKind;
  text: string;
  referenceId?: string;
}

export interface EngineeringNotebook {
  version: 1;
  blocks: NotebookBlock[];
}

export function sanitiseNotebookText(value: string): string {
  const bounded = requireText(value, "notebook text", KERNEL_LIMITS.notebookBlockCharacters);
  return bounded
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .trim();
}

export function validateNotebook(value: unknown, path = "notebook"): EngineeringNotebook {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["version", "blocks"]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  const blocks = requireArray(record.blocks, `${path}.blocks`, KERNEL_LIMITS.notebookBlocks)
    .map((block, index) => validateNotebookBlock(block, `${path}.blocks[${index}]`));
  assertUniqueIds(blocks, `${path}.blocks`);
  return { version: 1, blocks };
}

export function createNotebookBlock(
  id: string,
  kind: NotebookBlockKind,
  text: string,
  referenceId?: string
): NotebookBlock {
  return validateNotebookBlock({
    version: 1,
    id,
    kind,
    text,
    ...(referenceId !== undefined ? { referenceId } : {})
  }, "notebook block");
}

function validateNotebookBlock(value: unknown, path: string): NotebookBlock {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["version", "id", "kind", "text", "referenceId"]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  if (![
    "note",
    "assumption",
    "reflection",
    "variable",
    "calculation",
    "dataset",
    "scenario",
    "table",
    "evidence"
  ].includes(String(record.kind))) {
    throw new Error(`${path}.kind is invalid`);
  }
  const kind = record.kind as NotebookBlockKind;
  const referenceId = record.referenceId === undefined
    ? undefined
    : requireIdentifier(record.referenceId, `${path}.referenceId`);
  const requiresReference = [
    "variable",
    "calculation",
    "dataset",
    "scenario",
    "table",
    "evidence"
  ].includes(kind);
  if (requiresReference && referenceId === undefined) {
    throw new Error(`${path}.referenceId is required for ${kind} blocks`);
  }
  if (!requiresReference && referenceId !== undefined) {
    throw new Error(`${path}.referenceId is not valid for ${kind} blocks`);
  }
  return {
    version: 1,
    id: requireIdentifier(record.id, `${path}.id`),
    kind,
    text: sanitiseNotebookText(requireText(
      record.text,
      `${path}.text`,
      KERNEL_LIMITS.notebookBlockCharacters
    )),
    ...(referenceId !== undefined ? { referenceId } : {})
  };
}

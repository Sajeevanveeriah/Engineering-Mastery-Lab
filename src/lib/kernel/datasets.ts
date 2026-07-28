import { KERNEL_LIMITS } from "./limits";
import { ENGINEERING_UNIT_REGISTRY, EngineeringUnitRegistry, getEngineeringUnit } from "./units";
import {
  assertNoUnsafeKeysDeep,
  assertOnlyKeys,
  assertSafeKey,
  assertUniqueIds,
  compareOrdinal,
  defineSafe,
  requireArray,
  requireFiniteNumber,
  requireIdentifier,
  requireRecord,
  requireText
} from "./validation";

export type DatasetColumnType = "number" | "text" | "boolean";
export type DatasetCell = number | string | boolean | null;

export interface DatasetColumn {
  id: string;
  label: string;
  type: DatasetColumnType;
  unitId?: string;
}

export interface DatasetProvenance {
  sourceLabel: string;
  licenceId?: string;
  learnerGenerated: boolean;
}

export interface EngineeringDataset {
  version: 1;
  id: string;
  name: string;
  source: "manual" | "csv" | "json";
  provenance: DatasetProvenance;
  columns: DatasetColumn[];
  rows: Array<Record<string, DatasetCell>>;
}

export interface DatasetImportOptions {
  id: string;
  name: string;
  unitIds?: Record<string, string>;
  provenance?: DatasetProvenance;
}

export interface DatasetSummary {
  rows: number;
  columns: number;
  missingCells: number;
  duplicateRows: number;
}

export function parseDatasetCsv(
  text: string,
  options: DatasetImportOptions,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringDataset {
  if (text.length > KERNEL_LIMITS.datasetCharacters) {
    throw new Error(`CSV dataset exceeds ${KERNEL_LIMITS.datasetCharacters} characters`);
  }
  const matrix = parseCsvMatrix(text);
  if (matrix.length < 2) throw new Error("CSV dataset must include a header and at least one data row");
  const headers = matrix[0].map((header, index) => {
    const id = requireIdentifier(header.trim(), `CSV header ${index + 1}`);
    return { id, label: header.trim() };
  });
  if (headers.length > KERNEL_LIMITS.datasetColumns) {
    throw new Error(`CSV dataset exceeds ${KERNEL_LIMITS.datasetColumns} columns`);
  }
  assertUniqueIds(headers, "CSV headers");
  const rawRows = matrix.slice(1);
  if (rawRows.length > KERNEL_LIMITS.datasetRows) {
    throw new Error(`CSV dataset exceeds ${KERNEL_LIMITS.datasetRows} rows`);
  }
  rawRows.forEach((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${row.length} cells; expected ${headers.length}`);
    }
  });
  const columns = headers.map((header, columnIndex) => {
    const type = inferColumnType(rawRows.map((row) => row[columnIndex]));
    const unitId = options.unitIds?.[header.id];
    if (unitId !== undefined) {
      if (type !== "number") throw new Error(`CSV column ${header.id} cannot have a unit because it is not numeric`);
      getEngineeringUnit(unitId, registry);
    }
    return {
      id: header.id,
      label: header.label,
      type,
      ...(unitId !== undefined ? { unitId } : {})
    };
  });
  const rows = rawRows.map((row) => rowToRecord(row, columns));
  return validateDataset({
    version: 1,
    id: options.id,
    name: options.name,
    source: "csv",
    provenance: options.provenance ?? defaultProvenance("csv"),
    columns,
    rows
  }, registry);
}

export function parseDatasetJson(
  json: string,
  options: DatasetImportOptions = { id: "imported-dataset", name: "Imported dataset" },
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY
): EngineeringDataset {
  if (json.length > KERNEL_LIMITS.datasetCharacters) {
    throw new Error(`JSON dataset exceeds ${KERNEL_LIMITS.datasetCharacters} characters`);
  }
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    throw new Error("JSON dataset is not valid JSON");
  }
  assertNoUnsafeKeysDeep(value, "JSON dataset");
  if (!Array.isArray(value)) return validateDataset(value, registry);
  return datasetFromJsonRecords(value, options, registry);
}

export function exportDatasetJson(dataset: EngineeringDataset): string {
  return JSON.stringify(validateDataset(dataset), null, 2);
}

export function exportDatasetCsv(dataset: EngineeringDataset): string {
  const valid = validateDataset(dataset);
  const lines = [valid.columns.map((column) => encodeCsvCell(column.id)).join(",")];
  for (const row of valid.rows) {
    lines.push(valid.columns.map((column) => {
      const value = row[column.id];
      return encodeCsvCell(value === null ? "" : String(value));
    }).join(","));
  }
  return lines.join("\n");
}

export function summariseDataset(dataset: EngineeringDataset): DatasetSummary {
  const valid = validateDataset(dataset);
  let missingCells = 0;
  let duplicateRows = 0;
  const seen = new Set<string>();
  for (const row of valid.rows) {
    const values = valid.columns.map((column) => row[column.id]);
    missingCells += values.filter((value) => value === null).length;
    const signature = JSON.stringify(values);
    if (seen.has(signature)) duplicateRows += 1;
    else seen.add(signature);
  }
  return {
    rows: valid.rows.length,
    columns: valid.columns.length,
    missingCells,
    duplicateRows
  };
}

export function validateDataset(
  value: unknown,
  registry: EngineeringUnitRegistry = ENGINEERING_UNIT_REGISTRY,
  path = "dataset"
): EngineeringDataset {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["version", "id", "name", "source", "provenance", "columns", "rows"]), path);
  if (record.version !== 1) throw new Error(`${path}.version is unsupported`);
  if (record.source !== "manual" && record.source !== "csv" && record.source !== "json") {
    throw new Error(`${path}.source is invalid`);
  }
  const columnValues = requireArray(record.columns, `${path}.columns`, KERNEL_LIMITS.datasetColumns);
  if (columnValues.length === 0) throw new Error(`${path}.columns must not be empty`);
  const columns = columnValues.map((column, index) =>
    validateColumn(column, registry, `${path}.columns[${index}]`)
  );
  assertUniqueIds(columns, `${path}.columns`);
  const rows = requireArray(record.rows, `${path}.rows`, KERNEL_LIMITS.datasetRows)
    .map((row, index) => validateRow(row, columns, `${path}.rows[${index}]`));
  return {
    version: 1,
    id: requireIdentifier(record.id, `${path}.id`),
    name: requireText(record.name, `${path}.name`, KERNEL_LIMITS.shortTextCharacters),
    source: record.source,
    provenance: record.provenance === undefined
      ? defaultProvenance(record.source)
      : validateDatasetProvenance(record.provenance, `${path}.provenance`),
    columns,
    rows
  };
}

function datasetFromJsonRecords(
  values: unknown[],
  options: DatasetImportOptions,
  registry: EngineeringUnitRegistry
): EngineeringDataset {
  if (values.length === 0) throw new Error("JSON dataset record array must not be empty");
  if (values.length > KERNEL_LIMITS.datasetRows) {
    throw new Error(`JSON dataset exceeds ${KERNEL_LIMITS.datasetRows} rows`);
  }
  const records = values.map((value, index) => requireRecord(value, `JSON dataset[${index}]`));
  const keySet = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      assertSafeKey(key, "JSON dataset");
      requireIdentifier(key, `JSON dataset key ${key}`);
      keySet.add(key);
    }
  }
  const keys = [...keySet].sort(compareOrdinal);
  if (keys.length === 0) throw new Error("JSON dataset records must contain at least one field");
  if (keys.length > KERNEL_LIMITS.datasetColumns) {
    throw new Error(`JSON dataset exceeds ${KERNEL_LIMITS.datasetColumns} columns`);
  }
  const columns = keys.map((key) => {
    const rawValues = records.map((record) => record[key] ?? null);
    const type = inferJsonColumnType(rawValues, key);
    const unitId = options.unitIds?.[key];
    if (unitId !== undefined) {
      if (type !== "number") throw new Error(`JSON column ${key} cannot have a unit because it is not numeric`);
      getEngineeringUnit(unitId, registry);
    }
    return { id: key, label: key, type, ...(unitId !== undefined ? { unitId } : {}) };
  });
  const rows = records.map((record, rowIndex) => {
    const result: Record<string, DatasetCell> = {};
    for (const column of columns) {
      const value = record[column.id] ?? null;
      defineSafe(result, column.id, validateCell(value, column, `JSON dataset[${rowIndex}].${column.id}`));
    }
    return result;
  });
  return validateDataset({
    version: 1,
    id: options.id,
    name: options.name,
    source: "json",
    provenance: options.provenance ?? defaultProvenance("json"),
    columns,
    rows
  }, registry);
}

function defaultProvenance(source: EngineeringDataset["source"]): DatasetProvenance {
  return {
    sourceLabel: source === "manual"
      ? "Local source not specified"
      : `Local ${source.toUpperCase()} import source not specified`,
    learnerGenerated: false
  };
}

function validateDatasetProvenance(value: unknown, path: string): DatasetProvenance {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["sourceLabel", "licenceId", "learnerGenerated"]), path);
  if (typeof record.learnerGenerated !== "boolean") {
    throw new Error(`${path}.learnerGenerated must be a boolean`);
  }
  const licenceId = record.licenceId === undefined
    ? undefined
    : requireIdentifier(record.licenceId, `${path}.licenceId`);
  return {
    sourceLabel: requireText(record.sourceLabel, `${path}.sourceLabel`, KERNEL_LIMITS.longTextCharacters),
    ...(licenceId !== undefined ? { licenceId } : {}),
    learnerGenerated: record.learnerGenerated
  };
}

function validateColumn(
  value: unknown,
  registry: EngineeringUnitRegistry,
  path: string
): DatasetColumn {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["id", "label", "type", "unitId"]), path);
  if (record.type !== "number" && record.type !== "text" && record.type !== "boolean") {
    throw new Error(`${path}.type is invalid`);
  }
  const unitId = record.unitId === undefined
    ? undefined
    : requireIdentifier(record.unitId, `${path}.unitId`);
  if (unitId !== undefined) {
    if (record.type !== "number") throw new Error(`${path}.unitId is only valid for numeric columns`);
    getEngineeringUnit(unitId, registry);
  }
  return {
    id: requireIdentifier(record.id, `${path}.id`),
    label: requireText(record.label, `${path}.label`, KERNEL_LIMITS.shortTextCharacters),
    type: record.type,
    ...(unitId !== undefined ? { unitId } : {})
  };
}

function validateRow(
  value: unknown,
  columns: DatasetColumn[],
  path: string
): Record<string, DatasetCell> {
  const record = requireRecord(value, path);
  const columnIds = new Set(columns.map((column) => column.id));
  assertOnlyKeys(record, columnIds, path);
  const result: Record<string, DatasetCell> = {};
  for (const column of columns) {
    if (!Object.prototype.hasOwnProperty.call(record, column.id)) {
      throw new Error(`${path} is missing column ${column.id}`);
    }
    defineSafe(result, column.id, validateCell(record[column.id], column, `${path}.${column.id}`));
  }
  return result;
}

function validateCell(value: unknown, column: DatasetColumn, path: string): DatasetCell {
  if (value === null) return null;
  if (column.type === "number") return requireFiniteNumber(value, path);
  if (column.type === "boolean") {
    if (typeof value !== "boolean") throw new Error(`${path} must be a boolean or null`);
    return value;
  }
  return requireText(value, path, KERNEL_LIMITS.datasetCellCharacters);
}

function parseCsvMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (closedQuote) {
      if (character === ",") {
        row.push(validateRawCell(cell));
        cell = "";
        closedQuote = false;
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && text[index + 1] === "\n") index++;
        row.push(validateRawCell(cell));
        rows.push(row);
        if (rows.length > KERNEL_LIMITS.datasetRows + 1) {
          throw new Error(`CSV dataset exceeds ${KERNEL_LIMITS.datasetRows} rows`);
        }
        row = [];
        cell = "";
        closedQuote = false;
      } else {
        throw new Error("CSV dataset contains invalid content after a closing quote");
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === '"') {
      throw new Error("CSV dataset contains an unexpected quote in an unquoted cell");
    } else if (character === ",") {
      row.push(validateRawCell(cell));
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(validateRawCell(cell));
      rows.push(row);
      if (rows.length > KERNEL_LIMITS.datasetRows + 1) {
        throw new Error(`CSV dataset exceeds ${KERNEL_LIMITS.datasetRows} rows`);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("CSV dataset contains an unclosed quoted cell");
  if (closedQuote || cell.length > 0 || row.length > 0) {
    row.push(validateRawCell(cell));
    rows.push(row);
  }
  return rows;
}

function validateRawCell(value: string): string {
  if (value.length > KERNEL_LIMITS.datasetCellCharacters) {
    throw new Error(`CSV cell exceeds ${KERNEL_LIMITS.datasetCellCharacters} characters`);
  }
  return value;
}

function inferColumnType(values: string[]): DatasetColumnType {
  const populated = values.filter((value) => value.trim() !== "");
  if (populated.length > 0 && populated.every(isStrictNumber)) return "number";
  if (populated.length > 0 && populated.every((value) => /^(true|false)$/i.test(value.trim()))) return "boolean";
  return "text";
}

function inferJsonColumnType(values: unknown[], key: string): DatasetColumnType {
  const populated = values.filter((value) => value !== null);
  if (populated.length === 0) return "text";
  if (populated.every((value) => typeof value === "number" && Number.isFinite(value))) return "number";
  if (populated.every((value) => typeof value === "boolean")) return "boolean";
  if (populated.every((value) => typeof value === "string")) {
    populated.forEach((value, index) =>
      requireText(value, `JSON column ${key}[${index}]`, KERNEL_LIMITS.datasetCellCharacters)
    );
    return "text";
  }
  throw new Error(`JSON column ${key} mixes incompatible value types`);
}

function rowToRecord(values: string[], columns: DatasetColumn[]): Record<string, DatasetCell> {
  const row: Record<string, DatasetCell> = {};
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const raw = values[index];
    let cell: DatasetCell = raw;
    if (raw.trim() === "") cell = null;
    else if (column.type === "number") cell = Number(raw.trim());
    else if (column.type === "boolean") cell = raw.trim().toLowerCase() === "true";
    defineSafe(row, column.id, cell);
  }
  return row;
}

function isStrictNumber(value: string): boolean {
  const trimmed = value.trim();
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed) && Number.isFinite(Number(trimmed));
}

function encodeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

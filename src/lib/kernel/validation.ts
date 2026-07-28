import { KERNEL_LIMITS } from "./limits";

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Deterministic UTF-16 code-unit ordering for canonical records and kernel
 * collections. Unlike localeCompare, this does not vary with the host locale.
 */
export function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error(`${path} must be an object`);
  return value;
}

export function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string
): void {
  for (const key of Object.keys(value)) {
    assertSafeKey(key, path);
    if (!allowed.has(key)) throw new Error(`${path} contains unsupported field ${key}`);
  }
}

export function assertSafeKey(key: string, path: string): void {
  if (key.length === 0 || key.length > KERNEL_LIMITS.identifierCharacters) {
    throw new Error(`${path} contains an invalid key`);
  }
  if (UNSAFE_KEYS.has(key) || containsControlCharacter(key)) {
    throw new Error(`${path} contains an unsafe key`);
  }
}

export function requireIdentifier(value: unknown, path: string): string {
  const id = requireText(value, path, KERNEL_LIMITS.identifierCharacters).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id) || UNSAFE_KEYS.has(id)) {
    throw new Error(`${path} must be a safe identifier`);
  }
  return id;
}

export function requireText(value: unknown, path: string, maximum: number): string {
  if (typeof value !== "string") throw new Error(`${path} must be text`);
  if (value.length > maximum) throw new Error(`${path} exceeds ${maximum} characters`);
  if (containsControlCharacter(value, true)) throw new Error(`${path} contains unsupported control characters`);
  return value;
}

export function optionalText(value: unknown, path: string, maximum: number): string | undefined {
  if (value === undefined) return undefined;
  return requireText(value, path, maximum);
}

export function requireFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} must be a finite number`);
  return value;
}

export function requireInteger(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${path} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

export function requireUtcTimestamp(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length > 32) {
    throw new Error(`${path} must be a valid UTC ISO timestamp`);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) throw new Error(`${path} must be a valid UTC ISO timestamp`);
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const millisecond = Number((match[7] ?? "").padEnd(3, "0"));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second ||
    date.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error(`${path} must be a valid UTC ISO timestamp`);
  }
  return value;
}

export function requireArray(value: unknown, path: string, maximum: number): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  if (value.length > maximum) throw new Error(`${path} exceeds ${maximum} entries`);
  return value;
}

export function assertNoUnsafeKeysDeep(value: unknown, path = "value", depth = 0): void {
  if (depth > KERNEL_LIMITS.objectDepth) throw new Error(`${path} is nested too deeply`);
  if (Array.isArray(value)) {
    if (value.length > KERNEL_LIMITS.datasetRows * 2) throw new Error(`${path} has too many entries`);
    value.forEach((item, index) => assertNoUnsafeKeysDeep(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (isPlainRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      assertSafeKey(key, path);
      assertNoUnsafeKeysDeep(item, `${path}.${key}`, depth + 1);
    }
  }
}

export function defineSafe<T>(target: Record<string, T>, key: string, value: T): void {
  assertSafeKey(key, "record");
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
}

export function assertUniqueIds(items: ReadonlyArray<{ id: string }>, path: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`${path} contains duplicate id ${item.id}`);
    ids.add(item.id);
  }
}

function containsControlCharacter(value: string, allowLineWhitespace = false): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (allowLineWhitespace && (code === 0x09 || code === 0x0a || code === 0x0d)) continue;
    if (code <= 0x1f || code === 0x7f) return true;
    if (
      code === 0x061c ||
      code === 0x200e ||
      code === 0x200f ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    ) {
      return true;
    }
  }
  return false;
}

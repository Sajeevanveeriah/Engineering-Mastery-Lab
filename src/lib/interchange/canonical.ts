import { assertNoUnsafeKeysDeep } from "../kernel/validation";
import { canonicalStringify } from "../kernel/bundle";

/**
 * Canonical JSON used by project packs and engineering reports.
 *
 * Object keys are sorted with an ordinal comparison, arrays preserve their
 * declared order, negative zero is normalised to zero, and values outside the
 * JSON data model are rejected. This keeps hashes independent of object
 * insertion order without silently discarding unsupported values.
 */
export function canonicalJson(value: unknown): string {
  assertNoUnsafeKeysDeep(value, "canonical value");
  return canonicalStringify(value);
}

export function canonicalPrettyJson(value: unknown): string {
  assertNoUnsafeKeysDeep(value, "canonical value");
  const canonical = canonicalStringify(value);
  return `${JSON.stringify(JSON.parse(canonical) as unknown, null, 2)}\n`;
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

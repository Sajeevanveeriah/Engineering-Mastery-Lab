export function allocateEdaUiId(prefix: string, existingIds: Iterable<string>): string {
  const used = new Set(existingIds);
  for (let suffix = 1; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
    const candidate = `${prefix}-ui-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`No identifier is available for ${prefix}.`);
}

export function allocateEdaReference(prefix: string, existingReferences: Iterable<string>): string {
  const used = new Set(existingReferences);
  for (let suffix = 1; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
    const candidate = `${prefix}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`No reference is available for ${prefix}.`);
}

export interface LocalTextFile {
  readonly size: number;
  text(): Promise<string>;
}

export async function readBoundedLocalTextFile(
  file: LocalTextFile,
  maximumBytes: number,
  label: string
): Promise<string> {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0) {
    throw new Error("Local text import byte limit is invalid");
  }
  if (!Number.isSafeInteger(file.size) || file.size < 0) {
    throw new Error(`${label} has an invalid byte size`);
  }
  if (file.size > maximumBytes) {
    throw new Error(`${label} exceeds ${maximumBytes} bytes`);
  }
  return file.text();
}

export const KERNEL_LIMITS = {
  bundleCharacters: 1_000_000,
  identifierCharacters: 120,
  shortTextCharacters: 240,
  longTextCharacters: 20_000,
  projectDescriptionCharacters: 4_000,
  collectionEntries: 512,
  datasetCharacters: 1_000_000,
  datasetColumns: 64,
  datasetRows: 5_000,
  datasetCellCharacters: 2_000,
  notebookBlocks: 256,
  notebookBlockCharacters: 20_000,
  graphNodes: 1_024,
  graphEdges: 4_096,
  objectDepth: 16
} as const;

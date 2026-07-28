import { KERNEL_LIMITS } from "./limits";
import {
  assertOnlyKeys,
  assertUniqueIds,
  compareOrdinal,
  requireArray,
  requireIdentifier,
  requireRecord,
  requireText
} from "./validation";

export type EvidenceNodeKind =
  | "project"
  | "milestone"
  | "variable"
  | "assumption"
  | "calculation"
  | "dataset"
  | "scenario"
  | "notebook"
  | "result"
  | "validation"
  | "evidence-record"
  | "report"
  | "artefact"
  | "decision";

export type EvidenceRelation = "derives" | "supports" | "verifies" | "documents" | "compares";

export interface EvidenceNode {
  id: string;
  kind: EvidenceNodeKind;
  label: string;
}

export interface EvidenceEdge {
  from: string;
  to: string;
  relation: EvidenceRelation;
}

export interface EngineeringEvidenceGraph {
  version: 1;
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}

export interface EvidenceGraphIssue {
  code: "broken-source" | "broken-target" | "cycle";
  message: string;
  path: string[];
}

const NODE_KINDS = new Set<EvidenceNodeKind>([
  "project",
  "milestone",
  "variable",
  "assumption",
  "calculation",
  "dataset",
  "scenario",
  "notebook",
  "result",
  "validation",
  "evidence-record",
  "report",
  "artefact",
  "decision"
]);

const RELATIONS = new Set<EvidenceRelation>([
  "derives",
  "supports",
  "verifies",
  "documents",
  "compares"
]);

export function inspectEvidenceGraph(value: unknown): {
  graph: EngineeringEvidenceGraph;
  issues: EvidenceGraphIssue[];
} {
  const graph = parseGraphShape(value);
  const ids = new Set(graph.nodes.map((node) => node.id));
  const issues: EvidenceGraphIssue[] = [];
  for (const edge of graph.edges) {
    if (!ids.has(edge.from)) {
      issues.push({
        code: "broken-source",
        message: `Evidence edge source ${edge.from} does not exist`,
        path: [edge.from, edge.to]
      });
    }
    if (!ids.has(edge.to)) {
      issues.push({
        code: "broken-target",
        message: `Evidence edge target ${edge.to} does not exist`,
        path: [edge.from, edge.to]
      });
    }
  }
  if (issues.some((issue) => issue.code !== "cycle")) return { graph, issues };
  const cycle = findDirectedCycle(graph);
  if (cycle) {
    issues.push({
      code: "cycle",
      message: `Evidence graph contains a directed cycle: ${cycle.join(" -> ")}`,
      path: cycle
    });
  }
  return { graph, issues };
}

export function validateEvidenceGraph(value: unknown): EngineeringEvidenceGraph {
  const result = inspectEvidenceGraph(value);
  if (result.issues.length > 0) {
    throw new Error(result.issues.map((issue) => issue.message).join("; "));
  }
  return result.graph;
}

function parseGraphShape(value: unknown): EngineeringEvidenceGraph {
  const record = requireRecord(value, "evidence graph");
  assertOnlyKeys(record, new Set(["version", "nodes", "edges"]), "evidence graph");
  if (record.version !== 1) throw new Error("evidence graph.version is unsupported");
  const nodes = requireArray(record.nodes, "evidence graph.nodes", KERNEL_LIMITS.graphNodes)
    .map((node, index) => validateNode(node, `evidence graph.nodes[${index}]`));
  assertUniqueIds(nodes, "evidence graph.nodes");
  const edges = requireArray(record.edges, "evidence graph.edges", KERNEL_LIMITS.graphEdges)
    .map((edge, index) => validateEdge(edge, `evidence graph.edges[${index}]`));
  const edgeKeys = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.from}\u0000${edge.relation}\u0000${edge.to}`;
    if (edgeKeys.has(key)) throw new Error("evidence graph.edges contains a duplicate edge");
    edgeKeys.add(key);
    if (edge.from === edge.to) throw new Error(`Evidence edge ${edge.from} cannot reference itself`);
  }
  return {
    version: 1,
    nodes: [...nodes].sort((left, right) => compareOrdinal(left.id, right.id)),
    edges: [...edges].sort((left, right) =>
      compareOrdinal(left.from, right.from) ||
      compareOrdinal(left.to, right.to) ||
      compareOrdinal(left.relation, right.relation)
    )
  };
}

function validateNode(value: unknown, path: string): EvidenceNode {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["id", "kind", "label"]), path);
  if (!NODE_KINDS.has(record.kind as EvidenceNodeKind)) throw new Error(`${path}.kind is invalid`);
  return {
    id: requireIdentifier(record.id, `${path}.id`),
    kind: record.kind as EvidenceNodeKind,
    label: requireText(record.label, `${path}.label`, KERNEL_LIMITS.shortTextCharacters)
  };
}

function validateEdge(value: unknown, path: string): EvidenceEdge {
  const record = requireRecord(value, path);
  assertOnlyKeys(record, new Set(["from", "to", "relation"]), path);
  if (!RELATIONS.has(record.relation as EvidenceRelation)) throw new Error(`${path}.relation is invalid`);
  return {
    from: requireIdentifier(record.from, `${path}.from`),
    to: requireIdentifier(record.to, `${path}.to`),
    relation: record.relation as EvidenceRelation
  };
}

function findDirectedCycle(graph: EngineeringEvidenceGraph): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);
  for (const edge of graph.edges) {
    if (adjacency.has(edge.from) && adjacency.has(edge.to)) adjacency.get(edge.from)?.push(edge.to);
  }
  for (const neighbours of adjacency.values()) neighbours.sort(compareOrdinal);

  const state = new Map<string, "active" | "complete">();
  const stack: string[] = [];
  const visit = (nodeId: string): string[] | null => {
    state.set(nodeId, "active");
    stack.push(nodeId);
    for (const target of adjacency.get(nodeId) ?? []) {
      if (state.get(target) === "active") {
        const start = stack.indexOf(target);
        return [...stack.slice(start), target];
      }
      if (state.get(target) !== "complete") {
        const cycle = visit(target);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(nodeId, "complete");
    return null;
  };

  for (const nodeId of [...adjacency.keys()].sort(compareOrdinal)) {
    if (!state.has(nodeId)) {
      const cycle = visit(nodeId);
      if (cycle) return cycle;
    }
  }
  return null;
}

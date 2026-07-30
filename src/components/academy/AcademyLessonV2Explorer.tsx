import { useId, useMemo, useState } from "react";
import type {
  AcademyDiagramPosition,
  AcademyDomainCondition,
  AcademyDomainEntity,
  AcademyDomainRelation,
  AcademyExplorerGeometryPoint,
  AcademyExplorerPoint,
  AcademyExplorerState,
  AcademyLessonTeachingProfileV2
} from "../../data/academy/lessonTeachingProfileV2";

export interface AcademyLessonV2ExplorerProps {
  explorer: AcademyLessonTeachingProfileV2["explorer"];
  entities: readonly AcademyDomainEntity[];
  relations: readonly AcademyDomainRelation[];
  conditions: readonly AcademyDomainCondition[];
  sectionId?: string;
  resumeBlockId?: string;
}

interface AcademyLessonV2DomainGraphProps {
  positions: readonly AcademyDiagramPosition[];
  relationIds: readonly string[];
  entities: readonly AcademyDomainEntity[];
  relations: readonly AcademyDomainRelation[];
  activeRelationIds?: readonly string[];
  suppressedRelationIds?: readonly string[];
  reversedRelationIds?: readonly string[];
  textEquivalent: string;
}

interface PlotBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

const entityLabel = (
  entities: readonly AcademyDomainEntity[],
  entityId: string
): string =>
  entities.find((entity) => entity.entityId === entityId)?.label ?? entityId;

const relationLabel = (
  relations: readonly AcademyDomainRelation[],
  relationId: string
): string =>
  relations.find((relation) => relation.relationId === relationId)?.predicate
  ?? relationId;

const conditionLabel = (
  conditions: readonly AcademyDomainCondition[],
  conditionId: string
): string =>
  conditions.find((condition) => condition.conditionId === conditionId)?.statement
  ?? conditionId;

const finiteBounds = (
  points: readonly Pick<AcademyExplorerPoint, "x" | "y">[]
): PlotBounds => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minimumX = Math.min(...xValues);
  const maximumX = Math.max(...xValues);
  const minimumY = Math.min(...yValues);
  const maximumY = Math.max(...yValues);
  return {
    minimumX,
    maximumX: maximumX === minimumX ? minimumX + 1 : maximumX,
    minimumY,
    maximumY: maximumY === minimumY ? minimumY + 1 : maximumY
  };
};

const plotX = (value: number, bounds: PlotBounds): number =>
  64 + ((value - bounds.minimumX) / (bounds.maximumX - bounds.minimumX)) * 392;

const plotY = (value: number, bounds: PlotBounds): number =>
  248 - ((value - bounds.minimumY) / (bounds.maximumY - bounds.minimumY)) * 184;

const wrapGraphLabel = (
  label: string,
  maximumCharacters = 20
): string[] => {
  const words = label.trim().split(/\s+/u).filter(Boolean);
  return words.reduce<string[]>((lines, word) => {
    const last = lines.at(-1);
    if (!last || `${last} ${word}`.length > maximumCharacters) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${last} ${word}`;
    }
    return lines;
  }, []);
};

export function AcademyLessonV2DomainGraph({
  positions,
  relationIds,
  entities,
  relations,
  activeRelationIds = [],
  suppressedRelationIds = [],
  reversedRelationIds = [],
  textEquivalent
}: AcademyLessonV2DomainGraphProps) {
  const markerId = `academy-v2-arrow-${useId().replaceAll(":", "")}`;
  const positionByEntityId = new Map(
    positions.map((position) => [position.entityId, position])
  );
  const labelLinesByEntityId = new Map(
    positions.map((position) => {
      const label = entityLabel(entities, position.entityId);
      return [position.entityId, wrapGraphLabel(label)] as const;
    })
  );
  const maximumColumn = Math.max(0, ...positions.map((position) => position.column));
  const maximumRow = Math.max(0, ...positions.map((position) => position.row));
  const maximumLineCount = Math.max(
    1,
    ...[...labelLinesByEntityId.values()].map((lines) => lines.length)
  );
  const nodeWidth = 150;
  const nodeHeight = Math.max(52, 28 + maximumLineCount * 16);
  const columnGap = 185;
  const rowGap = nodeHeight + 68;
  const width = Math.max(560, nodeWidth + 40 + maximumColumn * columnGap);
  const height = Math.max(260, nodeHeight + 80 + maximumRow * rowGap);
  const coordinate = (position: AcademyDiagramPosition) => ({
    x: nodeWidth / 2 + 20 + position.column * columnGap,
    y: nodeHeight / 2 + 30 + position.row * rowGap
  });

  return (
    <figure className="academy-v2-graph">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={textEquivalent}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" />
          </marker>
        </defs>
        <g className="academy-v2-graph__relations">
          {relationIds.flatMap((relationId) => {
            const relation = relations.find(
              (candidate) => candidate.relationId === relationId
            );
            if (!relation) return [];
            const reversed = reversedRelationIds.includes(relationId);
            const fromIds = reversed ? relation.toEntityIds : relation.fromEntityIds;
            const toIds = reversed ? relation.fromEntityIds : relation.toEntityIds;
            return fromIds.flatMap((fromId) =>
              toIds.map((toId) => {
                const from = positionByEntityId.get(fromId);
                const to = positionByEntityId.get(toId);
                if (!from || !to) return null;
                const fromCoordinate = coordinate(from);
                const toCoordinate = coordinate(to);
                const active = activeRelationIds.includes(relationId);
                const suppressed = suppressedRelationIds.includes(relationId);
                return (
                  <g
                    key={`${relationId}-${fromId}-${toId}`}
                    className={[
                      "academy-v2-graph__relation",
                      active ? "is-active" : "",
                      suppressed ? "is-suppressed" : "",
                      reversed ? "is-reversed" : ""
                    ].filter(Boolean).join(" ")}
                    data-relation-id={relationId}
                    data-relation-state={
                      suppressed ? "suppressed" : active ? "active" : "available"
                    }
                  >
                    <line
                      x1={fromCoordinate.x}
                      y1={fromCoordinate.y}
                      x2={toCoordinate.x}
                      y2={toCoordinate.y}
                      markerEnd={
                        relation.direction === "directed"
                          ? `url(#${markerId})`
                          : undefined
                      }
                    />
                    <title>
                      {`${relation.predicate}${reversed ? " (reversed in this state)" : ""}`}
                    </title>
                  </g>
                );
              })
            );
          })}
        </g>
        <g className="academy-v2-graph__entities">
          {positions.map((position) => {
            const point = coordinate(position);
            const label = entityLabel(entities, position.entityId);
            const labelLines = labelLinesByEntityId.get(position.entityId)
              ?? [label];
            return (
              <g
                key={position.entityId}
                transform={`translate(${point.x} ${point.y})`}
                data-entity-id={position.entityId}
              >
                <rect
                  x={-nodeWidth / 2}
                  y={-nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="12"
                />
                <text
                  textAnchor="middle"
                  y={-(labelLines.length - 1) * 8}
                >
                  {labelLines.map((line, index) => (
                    <tspan
                      key={`${position.entityId}-line-${index}`}
                      x="0"
                      dy={index === 0 ? 0 : 16}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
                <title>{label}</title>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption>{textEquivalent}</figcaption>
    </figure>
  );
}

function ParameterSweep({
  state,
  entities,
  conditions,
  textEquivalent
}: {
  state: Extract<AcademyExplorerState, { kind: "parameter-sweep" }>;
  entities: readonly AcademyDomainEntity[];
  conditions: readonly AcademyDomainCondition[];
  textEquivalent: string;
}) {
  const bounds = finiteBounds(state.points);
  const [xAxis, yAxis] = state.axes;
  return (
    <figure className="academy-v2-plot" data-explorer-kind={state.kind}>
      <svg
        viewBox="0 0 520 300"
        role="img"
        aria-label={textEquivalent}
        preserveAspectRatio="xMidYMid meet"
      >
        <line className="academy-v2-plot__axis" x1="64" y1="248" x2="474" y2="248" />
        <line className="academy-v2-plot__axis" x1="64" y1="248" x2="64" y2="44" />
        <text className="academy-v2-plot__axis-label" x="270" y="286" textAnchor="middle">
          {`${xAxis.label}${xAxis.unit ? ` (${xAxis.unit})` : ""}`}
        </text>
        <text
          className="academy-v2-plot__axis-label"
          x="18"
          y="148"
          textAnchor="middle"
          transform="rotate(-90 18 148)"
        >
          {`${yAxis.label}${yAxis.unit ? ` (${yAxis.unit})` : ""}`}
        </text>
        {state.points.map((point) => {
          const highlighted = point.pointId === state.highlightedPointId;
          return (
            <g
              key={point.pointId}
              className={highlighted ? "is-highlighted" : ""}
              data-point-id={point.pointId}
              data-highlighted={highlighted}
            >
              <circle cx={plotX(point.x, bounds)} cy={plotY(point.y, bounds)} r={highlighted ? 8 : 6} />
              <text x={plotX(point.x, bounds) + 10} y={plotY(point.y, bounds) - 10}>
                {point.label}
              </text>
              <title>
                {`${point.label}: ${xAxis.label} ${point.x}, ${yAxis.label} ${point.y}. ${
                  point.conditionIds.map((id) => conditionLabel(conditions, id)).join(" ")
                }`}
              </title>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{textEquivalent}</span>
        <span>{state.verification}</span>
        <span>
          Axes represent {entityLabel(entities, xAxis.entityId)} and{" "}
          {entityLabel(entities, yAxis.entityId)}.
        </span>
      </figcaption>
    </figure>
  );
}

function GeometryTransform({
  state,
  entities,
  relations,
  textEquivalent
}: {
  state: Extract<AcademyExplorerState, { kind: "geometry-transform" }>;
  entities: readonly AcademyDomainEntity[];
  relations: readonly AcademyDomainRelation[];
  textEquivalent: string;
}) {
  const bounds = finiteBounds(state.points);
  const pointById = new Map(
    state.points.map((point: AcademyExplorerGeometryPoint) => [point.pointId, point])
  );
  return (
    <figure className="academy-v2-plot" data-explorer-kind={state.kind}>
      <svg
        viewBox="0 0 520 300"
        role="img"
        aria-label={textEquivalent}
        preserveAspectRatio="xMidYMid meet"
      >
        <line className="academy-v2-plot__axis" x1="64" y1="248" x2="474" y2="248" />
        <line className="academy-v2-plot__axis" x1="64" y1="248" x2="64" y2="44" />
        {state.segments.map((segment) => {
          const from = pointById.get(segment.fromPointId);
          const to = pointById.get(segment.toPointId);
          if (!from || !to) return null;
          return (
            <line
              key={segment.segmentId}
              className="academy-v2-plot__segment"
              x1={plotX(from.x, bounds)}
              y1={plotY(from.y, bounds)}
              x2={plotX(to.x, bounds)}
              y2={plotY(to.y, bounds)}
            >
              <title>{relationLabel(relations, segment.relationId)}</title>
            </line>
          );
        })}
        {state.points.map((point) => (
          <g key={point.pointId} data-point-id={point.pointId}>
            <circle cx={plotX(point.x, bounds)} cy={plotY(point.y, bounds)} r="7" />
            <text x={plotX(point.x, bounds) + 10} y={plotY(point.y, bounds) - 10}>
              {point.label}
            </text>
            <title>{`${point.label}: ${entityLabel(entities, point.entityId)}`}</title>
          </g>
        ))}
      </svg>
      <figcaption>
        <span>{textEquivalent}</span>
        <span>{state.verification}</span>
        <span>Reference frame: {entityLabel(entities, state.frameEntityId)}.</span>
      </figcaption>
    </figure>
  );
}

function ComparisonMatrix({
  state,
  entities,
  conditions,
  textEquivalent
}: {
  state: Extract<AcademyExplorerState, { kind: "comparison-matrix" }>;
  entities: readonly AcademyDomainEntity[];
  conditions: readonly AcademyDomainCondition[];
  textEquivalent: string;
}) {
  const cellByKey = new Map(
    state.cells.map((cell) => [`${cell.entityId}:${cell.conditionId}`, cell])
  );
  return (
    <div className="academy-v2-matrix" data-explorer-kind={state.kind}>
      <div className="table-scroll" role="region" aria-label="Comparison matrix. Horizontally scrollable when needed." tabIndex={0}>
        <table>
          <caption>{textEquivalent}</caption>
          <thead>
            <tr>
              <th scope="col">Entity</th>
              {state.columnConditionIds.map((conditionId) => (
                <th key={conditionId} scope="col">
                  {conditionLabel(conditions, conditionId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.rowEntityIds.map((entityId) => (
              <tr key={entityId}>
                <th scope="row">{entityLabel(entities, entityId)}</th>
                {state.columnConditionIds.map((conditionId) => {
                  const cell = cellByKey.get(`${entityId}:${conditionId}`);
                  return (
                    <td
                      key={`${entityId}:${conditionId}`}
                      data-cell-state={cell?.state ?? "not-observed"}
                    >
                      <strong>{cell?.state ?? "not-observed"}</strong>
                      <span>{cell?.label ?? "No authored observation."}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExplorerStateView({
  state,
  textEquivalent,
  entities,
  relations,
  conditions
}: {
  state: AcademyExplorerState;
  textEquivalent: string;
  entities: readonly AcademyDomainEntity[];
  relations: readonly AcademyDomainRelation[];
  conditions: readonly AcademyDomainCondition[];
}) {
  switch (state.kind) {
    case "causal-graph":
    case "state-graph":
      return (
        <div data-explorer-kind={state.kind}>
          <AcademyLessonV2DomainGraph
            positions={state.positions}
            relationIds={state.visibleRelationIds}
            entities={entities}
            relations={relations}
            activeRelationIds={state.activeRelationIds}
            suppressedRelationIds={state.suppressedRelationIds}
            reversedRelationIds={state.reversedRelationIds}
            textEquivalent={textEquivalent}
          />
          {state.annotations.length > 0 && (
            <ul className="academy-v2-explorer__annotations" aria-label="Model annotations">
              {state.annotations.map((annotation) => (
                <li key={annotation.annotationId}>{annotation.label}</li>
              ))}
            </ul>
          )}
        </div>
      );
    case "parameter-sweep":
      return (
        <ParameterSweep
          state={state}
          entities={entities}
          conditions={conditions}
          textEquivalent={textEquivalent}
        />
      );
    case "geometry-transform":
      return (
        <GeometryTransform
          state={state}
          entities={entities}
          relations={relations}
          textEquivalent={textEquivalent}
        />
      );
    case "comparison-matrix":
      return (
        <ComparisonMatrix
          state={state}
          entities={entities}
          conditions={conditions}
          textEquivalent={textEquivalent}
        />
      );
  }
}

export function AcademyLessonV2Explorer({
  explorer,
  entities,
  relations,
  conditions,
  sectionId,
  resumeBlockId
}: AcademyLessonV2ExplorerProps) {
  const [selectedControlId, setSelectedControlId] = useState(
    explorer.controls[0]?.id ?? ""
  );
  const generatedHeadingId = useId();
  const headingId = sectionId
    ? `${sectionId}-heading`
    : generatedHeadingId;
  const resultId = useId();
  const selectedControl = useMemo(
    () =>
      explorer.controls.find((control) => control.id === selectedControlId)
      ?? explorer.controls[0],
    [explorer.controls, selectedControlId]
  );

  if (!selectedControl) {
    return (
      <section
        id={sectionId}
        className="academy-v2-explorer"
        aria-labelledby={headingId}
        data-academy-resume-block={resumeBlockId}
      >
        <h2 id={headingId}>{explorer.title}</h2>
        <p role="alert">This lesson has no authored explorer controls.</p>
      </section>
    );
  }

  return (
    <section
      id={sectionId}
      className="academy-v2-explorer"
      aria-labelledby={headingId}
      data-academy-resume-block={resumeBlockId}
    >
      <header>
        <p className="eyebrow">Interactive concept explorer</p>
        <h2 id={headingId}>{explorer.title}</h2>
        <p>{explorer.description}</p>
      </header>
      <div
        className="academy-v2-explorer__controls"
        aria-label="Choose an authored model state"
      >
        {explorer.controls.map((control) => (
          <button
            key={control.id}
            type="button"
            aria-pressed={control.id === selectedControl.id}
            aria-controls={resultId}
            onClick={() => setSelectedControlId(control.id)}
          >
            {control.label}
          </button>
        ))}
      </div>
      <div
        id={resultId}
        className="academy-v2-explorer__state"
        aria-live="polite"
      >
        <ExplorerStateView
          state={selectedControl.state}
          textEquivalent={selectedControl.textEquivalent}
          entities={entities}
          relations={relations}
          conditions={conditions}
        />
        <dl className="academy-v2-explorer__receipt">
          <div>
            <dt>Outcome</dt>
            <dd>{selectedControl.outcome}</dd>
          </div>
          <div>
            <dt>What to do</dt>
            <dd>{selectedControl.requiredAction}</dd>
          </div>
          <div>
            <dt>What to retain</dt>
            <dd>{selectedControl.retainedEvidence}</dd>
          </div>
          <div>
            <dt>Accessible text equivalent</dt>
            <dd>{selectedControl.textEquivalent}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

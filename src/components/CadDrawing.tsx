import { flangeHoleCentres, plateHoleCentres, type CadDesign } from "../lib/cad/model";

interface CadDrawingProps {
  design: CadDesign;
}

function DimensionLine({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  return (
    <g className="cad-dimension">
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#dimension-arrow)" markerEnd="url(#dimension-arrow)" />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle">{label}</text>
    </g>
  );
}

export function CadDrawing({ design }: CadDrawingProps) {
  let drawing: JSX.Element;
  if (design.partType === "plate") {
    const part = design.plate;
    const scale = Math.min(430 / part.width, 270 / part.height);
    const width = part.width * scale;
    const height = part.height * scale;
    const left = 320 - width / 2;
    const top = 200 - height / 2;
    drawing = (
      <>
        <rect className="cad-drawing__solid" x={left} y={top} width={width} height={height} rx={part.cornerRadius * scale} />
        {plateHoleCentres(design).map((hole, index) => (
          <g key={`${hole.x}-${hole.y}`}>
            <circle className="cad-drawing__cut" cx={320 + hole.x * scale} cy={200 + hole.y * scale} r={part.holeDiameter * scale / 2} />
            {index === 0 && <text className="cad-drawing__callout" x={320 + hole.x * scale + 12} y={200 + hole.y * scale - 12}>dia {part.holeDiameter}</text>}
          </g>
        ))}
        <DimensionLine x1={left} y1={top + height + 42} x2={left + width} y2={top + height + 42} label={`${part.width} mm`} />
        <DimensionLine x1={left - 42} y1={top} x2={left - 42} y2={top + height} label={`${part.height} mm`} />
      </>
    );
  } else if (design.partType === "flange") {
    const part = design.flange;
    const scale = 300 / part.outerDiameter;
    drawing = (
      <>
        <circle className="cad-drawing__solid" cx="320" cy="200" r={part.outerDiameter * scale / 2} />
        <circle className="cad-drawing__cut" cx="320" cy="200" r={part.innerDiameter * scale / 2} />
        <circle className="cad-drawing__construction" cx="320" cy="200" r={part.pitchCircleDiameter * scale / 2} />
        {flangeHoleCentres(design).map((hole) => (
          <circle key={`${hole.x}-${hole.y}`} className="cad-drawing__cut" cx={320 + hole.x * scale} cy={200 + hole.y * scale} r={part.holeDiameter * scale / 2} />
        ))}
        <DimensionLine x1={320 - part.outerDiameter * scale / 2} y1={390} x2={320 + part.outerDiameter * scale / 2} y2={390} label={`OD ${part.outerDiameter} mm`} />
        <text className="cad-drawing__callout" x="335" y="205">bore dia {part.innerDiameter}</text>
        <text className="cad-drawing__callout" x="335" y="228">{part.holeCount} x dia {part.holeDiameter} on PCD {part.pitchCircleDiameter}</text>
      </>
    );
  } else if (design.partType === "spacer") {
    const part = design.spacer;
    const scale = Math.min(230 / part.outerDiameter, 270 / part.length);
    const outer = part.outerDiameter * scale;
    const inner = part.innerDiameter * scale;
    const length = part.length * scale;
    drawing = (
      <>
        <text className="cad-drawing__view-label" x="175" y="52">End view</text>
        <circle className="cad-drawing__solid" cx="180" cy="200" r={outer / 2} />
        <circle className="cad-drawing__cut" cx="180" cy="200" r={inner / 2} />
        <text className="cad-drawing__view-label" x="430" y="52">Side view</text>
        <rect className="cad-drawing__solid" x={460 - length / 2} y={200 - outer / 2} width={length} height={outer} />
        <line className="cad-drawing__hidden" x1={460 - length / 2} y1={200 - inner / 2} x2={460 + length / 2} y2={200 - inner / 2} />
        <line className="cad-drawing__hidden" x1={460 - length / 2} y1={200 + inner / 2} x2={460 + length / 2} y2={200 + inner / 2} />
        <DimensionLine x1={460 - length / 2} y1={365} x2={460 + length / 2} y2={365} label={`${part.length} mm`} />
        <text className="cad-drawing__callout" x="95" y="365">OD {part.outerDiameter}, ID {part.innerDiameter}</text>
      </>
    );
  } else {
    const part = design.angle;
    const scale = Math.min(340 / part.legA, 280 / part.legB);
    const left = 320 - part.legA * scale / 2;
    const top = 200 - part.legB * scale / 2;
    const points = [
      [left, top],
      [left + part.thickness * scale, top],
      [left + part.thickness * scale, top + (part.legB - part.thickness) * scale],
      [left + part.legA * scale, top + (part.legB - part.thickness) * scale],
      [left + part.legA * scale, top + part.legB * scale],
      [left, top + part.legB * scale]
    ].map((point) => point.join(",")).join(" ");
    drawing = (
      <>
        <polygon className="cad-drawing__solid" points={points} />
        <DimensionLine x1={left} y1={top + part.legB * scale + 42} x2={left + part.legA * scale} y2={top + part.legB * scale + 42} label={`leg A ${part.legA} mm`} />
        <DimensionLine x1={left - 42} y1={top} x2={left - 42} y2={top + part.legB * scale} label={`leg B ${part.legB} mm`} />
        <text className="cad-drawing__callout" x={left + 14} y={top + 24}>t {part.thickness} mm</text>
        <text className="cad-drawing__callout" x={left + 14} y={top + 46}>width {part.width} mm</text>
      </>
    );
  }

  return (
    <svg className="cad-drawing" viewBox="0 0 640 440" role="img" aria-labelledby="cad-drawing-title cad-drawing-description">
      <title id="cad-drawing-title">Dimensioned drawing of {design.name}</title>
      <desc id="cad-drawing-description">Orthographic design preview with dimensions in millimetres. Verify the exported drawing before manufacture.</desc>
      <defs>
        <marker id="dimension-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 5 L 10 0 L 10 10 z" />
        </marker>
      </defs>
      <rect className="cad-drawing__background" x="0" y="0" width="640" height="440" rx="12" />
      <line className="cad-drawing__centreline" x1="320" y1="24" x2="320" y2="416" />
      <line className="cad-drawing__centreline" x1="24" y1="200" x2="616" y2="200" />
      {drawing}
    </svg>
  );
}

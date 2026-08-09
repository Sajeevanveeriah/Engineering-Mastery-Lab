const SCHEMATIC_BODY = `
  (generator eeschema)
  (uuid "11111111-1111-4111-8111-111111111111")
  (paper "A4")
  (lib_symbols
    (symbol "Device:R"
      (pin_names (offset 0))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (polyline (pts (xy -1 -1) (xy 1 1)) (stroke (width 0) (type default)) (fill (type none)))
      (pin passive line (at -5 0 0) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      (pin passive line (at 5 0 180) (length 2.54) (name "B" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
    )
  )
  (junction (at 30 20) (diameter 0) (color 0 0 0 0) (uuid "junction-mid"))
  (wire (pts (xy 15 20) (xy 25 20)) (stroke (width 0) (type default)) (uuid "wire-in"))
  (wire (pts (xy 35 20) (xy 45 20)) (stroke (width 0) (type default)) (uuid "wire-out"))
  (label "VIN" (at 15 20 0) (effects (font (size 1.27 1.27))) (uuid "label-in"))
  (label "VOUT" (at 45 20 0) (effects (font (size 1.27 1.27))) (uuid "label-out"))
  (symbol (lib_id "Device:R") (at 30 20 0) (unit 1) (exclude_from_sim no) (in_bom yes) (on_board yes) (uuid "symbol-r1")
    (property "Reference" "R1" (at 30 17.46 0) (effects (font (size 1.27 1.27))))
    (property "Value" "10 kOhm" (at 30 22.54 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "Resistor_THT:R_Axial" (at 30 25.08 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "https://example.invalid/retained" (at 30 27.62 0) (effects (font (size 1.27 1.27)) hide))
    (pin "1" (uuid "symbol-r1-pin-1"))
    (pin "2" (uuid "symbol-r1-pin-2"))
  )
  (hierarchical_label "SAFE_HIERARCHY" (shape input) (at 50 20 0) (effects (font (size 1.27 1.27))) (uuid "hierarchy-1"))
`;

const PCB_BODY = `
  (generator pcbnew)
  (general (thickness 1.6))
  (paper "A4")
  (layers (0 "F.Cu" signal) (31 "B.Cu" signal) (44 "Edge.Cuts" user))
  (setup (pad_to_mask_clearance 0.07) (allow_soldermask_bridges_in_footprints no))
  (net 0 "")
  (net 1 "VIN")
  (net 2 "VOUT")
  (net 3 "UNUSED")
  (footprint "Resistor_THT:R_Axial" (layer "F.Cu") (uuid "footprint-r1") (at 30 20 92.5)
    (property "Reference" "R1" (at 0 -2.5 90) (layer "F.SilkS"))
    (property "Manufacturer" "Fixture Parts" (at 0 2.5 90) (layer "F.Fab") hide)
    (pad "1" thru_hole rect (at -5 0) (size 1.8 1.8) (drill 0.9) (layers "*.Cu" "*.Mask") (net 1 "VIN") (uuid "pad-r1-1"))
    (pad "2" thru_hole roundrect (at 5 0) (size 1.8 1.8) (drill 0.9) (layers "*.Cu" "*.Mask") (roundrect_rratio 0.25) (net 2 "VOUT") (uuid "pad-r1-2"))
  )
  (gr_line (start 0 0) (end 60 0) (stroke (width 0.05) (type default)) (layer "Edge.Cuts") (uuid "edge-1"))
  (gr_line (start 60 0) (end 60 40) (stroke (width 0.05) (type default)) (layer "Edge.Cuts") (uuid "edge-2"))
  (gr_line (start 60 40) (end 0 40) (stroke (width 0.05) (type default)) (layer "Edge.Cuts") (uuid "edge-3"))
  (gr_line (start 0 40) (end 0 0) (stroke (width 0.05) (type default)) (layer "Edge.Cuts") (uuid "edge-4"))
  (segment (start 25 20) (end 20 20) (width 0.4) (layer "F.Cu") (net 1) (uuid "segment-vin"))
  (segment (start 35 20) (end 40 20) (width 0.4) (layer "B.Cu") (net 2) (uuid "segment-vout"))
  (via (at 40 20) (size 0.8) (drill 0.4) (layers "F.Cu" "B.Cu") (net 2) (uuid "via-vout"))
  (zone (net 2) (net_name "VOUT") (layer "F.Cu") (hatch edge 0.5) (polygon (pts (xy 10 10) (xy 20 10) (xy 20 20))))
`;

export const KICAD_FIXTURE_VERSIONS = [
  { major: 7, schematicVersion: 20230121, pcbVersion: 20221018 },
  { major: 8, schematicVersion: 20231120, pcbVersion: 20240108 },
  { major: 9, schematicVersion: 20250114, pcbVersion: 20241229 },
  { major: 10, schematicVersion: 20260101, pcbVersion: 20260101 }
] as const;

export function independentKicadProjectFixture(major: 7 | 8 | 9 | 10): { schematicText: string; pcbText: string } {
  const version = KICAD_FIXTURE_VERSIONS.find((item) => item.major === major);
  if (!version) throw new Error(`No KiCad fixture for major ${major}`);
  return {
    schematicText: `(kicad_sch (version ${version.schematicVersion})${SCHEMATIC_BODY})\n`,
    pcbText: `(kicad_pcb (version ${version.pcbVersion})${PCB_BODY})\n`
  };
}

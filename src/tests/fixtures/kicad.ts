// Representative kicad-cli outputs used as fixtures (schemas.kicad.org drc/erc v1).

export const VERSION_OUTPUT_8 = "8.0.4\n";
export const VERSION_OUTPUT_7 = "7.0.11\n";
export const VERSION_OUTPUT_9 = "9.0.0\n";

export const DRC_REPORT_CLEAN = JSON.stringify({
  $schema: "https://schemas.kicad.org/drc.v1.json",
  coordinate_units: "mm",
  date: "2026-07-11T00:00:00+0000",
  kicad_version: "8.0.4",
  source: "board.kicad_pcb",
  violations: [],
  unconnected_items: [],
  schematic_parity: []
});

export const DRC_REPORT_WITH_VIOLATIONS = JSON.stringify({
  $schema: "https://schemas.kicad.org/drc.v1.json",
  coordinate_units: "mm",
  date: "2026-07-11T00:00:00+0000",
  kicad_version: "8.0.4",
  source: "board.kicad_pcb",
  violations: [
    {
      type: "clearance",
      description: "Clearance violation (netclass 'Default' clearance 0.2000 mm; actual 0.1500 mm)",
      severity: "error",
      items: [
        { description: "Track [Net-(R1-Pad2)] on F.Cu", pos: { x: 105.2, y: 55.1 } },
        { description: "Pad 1 [GND] of C1 on F.Cu", pos: { x: 105.4, y: 55.3 } }
      ]
    },
    {
      type: "silk_over_copper",
      description: "Silkscreen clipped by board edge",
      severity: "warning",
      items: [{ description: "Text 'REV A' on F.Silkscreen", pos: { x: 120.0, y: 42.0 } }]
    }
  ],
  unconnected_items: [
    {
      type: "unconnected_items",
      description: "Missing connection between items",
      severity: "error",
      items: [{ description: "Pad 2 [Net-(J1-Pad3)] of J1", pos: { x: 98.0, y: 61.0 } }]
    }
  ],
  schematic_parity: []
});

export const ERC_REPORT_CLEAN = JSON.stringify({
  $schema: "https://schemas.kicad.org/erc.v1.json",
  coordinate_units: "mm",
  date: "2026-07-11T00:00:00+0000",
  kicad_version: "8.0.4",
  source: "design.kicad_sch",
  sheets: [{ path: "/", violations: [] }]
});

export const ERC_REPORT_WITH_VIOLATIONS = JSON.stringify({
  $schema: "https://schemas.kicad.org/erc.v1.json",
  coordinate_units: "mm",
  date: "2026-07-11T00:00:00+0000",
  kicad_version: "8.0.4",
  source: "design.kicad_sch",
  sheets: [
    {
      path: "/",
      violations: [
        {
          type: "pin_not_connected",
          description: "Pin not connected",
          severity: "error",
          items: [{ description: "Symbol U1 Pin 4 [VDD, Power input]", pos: { x: 50.8, y: 63.5 } }]
        },
        {
          type: "power_pin_not_driven",
          description: "Input Power pin not driven by any Output Power pins",
          severity: "warning",
          items: [{ description: "Symbol U1 Pin 8 [VSS, Power input]", pos: { x: 50.8, y: 76.2 } }]
        }
      ]
    }
  ]
});

export const KICAD_ERROR_STDERR = "Error: Unable to load the schematic file 'design.kicad_sch'\n";

export interface EngineeringMaterial {
  id: string;
  name: string;
  family: string;
  density: number;
  elasticModulus: number;
  yieldStrength: number | null;
  thermalConductivity: number;
  expansionCoefficient: number;
  note: string;
}

export const engineeringMaterials: EngineeringMaterial[] = [
  { id: "al-6061-t6", name: "Aluminium 6061-T6", family: "Aluminium", density: 2700, elasticModulus: 68.9, yieldStrength: 276, thermalConductivity: 167, expansionCoefficient: 23.6, note: "General structural and machined components." },
  { id: "al-7075-t6", name: "Aluminium 7075-T6", family: "Aluminium", density: 2810, elasticModulus: 71.7, yieldStrength: 503, thermalConductivity: 130, expansionCoefficient: 23.4, note: "High-strength aerospace-grade alloy." },
  { id: "steel-mild", name: "Mild steel, indicative", family: "Steel", density: 7850, elasticModulus: 200, yieldStrength: 250, thermalConductivity: 50, expansionCoefficient: 12, note: "Verify the exact grade before design use." },
  { id: "steel-304", name: "Stainless steel 304", family: "Steel", density: 8000, elasticModulus: 193, yieldStrength: 215, thermalConductivity: 16.2, expansionCoefficient: 17.2, note: "Corrosion-resistant general-purpose stainless steel." },
  { id: "steel-316", name: "Stainless steel 316", family: "Steel", density: 8000, elasticModulus: 193, yieldStrength: 205, thermalConductivity: 16.3, expansionCoefficient: 15.9, note: "Improved resistance in chloride environments." },
  { id: "copper-c110", name: "Copper C110", family: "Copper", density: 8940, elasticModulus: 117, yieldStrength: 69, thermalConductivity: 391, expansionCoefficient: 16.9, note: "High electrical and thermal conductivity." },
  { id: "brass-c360", name: "Free-cutting brass C360", family: "Copper", density: 8490, elasticModulus: 97, yieldStrength: 124, thermalConductivity: 116, expansionCoefficient: 20.5, note: "Machinable fittings and turned parts." },
  { id: "titanium-ti6al4v", name: "Titanium Ti-6Al-4V", family: "Titanium", density: 4430, elasticModulus: 114, yieldStrength: 880, thermalConductivity: 6.7, expansionCoefficient: 8.6, note: "High specific strength with demanding machining." },
  { id: "abs", name: "ABS, typical", family: "Polymer", density: 1040, elasticModulus: 2.1, yieldStrength: 40, thermalConductivity: 0.18, expansionCoefficient: 90, note: "Properties vary strongly with grade and processing." },
  { id: "petg", name: "PETG, typical", family: "Polymer", density: 1270, elasticModulus: 2.1, yieldStrength: 50, thermalConductivity: 0.2, expansionCoefficient: 68, note: "Indicative values for printed or formed material." },
  { id: "nylon-66", name: "Nylon 6/6, dry", family: "Polymer", density: 1140, elasticModulus: 2.8, yieldStrength: 75, thermalConductivity: 0.25, expansionCoefficient: 80, note: "Moisture conditioning materially changes properties." },
  { id: "gfrp", name: "GFRP, typical laminate", family: "Composite", density: 1850, elasticModulus: 25, yieldStrength: null, thermalConductivity: 0.35, expansionCoefficient: 10, note: "Anisotropic. Use laminate-specific allowables for design." }
];

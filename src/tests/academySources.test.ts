import {
  academyCourses,
  academySources,
  academyUnits,
  academyUnitSourceMap
} from "../data/academy/catalogue";

const validationDate = "2026-07-30";

const expectedUnitSourceMap: Record<string, readonly string[]> = {
  "EML-E0-D01": [
    "SRC-OPENSTAX-STUDY",
    "SRC-OPENSTAX-SCIENTIFIC-METHOD",
    "SRC-NASA-SE-HANDBOOK",
    "SRC-DOE-DRAWINGS"
  ],
  "EML-E0-D02": ["SRC-BIPM-SI", "SRC-NIST-TN-1297"],
  "EML-E0-D03": ["SRC-OPENSTAX-PRECALCULUS-2E", "SRC-MIT-18-06SC"],
  "EML-E1-D04": [
    "SRC-MIT-OCW-CALCULUS-REVISITED",
    "SRC-MIT-18-02SC",
    "SRC-MIT-18-03SC",
    "SRC-MIT-18-05",
    "SRC-MIT-18-06SC"
  ],
  "EML-E1-D05": [
    "SRC-OPENSTAX-UNIVERSITY-PHYSICS-1",
    "SRC-OPENSTAX-UNIVERSITY-PHYSICS-2"
  ],
  "EML-E1-D06": ["SRC-MIT-MISSING-SEMESTER", "SRC-PRO-GIT"],
  "EML-E1-D07": ["SRC-MIT-6-100L", "SRC-MIT-6-005", "SRC-CPP-CORE-GUIDELINES"],
  "EML-E1-D08": ["SRC-AUTODESK-FUSION-CAD-90", "SRC-DOE-DRAWINGS", "SRC-ASME-Y14-5"],
  "EML-E2-D09": ["SRC-MIT-2-001", "SRC-MIT-2-72"],
  "EML-E2-D10": ["SRC-MIT-2-008", "SRC-NIST-ADDITIVE-MANUFACTURING"],
  "EML-E2-D11": ["SRC-MIT-OCW-CIRCUITS-6002", "SRC-MIT-6-622", "SRC-MIT-10-626"],
  "EML-E2-D12": ["SRC-MIT-6-071J", "SRC-MIT-2-737", "SRC-NIST-TN-1297"],
  "EML-E2-D13": [
    "SRC-MIT-2-737",
    "SRC-MIT-6-004-C18",
    "SRC-FREERTOS-DEVELOPER-DOCS"
  ],
  "EML-E2-D14": [
    "SRC-MIT-2-737",
    "SRC-PLCOPEN-IEC-61131-3",
    "SRC-ISA-101",
    "SRC-ISA-18",
    "SRC-ARM-CMSIS-DRIVER",
    "SRC-MODBUS-SPECIFICATIONS",
    "SRC-OASIS-MQTT-5",
    "SRC-OPC-UA-PART-1",
    "SRC-RFC-9293",
    "SRC-OMG-DDS-1-4"
  ],
  "EML-E2-D15": ["SRC-MIT-6-003"],
  "EML-E2-D16": ["SRC-MIT-2-14"],
  "EML-E3-D17": ["SRC-MIT-2-12"],
  "EML-E3-D18": [
    "SRC-ROS2-JAZZY-CLI",
    "SRC-ROS2-CONTROL-JAZZY",
    "SRC-GAZEBO-HARMONIC-ROS2",
    "SRC-GAZEBO-HARMONIC-SENSORS"
  ],
  "EML-E3-D19": ["SRC-MIT-6-041SC", "SRC-MIT-16-322"],
  "EML-E3-D20": ["SRC-NAV2-MAPPING-LOCALISATION", "SRC-NAV2-CONCEPTS"],
  "EML-E3-D21": ["SRC-OPENCV-5-TUTORIALS"],
  "EML-E3-D22": ["SRC-SCIKIT-USER-GUIDE", "SRC-SCIKIT-COMMON-PITFALLS"],
  "EML-E3-D23": [
    "SRC-PYTORCH-BASICS",
    "SRC-PYTORCH-CNN-TRANSFER",
    "SRC-PYTORCH-TRANSFORMER",
    "SRC-PYTORCH-DQN",
    "SRC-EXECUTORCH-BEGINNER",
    "SRC-NIST-AI-RMF-1"
  ],
  "EML-E4-D24": ["SRC-NASA-SE-HANDBOOK", "SRC-NASA-SYSTEM-SAFETY-V2", "SRC-NIST-DOE"],
  "EML-E4-D25": [
    "SRC-ENGINEERS-AUSTRALIA-STAGE-1",
    "SRC-ENGINEERS-AUSTRALIA-ETHICS",
    "SRC-NASA-SE-HANDBOOK"
  ]
};

const prohibitedGenericUrls = new Set([
  "https://ocw.mit.edu/",
  "https://docs.python.org/3/",
  "https://isocpp.org/",
  "https://docs.ros.org/en/rolling/",
  "https://gazebosim.org/docs/",
  "https://docs.opencv.org/",
  "https://www.rfc-editor.org/rfc-index.html",
  "https://www.nist.gov/product-data",
  "https://www.nist.gov/programs-projects/materials-data-repository",
  "https://www.nist.gov/mep"
]);

const restrictedLinkOutSourceIds = [
  "SRC-AUTODESK-FUSION-CAD-90",
  "SRC-ASME-Y14-5",
  "SRC-ISA-101",
  "SRC-ISA-18",
  "SRC-OPC-UA-PART-1",
  "SRC-OMG-DDS-1-4",
  "SRC-ENGINEERS-AUSTRALIA-STAGE-1",
  "SRC-ENGINEERS-AUSTRALIA-ETHICS"
];

const removedLegacySourceIds = new Set([
  "SRC-MIT-OCW",
  "SRC-PYTHON",
  "SRC-CPP",
  "SRC-NIST-STATISTICS",
  "SRC-STM32",
  "SRC-NASA-SE",
  "SRC-ROS2",
  "SRC-GAZEBO",
  "SRC-OPENCV",
  "SRC-SCIKIT"
]);

describe("Academy source registry", () => {
  it("maps every Academy unit to the reviewed subject-specific source set", () => {
    expect(academyUnitSourceMap).toEqual(expectedUnitSourceMap);
    expect(Object.keys(academyUnitSourceMap)).toHaveLength(25);
    expect(Object.keys(academyUnitSourceMap).sort()).toEqual(
      academyUnits.map((unit) => unit.id).sort()
    );
  });

  it("keeps exactly 65 dated, unique and fully attributed HTTPS records", () => {
    expect(academySources).toHaveLength(65);
    expect(new Set(academySources.map((source) => source.id)).size).toBe(65);
    expect(new Set(academySources.map((source) => source.url)).size).toBe(65);

    for (const source of academySources) {
      expect(new URL(source.url).protocol, source.id).toBe("https:");
      expect(source.title.trim(), source.id).not.toBe("");
      expect(source.organisation.trim(), source.id).not.toBe("");
      expect(source.licence.trim(), source.id).not.toBe("");
      expect(source.attribution.trim(), source.id).not.toBe("");
      expect(source.lastValidated, source.id).toBe(validationDate);
      expect(source.optional, source.id).toBe(true);
    }
  });

  it("records the page-specific scientific-method licence and attribution", () => {
    expect(
      academySources.find((source) => source.id === "SRC-OPENSTAX-SCIENTIFIC-METHOD")
    ).toMatchObject({
      organisation: "Texas Education Agency; hosted by OpenStax, Rice University",
      licence: "CC BY 4.0; OpenStax separately requires permission for LLM training or generative-AI ingestion; third-party material may differ",
      attribution: "Texas Education Agency, Physics 1.2 The Scientific Methods; access for free at https://openstax.org/books/physics/pages/1-introduction"
    });
  });

  it("resolves every mapping and leaves no source record orphaned", () => {
    const sourceIds = new Set(academySources.map((source) => source.id));
    const mappedIds = Object.values(academyUnitSourceMap).flat();

    for (const [unitId, mappedSourceIds] of Object.entries(academyUnitSourceMap)) {
      expect(mappedSourceIds.length, unitId).toBeGreaterThan(0);
      expect(new Set(mappedSourceIds).size, unitId).toBe(mappedSourceIds.length);
      expect(mappedSourceIds.every((sourceId) => sourceIds.has(sourceId)), unitId).toBe(true);
    }

    expect([...new Set(mappedIds)].sort()).toEqual([...sourceIds].sort());
  });

  it("resolves every course-level source and removes all legacy generic IDs", () => {
    const sourceIds = new Set(academySources.map((source) => source.id));

    for (const course of academyCourses) {
      expect(course.sourceIds.length, course.id).toBeGreaterThan(0);
      expect(course.sourceIds.every((sourceId) => sourceIds.has(sourceId)), course.id).toBe(true);
      expect(course.sourceIds.some((sourceId) => removedLegacySourceIds.has(sourceId)), course.id).toBe(false);
    }

    expect(
      academySources.some((source) => removedLegacySourceIds.has(source.id))
    ).toBe(false);
    expect(
      Object.values(academyUnitSourceMap)
        .flat()
        .some((sourceId) => removedLegacySourceIds.has(sourceId))
    ).toBe(false);
  });

  it("rejects generic homepages, ST deep links and framing of restricted sources", () => {
    for (const source of academySources) {
      expect(prohibitedGenericUrls.has(source.url), source.id).toBe(false);
      const hostname = new URL(source.url).hostname.toLocaleLowerCase("en-AU");
      expect(hostname === "st.com" || hostname.endsWith(".st.com"), source.id).toBe(false);
    }

    const sourceById = new Map(academySources.map((source) => [source.id, source]));
    for (const sourceId of restrictedLinkOutSourceIds) {
      expect(sourceById.get(sourceId)?.licence, sourceId).toMatch(/^Link-out only;/);
    }
  });
});

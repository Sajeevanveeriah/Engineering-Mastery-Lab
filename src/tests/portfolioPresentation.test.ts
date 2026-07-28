import { describe, expect, it } from "vitest";
import {
  buildPortfolioMarkdown,
  type PortfolioAchievement,
  type PortfolioEntry,
  type PortfolioSkillEvidence
} from "../pages/Portfolio";
import { hasExactRequiredIds, projectNotesFor } from "../pages/ProjectDetail";

describe("project completion presentation gate", () => {
  const required = ["requirements", "model", "verify"];

  it("accepts each required identifier exactly once", () => {
    expect(hasExactRequiredIds(["verify", "requirements", "model"], required)).toBe(true);
  });

  it("rejects extra, duplicate, missing, and substituted identifiers", () => {
    expect(hasExactRequiredIds([...required, "unexpected"], required)).toBe(false);
    expect(hasExactRequiredIds(["requirements", "model", "model"], required)).toBe(false);
    expect(hasExactRequiredIds(["requirements", "model"], required)).toBe(false);
    expect(hasExactRequiredIds(["requirements", "model", "unexpected"], required)).toBe(false);
    expect(hasExactRequiredIds(["requirements", "unexpected"], ["requirements", "requirements"])).toBe(false);
  });

  it("does not carry a notes draft between related project routes", () => {
    expect(projectNotesFor("new-project", "new saved notes", {
      projectId: "old-project",
      value: "old draft notes"
    })).toBe("new saved notes");
    expect(projectNotesFor("old-project", "old saved notes", {
      projectId: "old-project",
      value: "old draft notes"
    })).toBe("old draft notes");
  });
});

describe("portfolio Markdown export safety", () => {
  const attack = [
    '<img src="https://example.invalid/pixel" onerror="alert(1)">',
    "![beacon](https://example.invalid/pixel)",
    "[remote](https://example.invalid/remote)",
    "# injected-heading"
  ].join("\n");

  it("preserves dynamic content as escaped plain text without active Markdown or HTML", () => {
    const entry: PortfolioEntry = {
      id: "manual-test",
      title: attack,
      description: attack,
      discipline: attack,
      type: "Manual",
      complete: true,
      stateLabel: attack,
      provenance: attack,
      linkedSkillIds: [attack],
      url: `https://example.invalid/${encodeURIComponent(attack)}`
    };
    const skillEvidence: PortfolioSkillEvidence = {
      domain: attack,
      level: attack,
      evidence: attack
    };
    const achievement: PortfolioAchievement = {
      label: attack,
      basis: attack
    };

    const markdown = buildPortfolioMarkdown({
      completedEntries: [entry],
      workInProgressEntries: [entry],
      pendingRequirementGroups: [{
        moduleId: "module-test",
        moduleTitle: attack,
        discipline: attack,
        items: [attack]
      }],
      skillEvidence: [skillEvidence],
      achievements: [achievement]
    });

    expect(markdown).toContain("\\<img");
    expect(markdown).toContain("onerror\\=");
    expect(markdown).toContain("\\!\\[beacon\\]\\(https\\:\\/\\/example\\.invalid\\/pixel\\)");
    expect(markdown).toContain("\\[remote\\]\\(https\\:\\/\\/example\\.invalid\\/remote\\)");
    expect(markdown).toContain("\\# injected\\-heading");
    expect(markdown).not.toMatch(/(?<!\\)<img/i);
    expect(markdown).not.toContain("onerror=");
    expect(markdown).not.toMatch(/(?<!\\)!\[beacon\]/);
    expect(markdown).not.toContain("[remote](");
    expect(markdown).not.toContain("https://example.invalid");
    expect(markdown).not.toContain("\n# injected-heading");
  });
});

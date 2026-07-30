import {
  academyMediaByLessonId,
  academyMediaRegistry
} from "../academyMedia";
import type {
  AcademyCatalogue,
  AssessmentSpec,
  MediaSpec,
  Skill,
  SourceReference
} from "../../lib/academy/types";
import {
  academyAssessments,
  academyCourses,
  academyRequiredRoutes,
  academySkills,
  academySources,
  academyUnits
} from "./catalogue";
import {
  academyCoverageManifest,
  academyCoverageRequirements
} from "./coverage";
import {
  academyRebootMappings,
  academyRebootMilestoneManifest
} from "./rebootMappings";

export const academyCatalogue: AcademyCatalogue = {
  courses: academyCourses,
  units: academyUnits,
  skills: academySkills,
  coverage: academyCoverageManifest,
  rebootMappings: academyRebootMappings,
  media: [...academyMediaRegistry],
  sources: academySources
};

export const academyCourseCatalogue = academyCourses;
export const academyUnitCatalogue = academyUnits;
export const academySkillsManifest: Skill[] = academySkills;
export const academyAssessmentsManifest: AssessmentSpec[] = academyAssessments;
export const academySourcesManifest: SourceReference[] = academySources;
export const academyMediaManifest: MediaSpec[] = [...academyMediaRegistry];
export interface AcademyMediaPlacementManifestEntry {
  mediaId: string;
  lessonIds: string[];
}

export const academyMediaPlacementManifest: AcademyMediaPlacementManifestEntry[] =
  academyMediaRegistry.map((media) => ({
    mediaId: media.id,
    lessonIds: Object.entries(academyMediaByLessonId)
      .filter(([, mediaIds]) => mediaIds.includes(media.id))
      .map(([lessonId]) => lessonId)
      .sort()
  }));
export const academyRouteManifest = academyRequiredRoutes;
export const academyMandatoryCoverageRequirements = academyCoverageRequirements;
export const academySessionMappings = academyRebootMappings;
export const academyMilestoneMappings = academyRebootMilestoneManifest;

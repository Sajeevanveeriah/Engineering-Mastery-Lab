import { academyLessonTeachingProfilesE0 } from "./lessonTeachingProfiles/E0";
import { academyLessonTeachingProfilesE1 } from "./lessonTeachingProfiles/E1";
import { academyLessonTeachingProfilesE2 } from "./lessonTeachingProfiles/E2";
import { academyLessonTeachingProfilesE3 } from "./lessonTeachingProfiles/E3";
import { academyLessonTeachingProfilesE4 } from "./lessonTeachingProfiles/E4";
import type { AcademyLessonTeachingProfileRegistry } from "./lessonTeachingProfileValidation";
export type {
  AcademyLessonTeachingProfile,
  AcademyLessonTeachingProfileRegistry
} from "./lessonTeachingProfileValidation";
export { validateAcademyLessonTeachingProfiles } from "./lessonTeachingProfileValidation";

export const academyLessonTeachingProfiles: AcademyLessonTeachingProfileRegistry = {
  ...academyLessonTeachingProfilesE0,
  ...academyLessonTeachingProfilesE1,
  ...academyLessonTeachingProfilesE2,
  ...academyLessonTeachingProfilesE3,
  ...academyLessonTeachingProfilesE4
} as const;

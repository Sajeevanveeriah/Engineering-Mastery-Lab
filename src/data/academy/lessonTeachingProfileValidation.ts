export interface AcademyLessonTeachingProfile {
  readonly systemModel: string;
  readonly failurePattern: string;
  readonly visualExplanation: string;
  readonly applicationTask: string;
}

export type AcademyLessonTeachingProfileRegistry = Readonly<
  Record<string, AcademyLessonTeachingProfile>
>;

const normaliseProfileField = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-AU")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

export const validateAcademyLessonTeachingProfiles = (
  canonicalLessonIds: readonly string[],
  profiles: AcademyLessonTeachingProfileRegistry
): string[] => {
  const issues: string[] = [];
  const canonicalIdSet = new Set(canonicalLessonIds);
  const profileIds = Object.keys(profiles);
  for (const lessonId of canonicalLessonIds) {
    if (!profiles[lessonId]) issues.push(`missing-profile:${lessonId}`);
  }
  for (const profileId of profileIds) {
    if (!canonicalIdSet.has(profileId)) issues.push(`extra-profile:${profileId}`);
  }

  const fieldNames = [
    "systemModel",
    "failurePattern",
    "visualExplanation",
    "applicationTask"
  ] as const;
  for (const fieldName of fieldNames) {
    const ownerByNormalisedValue = new Map<string, string>();
    for (const lessonId of canonicalLessonIds) {
      const value = profiles[lessonId]?.[fieldName] ?? "";
      const normalised = normaliseProfileField(value);
      if (
        normalised.length < 40
        || /\b(?:TODO|TBD|placeholder|lorem ipsum|coming soon)\b/i.test(value)
        || /[\u2013\u2014]/u.test(value)
      ) {
        issues.push(`invalid-${fieldName}:${lessonId}`);
        continue;
      }
      const priorOwner = ownerByNormalisedValue.get(normalised);
      if (priorOwner) {
        issues.push(`duplicate-${fieldName}:${priorOwner}:${lessonId}`);
      } else {
        ownerByNormalisedValue.set(normalised, lessonId);
      }
    }
  }
  return issues;
};

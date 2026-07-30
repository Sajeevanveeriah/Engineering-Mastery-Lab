export interface AcademyFormulaRenderLink {
  formulaId: string;
  lessonId: string;
  renderVerificationId: string;
}

export const getAcademyFormulaRenderVerificationId = (
  lessonId: string,
  formulaId: string
): string => `academy-formula-render:${lessonId}:${formulaId}`;

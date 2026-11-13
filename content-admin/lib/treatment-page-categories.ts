export const TREATMENT_PAGE_CATEGORIES = [
  "behandlingar",
  "problem",
  "plastikkirurgi",
] as const;

export type TreatmentPageCategory = (typeof TREATMENT_PAGE_CATEGORIES)[number];

export const TREATMENT_CATEGORY_LABEL: Record<TreatmentPageCategory, string> = {
  behandlingar: "Behandlingar",
  problem: "Problem",
  plastikkirurgi: "Plastikkirurgi",
};

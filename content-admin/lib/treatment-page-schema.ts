export const OVERVIEW_BLOCK_IDS = [
  { id: "whatIsIt", label: "Vad är det / Om behandlingen" },
  { id: "symptoms", label: "Tecken & symtom / Passar för" },
  { id: "causes", label: "Orsaker" },
  { id: "assessment", label: "Hur vi bedömer det" },
] as const;

export const FACT_ICONS = [
  "",
  "timer",
  "heart-pulse",
  "wallet",
  "layout-grid",
  "calendar-check",
  "syringe",
  "sparkles",
  "bandage",
] as const;

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  facts: "Snabba fakta",
  overview: "Översikt",
  suitability: "Passar bra / Kräver bedömning",
  benefits: "Fördelar",
  howItWorks: "Så fungerar det",
  resultsTimeline: "Resultat över tid",
  treatmentAreas: "Behandlingsområden",
  beforeAfterCare: "Före & eftervård",
  beforeAfterGallery: "Före & Efter (bilder)",
  faq: "Vanliga frågor",
  related: "Relaterat",
  quizCta: "Quiz-kort",
  bottomCta: "Botten-CTA",
  method: "Vår metod (endast synlighet)",
  experts: "Möt experter (endast synlighet)",
  trust: "Trust (endast synlighet)",
};

export const SECTION_ORDER = [
  "hero",
  "facts",
  "overview",
  "treatmentAreas",
  "suitability",
  "benefits",
  "howItWorks",
  "resultsTimeline",
  "beforeAfterCare",
  "beforeAfterGallery",
  "faq",
  "related",
  "quizCta",
  "method",
  "experts",
  "trust",
  "bottomCta",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

export type TreatmentPageDoc = {
  version?: number;
  category: string;
  slug: string;
  path?: string;
  title?: string;
  sections?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

const SECTION_KEY_SET = new Set<string>(SECTION_ORDER);

export function emptySectionDefaults(key: SectionKey): Record<string, unknown> {
  const base = { enabled: true };
  switch (key) {
    case "facts":
      return { ...base, title: "Snabba fakta", items: [] };
    case "overview":
      return {
        ...base,
        blocks: OVERVIEW_BLOCK_IDS.map(({ id }) => ({
          id,
          heading: "",
          body: "",
          enabled: false,
        })),
      };
    case "suitability":
      return { ...base, goodFor: [], needsAssessment: [] };
    case "benefits":
      return { ...base, items: [] };
    case "howItWorks":
      return { ...base, heading: "Så fungerar det", steps: [] };
    case "resultsTimeline":
      return { ...base, heading: "Resultat över tid", items: [] };
    case "treatmentAreas":
      return { ...base, items: [] };
    case "beforeAfterCare":
      return { ...base, before: [], after: [] };
    case "beforeAfterGallery":
      return { ...base, heading: "Före & Efter", items: [] };
    case "faq":
      return { ...base, items: [] };
    case "related":
      return { ...base, heading: "Relaterat", items: [] };
    case "quizCta":
      return { ...base, quizLink: { enabled: true, label: "Gör vårt gratis quiz" } };
    case "hero":
      return { ...base, primaryCta: {}, secondaryCta: {} };
    case "bottomCta":
      return { ...base, primaryCta: {} };
    default:
      return base;
  }
}

export function ensureAllSections(doc: TreatmentPageDoc): TreatmentPageDoc {
  const sections = { ...(doc.sections ?? {}) };
  for (const key of SECTION_ORDER) {
    if (!sections[key]) {
      sections[key] = emptySectionDefaults(key);
    }
  }
  return { ...doc, sections };
}

export function validateTreatmentPageBody(body: unknown, category: string, slug: string): void {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid body");
  }
  const doc = body as Record<string, unknown>;
  if (doc.category !== category || doc.slug !== slug) {
    throw new Error("category/slug mismatch");
  }
  if (doc.version != null && typeof doc.version !== "number") {
    throw new Error("version must be a number");
  }
  if (doc.sections === undefined) return;
  if (typeof doc.sections !== "object" || doc.sections === null || Array.isArray(doc.sections)) {
    throw new Error("sections must be an object");
  }
  const sections = doc.sections as Record<string, unknown>;
  for (const [key, value] of Object.entries(sections)) {
    if (!SECTION_KEY_SET.has(key)) {
      throw new Error(`Unknown section: ${key}`);
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Section "${key}" must be an object`);
    }
    const sec = value as Record<string, unknown>;
    if ("enabled" in sec && typeof sec.enabled !== "boolean") {
      throw new Error(`Section "${key}".enabled must be boolean`);
    }
  }
}

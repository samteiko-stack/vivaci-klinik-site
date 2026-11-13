import {
  ensureAllSections,
  type TreatmentPageDoc,
} from "@/lib/treatment-page-schema";

export function scaffoldUtbildningCourse(slug: string, title: string) {
  return {
    version: 1,
    slug,
    path: `/utbildning/${slug}`,
    title,
    metaDescription: "",
    hero: {
      title,
      intro: "",
      audience: "",
      image: "",
      ctaPrimary: { label: "Se tillgängliga datum" },
    },
    summary: {
      intro: "",
      fee: "",
      feeNote: "",
      level: "",
      duration: "",
      location: "",
    },
    dates: [] as unknown[],
    about: { html: "<p></p>" },
    instructors: {
      enabled: false,
      heading: "Instruktörer",
      intro: "",
      items: [] as unknown[],
    },
    faq: { enabled: false, items: [] as unknown[] },
  };
}

export function scaffoldBlogPost(slug: string, title: string, category = "Nyhet") {
  const date = new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return {
    slug,
    title,
    metaDescription: "",
    category,
    excerpt: "",
    date,
    readTime: "3 min läsning",
    author: { name: "", role: "", image: "", bio: "" },
    heroImage: "",
    tags: [] as string[],
    bodyHtml: "<p></p>",
  };
}

export function scaffoldTreatmentPage(
  category: string,
  slug: string,
  title: string
): TreatmentPageDoc {
  const base: TreatmentPageDoc = {
    version: 1,
    category,
    slug,
    path: `/${category}/${slug}`,
    title,
    sections: {},
  };
  const doc = ensureAllSections(base);
  const hero = doc.sections?.hero;
  if (hero) {
    hero.title = title;
    hero.intro = "";
    hero.enabled = true;
  }
  return doc;
}

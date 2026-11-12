"use client";

import { HubCategoriesEditor } from "@/components/content-editors/hub-categories-editor";
import {
  BLOG_POST_SECTIONS,
  renderBlogPostSection,
} from "@/components/content-editors/blog-post-editor";
import {
  UTBILDNING_COURSE_SECTIONS,
  renderUtbildningCourseSection,
} from "@/components/content-editors/utbildning-course-editor";
import { SectionedPageEditor, type EditorSectionDef } from "@/components/sectioned-page-editor";
import { useSimpleContent } from "@/components/simple-content-context";

const HUB_SECTIONS: EditorSectionDef[] = [
  {
    id: "hub",
    label: "Översikt",
    description: "Kategorier och kort som visas på listsidan.",
  },
];

const HUB_ITEM_FIELDS = [
  { key: "href", label: "Länk (path)" },
  { key: "label", label: "Rubrik" },
  { key: "description", label: "Beskrivning", kind: "textarea" as const, rows: 2 },
  { key: "image", label: "Bild", kind: "image" as const },
];

export function SimpleContentClient({
  emptyHint,
}: {
  emptyHint: string;
}) {
  const ctx = useSimpleContent();
  if (!ctx) return null;

  const { kind, slug, loading, doc, pageTitle, setDoc } = ctx;
  const isHub =
    (kind === "utbildning" && slug === "index") ||
    (kind === "nyheter" && slug === "listing");

  const sections = isHub
    ? HUB_SECTIONS
    : kind === "utbildning"
      ? UTBILDNING_COURSE_SECTIONS
      : BLOG_POST_SECTIONS;

  const hasPage = Boolean(slug && doc);

  return (
    <SectionedPageEditor
      pageTitle={pageTitle || (slug ? slug : "")}
      sections={sections}
      loading={loading && Boolean(slug)}
      hasPage={hasPage}
      pageKey={slug ?? undefined}
      emptyTitle="Välj en sida"
      emptyDescription={emptyHint}
      renderSection={(sectionId) => {
        if (!doc) return null;
        if (isHub && sectionId === "hub") {
          return (
            <HubCategoriesEditor
              doc={doc}
              onChange={(next) => setDoc(next)}
              itemFields={HUB_ITEM_FIELDS}
            />
          );
        }
        if (kind === "utbildning") {
          return renderUtbildningCourseSection(sectionId, doc, (next) => setDoc(next));
        }
        return renderBlogPostSection(sectionId, doc, (next) => setDoc(next));
      }}
    />
  );
}

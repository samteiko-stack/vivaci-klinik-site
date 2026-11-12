"use client";

import type { EditorSectionDef } from "@/components/sectioned-page-editor";
import {
  FieldGroup,
  SectionFormBody,
  SectionSubheading,
} from "@/components/treatment-pages/editor-fields";
import { ImagePathField } from "@/components/treatment-pages/image-path-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function patchObject(
  doc: Record<string, unknown>,
  key: string,
  value: unknown
): Record<string, unknown> {
  return { ...doc, [key]: value };
}

function patchNested(
  doc: Record<string, unknown>,
  key: string,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const prev = doc[key];
  const base =
    prev && typeof prev === "object" && !Array.isArray(prev)
      ? (doc[key] as Record<string, unknown>)
      : {};
  return { ...doc, [key]: { ...base, ...patch } };
}

export const BLOG_POST_SECTIONS: EditorSectionDef[] = [
  { id: "grund", label: "Grund", description: "Titel, SEO, utdrag och metadata." },
  { id: "hero", label: "Hero", description: "Artikelns huvudbild." },
  { id: "author", label: "Författare", description: "Författarbox på artikeln." },
  { id: "body", label: "Brödtext", description: "HTML-innehåll i artikeln." },
];

export function renderBlogPostSection(
  sectionId: string,
  doc: Record<string, unknown>,
  onChange: (next: Record<string, unknown>) => void
) {
  const author =
    doc.author && typeof doc.author === "object" && !Array.isArray(doc.author)
      ? (doc.author as Record<string, unknown>)
      : {};
  const tags = Array.isArray(doc.tags) ? doc.tags.map(String) : [];

  switch (sectionId) {
    case "grund":
      return (
        <SectionFormBody>
          <FieldGroup label="Titel">
            <Input
              value={String(doc.title ?? "")}
              onChange={(e) => onChange(patchObject(doc, "title", e.target.value))}
            />
          </FieldGroup>
          <FieldGroup label="Meta (SEO)">
            <Textarea
              rows={2}
              value={String(doc.metaDescription ?? "")}
              onChange={(e) =>
                onChange(patchObject(doc, "metaDescription", e.target.value))
              }
            />
          </FieldGroup>
          <FieldGroup label="Utdrag">
            <Textarea
              rows={3}
              value={String(doc.excerpt ?? "")}
              onChange={(e) => onChange(patchObject(doc, "excerpt", e.target.value))}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Datum">
              <Input
                value={String(doc.date ?? "")}
                onChange={(e) => onChange(patchObject(doc, "date", e.target.value))}
              />
            </FieldGroup>
            <FieldGroup label="Lästid">
              <Input
                value={String(doc.readTime ?? "")}
                onChange={(e) => onChange(patchObject(doc, "readTime", e.target.value))}
              />
            </FieldGroup>
            <FieldGroup label="Kategori">
              <Input
                value={String(doc.category ?? "")}
                onChange={(e) => onChange(patchObject(doc, "category", e.target.value))}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Taggar (kommaseparerade)">
            <Input
              value={tags.join(", ")}
              onChange={(e) =>
                onChange(
                  patchObject(
                    doc,
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                )
              }
            />
          </FieldGroup>
        </SectionFormBody>
      );
    case "hero":
      return (
        <SectionFormBody>
          <FieldGroup label="Hero-bild">
            <ImagePathField
              value={String(doc.heroImage ?? "")}
              onChange={(v) => onChange(patchObject(doc, "heroImage", v))}
            />
          </FieldGroup>
        </SectionFormBody>
      );
    case "author":
      return (
        <SectionFormBody>
          <SectionSubheading>Författarbox</SectionSubheading>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Namn">
              <Input
                value={String(author.name ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "author", { name: e.target.value }))
                }
              />
            </FieldGroup>
            <FieldGroup label="Roll">
              <Input
                value={String(author.role ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "author", { role: e.target.value }))
                }
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Profilbild">
            <ImagePathField
              value={String(author.image ?? "")}
              onChange={(v) => onChange(patchNested(doc, "author", { image: v }))}
            />
          </FieldGroup>
          <FieldGroup label="Bio">
            <Textarea
              rows={3}
              value={String(author.bio ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "author", { bio: e.target.value }))
              }
            />
          </FieldGroup>
        </SectionFormBody>
      );
    case "body":
      return (
        <SectionFormBody>
          <FieldGroup label="Brödtext (HTML)">
            <Textarea
              className="min-h-[28rem] font-mono text-sm"
              value={String(doc.bodyHtml ?? "")}
              onChange={(e) => onChange(patchObject(doc, "bodyHtml", e.target.value))}
            />
          </FieldGroup>
        </SectionFormBody>
      );
    default:
      return null;
  }
}

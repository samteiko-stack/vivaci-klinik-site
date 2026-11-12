"use client";

import type { EditorSectionDef } from "@/components/sectioned-page-editor";
import { FieldGroup, SectionFormBody } from "@/components/treatment-pages/editor-fields";
import { RichTextField } from "@/components/ui/rich-text-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const LEGAL_PAGE_SECTIONS: EditorSectionDef[] = [
  { id: "grund", label: "Grund", description: "Titel och SEO." },
  { id: "body", label: "Brödtext", description: "Sidans juridiska innehåll." },
];

export function renderLegalPageSection(
  sectionId: string,
  doc: Record<string, unknown>,
  onChange: (next: Record<string, unknown>) => void
) {
  switch (sectionId) {
    case "grund":
      return (
        <SectionFormBody>
          <FieldGroup label="Titel">
            <Input
              value={String(doc.title ?? "")}
              onChange={(e) => onChange({ ...doc, title: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Meta (SEO)">
            <Textarea
              rows={2}
              value={String(doc.metaDescription ?? "")}
              onChange={(e) =>
                onChange({ ...doc, metaDescription: e.target.value })
              }
            />
          </FieldGroup>
        </SectionFormBody>
      );
    case "body":
      return (
        <SectionFormBody>
          <FieldGroup label="Brödtext">
            <RichTextField
              minHeightClassName="min-h-[32rem]"
              value={String(doc.bodyHtml ?? "")}
              onChange={(html) => onChange({ ...doc, bodyHtml: html })}
            />
          </FieldGroup>
        </SectionFormBody>
      );
    default:
      return null;
  }
}

"use client";

import {
  FieldGroup,
  SectionFormBody,
  SectionSubheading,
} from "@/components/treatment-pages/editor-fields";
import { ImagePathField } from "@/components/treatment-pages/image-path-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      ? (prev as Record<string, unknown>)
      : {};
  return { ...doc, [key]: { ...base, ...patch } };
}

export function BlogPostEditor({
  doc,
  onChange,
}: {
  doc: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const author =
    doc.author && typeof doc.author === "object" && !Array.isArray(doc.author)
      ? (doc.author as Record<string, unknown>)
      : {};
  const tags = Array.isArray(doc.tags) ? doc.tags.map(String) : [];

  return (
    <Tabs defaultValue="grund" className="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="grund">Grund</TabsTrigger>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="author">Författare</TabsTrigger>
        <TabsTrigger value="body">Brödtext</TabsTrigger>
      </TabsList>

      <TabsContent value="grund" className="mt-0">
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
      </TabsContent>

      <TabsContent value="hero" className="mt-0">
        <SectionFormBody>
          <FieldGroup label="Hero-bild">
            <ImagePathField
              value={String(doc.heroImage ?? "")}
              onChange={(v) => onChange(patchObject(doc, "heroImage", v))}
            />
          </FieldGroup>
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="author" className="mt-0">
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
      </TabsContent>

      <TabsContent value="body" className="mt-0">
        <SectionFormBody>
          <FieldGroup label="Brödtext (HTML)">
            <Textarea
              className="min-h-[28rem] font-mono text-sm"
              value={String(doc.bodyHtml ?? "")}
              onChange={(e) => onChange(patchObject(doc, "bodyHtml", e.target.value))}
            />
          </FieldGroup>
        </SectionFormBody>
      </TabsContent>
    </Tabs>
  );
}

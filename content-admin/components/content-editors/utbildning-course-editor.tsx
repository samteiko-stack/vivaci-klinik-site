"use client";

import {
  CardListEditor,
  CtaFields,
  FieldGroup,
  SectionEnabled,
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

export function UtbildningCourseEditor({
  doc,
  onChange,
}: {
  doc: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const hero =
    doc.hero && typeof doc.hero === "object" && !Array.isArray(doc.hero)
      ? (doc.hero as Record<string, unknown>)
      : {};
  const summary =
    doc.summary && typeof doc.summary === "object" && !Array.isArray(doc.summary)
      ? (doc.summary as Record<string, unknown>)
      : {};
  const dates = Array.isArray(doc.dates) ? doc.dates : [];
  const instructors =
    doc.instructors && typeof doc.instructors === "object" && !Array.isArray(doc.instructors)
      ? (doc.instructors as Record<string, unknown>)
      : {};
  const faq =
    doc.faq && typeof doc.faq === "object" && !Array.isArray(doc.faq)
      ? (doc.faq as Record<string, unknown>)
      : {};
  const instructorItems = Array.isArray(instructors.items) ? instructors.items : [];
  const faqItems = Array.isArray(faq.items) ? faq.items : [];
  const ctaPrimary =
    hero.ctaPrimary && typeof hero.ctaPrimary === "object" && !Array.isArray(hero.ctaPrimary)
      ? (hero.ctaPrimary as Record<string, unknown>)
      : {};

  return (
    <Tabs defaultValue="grund" className="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="grund">Grund</TabsTrigger>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="summary">Sammanfattning</TabsTrigger>
        <TabsTrigger value="dates">Kurstillfällen</TabsTrigger>
        <TabsTrigger value="about">Om kursen</TabsTrigger>
        <TabsTrigger value="instructors">Instruktörer</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
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
          <FieldGroup label="URL (path)">
            <Input
              value={String(doc.path ?? "")}
              onChange={(e) => onChange(patchObject(doc, "path", e.target.value))}
            />
          </FieldGroup>
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="hero" className="mt-0">
        <SectionFormBody>
          <FieldGroup label="Rubrik">
            <Input
              value={String(hero.title ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "hero", { title: e.target.value }))
              }
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={4}
              value={String(hero.intro ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "hero", { intro: e.target.value }))
              }
            />
          </FieldGroup>
          <FieldGroup label="Målgrupp">
            <Textarea
              rows={3}
              value={String(hero.audience ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "hero", { audience: e.target.value }))
              }
            />
          </FieldGroup>
          <FieldGroup label="Hero-bild">
            <ImagePathField
              value={String(hero.image ?? "")}
              onChange={(v) => onChange(patchNested(doc, "hero", { image: v }))}
            />
          </FieldGroup>
          <SectionSubheading>Primär knapp</SectionSubheading>
          <CtaFields
            cta={ctaPrimary}
            onChange={(next) =>
              onChange(patchNested(doc, "hero", { ctaPrimary: next }))
            }
          />
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="summary" className="mt-0">
        <SectionFormBody>
          <FieldGroup label="Intro">
            <Textarea
              rows={3}
              value={String(summary.intro ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "summary", { intro: e.target.value }))
              }
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Pris">
              <Input
                value={String(summary.fee ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "summary", { fee: e.target.value }))
                }
              />
            </FieldGroup>
            <FieldGroup label="Prisnotis">
              <Input
                value={String(summary.feeNote ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "summary", { feeNote: e.target.value }))
                }
              />
            </FieldGroup>
            <FieldGroup label="Nivå">
              <Input
                value={String(summary.level ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "summary", { level: e.target.value }))
                }
              />
            </FieldGroup>
            <FieldGroup label="Längd">
              <Input
                value={String(summary.duration ?? "")}
                onChange={(e) =>
                  onChange(patchNested(doc, "summary", { duration: e.target.value }))
                }
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Plats">
            <Input
              value={String(summary.location ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "summary", { location: e.target.value }))
              }
            />
          </FieldGroup>
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="dates" className="mt-0">
        <SectionFormBody>
          <p className="text-xs text-muted-foreground">
            Tillgängliga datum, tider och platser som visas i anmälningsblocket.
          </p>
          <CardListEditor
            items={dates as Record<string, unknown>[]}
            fields={[
              { key: "label", label: "Datum" },
              { key: "time", label: "Tid" },
              { key: "seats", label: "Platser / status" },
            ]}
            emptyItem={{ label: "", time: "", seats: "" }}
            onChange={(items) => onChange(patchObject(doc, "dates", items))}
          />
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="about" className="mt-0">
        <SectionFormBody>
          <FieldGroup label="Brödtext (HTML)">
            <Textarea
              className="min-h-[28rem] font-mono text-sm"
              value={String(
                doc.about && typeof doc.about === "object" && !Array.isArray(doc.about)
                  ? (doc.about as { html?: string }).html ?? ""
                  : ""
              )}
              onChange={(e) =>
                onChange({
                  ...doc,
                  about: { html: e.target.value },
                })
              }
            />
          </FieldGroup>
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="instructors" className="mt-0">
        <SectionFormBody>
          <SectionEnabled
            checked={Boolean(instructors.enabled ?? true)}
            onCheckedChange={(v) =>
              onChange(patchNested(doc, "instructors", { enabled: v }))
            }
            title="Visa instruktörer"
          />
          <FieldGroup label="Rubrik">
            <Input
              value={String(instructors.heading ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "instructors", { heading: e.target.value }))
              }
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={2}
              value={String(instructors.intro ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "instructors", { intro: e.target.value }))
              }
            />
          </FieldGroup>
          <CardListEditor
            items={instructorItems as Record<string, unknown>[]}
            fields={[
              { key: "name", label: "Namn" },
              { key: "role", label: "Roll" },
              { key: "image", label: "Bild", kind: "image" },
            ]}
            emptyItem={{ name: "", role: "", image: "" }}
            onChange={(items) =>
              onChange(patchNested(doc, "instructors", { items }))
            }
          />
        </SectionFormBody>
      </TabsContent>

      <TabsContent value="faq" className="mt-0">
        <SectionFormBody>
          <SectionEnabled
            checked={Boolean(faq.enabled ?? true)}
            onCheckedChange={(v) => onChange(patchNested(doc, "faq", { enabled: v }))}
            title="Visa FAQ"
          />
          <FieldGroup label="Intro">
            <Textarea
              rows={2}
              value={String(faq.intro ?? "")}
              onChange={(e) =>
                onChange(patchNested(doc, "faq", { intro: e.target.value }))
              }
            />
          </FieldGroup>
          <CardListEditor
            items={faqItems as Record<string, unknown>[]}
            fields={[
              { key: "question", label: "Fråga" },
              { key: "answer", label: "Svar", kind: "textarea", rows: 3 },
            ]}
            emptyItem={{ question: "", answer: "" }}
            onChange={(items) => onChange(patchNested(doc, "faq", { items }))}
          />
        </SectionFormBody>
      </TabsContent>
    </Tabs>
  );
}

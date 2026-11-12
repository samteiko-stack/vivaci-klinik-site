"use client";

import {
  CardListEditor,
  CtaFields,
  FactIconSelect,
  FieldGroup,
  FormSectionDivider,
  SectionEnabled,
  SectionFormBody,
  SectionHint,
  SectionSubheading,
  StringListEditor,
  SubsectionCard,
} from "@/components/treatment-pages/editor-fields";
import { ImagePathField } from "@/components/treatment-pages/image-path-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FACT_ICONS,
  OVERVIEW_BLOCK_IDS,
  SECTION_LABELS,
  SECTION_ORDER,
  type SectionKey,
} from "@/lib/treatment-page-schema";

export type MutateSection = (
  key: SectionKey,
  updater: (section: Record<string, unknown>) => void
) => void;

type SectionFormProps = {
  sectionKey: SectionKey;
  section: Record<string, unknown>;
  mutateSection: MutateSection;
  pageTitle?: string;
  pagePath?: string;
  heroImagePath?: string;
  onHeroImagePathChange?: (path: string) => void;
};

function patch(mutate: MutateSection, key: SectionKey, patch: Record<string, unknown>) {
  mutate(key, (sec) => {
    Object.assign(sec, patch);
  });
}

export function SectionForm({
  sectionKey,
  section,
  mutateSection,
  pageTitle,
  pagePath,
  heroImagePath,
  onHeroImagePathChange,
}: SectionFormProps) {
  const enabled = section.enabled !== false;

  const setEnabled = (value: boolean) => patch(mutateSection, sectionKey, { enabled: value });

  switch (sectionKey) {
    case "hero": {
      const primary = (section.primaryCta ?? {}) as Record<string, unknown>;
      const secondary = (section.secondaryCta ?? {}) as Record<string, unknown>;
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} title="Visa sektion" />
          <FieldGroup label="Rubrik (H1)">
            <Input
              value={String(section.title ?? pageTitle ?? "")}
              onChange={(e) => patch(mutateSection, "hero", { title: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={5}
              className="min-h-[7.5rem]"
              value={String(section.intro ?? "")}
              onChange={(e) => patch(mutateSection, "hero", { intro: e.target.value })}
            />
          </FieldGroup>
          {onHeroImagePathChange ? (
            <FieldGroup
              label="Hero-bild"
              hint={
                pagePath
                  ? `Sparas i treatment-images.json för ${pagePath} (samma källa som live-sidan).`
                  : "Sparas i treatment-images.json (samma källa som live-sidan)."
              }
            >
              <ImagePathField value={heroImagePath ?? ""} onChange={onHeroImagePathChange} />
            </FieldGroup>
          ) : null}
          <FormSectionDivider label="Knappar" />
          <FieldGroup label="Primär CTA">
            <CtaFields
              cta={primary}
              onChange={(next) =>
                mutateSection("hero", (sec) => {
                  sec.primaryCta = next;
                })
              }
            />
          </FieldGroup>
          <FieldGroup label="Sekundär CTA">
            <CtaFields
              cta={secondary}
              onChange={(next) =>
                mutateSection("hero", (sec) => {
                  sec.secondaryCta = next;
                })
              }
            />
          </FieldGroup>
        </SectionFormBody>
      );
    }

    case "facts": {
      const items = (section.items ?? []) as Record<string, unknown>[];
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} title="Visa sektion" />
          <FieldGroup label="Titel">
            <Input
              value={String(section.title ?? "Snabba fakta")}
              onChange={(e) => patch(mutateSection, "facts", { title: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Sammanfattning">
            <Textarea
              rows={2}
              value={String(section.summary ?? "")}
              onChange={(e) => patch(mutateSection, "facts", { summary: e.target.value })}
            />
          </FieldGroup>
          <div className="space-y-1">
            <SectionSubheading>Fakta-rader</SectionSubheading>
            <SectionHint>Lägg till rader eller använd + Rad för nya.</SectionHint>
          </div>
          {items.map((item, idx) => (
            <SubsectionCard key={idx} title={`Rad ${idx + 1}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Etikett">
                  <Input
                    value={String(item.label ?? "")}
                    onChange={(e) =>
                      mutateSection("facts", (sec) => {
                        const list = [...((sec.items as Record<string, unknown>[]) ?? [])];
                        list[idx] = { ...list[idx], label: e.target.value };
                        sec.items = list;
                      })
                    }
                  />
                </FieldGroup>
                <FieldGroup label="Värde">
                  <Input
                    value={String(item.value ?? "")}
                    onChange={(e) =>
                      mutateSection("facts", (sec) => {
                        const list = [...((sec.items as Record<string, unknown>[]) ?? [])];
                        list[idx] = { ...list[idx], value: e.target.value };
                        sec.items = list;
                      })
                    }
                  />
                </FieldGroup>
                <FieldGroup label="Ikon" className="sm:col-span-2">
                  <FactIconSelect
                    value={String(item.icon ?? "")}
                    options={FACT_ICONS}
                    onChange={(icon) =>
                      mutateSection("facts", (sec) => {
                        const list = [...((sec.items as Record<string, unknown>[]) ?? [])];
                        const row = { ...list[idx] };
                        if (icon) row.icon = icon;
                        else delete row.icon;
                        list[idx] = row;
                        sec.items = list;
                      })
                    }
                  />
                </FieldGroup>
              </div>
              <div className="flex justify-end border-t pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    mutateSection("facts", (sec) => {
                      sec.items = ((sec.items as Record<string, unknown>[]) ?? []).filter(
                        (_, i) => i !== idx
                      );
                    })
                  }
                >
                  Ta bort
                </Button>
              </div>
            </SubsectionCard>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              mutateSection("facts", (sec) => {
                const list = [...((sec.items as Record<string, unknown>[]) ?? [])];
                list.push({ label: "", value: "" });
                sec.items = list;
              })
            }
          >
            + Rad
          </Button>
        </SectionFormBody>
      );
    }

    case "overview": {
      const blocks = (section.blocks ?? []) as Record<string, unknown>[];
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} title="Visa sektion" />
          <FieldGroup label="Tagline">
            <Input
              value={String(section.tagline ?? "")}
              onChange={(e) => patch(mutateSection, "overview", { tagline: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Rubrik (H2)">
            <Input
              value={String(section.heading ?? "")}
              onChange={(e) => patch(mutateSection, "overview", { heading: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Innehållsblock</SectionSubheading>
          {OVERVIEW_BLOCK_IDS.map(({ id, label }) => {
            let block = blocks.find((b) => b.id === id);
            if (!block) block = { id, heading: "", body: "", enabled: false };
            const blockEnabled = block.enabled !== false;
            return (
              <SubsectionCard key={id} title={label}>
                <SectionEnabled
                  checked={blockEnabled}
                  onCheckedChange={(v) =>
                    mutateSection("overview", (sec) => {
                      const list = [...((sec.blocks as Record<string, unknown>[]) ?? [])];
                      const i = list.findIndex((b) => b.id === id);
                      const row = i >= 0 ? { ...list[i], enabled: v } : { id, heading: "", body: "", enabled: v };
                      if (i >= 0) list[i] = row;
                      else list.push(row);
                      sec.blocks = list;
                    })
                  }
                  title="Visa block"
                />
                <FieldGroup label="Blockrubrik">
                  <Input
                    value={String(block.heading ?? "")}
                    onChange={(e) =>
                      mutateSection("overview", (sec) => {
                        const list = [...((sec.blocks as Record<string, unknown>[]) ?? [])];
                        const i = list.findIndex((b) => b.id === id);
                        const row =
                          i >= 0
                            ? { ...list[i], heading: e.target.value }
                            : { id, heading: e.target.value, body: "", enabled: false };
                        if (i >= 0) list[i] = row;
                        else list.push(row);
                        sec.blocks = list;
                      })
                    }
                  />
                </FieldGroup>
                <FieldGroup
                  label="Brödtext"
                  hint="Dubbla radbrytningar = nytt stycke"
                >
                  <Textarea
                    rows={8}
                    value={String(block.body ?? "")}
                    onChange={(e) =>
                      mutateSection("overview", (sec) => {
                        const list = [...((sec.blocks as Record<string, unknown>[]) ?? [])];
                        const i = list.findIndex((b) => b.id === id);
                        const row =
                          i >= 0
                            ? { ...list[i], body: e.target.value }
                            : { id, heading: "", body: e.target.value, enabled: false };
                        if (i >= 0) list[i] = row;
                        else list.push(row);
                        sec.blocks = list;
                      })
                    }
                  />
                </FieldGroup>
              </SubsectionCard>
            );
          })}
        </SectionFormBody>
      );
    }

    case "treatmentAreas":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Rubrik" },
              { key: "body", label: "Text", kind: "textarea", rows: 2 },
            ]}
            emptyItem={{ title: "", body: "" }}
            onChange={(items) => patch(mutateSection, "treatmentAreas", { items })}
          />
        </SectionFormBody>
      );

    case "suitability":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <SectionHint>
            Båda listorna måste ha minst en punkt för att sektionen ska visas på sidan.
          </SectionHint>
          <SectionSubheading>Passar bra för dig som</SectionSubheading>
          <StringListEditor
            items={(section.goodFor ?? []) as string[]}
            onChange={(goodFor) => patch(mutateSection, "suitability", { goodFor })}
          />
          <SectionSubheading>Kräver individuell bedömning</SectionSubheading>
          <StringListEditor
            items={(section.needsAssessment ?? []) as string[]}
            onChange={(needsAssessment) => patch(mutateSection, "suitability", { needsAssessment })}
          />
        </SectionFormBody>
      );

    case "benefits":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Rubrik" },
              { key: "body", label: "Text", kind: "textarea", rows: 3 },
            ]}
            emptyItem={{ title: "", body: "" }}
            onChange={(items) => patch(mutateSection, "benefits", { items })}
          />
        </SectionFormBody>
      );

    case "howItWorks":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "Så fungerar det")}
              onChange={(e) => patch(mutateSection, "howItWorks", { heading: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Brödtext (om inga steg finns)">
            <Textarea
              rows={6}
              value={String(section.body ?? "")}
              onChange={(e) => patch(mutateSection, "howItWorks", { body: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Steg (ersätter brödtext om minst ett steg finns)</SectionSubheading>
          <CardListEditor
            items={(section.steps ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Stegnamn" },
              { key: "body", label: "Beskrivning", kind: "textarea", rows: 3 },
            ]}
            emptyItem={{ title: "", body: "" }}
            onChange={(steps) => patch(mutateSection, "howItWorks", { steps })}
          />
        </SectionFormBody>
      );

    case "resultsTimeline":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "Resultat över tid")}
              onChange={(e) => patch(mutateSection, "resultsTimeline", { heading: e.target.value })}
            />
          </FieldGroup>
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Etikett (t.ex. Dag 0)" },
              { key: "body", label: "Beskrivning", kind: "textarea", rows: 2 },
            ]}
            emptyItem={{ title: "", body: "" }}
            onChange={(items) => patch(mutateSection, "resultsTimeline", { items })}
          />
        </SectionFormBody>
      );

    case "beforeAfterCare":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Intro — före">
            <Textarea
              rows={2}
              value={String(section.introBefore ?? "")}
              onChange={(e) => patch(mutateSection, "beforeAfterCare", { introBefore: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Checklista före</SectionSubheading>
          <StringListEditor
            items={(section.before ?? []) as string[]}
            onChange={(before) => patch(mutateSection, "beforeAfterCare", { before })}
          />
          <FieldGroup label="Intro — efter">
            <Textarea
              rows={2}
              value={String(section.introAfter ?? "")}
              onChange={(e) => patch(mutateSection, "beforeAfterCare", { introAfter: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Checklista efter</SectionSubheading>
          <StringListEditor
            items={(section.after ?? []) as string[]}
            onChange={(after) => patch(mutateSection, "beforeAfterCare", { after })}
          />
        </SectionFormBody>
      );

    case "beforeAfterGallery":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "Före & Efter")}
              onChange={(e) => patch(mutateSection, "beforeAfterGallery", { heading: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={2}
              value={String(section.intro ?? "")}
              onChange={(e) => patch(mutateSection, "beforeAfterGallery", { intro: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Disclaimer">
            <Textarea
              rows={2}
              value={String(section.disclaimer ?? "")}
              onChange={(e) => patch(mutateSection, "beforeAfterGallery", { disclaimer: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Bilder (sökvägar under /images/…)</SectionSubheading>
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Bildtext (valfritt)" },
              {
                key: "beforeImage",
                label: "Före-bild",
                kind: "image",
                placeholder: "/images/…",
              },
              {
                key: "afterImage",
                label: "Efter-bild",
                kind: "image",
                placeholder: "/images/…",
              },
            ]}
            emptyItem={{ title: "", beforeImage: "", afterImage: "" }}
            onChange={(items) => patch(mutateSection, "beforeAfterGallery", { items })}
          />
        </SectionFormBody>
      );

    case "faq":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Intro">
            <Textarea
              rows={3}
              value={String(section.intro ?? "")}
              onChange={(e) => patch(mutateSection, "faq", { intro: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Frågor</SectionSubheading>
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "question", label: "Fråga" },
              { key: "answer", label: "Svar", kind: "textarea", rows: 4 },
            ]}
            emptyItem={{ question: "", answer: "" }}
            onChange={(items) => patch(mutateSection, "faq", { items })}
          />
        </SectionFormBody>
      );

    case "related":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "Relaterat")}
              onChange={(e) => patch(mutateSection, "related", { heading: e.target.value })}
            />
          </FieldGroup>
          <CardListEditor
            items={(section.items ?? []) as Record<string, unknown>[]}
            fields={[
              { key: "title", label: "Titel" },
              { key: "href", label: "Länk", placeholder: "/behandlingar/…" },
            ]}
            emptyItem={{ title: "", href: "" }}
            onChange={(items) => patch(mutateSection, "related", { items })}
          />
        </SectionFormBody>
      );

    case "quizCta": {
      const quizLink = (section.quizLink ?? { enabled: true, label: "Gör vårt gratis quiz" }) as Record<
        string,
        unknown
      >;
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "")}
              onChange={(e) => patch(mutateSection, "quizCta", { heading: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={3}
              value={String(section.intro ?? "")}
              onChange={(e) => patch(mutateSection, "quizCta", { intro: e.target.value })}
            />
          </FieldGroup>
          <SectionEnabled
            checked={quizLink.enabled !== false}
            onCheckedChange={(v) =>
              mutateSection("quizCta", (sec) => {
                sec.quizLink = { ...(sec.quizLink as object), enabled: v };
              })
            }
            title="Visa quiz-knapp"
          />
          <FieldGroup label="Quiz-knapptext">
            <Input
              value={String(quizLink.label ?? "")}
              onChange={(e) =>
                mutateSection("quizCta", (sec) => {
                  sec.quizLink = { ...(sec.quizLink as object), label: e.target.value };
                })
              }
            />
          </FieldGroup>
        </SectionFormBody>
      );
    }

    case "method":
    case "experts":
    case "trust":
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <SectionHint>Texter i dessa sektioner ligger i Webflow-mallen idag.</SectionHint>
        </SectionFormBody>
      );

    case "bottomCta": {
      const primary = (section.primaryCta ?? {}) as Record<string, unknown>;
      return (
        <SectionFormBody>
          <SectionEnabled checked={enabled} onCheckedChange={setEnabled} />
          <FieldGroup label="Rubrik">
            <Input
              value={String(section.heading ?? "")}
              onChange={(e) => patch(mutateSection, "bottomCta", { heading: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Intro">
            <Textarea
              rows={3}
              value={String(section.intro ?? "")}
              onChange={(e) => patch(mutateSection, "bottomCta", { intro: e.target.value })}
            />
          </FieldGroup>
          <SectionSubheading>Primär knapp</SectionSubheading>
          <CtaFields
            cta={primary}
            onChange={(next) =>
              mutateSection("bottomCta", (sec) => {
                sec.primaryCta = next;
              })
            }
          />
        </SectionFormBody>
      );
    }

    default:
      return null;
  }
}

export function sectionAccordionLabel(key: SectionKey) {
  return SECTION_LABELS[key] ?? key;
}

export { SECTION_ORDER };

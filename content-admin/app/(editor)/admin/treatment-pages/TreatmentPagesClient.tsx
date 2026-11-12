"use client";

import { useEffect, useState } from "react";
import { EyeOff, FilePenLine } from "lucide-react";
import { SectionForm, SECTION_ORDER, sectionAccordionLabel } from "@/components/treatment-pages/section-forms";
import { useTreatmentPages } from "@/components/treatment-pages-context";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emptySectionDefaults } from "@/lib/treatment-page-schema";
import type { SectionKey } from "@/lib/treatment-page-schema";

const SECTION_DESCRIPTION: Partial<Record<SectionKey, string>> = {
  hero: "Sidans huvudrubrik, introduktion och primära länkar.",
  facts: "Korta fakta som hjälper besökaren att skanna sidan.",
  overview: "Den längre introduktionen till behandlingen.",
  treatmentAreas: "Områden och behov som behandlingen riktar sig till.",
  suitability: "Vem behandlingen passar och vad som kräver bedömning.",
  benefits: "De viktigaste fördelarna med behandlingen.",
  howItWorks: "Förloppet, metoden och eventuella behandlingssteg.",
  resultsTimeline: "När resultat kan förväntas och hur de utvecklas.",
  beforeAfterCare: "Råd före och efter behandlingen.",
  beforeAfterGallery: "Bildpar och information om resultatbilder.",
  faq: "Vanliga frågor och svar.",
  related: "Länkar till närliggande behandlingar och innehåll.",
  quizCta: "Länk till behandlingsguiden.",
  bottomCta: "Sidans avslutande uppmaning.",
};

export default function TreatmentPagesClient() {
  const {
    doc,
    loadingPage,
    pageTitle,
    pagePath,
    heroImagePath,
    setHeroImagePath,
    mutateSection,
  } = useTreatmentPages();
  const [activeSection, setActiveSection] = useState<SectionKey>("hero");

  useEffect(() => {
    setActiveSection("hero");
  }, [doc?.slug]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/35">
      <ScrollArea
        key={`${doc?.slug ?? "empty"}:${activeSection}`}
        className="min-h-0 flex-1"
      >
        <div className="mr-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {loadingPage && !doc ? (
            <div className="space-y-6" aria-label="Laddar sida">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-72 max-w-full" />
              </div>
              <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <Skeleton className="h-96 rounded-xl" />
                <Skeleton className="h-[36rem] rounded-xl" />
              </div>
            </div>
          ) : !doc ? (
            <Card className="mx-auto mt-[10vh] w-full max-w-lg text-center">
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <FilePenLine className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <div className="space-y-1">
                  <h1 className="text-base font-semibold">Välj en sida</h1>
                  <p className="text-sm text-muted-foreground">
                    Välj en behandlingssida i sidbiblioteket för att börja redigera.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">
                    {pageTitle}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Redigera innehållet sektion för sektion. Ändringar publiceras när du sparar.
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit font-normal tabular-nums">
                  {SECTION_ORDER.length} sektioner
                </Badge>
              </div>

              <Tabs
                value={activeSection}
                onValueChange={(value) => setActiveSection(value as SectionKey)}
                orientation="vertical"
                className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"
              >
                <Card className="lg:sticky lg:top-6">
                  <CardHeader className="border-b">
                    <CardTitle>Sektioner</CardTitle>
                    <CardDescription>Välj vad du vill redigera.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={activeSection}
                      onValueChange={(value) => setActiveSection(value as SectionKey)}
                    >
                      <SelectTrigger className="w-full lg:hidden">
                        <SelectValue>{sectionAccordionLabel(activeSection)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_ORDER.map((key) => (
                          <SelectItem key={key} value={key}>
                            {sectionAccordionLabel(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <TabsList
                      variant="line"
                      className="hidden w-full items-stretch gap-0 lg:flex"
                    >
                      {SECTION_ORDER.map((key) => {
                        const section = (doc.sections?.[key] ?? emptySectionDefaults(key)) as Record<
                          string,
                          unknown
                        >;
                        const off = section.enabled === false;
                        return (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className="min-h-9 w-full justify-between rounded-md px-2.5 text-left"
                          >
                            <span className="truncate">{sectionAccordionLabel(key)}</span>
                            {off ? (
                              <EyeOff className="size-3.5 text-muted-foreground" aria-label="Dold" />
                            ) : null}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </CardContent>
                </Card>

                {SECTION_ORDER.map((key) => {
                  const section = (doc.sections?.[key] ?? emptySectionDefaults(key)) as Record<
                    string,
                    unknown
                  >;
                  const off = section.enabled === false;
                  return (
                    <TabsContent key={key} value={key}>
                      <Card>
                        <CardHeader className="border-b bg-muted/25">
                          <CardTitle>{sectionAccordionLabel(key)}</CardTitle>
                          <CardDescription>
                            {SECTION_DESCRIPTION[key] ?? "Inställningar för den här sektionen."}
                          </CardDescription>
                          {off ? (
                            <CardAction>
                              <Badge variant="outline" className="gap-1 font-normal">
                                <EyeOff data-icon="inline-start" />
                                Dold
                              </Badge>
                            </CardAction>
                          ) : null}
                        </CardHeader>
                        <CardContent>
                          <SectionForm
                            sectionKey={key}
                            section={section}
                            mutateSection={mutateSection}
                            pageTitle={doc.title}
                            pagePath={pagePath}
                            heroImagePath={heroImagePath}
                            onHeroImagePathChange={key === "hero" ? setHeroImagePath : undefined}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

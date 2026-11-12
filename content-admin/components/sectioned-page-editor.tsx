"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export type EditorSectionDef = {
  id: string;
  label: string;
  description?: string;
};

type Props = {
  pageTitle: string;
  pageSubtitle?: string;
  sections: EditorSectionDef[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hasPage: boolean;
  pageKey?: string;
  renderSection: (sectionId: string) => ReactNode;
};

export function SectionedPageEditor({
  pageTitle,
  pageSubtitle = "Redigera innehållet sektion för sektion. Ändringar publiceras när du sparar.",
  sections,
  loading,
  emptyTitle = "Välj en sida",
  emptyDescription = "Välj en sida i sidofältet för att börja redigera.",
  hasPage,
  pageKey,
  renderSection,
}: Props) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    setActiveSection(sections[0]?.id ?? "");
  }, [pageKey, sections]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/35">
      <ScrollArea
        key={`${pageKey ?? "empty"}:${activeSection}`}
        className="min-h-0 flex-1"
      >
        <div className="mr-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {loading ? (
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
          ) : !hasPage ? (
            <Card className="mx-auto mt-[10vh] w-full max-w-lg text-center">
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <FilePenLine className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <div className="space-y-1">
                  <h1 className="text-base font-semibold">{emptyTitle}</h1>
                  <p className="text-sm text-muted-foreground">{emptyDescription}</p>
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
                  <p className="mt-1 text-sm text-muted-foreground">{pageSubtitle}</p>
                </div>
                <Badge variant="secondary" className="w-fit font-normal tabular-nums">
                  {sections.length} sektioner
                </Badge>
              </div>

              <Tabs
                value={activeSection}
                onValueChange={(v) => v && setActiveSection(v)}
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
                      onValueChange={(v) => v && setActiveSection(v)}
                    >
                      <SelectTrigger className="w-full lg:hidden">
                        <SelectValue>
                          {sections.find((s) => s.id === activeSection)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <TabsList
                      variant="line"
                      className="hidden w-full items-stretch gap-0 lg:flex"
                    >
                      {sections.map((s) => (
                        <TabsTrigger
                          key={s.id}
                          value={s.id}
                          className="min-h-9 w-full justify-start rounded-md px-2.5 text-left"
                        >
                          <span className="truncate">{s.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </CardContent>
                </Card>

                {sections.map((s) => (
                  <TabsContent key={s.id} value={s.id}>
                    <Card>
                      <CardHeader className="border-b bg-muted/25">
                        <CardTitle>{s.label}</CardTitle>
                        <CardDescription>
                          {s.description ?? "Inställningar för den här sektionen."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>{renderSection(s.id)}</CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

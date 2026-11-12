"use client";

import {
  CardListEditor,
  FieldGroup,
  SectionFormBody,
  SubsectionCard,
} from "@/components/treatment-pages/editor-fields";
import { Input } from "@/components/ui/input";

type HubCategory = {
  label: string;
  items: Record<string, unknown>[];
};

type HubDoc = {
  categories?: HubCategory[];
  source?: string;
};

export function HubCategoriesEditor({
  doc,
  onChange,
  itemFields,
}: {
  doc: HubDoc;
  onChange: (next: HubDoc) => void;
  itemFields: {
    key: string;
    label: string;
    kind?: "textarea" | "image";
    rows?: number;
  }[];
}) {
  const categories = Array.isArray(doc.categories) ? doc.categories : [];

  const updateCategories = (next: HubCategory[]) => {
    onChange({ ...doc, categories: next });
  };

  return (
    <SectionFormBody>
      <p className="text-xs text-muted-foreground">
        Samma kort som visas på webbplatsens lista. Varje kategori grupperar länkar till enskilda sidor.
      </p>
      {categories.map((cat, catIdx) => (
        <SubsectionCard
          key={catIdx}
          title={`Kategori ${catIdx + 1}`}
          action={
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() =>
                updateCategories(categories.filter((_, i) => i !== catIdx))
              }
            >
              Ta bort kategori
            </button>
          }
        >
          <FieldGroup label="Rubrik">
            <Input
              value={cat.label ?? ""}
              onChange={(e) => {
                const next = categories.map((c, i) =>
                  i === catIdx ? { ...c, label: e.target.value } : c
                );
                updateCategories(next);
              }}
            />
          </FieldGroup>
          <CardListEditor
            items={Array.isArray(cat.items) ? cat.items : []}
            fields={itemFields}
            emptyItem={Object.fromEntries(
              itemFields.map((f) => [f.key, ""])
            )}
            onChange={(items) => {
              const next = categories.map((c, i) =>
                i === catIdx ? { ...c, items } : c
              );
              updateCategories(next);
            }}
          />
        </SubsectionCard>
      ))}
      <button
        type="button"
        className="w-fit rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        onClick={() =>
          updateCategories([
            ...categories,
            { label: "Ny kategori", items: [] },
          ])
        }
      >
        + Lägg till kategori
      </button>
    </SectionFormBody>
  );
}

import { readSimpleContent, writeSimpleContent } from "@/lib/simple-json-store";

type HubKind = "utbildning" | "nyheter";

type HubItem = {
  href: string;
  label: string;
  description?: string;
  image?: string;
};

function hubSlug(kind: HubKind): string {
  return kind === "utbildning" ? "index" : "listing";
}

export async function listHubCategoryLabels(kind: HubKind): Promise<string[]> {
  try {
    const hub = await readSimpleContent(kind, hubSlug(kind));
    const categories = hub.categories;
    if (!Array.isArray(categories)) return defaultHubLabels(kind);
    const labels = categories
      .map((c) =>
        c && typeof c === "object" && typeof (c as { label?: string }).label === "string"
          ? (c as { label: string }).label
          : null
      )
      .filter((l): l is string => Boolean(l));
    return labels.length ? labels : defaultHubLabels(kind);
  } catch {
    return defaultHubLabels(kind);
  }
}

function defaultHubLabels(kind: HubKind): string[] {
  return kind === "utbildning" ? ["Övrigt"] : ["Nyhet"];
}

export async function appendToContentHub(
  kind: HubKind,
  item: HubItem,
  categoryLabel: string
) {
  const slug = hubSlug(kind);
  const hub = await readSimpleContent(kind, slug);
  const categories = Array.isArray(hub.categories)
    ? [...hub.categories]
    : ([] as Record<string, unknown>[]);

  let targetIdx = categories.findIndex(
    (c) =>
      c &&
      typeof c === "object" &&
      (c as { label?: string }).label === categoryLabel
  );

  if (targetIdx < 0) {
    categories.push({ label: categoryLabel, items: [] });
    targetIdx = categories.length - 1;
  }

  const cat = categories[targetIdx] as { label: string; items: HubItem[] };
  const items = Array.isArray(cat.items) ? [...cat.items] : [];
  if (items.some((row) => row.href === item.href)) {
    return;
  }
  items.push({
    href: item.href,
    label: item.label,
    description: item.description ?? "",
    image: item.image ?? "",
  });
  categories[targetIdx] = { ...cat, items };
  await writeSimpleContent(kind, slug, { ...hub, categories });
}

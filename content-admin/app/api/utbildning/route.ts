import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { scaffoldUtbildningCourse } from "@/lib/content-scaffolds";
import { appendToContentHub, listHubCategoryLabels } from "@/lib/hub-listing-sync";
import {
  createSimpleContent,
  listSimpleContent,
} from "@/lib/simple-json-store";
import { isValidContentSlug } from "@/lib/slugify";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listSimpleContent("utbildning");
  const hubCategories = await listHubCategoryLabels("utbildning");
  return NextResponse.json({ pages, hubCategories });
}

export async function POST(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { slug, title, addToHub, hubCategory, hubDescription } = body as {
    slug?: string;
    title?: string;
    addToHub?: boolean;
    hubCategory?: string;
    hubDescription?: string;
  };
  if (!title?.trim() || !slug?.trim() || !isValidContentSlug(slug)) {
    return NextResponse.json({ error: "Ogiltig titel eller slug" }, { status: 400 });
  }
  try {
    const data = scaffoldUtbildningCourse(slug, title.trim());
    await createSimpleContent("utbildning", slug, data);
    if (addToHub !== false) {
      const label = hubCategory?.trim() || "Övrigt";
      await appendToContentHub(
        "utbildning",
        {
          href: `/utbildning/${slug}`,
          label: title.trim(),
          description: hubDescription?.trim() ?? "",
          image: "",
        },
        label
      );
    }
    return NextResponse.json({ ok: true, slug, path: `/utbildning/${slug}` });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    const status = message.includes("exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

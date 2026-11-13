import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { scaffoldBlogPost } from "@/lib/content-scaffolds";
import { appendToContentHub, listHubCategoryLabels } from "@/lib/hub-listing-sync";
import { createSimpleContent, listSimpleContent } from "@/lib/simple-json-store";
import { isValidContentSlug } from "@/lib/slugify";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listSimpleContent("nyheter");
  const hubCategories = await listHubCategoryLabels("nyheter");
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
  const { slug, title, addToHub, listingCategory, excerpt } = body as {
    slug?: string;
    title?: string;
    addToHub?: boolean;
    listingCategory?: string;
    excerpt?: string;
  };
  if (!title?.trim() || !slug?.trim() || !isValidContentSlug(slug)) {
    return NextResponse.json({ error: "Ogiltig titel eller slug" }, { status: 400 });
  }
  try {
    const category = listingCategory?.trim() || "Nyhet";
    const data = scaffoldBlogPost(slug, title.trim(), category);
    if (excerpt?.trim()) {
      data.excerpt = excerpt.trim();
    }
    await createSimpleContent("nyheter", slug, data);
    if (addToHub !== false) {
      await appendToContentHub(
        "nyheter",
        {
          href: `/nyheter/${slug}`,
          label: title.trim(),
          description: data.excerpt || "",
          image: "",
        },
        category
      );
    }
    return NextResponse.json({ ok: true, slug, path: `/nyheter/${slug}` });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    const status = message.includes("exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { isValidContentSlug } from "@/lib/slugify";
import {
  TREATMENT_PAGE_CATEGORIES,
  createTreatmentPage,
  listTreatmentPages,
} from "@/lib/treatment-pages-store";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listTreatmentPages();
  return NextResponse.json({
    pages,
    categories: TREATMENT_PAGE_CATEGORIES,
  });
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
  const { category, slug, title } = body as {
    category?: string;
    slug?: string;
    title?: string;
  };
  if (
    !title?.trim() ||
    !slug?.trim() ||
    !isValidContentSlug(slug) ||
    !category ||
    !(TREATMENT_PAGE_CATEGORIES as readonly string[]).includes(category)
  ) {
    return NextResponse.json({ error: "Ogiltig titel, slug eller kategori" }, { status: 400 });
  }
  try {
    await createTreatmentPage(category, slug, title.trim());
    return NextResponse.json({
      ok: true,
      category,
      slug,
      path: `/${category}/${slug}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    const status = message.includes("exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

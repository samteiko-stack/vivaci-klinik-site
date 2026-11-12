import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getHeroImageForHref, setHeroImageForHref } from "@/lib/treatment-images-store";

export async function GET(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const href = new URL(req.url).searchParams.get("href")?.trim();
  if (!href) {
    return NextResponse.json({ error: "href required" }, { status: 400 });
  }
  try {
    const imagePath = await getHeroImageForHref(href);
    return NextResponse.json({ href, imagePath });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Read failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { href?: string; imagePath?: string };
    const href = body.href?.trim();
    if (!href) {
      return NextResponse.json({ error: "href required" }, { status: 400 });
    }
    const imagePath = typeof body.imagePath === "string" ? body.imagePath : "";
    await setHeroImageForHref(href, imagePath);
    return NextResponse.json({ ok: true, href, imagePath });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

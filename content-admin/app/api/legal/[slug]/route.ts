import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { readSimpleContent, writeSimpleContent } from "@/lib/simple-json-store";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    const data = await readSimpleContent("legal", slug);
    return NextResponse.json({ slug, data });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  try {
    await writeSimpleContent("legal", slug, body as Record<string, unknown>);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 400 });
  }
}

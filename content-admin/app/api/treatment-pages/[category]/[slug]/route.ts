import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { readTreatmentPage, writeTreatmentPage } from "@/lib/treatment-pages-store";

type Params = { params: Promise<{ category: string; slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { category, slug } = await params;
  try {
    const data = await readTreatmentPage(category, slug);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Not found";
    return NextResponse.json({ error: message }, { status: message.includes("Invalid") ? 400 : 404 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { category, slug } = await params;
  try {
    const body = await req.json();
    await writeTreatmentPage(category, slug, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

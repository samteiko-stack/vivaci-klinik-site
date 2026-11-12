import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { listTreatmentPages } from "@/lib/treatment-pages-store";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listTreatmentPages();
  return NextResponse.json({ pages });
}

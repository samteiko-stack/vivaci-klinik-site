import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { listSimpleContent } from "@/lib/simple-json-store";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pages = await listSimpleContent("legal");
  return NextResponse.json({ pages });
}

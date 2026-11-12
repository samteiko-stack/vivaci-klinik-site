import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { listSiteImages } from "@/lib/site-public";

export async function GET(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? undefined;
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const limit = Number(url.searchParams.get("limit") ?? "60");
  const subdir = url.searchParams.get("subdir") ?? undefined;

  try {
    const { items, total } = await listSiteImages({ query, offset, limit, subdir });
    return NextResponse.json({ items, total, offset, limit });
  } catch (e) {
    const message = e instanceof Error ? e.message : "List failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

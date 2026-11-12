import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { SITE_PUBLIC_ROOT, assertInsideSitePublic, isImageFileName } from "@/lib/site-public";

const UPLOAD_DIR = path.join(SITE_PUBLIC_ROOT, "images", "uploads");

function sanitizeBaseName(name: string): string {
  const base = path.basename(name, path.extname(name));
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "upload";
}

export async function POST(req: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const origName = file.name || "upload.jpg";
  const ext = path.extname(origName).toLowerCase();
  if (!isImageFileName(`x${ext}`)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const base = sanitizeBaseName(origName);
  const stamp = Date.now();
  let fileName = `${base}-${stamp}${ext}`;
  let abs = path.join(UPLOAD_DIR, fileName);
  assertInsideSitePublic(abs);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    await fs.writeFile(abs, buf);
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const webPath = `/images/uploads/${fileName}`;
  return NextResponse.json({ path: webPath });
}

import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "vivaci_admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const ISSUER = "vivaci-content-admin";
const AUDIENCE = "vivaci-admin";

function sessionKey() {
  const secret = process.env.VIVACI_ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? new TextEncoder().encode(secret) : null;
}

function safeEqual(value: string, expected: string) {
  const left = createHash("sha256").update(value).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function isAdminAuthConfigured() {
  return Boolean(sessionKey() && process.env.VIVACI_ADMIN_PASSWORD);
}

export function validateAdminPassword(password: string) {
  const expectedPassword = process.env.VIVACI_ADMIN_PASSWORD ?? "";

  if (!isAdminAuthConfigured()) return false;
  return safeEqual(password, expectedPassword);
}

export async function createAdminSession() {
  const key = sessionKey();
  if (!key) throw new Error("Admin authentication is not configured");

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("vivaci-admin")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_SECONDS,
    path: "/",
  });
}

export async function hasAdminSession() {
  const key = sessionKey();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!key || !token) return false;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload.sub === "vivaci-admin" && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function deleteAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

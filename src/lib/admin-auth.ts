/**
 * Admin session authentication helpers.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { Role } from "./security";

export const ADMIN_SESSION_COOKIE_NAME = "organvm_admin_session";
export const ADMIN_CSRF_COOKIE_NAME = "organvm_admin_csrf";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  role: Role;
  user_id: string;
  issued_at: number;
  expires_at: number;
}

function getAdminSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_API_TOKEN ?? null;
}

function base64urlEncode(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function base64urlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function sign(payloadBase64: string, secret: string): string { // allow-secret
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "utf-8");
  const rightBuf = Buffer.from(right, "utf-8");
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export function createAdminSessionToken(
  role: Role,
  userId: string,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
): string | null {
  const secret = getAdminSessionSecret(); // allow-secret
  if (!secret) return null;

  const now = Date.now();
  const session: AdminSession = {
    role,
    user_id: userId,
    issued_at: now,
    expires_at: now + ttlSeconds * 1000,
  };
  const payload = base64urlEncode(JSON.stringify(session));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSession | null { // allow-secret
  const secret = getAdminSessionSecret(); // allow-secret
  if (!secret) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  if (!safeStringEqual(expected, signature)) {
    return null;
  }

  let parsed: AdminSession;
  try {
    parsed = JSON.parse(base64urlDecode(payload)) as AdminSession;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed.role || !parsed.user_id) return null;
  if (!Number.isFinite(parsed.expires_at) || Date.now() > parsed.expires_at) return null;
  return parsed;
}

export function readCookieByName(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function getAdminSessionFromRequest(request: Request): AdminSession | null {
  const cookieHeader = request.headers.get("cookie");
  const token = readCookieByName(cookieHeader, ADMIN_SESSION_COOKIE_NAME); // allow-secret
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export function createAdminCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

export function getAdminCsrfFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  return readCookieByName(cookieHeader, ADMIN_CSRF_COOKIE_NAME);
}

export function validateAdminCsrf(request: Request): boolean {
  const cookieToken = getAdminCsrfFromRequest(request);
  const headerToken = request.headers.get("x-admin-csrf")?.trim() || null;
  if (!cookieToken || !headerToken) return false;
  return safeStringEqual(cookieToken, headerToken);
}

export function buildAdminSessionCookie(
  token: string, // allow-secret
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${ttlSeconds}`,
    secure,
  ].join("; ");
}

export function buildAdminCsrfCookie(
  token: string, // allow-secret
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${ADMIN_CSRF_COOKIE_NAME}=${token}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ttlSeconds}`,
    secure,
  ].join("; ");
}

export function buildClearAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${ADMIN_SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure,
  ].join("; ");
}

export function buildClearAdminCsrfCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${ADMIN_CSRF_COOKIE_NAME}=`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    secure,
  ].join("; ");
}

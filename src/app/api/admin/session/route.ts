import type { Role } from "@/lib/security";
import {
  buildAdminCsrfCookie,
  buildAdminSessionCookie,
  buildClearAdminCsrfCookie,
  buildClearAdminSessionCookie,
  createAdminCsrfToken,
  createAdminSessionToken,
  getAdminCsrfFromRequest,
  getAdminSessionFromRequest,
} from "@/lib/admin-auth";
import { timingSafeEqual } from "crypto";

const VALID_LOGIN_ROLES: Role[] = ["stakeholder", "contributor", "admin"];

function json(body: unknown, status = 200, setCookies: string[] = []): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of setCookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function getLoginPassword(): string | null {
  return process.env.ADMIN_LOGIN_PASSWORD ?? process.env.ADMIN_API_TOKEN ?? null;
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left, "utf-8");
  const rightBuf = Buffer.from(right, "utf-8");
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export async function GET(request: Request): Promise<Response> {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return json({ authenticated: false }, 401);
  }
  return json({
    authenticated: true,
    session: {
      role: session.role,
      user_id: session.user_id,
      expires_at: session.expires_at,
      csrf_token: getAdminCsrfFromRequest(request),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return json({ error: "Request body must be an object" }, 400);
  }

  const expectedPassword = getLoginPassword();
  if (!expectedPassword) {
    return json({ error: "ADMIN_LOGIN_PASSWORD is not configured" }, 503);
  }

  const password = (body as { password?: unknown }).password; // allow-secret
  if (
    typeof password !== "string" ||
    !safeStringEqual(password, expectedPassword)
  ) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const roleRaw = (body as { role?: unknown }).role;
  const role =
    typeof roleRaw === "string" && VALID_LOGIN_ROLES.includes(roleRaw as Role)
      ? (roleRaw as Role)
      : "admin";
  const userIdRaw = (body as { user_id?: unknown }).user_id;
  const userId =
    typeof userIdRaw === "string" && userIdRaw.trim()
      ? userIdRaw.trim().slice(0, 128)
      : `session-${role}`;

  const token = createAdminSessionToken(role, userId); // allow-secret
  if (!token) {
    return json({ error: "Admin session secret is not configured" }, 503);
  }
  const csrfToken = createAdminCsrfToken();

  return json(
    {
      authenticated: true,
      session: {
        role,
        user_id: userId,
        csrf_token: csrfToken,
      },
    },
    200,
    [buildAdminSessionCookie(token), buildAdminCsrfCookie(csrfToken)]
  );
}

export async function DELETE(): Promise<Response> {
  return json({ authenticated: false }, 200, [
    buildClearAdminSessionCookie(),
    buildClearAdminCsrfCookie(),
  ]);
}

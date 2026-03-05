import { afterEach, describe, expect, it } from "vitest";
import {
  ADMIN_CSRF_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  buildAdminCsrfCookie,
  buildClearAdminCsrfCookie,
  buildAdminSessionCookie,
  buildClearAdminSessionCookie,
  createAdminCsrfToken,
  createAdminSessionToken,
  getAdminCsrfFromRequest,
  readCookieByName,
  validateAdminCsrf,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("admin auth helpers", () => {
  it("creates and verifies signed session tokens", () => {
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const token = createAdminSessionToken("admin", "user-1", 3600); // allow-secret
    expect(token).toBeTruthy();

    const verified = verifyAdminSessionToken(token || "");
    expect(verified?.role).toBe("admin");
    expect(verified?.user_id).toBe("user-1");
  });

  it("rejects malformed or tampered tokens", () => {
    process.env.ADMIN_SESSION_SECRET = "session-secret";
    const token = createAdminSessionToken("admin", "user-1", 3600) || ""; // allow-secret
    const tampered = `${token}tampered`;
    expect(verifyAdminSessionToken(tampered)).toBeNull();
  });

  it("builds and clears session cookies", () => {
    const cookie = buildAdminSessionCookie("abc123", 60);
    expect(cookie).toContain(`${ADMIN_SESSION_COOKIE_NAME}=abc123`);
    expect(cookie).toContain("HttpOnly");

    const clearCookie = buildClearAdminSessionCookie();
    expect(clearCookie).toContain(`${ADMIN_SESSION_COOKIE_NAME}=`);
    expect(clearCookie).toContain("Max-Age=0");
  });

  it("reads named cookies from header", () => {
    const raw = "a=1; organvm_admin_session=token123; b=2";
    expect(readCookieByName(raw, "organvm_admin_session")).toBe("token123");
    expect(readCookieByName(raw, "missing")).toBeNull();
  });

  it("builds and validates csrf token/cookie", () => {
    const csrfToken = createAdminCsrfToken();
    const cookie = buildAdminCsrfCookie(csrfToken, 60);
    expect(cookie).toContain(`${ADMIN_CSRF_COOKIE_NAME}=`);

    const request = new Request("http://localhost/api/admin/intel", {
      headers: {
        cookie: `${ADMIN_CSRF_COOKIE_NAME}=${csrfToken}`,
        "x-admin-csrf": csrfToken,
      },
    });
    expect(getAdminCsrfFromRequest(request)).toBe(csrfToken);
    expect(validateAdminCsrf(request)).toBe(true);

    const clearCookie = buildClearAdminCsrfCookie();
    expect(clearCookie).toContain(`${ADMIN_CSRF_COOKIE_NAME}=`);
    expect(clearCookie).toContain("Max-Age=0");
  });
});

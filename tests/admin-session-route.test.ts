import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "@/app/api/admin/session/route";

const originalEnv = { ...process.env };

function extractCookieValue(setCookie: string | null, name: string): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
}

describe("admin session route", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_LOGIN_PASSWORD: "supersecret",
      ADMIN_SESSION_SECRET: "session-secret",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("authenticates and returns session cookie", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: "supersecret", // allow-secret
          role: "admin",
          user_id: "ops-user",
        }),
      })
    );

    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("organvm_admin_session=");
    expect(cookie).toContain("organvm_admin_csrf=");
    const sessionToken = extractCookieValue(cookie, "organvm_admin_session");
    const csrfToken = extractCookieValue(cookie, "organvm_admin_csrf");
    expect(sessionToken).toBeTruthy();
    expect(csrfToken).toBeTruthy();

    const checkRes = await GET(
      new Request("http://localhost/api/admin/session", {
        headers: {
          cookie: `organvm_admin_session=${sessionToken}; organvm_admin_csrf=${csrfToken}`,
        },
      })
    );
    expect(checkRes.status).toBe(200);
    const body = await checkRes.json();
    expect(body.authenticated).toBe(true);
    expect(body.session.role).toBe("admin");
    expect(body.session.csrf_token).toBeTruthy();
  });

  it("rejects invalid credentials", async () => {
    const res = await POST(
      new Request("http://localhost/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: "wrong", // allow-secret
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("clears session cookie on logout", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("organvm_admin_csrf=");
  });
});

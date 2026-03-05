import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminIntelPanel } from "@/components/AdminIntelPanel";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminIntelPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? verifyAdminSessionToken(sessionToken) : null;
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Intelligence Control Plane</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Operate ingestion, maintenance cycles, evaluation runs, and compliance actions.
        </p>
      </div>
      <AdminIntelPanel />
    </div>
  );
}

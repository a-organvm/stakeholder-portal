import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (existing && verifyAdminSessionToken(existing)) {
    redirect("/admin/intel");
  }

  return (
    <div className="py-8">
      <AdminLoginForm />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORGANVM — Stakeholder Intelligence Portal",
  description:
    "Real-time intelligence on the ORGANVM eight-organ creative-institutional system. 111 repos, 8 organs, one vision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <nav className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              ORGANVM
            </Link>
            <div className="flex gap-6 text-sm text-[var(--color-text-muted)]">
              <Link href="/repos" className="hover:text-white transition-colors">
                Repos
              </Link>
              <Link href="/organs" className="hover:text-white transition-colors">
                Organs
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/ask" className="hover:text-white transition-colors">
                Ask
              </Link>
              <Link href="/admin/intel" className="hover:text-white transition-colors">
                Admin
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

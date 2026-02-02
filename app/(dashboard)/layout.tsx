import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/care-notes", label: "Care Notes" },
  { href: "/incidents", label: "Incidents" },
  { href: "/roster", label: "Roster" },
  { href: "/approvals", label: "Approvals" },
  { href: "/audit", label: "Audit Log" },
  { href: "/admin", label: "Admin Console" }
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">LDS Nexus</p>
            <h2 className="text-lg font-semibold text-slate-900">Operations Dashboard</h2>
          </div>
          {user ? (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge>{user.role.replace("_", " ")}</Badge>
            </div>
          ) : (
            <Badge>Unauthenticated</Badge>
          )}
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-3 px-6 pb-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

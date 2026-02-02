import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">LDS Nexus</p>
          <h1 className="text-4xl font-semibold text-slate-900">
            AI + Agentic Operations Platform for Lutheran Disability Services
          </h1>
          <p className="text-lg text-slate-600">
            Human-in-the-loop, audit-by-default workflows for care notes, compliance, and rostering.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-slate-900 hover:bg-slate-700">Go to dashboard</Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            "Care Notes Copilot",
            "Compliance Sentinel",
            "Roster Optimiser",
            "Admin Console"
          ].map((item) => (
            <Card key={item}>
              <h3 className="text-lg font-semibold text-slate-900">{item}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Production-ready workflows aligned with NDIS quality and safeguarding expectations.
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

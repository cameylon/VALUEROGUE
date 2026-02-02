import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Care Notes Copilot</h3>
        <p className="mt-2 text-sm text-slate-600">
          Draft defensible notes, run missing-field checks, and submit for review when incident keywords appear.
        </p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Compliance Sentinel</h3>
        <p className="mt-2 text-sm text-slate-600">
          Track incidents, approvals, and evidence packs with immutable audit history.
        </p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Roster Optimiser</h3>
        <p className="mt-2 text-sm text-slate-600">
          Suggest assignments, highlight fatigue risk, and confirm with human approval.
        </p>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Admin Console</h3>
        <p className="mt-2 text-sm text-slate-600">
          Manage roles, approvals, system settings, and audit exports.
        </p>
      </Card>
    </div>
  );
}

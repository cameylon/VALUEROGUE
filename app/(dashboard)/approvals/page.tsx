"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/approvals")
      .then((res) => res.json())
      .then((data) => setApprovals(data.approvals || []))
      .catch(() => setMessage("Unable to load approvals."));
  }, []);

  async function decide(approvalId: string, decision: "APPROVED" | "REJECTED") {
    const response = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId, decision })
    });
    if (response.ok) {
      setMessage("Decision recorded.");
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">Approval Queue</h3>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
      <div className="mt-4 space-y-3 text-sm">
        {approvals.length ? (
          approvals.map((approval) => (
            <div key={approval.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{approval.entityType}</p>
              <p className="text-slate-600">Required role: {approval.requiredRole}</p>
              <p className="text-xs text-slate-500">Status: {approval.status}</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" onClick={() => decide(approval.id, "APPROVED")}>
                  Approve
                </Button>
                <Button type="button" className="bg-slate-900 hover:bg-slate-700" onClick={() => decide(approval.id, "REJECTED")}>
                  Reject
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500">No approvals pending.</p>
        )}
      </div>
    </Card>
  );
}

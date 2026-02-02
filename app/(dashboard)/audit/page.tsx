"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((res) => res.json())
      .then((data) => setEvents(data.auditEvents || []));
  }, []);

  async function runFilter() {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const response = await fetch(`/api/admin/audit?${params.toString()}`);
    const data = await response.json();
    setEvents(data.auditEvents || []);
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">Audit Log</h3>
      <p className="mt-1 text-sm text-slate-600">Immutable event history without sensitive payloads.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="text-sm">
          Start
          <input
            type="datetime-local"
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label className="text-sm">
          End
          <input
            type="datetime-local"
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
        <Button type="button" onClick={runFilter}>
          Filter
        </Button>
        <a
          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
          href={`/api/admin/audit/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`}
        >
          Export CSV
        </a>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{event.action}</p>
              <p className="text-xs text-slate-500">
                {new Date(event.createdAt).toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })} · {event.entityType}
              </p>
            </div>
          ))
        ) : (
          <p className="text-slate-500">No audit events yet.</p>
        )}
      </div>
    </Card>
  );
}

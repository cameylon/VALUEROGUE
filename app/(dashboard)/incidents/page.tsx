"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [homes, setHomes] = useState<any[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    homeId: "",
    category: "",
    severity: "",
    description: "",
    immediateActions: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/incidents"), fetch("/api/clients"), fetch("/api/homes")])
      .then(async ([incidentsRes, clientsRes, homesRes]) => {
        setIncidents((await incidentsRes.json()).incidents || []);
        setClients((await clientsRes.json()).clients || []);
        setHomes((await homesRes.json()).homes || []);
      })
      .catch(() => setMessage("Unable to load incident data."));
  }, []);

  async function createIncident() {
    setMessage("");
    const response = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to create incident.");
      return;
    }
    setIncidents([data.incident, ...incidents]);
    setMessage("Incident saved as draft.");
  }

  async function submitIncident(id: string) {
    const response = await fetch(`/api/incidents/${id}/submit`, { method: "POST" });
    if (response.ok) {
      setMessage("Incident submitted for Quality & Safety approval.");
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Create Incident</h3>
        <p className="mt-1 text-sm text-amber-700">Human approval required before submission and closure.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Client
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
            >
              <option value="">Select client</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.preferredName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Home
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.homeId}
              onChange={(event) => setForm({ ...form, homeId: event.target.value })}
            >
              <option value="">Select home</option>
              {homes.map((home: any) => (
                <option key={home.id} value={home.id}>
                  {home.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Category
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </label>
          <label className="text-sm">
            Severity
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.severity}
              onChange={(event) => setForm({ ...form, severity: event.target.value })}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Description
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label className="mt-4 block text-sm">
          Immediate actions
          <textarea
            className="mt-1 min-h-[100px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={form.immediateActions}
            onChange={(event) => setForm({ ...form, immediateActions: event.target.value })}
          />
        </label>
        <Button className="mt-4" type="button" onClick={createIncident}>
          Save Draft
        </Button>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Incident Queue</h3>
        <div className="mt-4 space-y-4 text-sm">
          {incidents.length ? (
            incidents.map((incident) => (
              <div key={incident.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{incident.category}</p>
                    <p className="text-xs text-slate-500">Severity: {incident.severity}</p>
                  </div>
                  <Button type="button" onClick={() => submitIncident(incident.id)}>
                    Submit
                  </Button>
                </div>
                <p className="mt-2 text-slate-600">{incident.description}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No incidents logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

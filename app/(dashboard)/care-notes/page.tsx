"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Client = { id: string; preferredName: string };
type Shift = { id: string; start: string; end: string; home: { name: string } };

export default function CareNotesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [clientId, setClientId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/clients"), fetch("/api/shifts")])
      .then(async ([clientsRes, shiftsRes]) => {
        const clientsData = await clientsRes.json();
        const shiftsData = await shiftsRes.json();
        setClients(clientsData.clients || []);
        setShifts(shiftsData.shifts || []);
      })
      .catch(() => {
        setStatusMessage("Unable to load clients or shifts.");
      });
  }, []);

  async function runAiSuggest() {
    setStatusMessage("");
    const response = await fetch("/api/care-notes/ai-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: noteText,
        clientLabel: "[CLIENT]",
        staffLabel: "[STAFF]"
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatusMessage(data.error || "AI run failed.");
      return;
    }
    setAiDraft(data.output);
    setMissingFields(data.missingFields || []);
  }

  async function submitNote(status: "DRAFT" | "SUBMITTED") {
    setStatusMessage("");
    if (status === "SUBMITTED" && aiDraft?.escalationGuidance && !acknowledged) {
      setStatusMessage("Please acknowledge the escalation guidance before submitting.");
      return;
    }
    const response = await fetch("/api/care-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        shiftId: shiftId || undefined,
        noteText,
        structuredJson: aiDraft ?? {},
        status
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatusMessage(data.error || "Unable to save note.");
      return;
    }
    setStatusMessage(data.requiresApproval ? "Submitted for Quality & Safety approval." : "Note saved.");
  }

  async function copyDraft() {
    if (!aiDraft) return;
    const content = [
      `Summary: ${aiDraft.summary}`,
      `Supports Delivered: ${aiDraft.supportsDelivered}`,
      `Client Response: ${aiDraft.clientResponse}`,
      `Risks/Incidents: ${aiDraft.risksIncidents}`,
      `Follow-ups: ${aiDraft.followUps}`
    ].join("\n");
    await navigator.clipboard.writeText(content);
    setStatusMessage("Copied formatted note to clipboard.");
  }

  return (
    <div className="grid gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">New Care Note</h3>
        <p className="mt-1 text-sm text-slate-600">Human approval required if incident keywords are detected.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Client
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.preferredName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Shift (optional)
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={shiftId}
              onChange={(event) => setShiftId(event.target.value)}
            >
              <option value="">Select shift</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.home.name} - {new Date(shift.start).toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Raw note (voice transcription or text)
          <textarea
            className="mt-1 min-h-[140px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm">
          Optional audio upload (stored locally in MVP)
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            type="file"
            accept="audio/*"
            onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={runAiSuggest}>
            AI Suggest
          </Button>
          <Button type="button" className="bg-slate-900 hover:bg-slate-700" onClick={copyDraft}>
            Copy formatted note
          </Button>
          <Button type="button" className="bg-slate-900 hover:bg-slate-700" onClick={() => submitNote("DRAFT")}
          >
            Save Draft
          </Button>
          <Button type="button" className="bg-emerald-600 hover:bg-emerald-500" onClick={() => submitNote("SUBMITTED")}
          >
            Submit
          </Button>
        </div>
        {statusMessage ? <p className="mt-3 text-sm text-slate-600">{statusMessage}</p> : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">AI Draft Output</h3>
        <p className="mt-1 text-sm text-slate-600">Review for accuracy. No medical advice is generated.</p>
        {aiDraft ? (
          <div className="mt-4 grid gap-3 text-sm">
            <p className="rounded-md bg-blue-50 p-3 text-blue-700">{aiDraft.confidenceBanner}</p>
            {aiDraft.escalationGuidance ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700">
                <p className="font-semibold">Escalation required</p>
                <p>{aiDraft.escalationGuidance}</p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                  />
                  I acknowledge and will escalate immediately.
                </label>
              </div>
            ) : null}
            <p><strong>Summary:</strong> {aiDraft.summary}</p>
            <p><strong>Supports Delivered:</strong> {aiDraft.supportsDelivered}</p>
            <p><strong>Client Response:</strong> {aiDraft.clientResponse}</p>
            <p><strong>Risks/Incidents:</strong> {aiDraft.risksIncidents}</p>
            <p><strong>Follow-ups:</strong> {aiDraft.followUps}</p>
            <p className="rounded-md bg-slate-100 p-3 text-slate-700">{aiDraft.explainability}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Run AI Suggest to populate structured fields.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Missing Fields Checklist</h3>
        {missingFields.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No missing fields detected.</p>
        )}
      </Card>
    </div>
  );
}

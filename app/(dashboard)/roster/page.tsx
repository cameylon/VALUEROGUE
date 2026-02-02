"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RosterPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function fetchSuggestions() {
    const response = await fetch("/api/roster/suggest", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to fetch suggestions.");
      return;
    }
    setSuggestions(data.suggestions || []);
  }

  async function confirmAssignment(shiftId: string, userId: string) {
    const response = await fetch("/api/roster/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId, userId })
    });
    if (response.ok) {
      setMessage("Assignment confirmed with human approval.");
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Roster Optimiser</h3>
        <p className="mt-1 text-sm text-slate-600">
          Rule-based matching with fatigue risk flags. Human approval required before assignment.
        </p>
        <Button className="mt-4" type="button" onClick={fetchSuggestions}>
          Suggest assignments
        </Button>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Suggestions</h3>
        <div className="mt-4 space-y-3 text-sm">
          {suggestions.length ? (
            suggestions.map((suggestion) => (
              <div key={`${suggestion.shiftId}-${suggestion.userId}`} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">Shift {suggestion.shiftId}</p>
                <p className="text-slate-600">Proposed staff: {suggestion.userId}</p>
                <p className="text-slate-600">{suggestion.explanation}</p>
                {suggestion.riskFlags.length ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-amber-600">
                    {suggestion.riskFlags.map((flag: string) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                ) : null}
                <Button
                  type="button"
                  className="mt-3"
                  onClick={() => confirmAssignment(suggestion.shiftId, suggestion.userId)}
                >
                  Confirm assignment
                </Button>
              </div>
            ))
          ) : (
            <p className="text-slate-500">Run suggestions to see recommended assignments.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

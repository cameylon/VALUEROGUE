"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/admin/settings"), fetch("/api/admin/users")])
      .then(async ([settingsRes, usersRes]) => {
        const settingsData = await settingsRes.json();
        const usersData = await usersRes.json();
        setSettings(settingsData.settings || []);
        setUsers(usersData.users || []);
      })
      .catch(() => setMessage("Unable to load admin data."));
  }, []);

  return (
    <div className="grid gap-6">
      <Card>
        <h3 className="text-lg font-semibold text-slate-900">System Settings</h3>
        <p className="mt-1 text-sm text-slate-600">
          AI keys are stored in environment variables. UI only shows configuration state.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          {settings.length ? (
            settings.map((setting) => (
              <div key={setting.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">{setting.category} · {setting.key}</p>
                <pre className="mt-2 rounded bg-slate-100 p-2 text-xs text-slate-600">
                  {JSON.stringify(setting.valueJson, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No settings configured yet.</p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
        <p className="mt-1 text-sm text-slate-600">Invite, deactivate, and assign roles.</p>
        {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
        <div className="mt-4 space-y-3 text-sm">
          {users.length ? (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <Button type="button" className="bg-slate-900 hover:bg-slate-700">
                  {user.role}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No users found.</p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Client/Family Portal</h3>
        <p className="mt-2 text-sm text-slate-600">Coming soon. Architecture placeholder included for future release.</p>
      </Card>
    </div>
  );
}

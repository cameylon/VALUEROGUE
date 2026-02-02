"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (response.ok) {
      window.location.href = "/dashboard";
      return;
    }
    const data = await response.json();
    setMessage(data.error ?? "Login failed");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <Card className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold text-slate-900">Sign in to LDS Nexus</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your staff credentials. Default seed passwords are in the README.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {message ? <p className="text-sm text-red-600">{message}</p> : null}
          <Button type="submit" className="w-full">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}

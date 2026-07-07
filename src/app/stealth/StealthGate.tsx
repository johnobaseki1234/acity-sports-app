"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function StealthGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPending(false);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user?.email) {
      setError(signInError?.message ?? "Sign-in failed.");
      setLoading(false);
      return;
    }

    const { data: allowlisted } = await supabase
      .from("stealth_allowlist")
      .select("email")
      .eq("email", data.user.email)
      .maybeSingle();

    if (!allowlisted) {
      await supabase.auth.signOut();
      setPending(true);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--vanguard-charcoal)" }}
    >
      <div className="w-full max-w-sm rounded-3xl p-8 border border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-2xl text-black font-black text-xl"
            style={{ backgroundColor: "var(--vanguard-volt)" }}
          >
            V
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            VANGUARD
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Private build. Access is restricted to the Pack.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition"
              style={{ ["--tw-ring-color" as string]: "var(--vanguard-volt)" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 transition"
              style={{ ["--tw-ring-color" as string]: "var(--vanguard-volt)" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {denied && !error && !pending && (
            <div
              className="text-sm rounded-2xl px-3 py-2 border"
              style={{
                color: "var(--vanguard-crimson)",
                borderColor: "var(--vanguard-crimson)",
                backgroundColor: "rgba(229,9,20,0.08)",
              }}
            >
              That account isn&apos;t on the allowlist yet.
            </div>
          )}

          {pending && (
            <div
              className="text-sm rounded-2xl px-3 py-2 border"
              style={{
                color: "var(--vanguard-crimson)",
                borderColor: "var(--vanguard-crimson)",
                backgroundColor: "rgba(229,9,20,0.08)",
              }}
            >
              Signed in, but this account isn&apos;t approved for the private build yet.
            </div>
          )}

          {error && (
            <div
              className="text-sm rounded-2xl px-3 py-2 border"
              style={{
                color: "var(--vanguard-crimson)",
                borderColor: "var(--vanguard-crimson)",
                backgroundColor: "rgba(229,9,20,0.08)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl font-semibold text-black transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: "var(--vanguard-volt)" }}
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

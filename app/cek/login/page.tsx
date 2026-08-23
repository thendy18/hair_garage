"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CekLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError("Email atau password belum cocok. Coba cek lagi.");
      setIsLoading(false);
      return;
    }

    window.location.assign("/cek");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-10">
      <section className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Thendy Hair Garage
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
            Masuk ke ruang cek.
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Dashboard ini khusus untuk mengatur jadwal garage.
          </p>
        </div>

        <form onSubmit={handleLogin} className="grid gap-4">
          <label className="text-sm text-neutral-600">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white" />
          </label>
          <label className="text-sm text-neutral-600">
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white" />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={isLoading} className="mt-2 rounded-full bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60">
            {isLoading ? "MEMERIKSA..." : "MASUK KE /CEK"}
          </button>
        </form>
      </section>
    </main>
  );
}

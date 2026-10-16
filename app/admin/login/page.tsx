"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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

    window.location.assign("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4 py-6 text-black">
      <section className="w-full max-w-sm border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">
            Thendy Hair Garage
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">
            Admin login.
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Dashboard ini khusus untuk mengatur jadwal garage.
          </p>
        </div>

        <form onSubmit={handleLogin} className="grid gap-4">
          <label className="text-sm font-bold uppercase">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm text-black outline-none focus:bg-neutral-100" />
          </label>
          <label className="text-sm font-bold uppercase">
            Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm text-black outline-none focus:bg-neutral-100" />
          </label>

          {error && <p className="border-2 border-black bg-red-100 p-3 text-sm font-bold">{error}</p>}

          <button type="submit" disabled={isLoading} className="mt-2 border-2 border-black bg-zinc-900 px-5 py-3.5 text-sm font-bold uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-wait disabled:opacity-60">
            {isLoading ? "MEMERIKSA..." : "MASUK KE /ADMIN"}
          </button>
        </form>
      </section>
    </main>
  );
}

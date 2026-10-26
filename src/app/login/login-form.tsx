"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#873B52]/15 bg-[#FFF8EF]/40 px-3 text-sm font-medium text-[#392832] outline-none transition placeholder:text-[#392832]/35 focus:border-[#873B52] focus:ring-4 focus:ring-[#873B52]/10";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const result = await response.json();

    setLoading(false);
    if (result.error) {
      setError(result.message);
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col text-sm font-semibold text-[#392832]">
        Usuario
        <input name="username" autoComplete="username" placeholder="Ingresa tu usuario" required className={inputClass} />
      </label>
      <label className="flex flex-col text-sm font-semibold text-[#392832]">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" required className={inputClass} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 h-12 rounded-xl bg-[#873B52] text-sm font-bold text-white shadow-lg shadow-[#873B52]/20 transition hover:bg-[#6f3044] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

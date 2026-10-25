"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50";

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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Usuario
        <input name="username" autoComplete="username" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-full bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

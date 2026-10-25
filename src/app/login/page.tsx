import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-1 text-2xl font-semibold text-black dark:text-zinc-50">FastExpress</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Inicia sesión para registrar envíos</p>
        <LoginForm />
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-[#FFF8EF] px-4 font-sans">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#E6B94F]/35 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#398A8C]/25 blur-3xl" />
      <main className="relative w-full max-w-md rounded-3xl border border-[#873B52]/10 bg-white p-7 shadow-2xl shadow-[#392832]/10 sm:p-10">
        <div className="mb-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#873B52] font-display text-lg font-bold text-[#FFF8EF] shadow-lg shadow-[#873B52]/25">F</div><div><h1 className="font-display text-2xl font-bold text-[#873B52]">FastExpress</h1><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#80509A]">En movimiento</p></div></div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#873B52]">Bienvenido de nuevo</h2>
        <p className="mb-7 mt-2 text-sm leading-6 text-[#392832]/65">Inicia sesión para cotizar y registrar los envíos de tus clientes.</p>
        <LoginForm />
      </main>
    </div>
  );
}

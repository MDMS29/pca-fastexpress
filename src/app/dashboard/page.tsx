import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { getDB } from "@/src/db/models";
import { ClientType, ShippingMethod } from "@/src/db/models.interface";
import { getShippingQuotes } from "../api/shipping-quote/shipping-quote.service";
import LogoutButton from "../logout-button";
import ShippingQuoteForm from "../shipping-quote-form";

export default async function Dashboard() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDB();
  const clientTypes = db.prepare("SELECT id, label FROM client_types").all() as ClientType[];
  const shippingMethods = db.prepare("SELECT id, label FROM shipping_methods").all() as ShippingMethod[];
  const shippingQuotes = getShippingQuotes();

  return (
    <div className="min-h-screen bg-[#FFF8EF] text-[#392832] xl:h-screen xl:overflow-hidden">
      <div className="flex min-h-screen w-full xl:h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#873B52]/10 bg-white/80 p-5 lg:flex">
          <Link href="/" className="flex items-center gap-3 px-2 py-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#873B52] font-display text-lg font-bold text-[#FFF8EF]">F</div><div><p className="font-display text-lg font-bold text-[#873B52]">FastExpress</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#80509A]">En movimiento</p></div></Link>
          <nav className="mt-10 space-y-1" aria-label="Navegación principal">
            <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#392832]/65 transition hover:bg-[#E6B94F]/15 hover:text-[#873B52]"><span className="grid h-5 w-5 place-items-center rounded-md border border-current text-xs">⌂</span>Home</Link>
            <a href="#nueva-cotizacion" className="flex items-center gap-3 rounded-xl bg-[#873B52]/10 px-3 py-3 text-sm font-bold text-[#873B52]"><span className="grid h-5 w-5 place-items-center rounded-md bg-[#873B52] text-xs text-white">+</span>Cotización</a>
            <a href="#historial" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#392832]/65 transition hover:bg-[#E6B94F]/15 hover:text-[#873B52]"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>Historial de envíos</a>
          </nav>
          <div className="mt-auto rounded-2xl bg-[#FFF8EF] p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#80509A]">Operador activo</p><p className="mt-2 text-sm font-bold text-[#392832]">{user.name}</p><p className="truncate text-xs text-[#392832]/60">@{user.username}</p><div className="mt-4"><LogoutButton /></div></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-8 lg:px-10 xl:flex xl:h-screen xl:flex-col xl:overflow-hidden">
          <header className="flex items-center justify-between gap-4">
            <div><p className="font-display text-lg font-bold text-[#873B52] lg:hidden">FastExpress</p><h1 className="font-display text-3xl font-bold tracking-tight text-[#873B52]">Nueva cotización</h1></div>
            <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#392832]">{user.name}</p><p className="text-xs text-[#392832]/60">Operador</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-[#80509A] text-sm font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</div><div className="lg:hidden"><LogoutButton /></div></div>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#873B52]/10 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#80509A]">Envíos registrados</p><p className="mt-2 font-display text-3xl font-bold text-[#873B52]">{shippingQuotes.length}</p></div>
            <div className="rounded-2xl border border-[#873B52]/10 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#80509A]">Métodos disponibles</p><p className="mt-2 font-display text-3xl font-bold text-[#873B52]">{shippingMethods.length}</p></div>
            <div className="rounded-2xl bg-[#398A8C] p-4 shadow-lg shadow-[#398A8C]/15"><p className="text-xs font-bold uppercase tracking-wider text-[#FFF8EF]/70">Estado del sistema</p><p className="mt-2 flex items-center gap-2 text-sm font-bold text-white"><span className="h-2 w-2 rounded-full bg-[#E6B94F]" />Todo en marcha</p></div>
          </div>

          <div className="mt-8 grid gap-8 xl:min-h-0 xl:flex-1 xl:grid-cols-2">
            <section id="nueva-cotizacion" className="rounded-3xl border border-[#873B52]/10 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D66B4D]">Registro rápido</p><h2 className="mt-1 font-display text-3xl font-bold text-[#873B52]">Datos del envío</h2><p className="mt-1 text-sm text-[#392832]/65">Completa los datos para calcular y registrar el envío.</p></div><div className="rounded-lg bg-[#E6B94F]/20 px-3 py-1.5 text-xs font-bold text-[#873B52]">Peso máximo: 20 kg</div></div>
              <ShippingQuoteForm clientTypes={clientTypes} shippingMethods={shippingMethods} />
            </section>

            <section id="historial" className="flex min-h-[460px] flex-col rounded-3xl border border-[#873B52]/10 bg-white p-5 shadow-sm sm:p-7 xl:min-h-0">
              <div className="mb-6 flex shrink-0 items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D66B4D]">Registro</p><h2 className="mt-1 font-display text-3xl font-bold text-[#873B52]">Historial de envíos</h2></div><span className="rounded-lg bg-[#80509A]/10 px-3 py-1.5 text-xs font-bold text-[#80509A]">{shippingQuotes.length} total</span></div>
              <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="sticky top-0 border-y border-[#873B52]/10 bg-[#FFF8EF] text-[11px] font-bold uppercase tracking-wider text-[#80509A]"><tr><th className="px-3 py-3">#</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Identificación</th><th className="px-3 py-3">Peso</th><th className="px-3 py-3">Descuento</th><th className="px-3 py-3">Recargo</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Responsable</th><th className="px-3 py-3">Fecha</th></tr></thead><tbody>{shippingQuotes.length === 0 && <tr><td colSpan={9} className="px-3 py-12 text-center text-[#392832]/60"><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#E6B94F]/20 text-lg text-[#873B52]">⌁</div>Aún no hay envíos registrados.</td></tr>}{shippingQuotes.map((quote) => <tr key={quote.id} className="border-b border-[#873B52]/10 text-[#392832]/75 transition hover:bg-[#FFF8EF]"><td className="px-3 py-4 font-semibold text-[#80509A]">#{quote.id}</td><td className="px-3 py-4 font-bold text-[#392832]">{quote.client_name}</td><td className="px-3 py-4">{quote.client_identification}</td><td className="px-3 py-4">{quote.weight} kg</td><td className="px-3 py-4"><span className="rounded-md bg-[#398A8C]/10 px-2 py-1 text-xs font-bold text-[#398A8C]">{quote.discount}</span></td><td className="px-3 py-4"><span className="rounded-md bg-[#E6B94F]/25 px-2 py-1 text-xs font-bold text-[#873B52]">{quote.surcharge}</span></td><td className="px-3 py-4 font-bold text-[#873B52]">${quote.total.toFixed(2)}</td><td className="px-3 py-4">{quote.responsible ?? "—"}</td><td className="px-3 py-4 text-xs">{quote.created_at}</td></tr>)}</tbody></table></div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

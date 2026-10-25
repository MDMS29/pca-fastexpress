import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { getDB } from "@/src/db/models";
import { ClientType, ShippingMethod } from "@/src/db/models.interface";
import { getShippingQuotes } from "./api/shipping-quote/shipping-quote.service";
import ShippingQuoteForm from "./shipping-quote-form";
import LogoutButton from "./logout-button";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDB();
  const clientTypes = db.prepare("SELECT id, label FROM client_types").all() as ClientType[];
  const shippingMethods = db.prepare("SELECT id, label FROM shipping_methods").all() as ShippingMethod[];
  const shippingQuotes = getShippingQuotes();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <main className="flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">FastExpress</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Sesión: {user.name} ({user.username})</p>
          </div>
          <LogoutButton />
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">Nuevo envío</h2>
          <ShippingQuoteForm clientTypes={clientTypes} shippingMethods={shippingMethods} />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">Envíos registrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-700">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Identificación</th>
                  <th className="py-2 pr-4">Peso (kg)</th>
                  <th className="py-2 pr-4">Descuento</th>
                  <th className="py-2 pr-4">Recargo</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Responsable</th>
                  <th className="py-2 pr-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {shippingQuotes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-zinc-500">Sin envíos registrados</td>
                  </tr>
                )}
                {shippingQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-4">{quote.id}</td>
                    <td className="py-2 pr-4">{quote.client_name}</td>
                    <td className="py-2 pr-4">{quote.client_identification}</td>
                    <td className="py-2 pr-4">{quote.weight}</td>
                    <td className="py-2 pr-4">{quote.discount}</td>
                    <td className="py-2 pr-4">{quote.surcharge}</td>
                    <td className="py-2 pr-4">{quote.total.toFixed(2)}</td>
                    <td className="py-2 pr-4">{quote.responsible ?? "—"}</td>
                    <td className="py-2 pr-4">{quote.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

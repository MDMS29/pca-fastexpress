"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ClientType, ShippingMethod } from "@/src/db/models.interface";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const labelClass = "flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300";

interface Props {
  clientTypes: ClientType[];
  shippingMethods: ShippingMethod[];
}

export default function ShippingQuoteForm({ clientTypes, shippingMethods }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/shipping-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: form.get("client_name"),
        client_identification: form.get("client_identification"),
        client_type_id: Number(form.get("client_type_id")),
        shipping_method_id: Number(form.get("shipping_method_id")),
        weight: Number(form.get("weight")),
      }),
    });
    const result = await response.json();

    setLoading(false);
    if (response.status === 401) {
      router.replace("/login");
      return;
    }
    if (result.error) {
      setMessage({ error: true, text: result.message });
      return;
    }
    setMessage({ error: false, text: `${result.message} Total: ${result.data.total.toFixed(2)}` });
    formElement.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>
        Nombre del cliente
        <input name="client_name" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Identificación
        <input name="client_identification" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Tipo de cliente
        <select name="client_type_id" required className={inputClass}>
          {clientTypes.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Tipo de envío
        <select name="shipping_method_id" required className={inputClass}>
          {shippingMethods.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Peso (kg)
        <input name="weight" type="number" step="0.01" min="0.01" max="20" required className={inputClass} />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {loading ? "Guardando..." : "Crear envío"}
        </button>
      </div>
      {message && (
        <p className={`text-sm sm:col-span-2 ${message.error ? "text-red-600" : "text-green-600"}`}>{message.text}</p>
      )}
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ClientType, DocumentType, ShippingMethod } from "@/src/db/models.interface";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#873B52]/15 bg-[#FFF8EF]/35 px-3 text-sm font-medium text-[#392832] outline-none transition placeholder:text-[#392832]/35 focus:border-[#873B52] focus:ring-4 focus:ring-[#873B52]/10";
const labelClass = "flex flex-col text-sm font-semibold text-[#392832]";

interface Props {
  clientTypes: ClientType[];
  shippingMethods: ShippingMethod[];
}

export default function ShippingQuoteForm({ clientTypes, shippingMethods }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientTypeId, setClientTypeId] = useState(clientTypes[0]?.id ?? 1);
  const [shippingMethodId, setShippingMethodId] = useState(shippingMethods[0]?.id ?? 1);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    const loadDocumentTypes = async () => {
      const response = await fetch("/api/document-types");
      const result = await response.json();
      if (response.ok && !result.error) {
        setDocumentTypes(result.data);
        setDocumentTypeId(String(result.data[0]?.id ?? ""));
      }
    };
    void loadDocumentTypes();
  }, []);

  const estimate = useMemo(() => {
    const numericWeight = Number(weight);
    if (!numericWeight || numericWeight <= 0.01 || numericWeight > 20) return null;

    const rate = numericWeight <= 5 ? 2 : 4;
    const discount = clientTypeId === 2 ? 0.1 : clientTypeId === 3 ? 0.2 : 0;
    const surcharge = shippingMethodId === 2 ? 0.25 : 0;
    return { rate, discount, surcharge, total: rate * numericWeight * (1 - discount) * (1 + surcharge) };
  }, [clientTypeId, shippingMethodId, weight]);

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
        document_type_id: Number(form.get("document_type_id")),
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
    setWeight("");
    setDocumentTypeId(String(documentTypes[0]?.id ?? ""));
    setClientTypeId(clientTypes[0]?.id ?? 1);
    setShippingMethodId(shippingMethods[0]?.id ?? 1);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-2">
      <label className={labelClass}>
        Nombre del cliente
        <input name="client_name" required placeholder="Ej. Ana Pérez" className={inputClass} />
      </label>
      <label className={labelClass}>
        Tipo de documento
        <select name="document_type_id" required value={documentTypeId} onChange={(event) => setDocumentTypeId(event.target.value)} className={inputClass} disabled={documentTypes.length === 0}>
          {documentTypes.length === 0 && <option>Cargando tipos de documento...</option>}
          {documentTypes.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Número de documento
        <input name="client_identification" required placeholder="Documento o NIT" className={inputClass} />
      </label>
      <label className={labelClass}>
        Tipo de cliente
        <select name="client_type_id" required value={clientTypeId} onChange={(event) => setClientTypeId(Number(event.target.value))} className={inputClass}>
          {clientTypes.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Tipo de envío
        <select name="shipping_method_id" required value={shippingMethodId} onChange={(event) => setShippingMethodId(Number(event.target.value))} className={inputClass}>
          {shippingMethods.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Peso (kg)
        <input name="weight" type="number" step="0.01" min="0.01" max="20" required value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0.00" className={inputClass} />
      </label>
      <div className="rounded-xl border border-[#398A8C]/20 bg-[#398A8C]/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#398A8C]">Estimado</p>
        {estimate ? (
          <>
            <p className="mt-1 font-display text-3xl font-bold tracking-tight text-[#873B52]">${estimate.total.toFixed(2)}</p>
            <p className="mt-1 text-xs leading-5 text-[#392832]/75">Tarifa ${estimate.rate}/kg · Descuento {estimate.discount * 100}% · Recargo {estimate.surcharge * 100}%</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-5 text-[#392832]/75">Ingresa un peso entre 0.01 y 20 kg para ver el total.</p>
        )}
      </div>
      <div className="flex items-end lg:col-span-2">
        <button
          type="submit"
          disabled={loading || documentTypes.length === 0}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D66B4D] text-sm font-bold text-white shadow-lg shadow-[#D66B4D]/20 transition hover:bg-[#bc573b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!loading && <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M12 5v14M5 12h14" /></svg>}
          {loading ? "Guardando..." : documentTypes.length === 0 ? "Cargando formulario..." : "Crear envío"}
        </button>
      </div>
      {message && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium lg:col-span-2 ${message.error ? "bg-red-50 text-red-700" : "bg-[#398A8C]/10 text-[#398A8C]"}`}>{message.text}</p>
      )}
    </form>
  );
}

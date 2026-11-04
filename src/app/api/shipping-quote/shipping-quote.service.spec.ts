import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/src/db/models.interface";

type StoredClient = { id: number; name: string; documentTypeId: number; documentNumber: string };
type StoredQuote = Record<string, unknown> & { id: number };

const mockedDatabase = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock("@/src/db/models", () => ({
  getDB: () => mockedDatabase.current,
}));

import { createShippingQuote, getShippingQuotes } from "./shipping-quote.service";

const responsible: User = { id: 7, username: "qa", name: "Equipo QA" };

const baseRequest = {
  client_name: "Ana Pérez",
  client_identification: "100200300",
  document_type_id: 1,
  client_type_id: 1,
  shipping_method_id: 1,
  weight: 5,
};

const createDatabase = () => {
  const clients: StoredClient[] = [];
  const quotes: StoredQuote[] = [];
  let clientSequence = 1;
  let quoteSequence = 1;

  const db = {
    prepare: (query: string) => ({
      get: (...parameters: unknown[]) => {
        if (query.includes("FROM document_types")) {
          const id = Number(parameters[0]);
          return id >= 1 && id <= 4 ? { id, label: ["Cédula de ciudadanía", "Cédula de extranjería", "NIT", "Pasaporte"][id - 1] } : undefined;
        }
        if (query.includes("FROM customer_discounts")) {
          const clientType = Number(parameters[0]);
          return ({ 1: { label: "0%", value: 0 }, 2: { label: "10%", value: 0.1 }, 3: { label: "20%", value: 0.2 } } as Record<number, { label: string; value: number }>)[clientType];
        }
        if (query.includes("FROM shipping_method_surcharges")) {
          const shippingMethod = Number(parameters[0]);
          return ({ 1: { label: "0%", value: 0 }, 2: { label: "25%", value: 0.25 } } as Record<number, { label: string; value: number }>)[shippingMethod];
        }
        if (query.includes("SELECT id, name FROM clients")) {
          return clients.find((client) => client.documentTypeId === parameters[0] && client.documentNumber === parameters[1]);
        }
        return undefined;
      },
      all: () => (query.includes("FROM shipping_quotes") ? quotes : []),
      run: (data: Record<string, unknown> | string, documentTypeId?: number, documentNumber?: string) => {
        if (query.includes("INSERT INTO clients")) {
          clients.push({ id: clientSequence, name: String(data), documentTypeId: Number(documentTypeId), documentNumber: String(documentNumber) });
          return { lastInsertRowid: clientSequence++ };
        }
        if (query.includes("INSERT INTO shipping_quotes")) {
          quotes.push({ id: quoteSequence, ...data as Record<string, unknown> });
          return { lastInsertRowid: quoteSequence++ };
        }
        return { lastInsertRowid: 0 };
      },
    }),
  };

  return { db, clients, quotes };
};

describe("createShippingQuote - reglas BR-02, BR-03 y BR-04", () => {
  let store: ReturnType<typeof createDatabase>;

  beforeEach(() => {
    store = createDatabase();
    mockedDatabase.current = store.db;
  });

  it("rechaza datos de cliente incompletos y pesos fuera de los límites", () => {
    expect(createShippingQuote({ ...baseRequest, client_name: " " }, responsible)).toMatchObject({ code: 400 });
    expect(createShippingQuote({ ...baseRequest, weight: 0.01 }, responsible)).toMatchObject({ code: 400 });
    expect(createShippingQuote({ ...baseRequest, weight: 20.01 }, responsible)).toMatchObject({ code: 400 });
  });

  it("valida que los catálogos recibidos existan", () => {
    expect(createShippingQuote({ ...baseRequest, document_type_id: 99 }, responsible)).toMatchObject({ code: 400, message: "El tipo de documento es inválido" });
    expect(createShippingQuote({ ...baseRequest, client_type_id: 99 }, responsible)).toMatchObject({ code: 400, message: "El tipo de cliente es inválido" });
    expect(createShippingQuote({ ...baseRequest, shipping_method_id: 99 }, responsible)).toMatchObject({ code: 400, message: "El tipo de envío es inválido" });
  });

  it.each([
    [1, 1, 10],
    [1, 2, 12.5],
    [2, 1, 9],
    [2, 2, 11.25],
    [3, 1, 8],
    [3, 2, 10],
  ])("calcula la regla cliente %s y envío %s", (clientTypeId, shippingMethodId, total) => {
    const response = createShippingQuote({
      ...baseRequest,
      client_identification: `ID-${clientTypeId}-${shippingMethodId}`,
      client_type_id: clientTypeId,
      shipping_method_id: shippingMethodId,
    }, responsible);

    expect(response).toMatchObject({ code: 200, data: { total, responsible: "Equipo QA" } });
  });

  it("reutiliza al cliente exacto y evita que otro nombre use su documento", () => {
    const first = createShippingQuote(baseRequest, responsible);
    const second = createShippingQuote({ ...baseRequest, weight: 20 }, responsible);
    const conflicting = createShippingQuote({ ...baseRequest, client_name: "Otro nombre" }, responsible);

    expect(first).toMatchObject({ code: 200 });
    expect(second).toMatchObject({ code: 200 });
    expect(store.clients).toHaveLength(1);
    expect(store.quotes).toHaveLength(2);
    expect(conflicting).toMatchObject({ code: 409 });
  });

  it("lista el historial de cotizaciones ordenado desde la consulta", () => {
    createShippingQuote(baseRequest, responsible);

    expect(getShippingQuotes()).toHaveLength(1);
  });
});

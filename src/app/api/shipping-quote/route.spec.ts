import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: number; username: string; name: string } | null,
  quotes: [] as unknown[],
  failure: false,
  createResponse: { code: 200, message: "ok", data: { id: 1 } } as { code: number; message: string; data: unknown },
}));

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: async () => mocks.user,
}));

vi.mock("./shipping-quote.service", () => ({
  getShippingQuotes: () => {
    if (mocks.failure) throw new Error("database unavailable");
    return mocks.quotes;
  },
  createShippingQuote: () => {
    if (mocks.failure) throw new Error("database unavailable");
    return mocks.createResponse;
  },
}));

import { GET, POST } from "./route";

const responseBody = async (response: Response) => response.json() as Promise<{ code: number; error: boolean; data: unknown }>;

describe("API /api/shipping-quote", () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.quotes = [];
    mocks.failure = false;
    mocks.createResponse = { code: 200, message: "ok", data: { id: 1 } };
  });

  it("protege la consulta cuando no hay sesión", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(responseBody(response)).resolves.toMatchObject({ code: 401, error: true });
  });

  it("devuelve el historial cuando hay sesión", async () => {
    mocks.user = { id: 1, username: "qa", name: "QA" };
    mocks.quotes = [{ id: 1 }];

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(responseBody(response)).resolves.toMatchObject({ code: 200, error: false, data: [{ id: 1 }] });
  });

  it("informa error controlado si falla la consulta", async () => {
    mocks.user = { id: 1, username: "qa", name: "QA" };
    mocks.failure = true;

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(responseBody(response)).resolves.toMatchObject({ code: 500, error: true, data: [] });
  });

  it("protege la creación cuando no hay sesión", async () => {
    const response = await POST(new Request("http://localhost/api/shipping-quote", { method: "POST", body: "{}" }));

    expect(response.status).toBe(401);
  });

  it("crea una cotización autenticada y conserva el código del servicio", async () => {
    mocks.user = { id: 1, username: "qa", name: "QA" };
    mocks.createResponse = { code: 400, message: "Peso inválido", data: null };

    const response = await POST(new Request("http://localhost/api/shipping-quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weight: 30 }),
    }));

    expect(response.status).toBe(400);
    await expect(responseBody(response)).resolves.toMatchObject({ code: 400, error: true });
  });

  it("maneja JSON inválido y errores internos en la creación", async () => {
    mocks.user = { id: 1, username: "qa", name: "QA" };
    const invalidJsonResponse = await POST(new Request("http://localhost/api/shipping-quote", { method: "POST", body: "{" }));
    expect(invalidJsonResponse.status).toBe(500);

    mocks.failure = true;
    const errorResponse = await POST(new Request("http://localhost/api/shipping-quote", { method: "POST", body: "{}" }));
    expect(errorResponse.status).toBe(500);
  });
});

import { vi } from "vitest";

type RouteHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export const textResponse = (body: string, status = 200) => new Response(body, { status });

/**
 * Instala um fetch falso roteado por "MÉTODO caminho".
 * Ex.: { "GET /api/clientes": () => jsonResponse([]) }
 * A chave pode terminar com "*" para casar prefixos.
 */
export const mockFetch = (routes: Record<string, RouteHandler>) => {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const { pathname } = new URL(url);
    const key = `${method} ${pathname}`;

    const handler =
      routes[key] ??
      Object.entries(routes).find(([k]) => k.endsWith("*") && key.startsWith(k.slice(0, -1)))?.[1];

    if (!handler) throw new Error(`Rota não mockada: ${key}`);
    return handler(url, init);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
};

/** Data local YYYY-MM-DD deslocada N dias a partir de hoje. */
export const ymdOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

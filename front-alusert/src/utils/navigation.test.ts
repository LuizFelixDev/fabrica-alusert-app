import { describe, it, expect, vi } from "vitest";
import { PAGES, isValidPage, loadSessionUser, safeStorageGet, safeStorageRemove, safeStorageSet } from "./navigation";

const brokenStorage = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); }
} as unknown as Storage;

describe("isValidPage", () => {
  it("aceita todas as páginas do menu", () => {
    PAGES.forEach((p) => expect(isValidPage(p)).toBe(true));
  });

  it.each(["", "home", "Admin", null, undefined, 42])("rejeita %j", (p) => {
    expect(isValidPage(p)).toBe(false);
  });
});

describe("loadSessionUser", () => {
  it("retorna o usuário salvo", () => {
    localStorage.setItem("user", JSON.stringify({ id: 1, nome: "A", email: "a@a" }));
    expect(loadSessionUser()).toEqual({ id: 1, nome: "A", email: "a@a" });
  });

  it("retorna null sem sessão", () => {
    expect(loadSessionUser()).toBeNull();
  });

  it.each(["{x", "null", "123", JSON.stringify({ nome: "sem id" })])("descarta sessão inválida %s", (raw) => {
    localStorage.setItem("user", raw);
    expect(loadSessionUser()).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("não lança com storage bloqueado", () => {
    expect(loadSessionUser(brokenStorage)).toBeNull();
  });
});

describe("safeStorage*", () => {
  it("lê, grava e remove normalmente", () => {
    safeStorageSet("k", "v");
    expect(safeStorageGet("k")).toBe("v");
    safeStorageRemove("k");
    expect(safeStorageGet("k")).toBeNull();
  });

  it("não lança com storage bloqueado", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(safeStorageGet("k", brokenStorage)).toBeNull();
    expect(() => safeStorageSet("k", "v", brokenStorage)).not.toThrow();
    expect(() => safeStorageRemove("k", brokenStorage)).not.toThrow();
  });
});

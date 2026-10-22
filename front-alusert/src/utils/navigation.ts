// Rotas internas do menu e helpers de sessão tolerantes a falhas.

export const PAGES = [
  "Home",
  "Produtos",
  "Vendas",
  "Clientes",
  "MateriasPrimas",
  "Relatorios",
  "Usuarios"
] as const;

export type PageName = (typeof PAGES)[number];

export const isValidPage = (page: unknown): page is PageName =>
  typeof page === "string" && (PAGES as readonly string[]).includes(page);

export interface SessionUser {
  id: number;
  nome: string;
  email: string;
}

/** Lê o usuário salvo; se o JSON estiver corrompido/incompleto, limpa a sessão em vez de quebrar o app. */
export const loadSessionUser = (storage: Storage = localStorage): SessionUser | null => {
  try {
    const raw = storage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id != null && typeof parsed.nome === "string") {
      return parsed as SessionUser;
    }
  } catch {
    // JSON inválido: cai no descarte abaixo
  }
  try {
    storage.removeItem("user");
  } catch {
    /* storage indisponível */
  }
  return null;
};

export const safeStorageGet = (key: string, storage: Storage = localStorage): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const safeStorageSet = (key: string, value: string, storage: Storage = localStorage): void => {
  try {
    storage.setItem(key, value);
  } catch (err) {
    console.error(`Falha ao salvar "${key}":`, err);
  }
};

export const safeStorageRemove = (key: string, storage: Storage = localStorage): void => {
  try {
    storage.removeItem(key);
  } catch (err) {
    console.error(`Falha ao remover "${key}":`, err);
  }
};

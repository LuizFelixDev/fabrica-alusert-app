// Regras de negócio puras do módulo de cheques (sem React), para facilitar testes.

export interface ChequePagar {
  id: string;
  favorecido: string;
  numero: string;
  banco: string;
  valor: number;
  data_pagamento: string; // YYYY-MM-DD
  observacao?: string;
  pago: boolean;
}

export interface ChequeReceber {
  id: number;
  cliente: string;
  valor: number;
  data_venda: string | null;
  vencimento: string | null;
  compensado: boolean;
  diff: number | null;
}

export type FiltroStatus = "pendentes" | "quitados" | "todos";

export type DueClass = "ok" | "neutral" | "late" | "today" | "soon" | "future";

export const STORAGE_PAGAR = "alusert_cheques_pagar";
export const STORAGE_RECEBIDOS = "alusert_cheques_recebidos";

const pad = (n: number) => String(n).padStart(2, "0");

/** Data local (não UTC) no formato YYYY-MM-DD. */
export const todayYMD = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/** Normaliza qualquer data (ISO, Date, string) para YYYY-MM-DD. Retorna null se inválida. */
export const toYMD = (val: unknown): string | null => {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : todayYMD(val);
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().substring(0, 10);
};

/** Diferença em dias entre a data informada e hoje (negativo = vencido). */
export const daysUntil = (ymd: string | null, now: Date = new Date()): number | null => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if ([y, m, d].some((n) => !Number.isFinite(n))) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export const formatDateBR = (ymd: string | null): string => {
  if (!ymd) return "Sem data";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return "Sem data";
  return `${d}/${m}/${y}`;
};

export const getDueInfo = (
  ymd: string | null,
  quitado: boolean,
  quitadoLabel: string,
  now: Date = new Date()
): { cls: DueClass; label: string } => {
  if (quitado) return { cls: "ok", label: quitadoLabel };
  const diff = daysUntil(ymd, now);
  if (diff === null) return { cls: "neutral", label: "SEM DATA" };
  if (diff < 0) {
    const abs = Math.abs(diff);
    return { cls: "late", label: `VENCIDO HÁ ${abs} ${abs === 1 ? "DIA" : "DIAS"}` };
  }
  if (diff === 0) return { cls: "today", label: "VENCE HOJE" };
  if (diff <= 7) return { cls: "soon", label: `VENCE EM ${diff} ${diff === 1 ? "DIA" : "DIAS"}` };
  return { cls: "future", label: `EM ${diff} DIAS` };
};

/** Deriva os cheques a receber a partir das vendas pagas com cheque (ignora canceladas). */
export const buildChequesReceber = (
  sales: unknown,
  recebidos: number[],
  now: Date = new Date()
): ChequeReceber[] => {
  if (!Array.isArray(sales)) return [];
  return sales
    .filter((s) => s && s.forma_pagamento === "Cheque" && s.status !== "cancelada")
    .map((s) => {
      const vencimento = toYMD(s.data_vencimento_cheque);
      const valor = Number(s.valor_total);
      return {
        id: s.id as number,
        cliente: s.nome_cliente || "Cliente",
        valor: Number.isFinite(valor) ? valor : 0,
        data_venda: toYMD(s.data_venda),
        vencimento,
        compensado: recebidos.includes(s.id),
        diff: daysUntil(vencimento, now)
      };
    })
    .sort((a, b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));
};

export const filtrarPorStatus = <T>(lista: T[], filtro: FiltroStatus, isQuitado: (item: T) => boolean): T[] =>
  lista.filter((c) => (filtro === "todos" ? true : filtro === "pendentes" ? !isQuitado(c) : isQuitado(c)));

export const somarValores = (lista: { valor: number }[]): number =>
  lista.reduce((acc, c) => acc + (Number.isFinite(c.valor) ? c.valor : 0), 0);

/** Separa vencidos e próximos 7 dias de uma lista de pendentes. */
export const resumoVencimentos = <T>(pendentes: T[], getDiff: (item: T) => number | null) => ({
  vencidos: pendentes.filter((c) => {
    const d = getDiff(c);
    return d !== null && d < 0;
  }),
  proximos: pendentes.filter((c) => {
    const d = getDiff(c);
    return d !== null && d >= 0 && d <= 7;
  })
});

export interface NovoChequeInput {
  favorecido: string;
  numero: string;
  banco: string;
  valor: string;
  data: string;
  observacao: string;
}

/** Valida o formulário de cheque a pagar. Retorna mensagem de erro ou null. */
export const validarChequePagar = (input: NovoChequeInput): string | null => {
  if (!input.favorecido.trim()) return "Informe o favorecido do cheque.";
  const valor = parseFloat(String(input.valor).replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return "Informe um valor maior que zero.";
  if (!input.data || daysUntil(input.data) === null) return "Informe uma data de pagamento válida.";
  return null;
};

export const criarChequePagar = (input: NovoChequeInput, id: string = `chq-${Date.now()}`): ChequePagar => ({
  id,
  favorecido: input.favorecido.trim(),
  numero: input.numero.trim(),
  banco: input.banco.trim(),
  valor: Math.round(parseFloat(String(input.valor).replace(",", ".")) * 100) / 100,
  data_pagamento: input.data,
  observacao: input.observacao.trim() || undefined,
  pago: false
});

const isChequePagar = (c: any): c is ChequePagar =>
  c &&
  typeof c === "object" &&
  typeof c.id === "string" &&
  typeof c.favorecido === "string" &&
  typeof c.data_pagamento === "string" &&
  Number.isFinite(Number(c.valor));

/** Lê do localStorage tolerando JSON corrompido ou formato inesperado. */
export const loadChequesPagar = (storage: Storage = localStorage): ChequePagar[] => {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_PAGAR) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChequePagar).map((c) => ({
      ...c,
      numero: c.numero ?? "",
      banco: c.banco ?? "",
      valor: Number(c.valor),
      pago: Boolean(c.pago)
    }));
  } catch {
    return [];
  }
};

export const loadRecebidos = (storage: Storage = localStorage): number[] => {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_RECEBIDOS) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
};

/** Persiste sem quebrar a tela se o storage estiver cheio/bloqueado. */
export const safeSave = (key: string, value: unknown, storage: Storage = localStorage): boolean => {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Falha ao salvar ${key} no armazenamento local:`, err);
    return false;
  }
};

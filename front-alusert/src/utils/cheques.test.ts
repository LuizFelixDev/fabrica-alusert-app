import { describe, it, expect, vi } from "vitest";
import {
  STORAGE_PAGAR,
  STORAGE_RECEBIDOS,
  buildChequesReceber,
  criarChequePagar,
  daysUntil,
  filtrarPorStatus,
  formatDateBR,
  getDueInfo,
  loadChequesPagar,
  loadRecebidos,
  resumoVencimentos,
  safeSave,
  somarValores,
  toYMD,
  todayYMD,
  validarChequePagar,
  type NovoChequeInput
} from "./cheques";

// "Hoje" fixo para os testes: 15/03/2025 às 10h (horário local)
const NOW = new Date(2025, 2, 15, 10, 0, 0);

describe("toYMD", () => {
  it("retorna null para valores vazios", () => {
    expect(toYMD(null)).toBeNull();
    expect(toYMD(undefined)).toBeNull();
    expect(toYMD("")).toBeNull();
  });

  it("mantém strings já em YYYY-MM-DD e corta o horário de ISO", () => {
    expect(toYMD("2025-03-20")).toBe("2025-03-20");
    expect(toYMD("2025-03-20T23:59:59.000Z")).toBe("2025-03-20");
  });

  it("converte objetos Date usando a data local", () => {
    expect(toYMD(new Date(2025, 0, 5, 23, 30))).toBe("2025-01-05");
  });

  it("retorna null para datas inválidas", () => {
    expect(toYMD("não é data")).toBeNull();
    expect(toYMD(new Date("invalid"))).toBeNull();
  });
});

describe("todayYMD", () => {
  it("formata com zero à esquerda", () => {
    expect(todayYMD(new Date(2025, 0, 9))).toBe("2025-01-09");
  });
});

describe("daysUntil", () => {
  it("calcula dias futuros, passados e hoje", () => {
    expect(daysUntil("2025-03-15", NOW)).toBe(0);
    expect(daysUntil("2025-03-22", NOW)).toBe(7);
    expect(daysUntil("2025-03-10", NOW)).toBe(-5);
  });

  it("atravessa virada de mês/ano", () => {
    expect(daysUntil("2025-04-01", NOW)).toBe(17);
    expect(daysUntil("2024-12-31", NOW)).toBe(-74);
  });

  it("retorna null para entrada vazia ou malformada", () => {
    expect(daysUntil(null, NOW)).toBeNull();
    expect(daysUntil("abc", NOW)).toBeNull();
  });
});

describe("formatDateBR", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatDateBR("2025-03-05")).toBe("05/03/2025");
  });

  it("exibe 'Sem data' para nulo ou malformado", () => {
    expect(formatDateBR(null)).toBe("Sem data");
    expect(formatDateBR("2025")).toBe("Sem data");
  });
});

describe("getDueInfo", () => {
  it("prioriza o status quitado", () => {
    expect(getDueInfo("2020-01-01", true, "PAGO", NOW)).toEqual({ cls: "ok", label: "PAGO" });
  });

  it("classifica sem data", () => {
    expect(getDueInfo(null, false, "PAGO", NOW)).toEqual({ cls: "neutral", label: "SEM DATA" });
  });

  it("classifica vencido no singular e plural", () => {
    expect(getDueInfo("2025-03-14", false, "PAGO", NOW)).toEqual({ cls: "late", label: "VENCIDO HÁ 1 DIA" });
    expect(getDueInfo("2025-03-12", false, "PAGO", NOW)).toEqual({ cls: "late", label: "VENCIDO HÁ 3 DIAS" });
  });

  it("classifica vence hoje", () => {
    expect(getDueInfo("2025-03-15", false, "PAGO", NOW)).toEqual({ cls: "today", label: "VENCE HOJE" });
  });

  it("classifica próximos 7 dias (limite incluso)", () => {
    expect(getDueInfo("2025-03-16", false, "PAGO", NOW)).toEqual({ cls: "soon", label: "VENCE EM 1 DIA" });
    expect(getDueInfo("2025-03-22", false, "PAGO", NOW)).toEqual({ cls: "soon", label: "VENCE EM 7 DIAS" });
  });

  it("classifica futuro após 7 dias", () => {
    expect(getDueInfo("2025-03-23", false, "PAGO", NOW)).toEqual({ cls: "future", label: "EM 8 DIAS" });
  });
});

describe("buildChequesReceber", () => {
  const sales = [
    { id: 1, forma_pagamento: "Cheque", status: "concluída", nome_cliente: "Ana", valor_total: "150.50", data_venda: "2025-03-01T12:00:00Z", data_vencimento_cheque: "2025-03-20" },
    { id: 2, forma_pagamento: "Pix", status: "concluída", valor_total: 999 },
    { id: 3, forma_pagamento: "Cheque", status: "cancelada", valor_total: 50, data_vencimento_cheque: "2025-03-16" },
    { id: 4, forma_pagamento: "Cheque", status: "pendente", valor_total: null, data_vencimento_cheque: "2025-03-10" },
    { id: 5, forma_pagamento: "Cheque", status: "pendente", valor_total: "abc" }
  ];

  it("considera somente vendas em cheque não canceladas", () => {
    const ids = buildChequesReceber(sales, [], NOW).map((c) => c.id);
    expect(ids).toEqual([4, 1, 5]);
  });

  it("ordena por vencimento deixando 'sem data' por último", () => {
    const lista = buildChequesReceber(sales, [], NOW);
    expect(lista.map((c) => c.vencimento)).toEqual(["2025-03-10", "2025-03-20", null]);
  });

  it("normaliza valores, nome padrão e calcula diff", () => {
    const [c4, c1, c5] = buildChequesReceber(sales, [], NOW);
    expect(c1).toMatchObject({ cliente: "Ana", valor: 150.5, data_venda: "2025-03-01", diff: 5 });
    expect(c4).toMatchObject({ cliente: "Cliente", valor: 0, diff: -5 });
    expect(c5).toMatchObject({ valor: 0, vencimento: null, diff: null });
  });

  it("marca como compensado os ids recebidos", () => {
    const lista = buildChequesReceber(sales, [1], NOW);
    expect(lista.find((c) => c.id === 1)?.compensado).toBe(true);
    expect(lista.find((c) => c.id === 4)?.compensado).toBe(false);
  });

  it("tolera entrada que não é array ou itens nulos", () => {
    expect(buildChequesReceber(null, [], NOW)).toEqual([]);
    expect(buildChequesReceber({} as any, [], NOW)).toEqual([]);
    expect(buildChequesReceber([null, undefined], [], NOW)).toEqual([]);
  });
});

describe("filtrarPorStatus / somarValores / resumoVencimentos", () => {
  const itens = [
    { id: "a", valor: 100, pago: false, diff: -2 },
    { id: "b", valor: 50.25, pago: true, diff: 3 },
    { id: "c", valor: 10, pago: false, diff: 7 },
    { id: "d", valor: 1, pago: false, diff: 8 },
    { id: "e", valor: 2, pago: false, diff: null }
  ];

  it("filtra pendentes, quitados e todos", () => {
    expect(filtrarPorStatus(itens, "pendentes", (c) => c.pago).map((c) => c.id)).toEqual(["a", "c", "d", "e"]);
    expect(filtrarPorStatus(itens, "quitados", (c) => c.pago).map((c) => c.id)).toEqual(["b"]);
    expect(filtrarPorStatus(itens, "todos", (c) => c.pago)).toHaveLength(5);
  });

  it("soma valores ignorando NaN", () => {
    expect(somarValores(itens)).toBeCloseTo(163.25);
    expect(somarValores([{ valor: NaN }, { valor: 5 }])).toBe(5);
    expect(somarValores([])).toBe(0);
  });

  it("separa vencidos e próximos 7 dias, ignorando sem data", () => {
    const { vencidos, proximos } = resumoVencimentos(itens, (c) => c.diff);
    expect(vencidos.map((c) => c.id)).toEqual(["a"]);
    expect(proximos.map((c) => c.id)).toEqual(["b", "c"]);
  });
});

describe("validarChequePagar / criarChequePagar", () => {
  const base: NovoChequeInput = {
    favorecido: "Fornecedor X",
    numero: " 000123 ",
    banco: " BB ",
    valor: "250.40",
    data: "2025-04-10",
    observacao: "  "
  };

  it("aceita entrada válida", () => {
    expect(validarChequePagar(base)).toBeNull();
  });

  it("exige favorecido não vazio", () => {
    expect(validarChequePagar({ ...base, favorecido: "   " })).toMatch(/favorecido/i);
  });

  it.each(["", "0", "-10", "abc"])("rejeita valor inválido %j", (valor) => {
    expect(validarChequePagar({ ...base, valor })).toMatch(/valor/i);
  });

  it("aceita vírgula como separador decimal", () => {
    expect(validarChequePagar({ ...base, valor: "12,50" })).toBeNull();
    expect(criarChequePagar({ ...base, valor: "12,50" }, "x").valor).toBe(12.5);
  });

  it("exige data válida", () => {
    expect(validarChequePagar({ ...base, data: "" })).toMatch(/data/i);
    expect(validarChequePagar({ ...base, data: "xx" })).toMatch(/data/i);
  });

  it("cria o cheque com campos aparados, pendente e sem observação vazia", () => {
    expect(criarChequePagar(base, "chq-1")).toEqual({
      id: "chq-1",
      favorecido: "Fornecedor X",
      numero: "000123",
      banco: "BB",
      valor: 250.4,
      data_pagamento: "2025-04-10",
      observacao: undefined,
      pago: false
    });
  });

  it("arredonda o valor para centavos", () => {
    expect(criarChequePagar({ ...base, valor: "10.006" }, "x").valor).toBe(10.01);
  });
});

describe("persistência (localStorage)", () => {
  it("retorna lista vazia quando não há nada salvo", () => {
    expect(loadChequesPagar()).toEqual([]);
    expect(loadRecebidos()).toEqual([]);
  });

  it("tolera JSON corrompido", () => {
    localStorage.setItem(STORAGE_PAGAR, "{quebrado");
    localStorage.setItem(STORAGE_RECEBIDOS, "[1,");
    expect(loadChequesPagar()).toEqual([]);
    expect(loadRecebidos()).toEqual([]);
  });

  it("tolera formato inesperado (objeto em vez de array)", () => {
    localStorage.setItem(STORAGE_PAGAR, JSON.stringify({ a: 1 }));
    localStorage.setItem(STORAGE_RECEBIDOS, JSON.stringify("x"));
    expect(loadChequesPagar()).toEqual([]);
    expect(loadRecebidos()).toEqual([]);
  });

  it("descarta itens inválidos e normaliza os válidos", () => {
    localStorage.setItem(
      STORAGE_PAGAR,
      JSON.stringify([
        { id: "ok", favorecido: "F", data_pagamento: "2025-01-01", valor: "10" },
        { id: 2, favorecido: "id numérico", data_pagamento: "2025-01-01", valor: 1 },
        { id: "sem-valor", favorecido: "F", data_pagamento: "2025-01-01", valor: "x" },
        null
      ])
    );
    localStorage.setItem(STORAGE_RECEBIDOS, JSON.stringify([1, "2", 3]));

    expect(loadChequesPagar()).toEqual([
      { id: "ok", favorecido: "F", data_pagamento: "2025-01-01", valor: 10, numero: "", banco: "", pago: false }
    ]);
    expect(loadRecebidos()).toEqual([1, 3]);
  });

  it("safeSave grava JSON e retorna true", () => {
    expect(safeSave("k", [1, 2])).toBe(true);
    expect(localStorage.getItem("k")).toBe("[1,2]");
  });

  it("safeSave não lança quando o storage está cheio", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const storage = { setItem: () => { throw new DOMException("QuotaExceededError"); } } as unknown as Storage;
    expect(safeSave("k", [1], storage)).toBe(false);
    expect(err).toHaveBeenCalled();
  });
});

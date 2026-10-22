import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChequesDashboard from "./ChequesDashboard";
import { STORAGE_PAGAR, STORAGE_RECEBIDOS, type ChequePagar } from "../../utils/cheques";
import { ymdOffset } from "../../test/helpers";

const formatMoney = (v: number) => `R$ ${v.toFixed(2)}`;

const vendas = [
  { id: 10, forma_pagamento: "Cheque", status: "concluída", nome_cliente: "Serralheria Ana", valor_total: "300", data_venda: ymdOffset(-20), data_vencimento_cheque: ymdOffset(-2) },
  { id: 11, forma_pagamento: "Cheque", status: "pendente", nome_cliente: "Vidraçaria Beto", valor_total: 120, data_venda: ymdOffset(-1), data_vencimento_cheque: ymdOffset(3) },
  { id: 12, forma_pagamento: "Cheque", status: "pendente", nome_cliente: "Obra Carla", valor_total: 80, data_venda: ymdOffset(-1), data_vencimento_cheque: ymdOffset(30) },
  { id: 13, forma_pagamento: "Cheque", status: "cancelada", nome_cliente: "Cancelado SA", valor_total: 999, data_vencimento_cheque: ymdOffset(1) },
  { id: 14, forma_pagamento: "Dinheiro", status: "concluída", nome_cliente: "Dinheiro LTDA", valor_total: 50 }
];

const getPanel = (heading: string) => screen.getByText(heading).closest(".cheque-panel") as HTMLElement;

const kpiValue = (panel: HTMLElement, label: string) =>
  within(panel).getByText(label).parentElement!.querySelector(".cheque-kpi-value")!.textContent;

const savedPagar = (): ChequePagar[] => JSON.parse(localStorage.getItem(STORAGE_PAGAR) || "[]");

const openForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /cadastrar cheque/i }));
  return screen.getByText("Cadastrar Cheque a Pagar").closest(".modal-card") as HTMLElement;
};

describe("ChequesDashboard – cheques a receber", () => {
  it("lista apenas vendas em cheque não canceladas, ordenadas por vencimento", () => {
    render(<ChequesDashboard sales={vendas} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A RECEBER");

    const titles = within(panel).getAllByText(/Serralheria|Vidraçaria|Obra|Cancelado|Dinheiro/).map((el) => el.textContent);
    expect(titles).toEqual(["Serralheria Ana", "Vidraçaria Beto", "Obra Carla"]);
    expect(within(panel).getByText("3 PENDENTES")).toBeInTheDocument();
  });

  it("calcula os KPIs de total, vencidos e próximos 7 dias", () => {
    render(<ChequesDashboard sales={vendas} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A RECEBER");

    expect(kpiValue(panel, "A RECEBER")).toBe("R$ 500.00");
    expect(kpiValue(panel, "VENCIDOS")).toBe("1 · R$ 300.00");
    expect(kpiValue(panel, "PRÓXIMOS 7 DIAS")).toBe("1 · R$ 120.00");
    expect(within(panel).getByText("VENCIDO HÁ 2 DIAS")).toBeInTheDocument();
    expect(within(panel).getByText("VENCE EM 3 DIAS")).toBeInTheDocument();
    expect(within(panel).getByText("EM 30 DIAS")).toBeInTheDocument();
  });

  it("marca como compensado, persiste e permite desfazer pelo filtro", async () => {
    const user = userEvent.setup();
    render(<ChequesDashboard sales={vendas} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A RECEBER");

    const row = within(panel).getByText("Serralheria Ana").closest(".cheque-row") as HTMLElement;
    await user.click(within(row).getByTitle("Marcar como compensado"));

    expect(within(panel).queryByText("Serralheria Ana")).not.toBeInTheDocument();
    expect(kpiValue(panel, "A RECEBER")).toBe("R$ 200.00");
    expect(JSON.parse(localStorage.getItem(STORAGE_RECEBIDOS)!)).toEqual([10]);

    await user.click(within(panel).getByRole("button", { name: "Compensados" }));
    const compensado = within(panel).getByText("Serralheria Ana").closest(".cheque-row") as HTMLElement;
    expect(within(compensado).getByText("COMPENSADO")).toBeInTheDocument();

    await user.click(within(compensado).getByTitle("Desfazer compensação"));
    expect(within(panel).getByText("Nenhum cheque a receber nesta visão.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_RECEBIDOS)!)).toEqual([]);
  });

  it("restaura compensados salvos ao remontar", () => {
    localStorage.setItem(STORAGE_RECEBIDOS, JSON.stringify([11]));
    render(<ChequesDashboard sales={vendas} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A RECEBER");
    expect(within(panel).getByText("2 PENDENTES")).toBeInTheDocument();
    expect(within(panel).queryByText("Vidraçaria Beto")).not.toBeInTheDocument();
  });

  it("mostra estado vazio quando não há vendas em cheque", () => {
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    expect(screen.getByText("Nenhum cheque a receber nesta visão.")).toBeInTheDocument();
  });
});

describe("ChequesDashboard – cheques a pagar", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("cadastra um cheque, exibe na lista e persiste no localStorage", async () => {
    const user = userEvent.setup();
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    const modal = await openForm(user);

    await user.type(within(modal).getByPlaceholderText("Ex: Fornecedor de alumínio"), "  Alumínios Norte  ");
    await user.type(within(modal).getByPlaceholderText("000123"), "4567");
    await user.type(within(modal).getByPlaceholderText("Ex: Banco do Brasil"), "Caixa");
    await user.type(within(modal).getByPlaceholderText("0.00"), "1500.75");
    fireEvent.change(modal.querySelector("#cheque-pagar-data")!, { target: { value: ymdOffset(5) } });
    await user.type(within(modal).getByPlaceholderText("Opcional"), "Lote de perfis");
    await user.click(within(modal).getByRole("button", { name: /salvar cheque/i }));

    expect(screen.queryByText("Cadastrar Cheque a Pagar")).not.toBeInTheDocument();

    const panel = getPanel("CHEQUES A PAGAR");
    const row = within(panel).getByText("Alumínios Norte").closest(".cheque-row") as HTMLElement;
    expect(within(row).getByText("Nº 4567 · Caixa · Lote de perfis")).toBeInTheDocument();
    expect(within(row).getByText("VENCE EM 5 DIAS")).toBeInTheDocument();
    expect(kpiValue(panel, "A PAGAR")).toBe("R$ 1500.75");
    expect(kpiValue(panel, "PRÓXIMOS 7 DIAS")).toBe("1 · R$ 1500.75");

    expect(savedPagar()).toEqual([
      expect.objectContaining({ favorecido: "Alumínios Norte", numero: "4567", banco: "Caixa", valor: 1500.75, pago: false })
    ]);
  });

  it("exibe erro de validação e não salva com favorecido em branco", async () => {
    const user = userEvent.setup();
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    const modal = await openForm(user);

    await user.type(within(modal).getByPlaceholderText("Ex: Fornecedor de alumínio"), "   ");
    await user.type(within(modal).getByPlaceholderText("0.00"), "100");
    fireEvent.submit(modal.querySelector("form")!);

    expect(within(modal).getByRole("alert")).toHaveTextContent("Informe o favorecido do cheque.");
    expect(savedPagar()).toEqual([]);
  });

  it("exibe erro para valor zero e limpa o erro ao cancelar", async () => {
    const user = userEvent.setup();
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    let modal = await openForm(user);

    await user.type(within(modal).getByPlaceholderText("Ex: Fornecedor de alumínio"), "Fornecedor");
    await user.type(within(modal).getByPlaceholderText("0.00"), "0");
    fireEvent.submit(modal.querySelector("form")!);
    expect(within(modal).getByRole("alert")).toHaveTextContent("Informe um valor maior que zero.");

    await user.click(within(modal).getByRole("button", { name: "CANCELAR" }));
    modal = await openForm(user);
    expect(within(modal).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(modal).getByPlaceholderText("Ex: Fornecedor de alumínio")).toHaveValue("");
  });

  it("marca como pago, filtra e desfaz", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      STORAGE_PAGAR,
      JSON.stringify([
        { id: "a", favorecido: "Atrasado SA", numero: "", banco: "", valor: 200, data_pagamento: ymdOffset(-1), pago: false },
        { id: "b", favorecido: "Futuro ME", numero: "9", banco: "", valor: 50, data_pagamento: ymdOffset(20), pago: false }
      ])
    );
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A PAGAR");

    expect(kpiValue(panel, "ATRASADOS")).toBe("1 · R$ 200.00");
    const row = within(panel).getByText("Atrasado SA").closest(".cheque-row") as HTMLElement;
    expect(within(row).getByText("Sem número")).toBeInTheDocument();

    await user.click(within(row).getByTitle("Marcar como pago"));
    expect(within(panel).queryByText("Atrasado SA")).not.toBeInTheDocument();
    expect(kpiValue(panel, "A PAGAR")).toBe("R$ 50.00");
    expect(savedPagar().find((c) => c.id === "a")?.pago).toBe(true);

    await user.click(within(panel).getByRole("button", { name: "Pagos" }));
    expect(within(panel).getByText("PAGO")).toBeInTheDocument();
    expect(within(panel).queryByText("Futuro ME")).not.toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Todos" }));
    expect(within(panel).getByText("Atrasado SA")).toBeInTheDocument();
    expect(within(panel).getByText("Futuro ME")).toBeInTheDocument();

    await user.click(within(panel).getByTitle("Desfazer pagamento"));
    expect(savedPagar().find((c) => c.id === "a")?.pago).toBe(false);
  });

  it("remove somente após confirmação", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    localStorage.setItem(
      STORAGE_PAGAR,
      JSON.stringify([{ id: "x", favorecido: "Remover ME", numero: "", banco: "", valor: 10, data_pagamento: ymdOffset(1), pago: false }])
    );
    render(<ChequesDashboard sales={[]} formatMoney={formatMoney} />);
    const panel = getPanel("CHEQUES A PAGAR");

    await user.click(within(panel).getByTitle("Remover cheque"));
    expect(within(panel).getByText("Remover ME")).toBeInTheDocument();

    await user.click(within(panel).getByTitle("Remover cheque"));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(within(panel).queryByText("Remover ME")).not.toBeInTheDocument();
    expect(savedPagar()).toEqual([]);
  });

  it("não quebra com localStorage corrompido", () => {
    localStorage.setItem(STORAGE_PAGAR, "{oops");
    localStorage.setItem(STORAGE_RECEBIDOS, JSON.stringify({ not: "array" }));
    render(<ChequesDashboard sales={vendas} formatMoney={formatMoney} />);
    expect(screen.getByText("Nenhum cheque a pagar nesta visão.")).toBeInTheDocument();
    expect(getPanel("CHEQUES A RECEBER")).toHaveTextContent("3 PENDENTES");
  });
});

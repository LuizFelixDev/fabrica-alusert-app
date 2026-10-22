import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Relatorios from "./Relatorios";
import { jsonResponse, mockFetch, ymdOffset } from "../../test/helpers";

/**
 * Integração Relatórios → API (fetch mockado) → ChequesDashboard.
 * Valida que as vendas carregadas do backend alimentam o painel de cheques.
 */
describe("Relatórios › Cheques (integração com API)", () => {
  const vendasApi = [
    { id: 1, forma_pagamento: "Cheque", status: "concluída", nome_cliente: "Cliente Cheque", valor_total: "450.00", data_venda: ymdOffset(-3), data_vencimento_cheque: ymdOffset(2), itens: [{ id_produto: 1, quantidade: 1, preco_unitario: 450 }] },
    { id: 2, forma_pagamento: "Pix", status: "concluída", nome_cliente: "Cliente Pix", valor_total: "100.00", data_venda: ymdOffset(-1), itens: [{ id_produto: 1, quantidade: 1, preco_unitario: 100 }] },
    // sem itens: força a busca de detalhe GET /vendas/:id
    { id: 3, forma_pagamento: "Cheque", status: "pendente", nome_cliente: "Detalhe Cheque", valor_total: "80.00", data_venda: ymdOffset(-1), data_vencimento_cheque: ymdOffset(-4) }
  ];

  const setupApi = () =>
    mockFetch({
      "GET /api/vendas": () => jsonResponse(vendasApi),
      "GET /api/produtos": () => jsonResponse([{ id: 1, nome: "Perfil", preco_venda: 100, custo_producao: 40, quantidade_estoque: 10 }]),
      "GET /api/vendas/3": () => jsonResponse({ ...vendasApi[2], itens: [{ id_produto: 1, quantidade: 1, preco_unitario: 80 }] })
    });

  it("carrega vendas da API e exibe os cheques a receber no relatório de vendas", async () => {
    const fetchMock = setupApi();
    const user = userEvent.setup();
    render(<Relatorios onBack={() => {}} />);

    await user.click(await screen.findByText("RELATÓRIO DE VENDAS"));

    const panel = (await screen.findByText("CHEQUES A RECEBER")).closest(".cheque-panel") as HTMLElement;
    expect(within(panel).getByText("Cliente Cheque")).toBeInTheDocument();
    expect(within(panel).getByText("Detalhe Cheque")).toBeInTheDocument();
    expect(within(panel).queryByText("Cliente Pix")).not.toBeInTheDocument();
    expect(within(panel).getByText("VENCIDO HÁ 4 DIAS")).toBeInTheDocument();
    expect(within(panel).getByText("2 PENDENTES")).toBeInTheDocument();

    const calledUrls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(calledUrls.some((u) => u.endsWith("/api/vendas/3"))).toBe(true);
    expect(calledUrls.some((u) => u.endsWith("/api/vendas/1"))).toBe(false);
  });

  it("cheque cadastrado no relatório sobrevive a sair e voltar da tela", async () => {
    setupApi();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    const { unmount } = render(<Relatorios onBack={() => {}} />);

    await user.click(await screen.findByText("RELATÓRIO DE VENDAS"));
    await user.click(await screen.findByRole("button", { name: /cadastrar cheque/i }));
    await user.type(screen.getByPlaceholderText("Ex: Fornecedor de alumínio"), "Fornecedor Persistente");
    await user.type(screen.getByPlaceholderText("0.00"), "99.90");
    await user.click(screen.getByRole("button", { name: /salvar cheque/i }));
    unmount();

    render(<Relatorios onBack={() => {}} />);
    await user.click(await screen.findByText("RELATÓRIO DE VENDAS"));
    const panel = (await screen.findByText("CHEQUES A PAGAR")).closest(".cheque-panel") as HTMLElement;
    expect(within(panel).getByText("Fornecedor Persistente")).toBeInTheDocument();
    expect(within(panel).getByText("VENCE HOJE")).toBeInTheDocument();
  });

  it("mostra erro e permite tentar novamente quando a API de vendas falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let falhar = true;
    mockFetch({
      "GET /api/vendas": () => (falhar ? jsonResponse({ error: "boom" }, 500) : jsonResponse(vendasApi.slice(0, 1))),
      "GET /api/produtos": () => jsonResponse([])
    });
    const user = userEvent.setup();
    render(<Relatorios onBack={() => {}} />);

    expect(await screen.findByText("Não foi possível carregar os dados financeiros.")).toBeInTheDocument();

    falhar = false;
    await user.click(screen.getByRole("button", { name: "Tentar Novamente" }));
    await user.click(await screen.findByText("RELATÓRIO DE VENDAS"));
    expect(await screen.findByText("Cliente Cheque")).toBeInTheDocument();
  });
});

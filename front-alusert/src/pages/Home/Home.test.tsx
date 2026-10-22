import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./Home";
import { jsonResponse, mockFetch, textResponse } from "../../test/helpers";

const today = new Date().toISOString();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Home – menu de acesso rápido", () => {
  it.each([
    ["menu-MateriasPrimas", "MateriasPrimas"],
    ["menu-Produtos", "Produtos"],
    ["menu-Vendas", "Vendas"],
    ["menu-Clientes", "Clientes"],
    ["menu-Relatorios", "Relatorios"],
    ["menu-Usuarios", "Usuarios"],
    ["tab-vendas", "Vendas"],
    ["tab-clientes", "Clientes"],
    ["tab-relatorios", "Relatorios"]
  ])("botão #%s navega para %s", async (id, page) => {
    mockFetch({ "GET *": () => jsonResponse([]) });
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Home onNavigate={onNavigate} />);

    await user.click(container.querySelector(`#${id}`)!);
    expect(onNavigate).toHaveBeenCalledWith(page);
  });

  it("menu continua utilizável mesmo enquanto o painel carrega ou falha", async () => {
    mockFetch({ "GET *": () => { throw new TypeError("Failed to fetch"); } });
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Home onNavigate={onNavigate} />);

    expect(await screen.findByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
    await user.click(container.querySelector("#menu-Clientes")!);
    expect(onNavigate).toHaveBeenCalledWith("Clientes");
  });

  it("erro lançado pelo callback de navegação não quebra o menu", async () => {
    mockFetch({ "GET *": () => jsonResponse([]) });
    const onNavigate = vi.fn(() => {
      throw new Error("falha na navegação");
    });
    const user = userEvent.setup();
    const { container } = render(<Home onNavigate={onNavigate} />);

    await user.click(container.querySelector("#menu-Vendas")!);
    await user.click(container.querySelector("#menu-Clientes")!);
    expect(onNavigate).toHaveBeenCalledTimes(2);
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();
  });

  it("sem onNavigate os botões não lançam erro", async () => {
    mockFetch({ "GET *": () => jsonResponse([]) });
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await user.click(container.querySelector("#menu-Produtos")!);
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();
  });
});

describe("Home – carregamento do painel", () => {
  it("falha parcial (só clientes) ainda exibe vendas e estoque", async () => {
    mockFetch({
      "GET /api/vendas": () => jsonResponse([{ id: 1, status: "concluída", valor_total: "250", data_venda: today, forma_pagamento: "Pix", id_cliente: 9 }]),
      "GET /api/materias-primas": () => jsonResponse([{ nome: "Lingote", unidade_medida: "kg", quantidade_estoque: "5", estoque_minimo: "10" }]),
      "GET /api/clientes": () => textResponse("<html>500</html>", 500)
    });
    render(<Home />);

    expect(await screen.findByText("VENDAS HOJE")).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível conectar ao servidor.")).not.toBeInTheDocument();
    expect(screen.getByText("Cliente Avulso")).toBeInTheDocument();
    expect(screen.getByText("ESTOQUE BAIXO")).toBeInTheDocument();
  });

  it("falha total mostra erro e 'Recarregar Painel' tenta de novo", async () => {
    let online = false;
    mockFetch({
      "GET *": () => {
        if (!online) throw new TypeError("Failed to fetch");
        return jsonResponse([]);
      }
    });
    const user = userEvent.setup();
    render(<Home />);

    expect(await screen.findByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
    online = true;
    await user.click(screen.getByRole("button", { name: "Recarregar Painel" }));
    expect(await screen.findByText("Nenhuma venda registrada no sistema.")).toBeInTheDocument();
  });

  it("payload inesperado (objeto/JSON inválido) não derruba o painel", async () => {
    mockFetch({
      "GET /api/vendas": () => jsonResponse({ data: [] }),
      "GET /api/materias-primas": () => textResponse("isso não é json"),
      "GET /api/clientes": () => jsonResponse(null)
    });
    render(<Home />);
    expect(await screen.findByText("Nenhuma venda registrada no sistema.")).toBeInTheDocument();
  });

  it("dados com datas e números inválidos são tolerados", async () => {
    mockFetch({
      "GET /api/vendas": () => jsonResponse([{ id: 7, status: "pendente", valor_total: null, data_venda: "data-ruim", forma_pagamento: "Cheque" }]),
      "GET /api/materias-primas": () => jsonResponse([{ nome: "X", unidade_medida: "kg", quantidade_estoque: "abc", estoque_minimo: null }]),
      "GET /api/clientes": () => jsonResponse([])
    });
    render(<Home />);
    expect(await screen.findByText(/ID: #7 · data-ruim · Cheque/)).toBeInTheDocument();
    expect(screen.queryByText("ESTOQUE BAIXO")).not.toBeInTheDocument();
  });

  it("falha no prompt de instalação PWA é tratada", async () => {
    mockFetch({ "GET *": () => jsonResponse([]) });
    const user = userEvent.setup();
    render(<Home />);

    const evt = new Event("beforeinstallprompt") as any;
    evt.prompt = () => { throw new Error("prompt indisponível"); };
    evt.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(evt);

    await user.click(await screen.findByRole("button", { name: "INSTALAR" }));
    await waitFor(() => expect(screen.queryByText("BAIXAR APLICATIVO")).not.toBeInTheDocument());
  });
});

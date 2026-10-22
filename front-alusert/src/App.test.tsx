import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { jsonResponse, mockFetch } from "./test/helpers";

// Telas internas substituídas por stubs: o foco aqui é o menu/navegação do App.
const stub = (name: string) => ({
  default: ({ onBack }: { onBack?: () => void }) => (
    <div>
      <h2>TELA {name}</h2>
      <button onClick={onBack}>voltar-{name}</button>
    </div>
  )
});
vi.mock("./pages/Vendas/Vendas", () => stub("VENDAS"));
vi.mock("./pages/Clientes/Clientes", () => stub("CLIENTES"));
vi.mock("./pages/MateriasPrimas/MateriasPrimas", () => stub("MATERIAS"));
vi.mock("./pages/Usuarios/Usuarios", () => stub("USUARIOS"));
vi.mock("./pages/Relatorios/Relatorios", () => stub("RELATORIOS"));
vi.mock("./pages/Login/Login", () => ({ default: () => <h2>TELA LOGIN</h2> }));
vi.mock("./pages/PublicCatalogo/PublicCatalogo", () => ({
  default: ({ tokenLink }: { tokenLink: string }) => <h2>CATALOGO {tokenLink}</h2>
}));
vi.mock("./components/BarcodeScanner/BarcodeScanner", () => ({
  default: () => {
    throw new Error("câmera indisponível");
  }
}));
// Produtos simula uma tela que quebra ao renderizar
const produtosState = vi.hoisted(() => ({ shouldThrow: true }));
vi.mock("./pages/Produtos/Produtos", () => ({
  default: ({ onBack }: { onBack?: () => void }) => {
    if (produtosState.shouldThrow) throw new Error("dados inválidos em Produtos");
    return (
      <div>
        <h2>TELA PRODUTOS</h2>
        <button onClick={onBack}>voltar-PRODUTOS</button>
      </div>
    );
  }
}));

const loginAs = () => localStorage.setItem("user", JSON.stringify({ id: 1, nome: "Admin", email: "a@a.com" }));

const setupApi = () =>
  mockFetch({
    "GET /api/vendas": () => jsonResponse([]),
    "GET /api/materias-primas": () => jsonResponse([]),
    "GET /api/clientes": () => jsonResponse([])
  });

beforeEach(() => {
  produtosState.shouldThrow = true;
  window.history.pushState({}, "", "/");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("App – sessão e roteamento", () => {
  it("sem sessão exibe o login", () => {
    render(<App />);
    expect(screen.getByText("TELA LOGIN")).toBeInTheDocument();
  });

  it("sessão corrompida no localStorage volta ao login e é limpa (sem crash)", () => {
    localStorage.setItem("user", "{json-quebrado");
    render(<App />);
    expect(screen.getByText("TELA LOGIN")).toBeInTheDocument();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("sessão com formato inválido também é descartada", () => {
    localStorage.setItem("user", JSON.stringify({ foo: "bar" }));
    render(<App />);
    expect(screen.getByText("TELA LOGIN")).toBeInTheDocument();
  });

  it("rota pública de catálogo não exige login", () => {
    window.history.pushState({}, "", "/c/abc123");
    render(<App />);
    expect(screen.getByText("CATALOGO abc123")).toBeInTheDocument();
  });
});

describe("App – menu", () => {
  it.each([
    ["menu-Clientes", "TELA CLIENTES"],
    ["menu-Vendas", "TELA VENDAS"],
    ["menu-MateriasPrimas", "TELA MATERIAS"],
    ["menu-Relatorios", "TELA RELATORIOS"],
    ["menu-Usuarios", "TELA USUARIOS"]
  ])("item %s abre %s e o voltar retorna ao painel", async (id, tela) => {
    loginAs();
    setupApi();
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector(`#${id}`)!);
    expect(screen.getByText(tela)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^voltar-/ }));
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();
  });

  it("tela que lança erro mostra recuperação em vez de tela branca e permite voltar ao menu", async () => {
    loginAs();
    setupApi();
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector("#menu-Produtos")!);

    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado");
    expect(screen.getByRole("alert")).toHaveTextContent("Produtos");
    // AppBar continua funcional
    expect(screen.getByTitle("Sair do Sistema")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /voltar ao menu/i }));
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();
  });

  it("'Tentar novamente' re-renderiza a tela quando o problema foi resolvido", async () => {
    loginAs();
    setupApi();
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(container.querySelector("#menu-Produtos")!);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    produtosState.shouldThrow = false;
    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(screen.getByText("TELA PRODUTOS")).toBeInTheDocument();
  });

  it("erro no leitor de código de barras não derruba o painel", async () => {
    loginAs();
    setupApi();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTitle("Escanear Código de Barras"));
    expect(screen.getByRole("alert")).toHaveTextContent("Leitor de Código de Barras");
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /voltar ao menu/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("logout cancelado mantém a sessão; confirmado limpa e volta ao login", async () => {
    loginAs();
    setupApi();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTitle("Sair do Sistema"));
    expect(screen.getByText("ACESSO RÁPIDO")).toBeInTheDocument();

    await user.click(screen.getByTitle("Sair do Sistema"));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByText("TELA LOGIN")).toBeInTheDocument();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("alternar tema funciona mesmo com localStorage bloqueado", async () => {
    loginAs();
    setupApi();
    const user = userEvent.setup();
    const { container } = render(<App />);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("bloqueado", "SecurityError");
    });
    await user.click(screen.getByTitle("Ativar Modo Escuro"));
    expect(container.querySelector(".app-container")).toHaveClass("dark-mode");
  });
});

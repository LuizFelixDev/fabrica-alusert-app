import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Clientes, { type Client } from "./Clientes";
import { jsonResponse, mockFetch, textResponse } from "../../test/helpers";

const ana: Client = {
  id: 1,
  nome: "Ana Serralheria",
  cpf_cnpj: "123.456.789-00",
  telefone: "(81) 99999-0000",
  email: "ana@email.com",
  rua: "Rua A, 10",
  bairro: "Centro",
  cidade: "Caruaru",
  estado: "PE",
  data_cadastro: "2025-01-10T12:00:00Z"
};
const beto: Client = { id: 2, nome: "Beto Vidros", cpf_cnpj: "98.765.432/0001-10", telefone: null, email: null, cidade: null, estado: null };

/** Backend em memória: GET lista (com ?busca), POST cria, PUT edita, DELETE remove. */
const setupBackend = (initial: Client[] = [ana, beto], overrides: Record<string, any> = {}) => {
  let db = [...initial];
  let nextId = 100;
  const fetchMock = mockFetch({
    "GET /api/clientes": (url) => {
      const busca = new URL(url).searchParams.get("busca")?.toLowerCase();
      return jsonResponse(busca ? db.filter((c) => c.nome.toLowerCase().includes(busca)) : db);
    },
    "POST /api/clientes": (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const novo = { id: nextId++, ...body };
      db.push(novo);
      return jsonResponse(novo, 201);
    },
    "PUT /api/clientes/*": (url, init) => {
      const id = Number(url.split("/").pop());
      const body = JSON.parse(String(init?.body));
      db = db.map((c) => (c.id === id ? { ...c, ...body } : c));
      return jsonResponse(db.find((c) => c.id === id));
    },
    "DELETE /api/clientes/*": (url) => {
      const id = Number(url.split("/").pop());
      db = db.filter((c) => c.id !== id);
      return new Response(null, { status: 204 });
    },
    ...overrides
  });
  return { fetchMock, getDb: () => db };
};

const callsTo = (fetchMock: ReturnType<typeof mockFetch>, method: string, pathPart: string) =>
  fetchMock.mock.calls.filter(
    ([u, init]) => (init?.method || "GET").toUpperCase() === method && String(u).includes(pathPart)
  );

const waitForList = () => screen.findByText(/cliente\(s\) encontrado\(s\)/);

const openNewForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /novo/i }));
  return screen.getByRole("heading", { name: "Cadastrar Cliente" }).closest("form") as HTMLFormElement;
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Clientes – listagem", () => {
  it("carrega e exibe os clientes vindos da API", async () => {
    setupBackend();
    render(<Clientes />);

    expect(screen.getByText("Carregando lista de clientes...")).toBeInTheDocument();
    expect(await screen.findByText("2 cliente(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.getByText("Ana Serralheria")).toBeInTheDocument();
    expect(screen.getByText("CPF/CNPJ: 98.765.432/0001-10")).toBeInTheDocument();
    expect(screen.getByText("📍 Caruaru - PE")).toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    setupBackend([]);
    render(<Clientes />);
    expect(await screen.findByText("Nenhum cliente cadastrado ou encontrado para a busca.")).toBeInTheDocument();
  });

  it("exibe erro de conexão e recarrega com sucesso ao tentar novamente", async () => {
    let online = false;
    mockFetch({
      "GET /api/clientes": () => {
        if (!online) throw new TypeError("Failed to fetch");
        return jsonResponse([ana]);
      }
    });
    const user = userEvent.setup();
    render(<Clientes />);

    expect(await screen.findByText(/Não foi possível carregar a lista de clientes/)).toBeInTheDocument();
    online = true;
    await user.click(screen.getByRole("button", { name: /tentar recarregar/i }));
    expect(await screen.findByText("Ana Serralheria")).toBeInTheDocument();
  });

  it("não quebra se a API devolver um objeto em vez de lista", async () => {
    mockFetch({ "GET /api/clientes": () => jsonResponse({ unexpected: true }) });
    render(<Clientes />);
    expect(await screen.findByText("0 cliente(s) encontrado(s)")).toBeInTheDocument();
  });

  it("busca com debounce: uma única requisição com o termo final", async () => {
    const { fetchMock } = setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    await user.type(screen.getByLabelText("Buscar cliente"), "beto");
    expect(await screen.findByText("1 cliente(s) encontrado(s)", {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.queryByText("Ana Serralheria")).not.toBeInTheDocument();

    const buscas = fetchMock.mock.calls.map(([u]) => new URL(String(u)).searchParams.get("busca")).filter(Boolean);
    expect(buscas).toEqual(["beto"]);
  });
});

describe("Clientes – cadastro", () => {
  it("cadastra cliente enviando o payload normalizado e atualiza a lista", async () => {
    const { fetchMock, getDb } = setupBackend([ana]);
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "  Carlos Obras  ");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), "111.222.333-44");
    await user.type(within(form).getByLabelText("TELEFONE"), "(81) 98888-1111");
    await user.type(within(form).getByLabelText("CIDADE"), "Recife");
    await user.type(within(form).getByLabelText("ESTADO (UF)"), "pe");
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Cadastrar Cliente" })).not.toBeInTheDocument());
    expect(await screen.findByText("Carlos Obras")).toBeInTheDocument();
    expect(screen.getByText("2 cliente(s) encontrado(s)")).toBeInTheDocument();

    const [post] = callsTo(fetchMock, "POST", "/api/clientes");
    expect(post[1]?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(post[1]?.body))).toEqual({
      nome: "Carlos Obras",
      cpf_cnpj: "111.222.333-44",
      telefone: "(81) 98888-1111",
      email: null,
      rua: null,
      bairro: null,
      cidade: "Recife",
      estado: "PE"
    });
    expect(getDb()).toHaveLength(2);
  });

  it("valida campos obrigatórios (somente espaços) sem chamar a API", async () => {
    const { fetchMock } = setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "   ");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), "123");
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    expect(await within(form).findByText("Os campos Nome e CPF/CNPJ são obrigatórios.")).toBeInTheDocument();
    expect(callsTo(fetchMock, "POST", "/api/clientes")).toHaveLength(0);
  });

  it("exibe a mensagem de erro do backend (ex.: CPF duplicado) e mantém o formulário aberto", async () => {
    setupBackend([ana], {
      "POST /api/clientes": () => jsonResponse({ error: "CPF/CNPJ já cadastrado" }, 409)
    });
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "Duplicado");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), ana.cpf_cnpj);
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    expect(await within(form).findByText("CPF/CNPJ já cadastrado")).toBeInTheDocument();
    expect(within(form).getByLabelText("NOME COMPLETO *")).toHaveValue("Duplicado");
    expect(within(form).getByRole("button", { name: "CADASTRAR" })).toBeEnabled();
  });

  it("trata resposta não-JSON do servidor (HTML de erro 500)", async () => {
    setupBackend([ana], {
      "POST /api/clientes": () => textResponse("<html>Internal Server Error</html>", 500)
    });
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "Novo");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), "1");
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    expect(await within(form).findByText("Erro ao salvar cliente (500)")).toBeInTheDocument();
  });

  it("trata falha de rede com mensagem amigável", async () => {
    setupBackend([ana], {
      "POST /api/clientes": () => {
        throw new TypeError("Failed to fetch");
      }
    });
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "Novo");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), "1");
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    expect(await within(form).findByText(/Não foi possível conectar ao servidor/)).toBeInTheDocument();
  });

  it("desabilita os botões e mostra SALVANDO... durante o envio", async () => {
    let resolvePost!: (r: Response) => void;
    setupBackend([ana], {
      "POST /api/clientes": () => new Promise<Response>((r) => (resolvePost = r))
    });
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "Lento");
    await user.type(within(form).getByLabelText("CPF / CNPJ *"), "1");
    await user.click(within(form).getByRole("button", { name: "CADASTRAR" }));

    expect(within(form).getByRole("button", { name: "SALVANDO..." })).toBeDisabled();
    expect(within(form).getByRole("button", { name: "CANCELAR" })).toBeDisabled();

    resolvePost(jsonResponse({ id: 9, nome: "Lento", cpf_cnpj: "1" }, 201));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Cadastrar Cliente" })).not.toBeInTheDocument());
  });

  it("cancelar fecha o formulário sem enviar", async () => {
    const { fetchMock } = setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);
    await waitForList();

    const form = await openNewForm(user);
    await user.type(within(form).getByLabelText("NOME COMPLETO *"), "Desistiu");
    await user.click(within(form).getByRole("button", { name: "CANCELAR" }));

    expect(screen.queryByRole("heading", { name: "Cadastrar Cliente" })).not.toBeInTheDocument();
    expect(callsTo(fetchMock, "POST", "/api/clientes")).toHaveLength(0);
  });
});

describe("Clientes – detalhes, edição e exclusão", () => {
  const openDetails = async (user: ReturnType<typeof userEvent.setup>, nome: string) => {
    await user.click(await screen.findByText(nome));
    return screen.getByText("Detalhes do Cliente").closest(".modal-content") as HTMLElement;
  };

  it("exibe os detalhes completos do cliente", async () => {
    setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);

    const modal = await openDetails(user, "Ana Serralheria");
    expect(within(modal).getByText("ana@email.com")).toBeInTheDocument();
    expect(within(modal).getByText("Rua A, 10, Centro, Caruaru - PE")).toBeInTheDocument();
    expect(within(modal).getByText("10/01/2025")).toBeInTheDocument();
  });

  it("edita um cliente via PUT com o formulário pré-preenchido", async () => {
    const { fetchMock } = setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);

    const modal = await openDetails(user, "Ana Serralheria");
    await user.click(within(modal).getByRole("button", { name: "EDITAR" }));

    const form = screen.getByRole("heading", { name: "Editar Cliente" }).closest("form") as HTMLFormElement;
    const nome = within(form).getByLabelText("NOME COMPLETO *");
    expect(nome).toHaveValue("Ana Serralheria");
    expect(within(form).getByLabelText("E-MAIL")).toHaveValue("ana@email.com");

    await user.clear(nome);
    await user.type(nome, "Ana Esquadrias");
    await user.click(within(form).getByRole("button", { name: "SALVAR" }));

    expect(await screen.findByText("Ana Esquadrias")).toBeInTheDocument();
    const [put] = callsTo(fetchMock, "PUT", "/api/clientes/1");
    expect(JSON.parse(String(put[1]?.body))).toMatchObject({ nome: "Ana Esquadrias", cpf_cnpj: ana.cpf_cnpj, estado: "PE" });
  });

  it("exclui somente após confirmação e atualiza a lista", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { fetchMock } = setupBackend();
    const user = userEvent.setup();
    render(<Clientes />);

    let modal = await openDetails(user, "Beto Vidros");
    await user.click(within(modal).getByRole("button", { name: "EXCLUIR" }));
    expect(callsTo(fetchMock, "DELETE", "/api/clientes/2")).toHaveLength(0);

    modal = screen.getByText("Detalhes do Cliente").closest(".modal-content") as HTMLElement;
    await user.click(within(modal).getByRole("button", { name: "EXCLUIR" }));

    await waitFor(() => expect(screen.queryByText("Beto Vidros")).not.toBeInTheDocument());
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(callsTo(fetchMock, "DELETE", "/api/clientes/2")).toHaveLength(1);
    expect(screen.getByText("1 cliente(s) encontrado(s)")).toBeInTheDocument();
  });

  it("alerta o erro do backend quando a exclusão falha", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    setupBackend(undefined, {
      "DELETE /api/clientes/*": () => jsonResponse({ error: "Cliente possui vendas vinculadas" }, 400)
    });
    const user = userEvent.setup();
    render(<Clientes />);

    const modal = await openDetails(user, "Ana Serralheria");
    await user.click(within(modal).getByRole("button", { name: "EXCLUIR" }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith("Cliente possui vendas vinculadas"));
    expect(await screen.findByText("Ana Serralheria")).toBeInTheDocument();
  });

  it("botão voltar chama onBack", async () => {
    setupBackend();
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<Clientes onBack={onBack} />);
    await user.click(screen.getByTitle("Voltar ao início"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

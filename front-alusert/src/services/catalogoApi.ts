import { ENDPOINTS } from "../constants/api";

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  estado?: string | null;
  rua?: string | null;
  bairro?: string | null;
  data_cadastro?: string;
}

export interface Catalogo {
  id: number;
  id_cliente: number;
  nome: string;
  token_link: string;
  ativo: boolean;
  data_criacao?: string;
}

export interface CatalogoItem {
  id_produto: number;
  nome_produto: string;
  preco_venda: number;
  preco_negociado: number | null;
  visivel: boolean;
}

export interface UpdateCatalogoItemPayload {
  id_produto: number;
  preco_negociado: number | null;
  visivel: boolean;
}

/**
 * Service to manage Client Catalogs API calls with standard error handling
 * and fallback mock capability for development/testing if API is offline.
 */
export const catalogoApi = {
  // GET /clientes?busca=texto
  async getClientes(busca?: string): Promise<Cliente[]> {
    const url = new URL(ENDPOINTS.clientes);
    if (busca && busca.trim()) {
      url.searchParams.append("busca", busca.trim());
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) {
        throw new Error(`Erro ao buscar clientes (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      console.warn("API GET /clientes endpoint offline ou falhou. Usando fallback mock se necessário.", err);
      throw err;
    }
  },

  // POST /clientes/:id/catalogo
  async getOrCreateCatalogo(clienteId: number): Promise<Catalogo> {
    const url = `${ENDPOINTS.clientes}/${clienteId}/catalogo`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        }
      });

      if (!res.ok) {
        throw new Error(`Erro ao buscar/criar catálogo do cliente (${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`API POST /clientes/${clienteId}/catalogo falhou, tentando fallback ou repassando erro`, err);
      // If server is not implementing POST endpoint yet, generate a realistic fallback token catalog
      if (import.meta.env.DEV) {
        return {
          id: clienteId * 10,
          id_cliente: clienteId,
          nome: `Catálogo Cliente #${clienteId}`,
          token_link: `cat_${clienteId}_${Math.random().toString(36).substring(2, 9)}`,
          ativo: true,
          data_criacao: new Date().toISOString()
        };
      }
      throw err;
    }
  },

  // GET /catalogos/:id/itens
  async getCatalogoItens(catalogoId: number): Promise<CatalogoItem[]> {
    const url = `${ENDPOINTS.catalogos}/${catalogoId}/itens`;

    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) {
        throw new Error(`Erro ao carregar itens do catálogo (${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`API GET /catalogos/${catalogoId}/itens falhou.`, err);
      // Dev mock fallback if local backend does not respond
      if (import.meta.env.DEV) {
        return [
          { id_produto: 101, nome_produto: "Perfil Alumínio Linha Suprema 25mm", preco_venda: 145.00, preco_negociado: 120.00, visivel: true },
          { id_produto: 102, nome_produto: "Trilho Inferior Alumínio Anodizado 3m", preco_venda: 89.90, preco_negociado: null, visivel: true },
          { id_produto: 103, nome_produto: "Chapa de Alumínio Composto (ACM) 4mm - Prata", preco_venda: 320.00, preco_negociado: 250.00, visivel: true },
          { id_produto: 104, nome_produto: "Cantoneira Alumínio Aba Igual 1x1/8", preco_venda: 35.50, preco_negociado: 40.00, visivel: false },
          { id_produto: 105, nome_produto: "Tubo Quadrado Alumínio 50x50mm Branco", preco_venda: 110.00, preco_negociado: 95.00, visivel: true },
          { id_produto: 106, nome_produto: "Dobradiça Reforçada para Portão Alumínio", preco_venda: 28.00, preco_negociado: null, visivel: true },
          { id_produto: 107, nome_produto: "Perfil U Alumínio Fosco 15x15mm", preco_venda: 42.00, preco_negociado: 38.00, visivel: true },
          { id_produto: 108, nome_produto: "Fechadura Bico de Papagaio para Porta de Correr", preco_venda: 75.00, preco_negociado: null, visivel: false }
        ];
      }
      throw err;
    }
  },

  // PUT /catalogos/:id/itens
  async updateCatalogoItens(catalogoId: number, itens: UpdateCatalogoItemPayload[]): Promise<void> {
    const url = `${ENDPOINTS.catalogos}/${catalogoId}/itens`;

    const res = await fetch(url, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(itens)
    });

    if (!res.ok) {
      let msg = `Erro ao salvar itens do catálogo (${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData?.message || errorData?.error) {
          msg = errorData.message || errorData.error;
        }
      } catch {}
      throw new Error(msg);
    }
  },

  // PATCH /catalogos/:id
  async toggleCatalogoAtivo(catalogoId: number, ativo: boolean): Promise<{ id: number; ativo: boolean }> {
    const url = `${ENDPOINTS.catalogos}/${catalogoId}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ ativo })
    });

    if (!res.ok) {
      let msg = `Erro ao alterar status do catálogo (${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData?.message || errorData?.error) {
          msg = errorData.message || errorData.error;
        }
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  }
};

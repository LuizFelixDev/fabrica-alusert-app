import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Send,
  Loader2,
  Tag
} from "lucide-react";
import { catalogoApi } from "../../services/catalogoApi";
import type { PublicCatalogoData, PublicCatalogoProduto } from "../../services/catalogoApi";
import "./PublicCatalogo.css";

interface PublicCatalogoProps {
  tokenLink: string;
}

interface CartItem {
  produto: PublicCatalogoProduto;
  quantidade: number;
}

export default function PublicCatalogo({ tokenLink }: PublicCatalogoProps) {
  const [catalogData, setCatalogData] = useState<PublicCatalogoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [filterText, setFilterText] = useState<string>("");

  // Cart state
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);

  // Order submission state
  const [formaPagamento, setFormaPagamento] = useState<string>("PIX");
  const [observacoes, setObservacoes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id_venda?: number; message?: string } | null>(null);

  // Added animation state map
  const [addedAnimation, setAddedAnimation] = useState<Record<number, boolean>>({});

  // Fetch catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await catalogoApi.getCatalogoPublico(tokenLink);
        setCatalogData(data);
      } catch (err: any) {
        console.error("Erro ao carregar catálogo público:", err);
        setError(err.message || "Não foi possível carregar o catálogo. Verifique o link ou entre em contato.");
      } finally {
        setLoading(false);
      }
    };

    if (tokenLink) {
      fetchCatalog();
    }
  }, [tokenLink]);

  // Quantity change in grid
  const handleUpdateQuantity = (produto: PublicCatalogoProduto, delta: number) => {
    setCart(prev => {
      const existing = prev[produto.id_produto];
      const currentQty = existing ? existing.quantidade : 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[produto.id_produto];
        return copy;
      }

      return {
        ...prev,
        [produto.id_produto]: {
          produto,
          quantidade: newQty
        }
      };
    });
  };

  // Direct add to cart
  const handleAddToCart = (produto: PublicCatalogoProduto) => {
    handleUpdateQuantity(produto, 1);
    setAddedAnimation(prev => ({ ...prev, [produto.id_produto]: true }));
    setTimeout(() => {
      setAddedAnimation(prev => ({ ...prev, [produto.id_produto]: false }));
    }, 1200);
  };

  // Filtered products list
  const filteredProdutos = useMemo(() => {
    if (!catalogData?.produtos) return [];
    if (!filterText.trim()) return catalogData.produtos;
    const q = filterText.toLowerCase().trim();
    return catalogData.produtos.filter(p => 
      p.nome.toLowerCase().includes(q) || 
      (p.categoria && p.categoria.toLowerCase().includes(q)) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
    );
  }, [catalogData, filterText]);

  // Cart summary metrics
  const cartItemsList = useMemo(() => Object.values(cart), [cart]);
  
  const cartTotalItems = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.quantidade, 0);
  }, [cartItemsList]);

  const cartTotalPrice = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + (item.quantidade * item.produto.preco), 0);
  }, [cartItemsList]);

  // Submit order handler
  const handleSubmitOrder = async () => {
    if (cartItemsList.length === 0) return;

    try {
      setSubmitting(true);
      const payload = {
        forma_pagamento: formaPagamento,
        observacoes: observacoes.trim() || undefined,
        itens: cartItemsList.map(item => ({
          id_produto: item.produto.id_produto,
          quantidade: item.quantidade,
          preco_unitario: item.produto.preco
        }))
      };

      const result = await catalogoApi.enviarPedidoPublico(tokenLink, payload);
      setOrderSuccess({
        id_venda: result.id_venda,
        message: result.message || "Pedido registrado com sucesso!"
      });
      setCart({});
      setCartModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao enviar pedido:", err);
      alert(err.message || "Erro ao registrar seu pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Calculate discount percentage
  const getDiscountPercent = (preco: number, precoPadrao: number) => {
    if (!precoPadrao || preco >= precoPadrao) return null;
    const percent = Math.round(((precoPadrao - preco) / precoPadrao) * 100);
    return percent > 0 ? percent : null;
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="public-catalogo-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <Loader2 size={40} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#f18e04" }} />
          <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !catalogData) {
    return (
      <div className="public-catalogo-container">
        <header className="public-header">
          <div className="public-header-content">
            <div className="public-brand">
              <div className="public-brand-info">
                <h1>AluSert</h1>
                <p>Fábrica de Perfis de Alumínio</p>
              </div>
            </div>
          </div>
        </header>

        <div className="error-state-box">
          <AlertCircle size={48} />
          <h2>Catálogo Indisponível</h2>
          <p>{error || "Catálogo não encontrado ou inativo."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-catalogo-container">
      {/* Header Bar */}
      <header className="public-header">
        <div className="public-header-content">
          <div className="public-brand">
            <div className="public-brand-info">
              <h1>AluSert</h1>
              <p>Catálogo Digital de Produtos</p>
            </div>
          </div>

          <div className="client-welcome-card">
            <Tag size={16} color="#f18e04" />
            <span>Exclusivo para: <strong>{catalogData.nome_cliente}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="public-main-content">
        {/* Search & Filter Toolbar */}
        <div className="public-toolbar">
          <div className="public-search-box">
            <Search size={18} className="public-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por produto, categoria ou código..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <span className="products-counter">
            Exibindo <strong>{filteredProdutos.length}</strong> de {catalogData.produtos.length} produtos
          </span>
        </div>

        {/* Empty Search Results */}
        {filteredProdutos.length === 0 && (
          <div className="empty-state-box">
            <Package size={40} style={{ color: "#94a3b8", marginBottom: "0.5rem" }} />
            <h3>Nenhum produto encontrado</h3>
            <p>Tente alterar o termo de busca para encontrar o produto desejado.</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="public-products-grid">
          {filteredProdutos.map(produto => {
            const qtyInCart = cart[produto.id_produto]?.quantidade || 0;
            const discountPercent = getDiscountPercent(produto.preco, produto.preco_padrao);
            const isAdded = addedAnimation[produto.id_produto];

            return (
              <div key={produto.id_produto} className="public-product-card">
                <div className="product-card-top">
                  <div className="product-card-badges">
                    <span className="product-category-tag">
                      {produto.categoria || "Produto"}
                    </span>
                    {discountPercent && (
                      <span className="discount-badge" title="Preço com desconto negociado">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <h3 className="product-card-name">{produto.nome}</h3>

                  <div className="product-card-meta">
                    {produto.unidade_medida && (
                      <span>Unidade: <strong>{produto.unidade_medida}</strong></span>
                    )}
                    {produto.codigo_barras && (
                      <span>Cód: {produto.codigo_barras}</span>
                    )}
                  </div>
                </div>

                <div className="product-pricing">
                  {discountPercent && (
                    <div className="price-original-struck">
                      De {formatCurrency(produto.preco_padrao)}
                    </div>
                  )}
                  <div className="price-main">
                    {formatCurrency(produto.preco)}
                    {produto.unidade_medida && (
                      <span className="price-unit">/{produto.unidade_medida}</span>
                    )}
                  </div>
                </div>

                <div className="product-card-actions">
                  <div className="qty-control-box">
                    <button 
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(produto, -1)}
                      disabled={qtyInCart === 0}
                      title="Diminuir quantidade"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{qtyInCart}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(produto, 1)}
                      title="Aumentar quantidade"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button 
                    className={`btn-add-cart ${isAdded ? "added" : ""}`}
                    onClick={() => handleAddToCart(produto)}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Adicionado</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>{qtyInCart > 0 ? "Adicionar +" : "Adicionar"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartTotalItems > 0 && (
        <div className="floating-cart-bar">
          <div className="floating-cart-inner">
            <div className="floating-cart-info">
              <div className="cart-icon-wrapper">
                <ShoppingBag size={22} color="#ffffff" />
                <span className="cart-count-badge">{cartTotalItems}</span>
              </div>
              <div className="cart-total-text">
                <span>Total do Pedido</span>
                <span>{formatCurrency(cartTotalPrice)}</span>
              </div>
            </div>

            <button className="btn-open-cart" onClick={() => setCartModalOpen(true)}>
              Ver Pedido ({cartTotalItems})
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Modal */}
      {cartModalOpen && (
        <div className="modal-overlay" onClick={() => setCartModalOpen(false)}>
          <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cart-modal-header">
              <h2>Seu Pedido ({cartTotalItems} itens)</h2>
              <button className="close-modal-btn" onClick={() => setCartModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-modal-body">
              {cartItemsList.map(item => (
                <div key={item.produto.id_produto} className="cart-item-row">
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.produto.nome}</h4>
                    <div className="cart-item-price">
                      {formatCurrency(item.produto.preco)} {item.produto.unidade_medida ? `/${item.produto.unidade_medida}` : ""}
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control-box">
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.produto, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantidade}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQuantity(item.produto, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      {formatCurrency(item.quantidade * item.produto.preco)}
                    </div>

                    <button 
                      className="btn-remove-item"
                      onClick={() => handleUpdateQuantity(item.produto, -item.quantidade)}
                      title="Remover produto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Order Form Fields */}
              <div className="order-form-section">
                <div className="form-group">
                  <label htmlFor="formaPagamento">Forma de Pagamento Preferida</label>
                  <select 
                    id="formaPagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="A Prazo">A Prazo (30 dias)</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="observacoes">Observações ou Instruções para Entrega</label>
                  <textarea 
                    id="observacoes"
                    rows={3}
                    placeholder="Ex: Entregar pela manhã, agendar com faturamento..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="cart-modal-footer">
              <div className="order-summary-row">
                <span>Valor Total:</span>
                <span style={{ color: "#f18e04", fontSize: "1.3rem" }}>
                  {formatCurrency(cartTotalPrice)}
                </span>
              </div>

              <button 
                className="btn-submit-order"
                onClick={handleSubmitOrder}
                disabled={submitting || cartTotalItems === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Enviando Pedido...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Enviar Pedido para a Fábrica</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {orderSuccess && (
        <div className="modal-overlay">
          <div className="cart-modal-content" style={{ maxWidth: "480px", textAlign: "center", padding: "2rem" }}>
            <CheckCircle2 size={64} style={{ color: "#16a34a", margin: "0 auto 1rem auto" }} />
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", margin: "0 0 0.5rem 0", color: "#0f172a" }}>
              Pedido Enviado com Sucesso!
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {orderSuccess.message}
              {orderSuccess.id_venda && (
                <span style={{ display: "block", marginTop: "0.5rem", fontWeight: "600", color: "#0f172a" }}>
                  Número do Pedido: #{orderSuccess.id_venda}
                </span>
              )}
            </p>
            <button 
              className="btn-submit-order"
              onClick={() => setOrderSuccess(null)}
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

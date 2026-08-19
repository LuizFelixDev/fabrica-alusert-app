import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  WifiOff, 
  ShoppingBag, 
  Trash2, 
  X, 
  User, 
  Calendar, 
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import "./Vendas.css";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";

interface SaleItem {
  id?: number;
  id_venda?: number;
  id_produto: number;
  quantidade: number;
  preco_unitario: number | string;
  nome_produto?: string;
  codigo_barras?: string;
}

interface Sale {
  id: number;
  id_cliente: number;
  id_usuario: number;
  data_venda: string;
  forma_pagamento: string;
  status: 'pendente' | 'concluída' | 'cancelada';
  valor_total: number | string;
  nome_cliente: string;
  nome_usuario: string;
  email_cliente?: string;
  itens?: SaleItem[];
}

interface Client {
  id: number;
  nome: string;
  cpf_cnpj: string;
}

interface Seller {
  id: number;
  nome: string;
}

interface Product {
  id: number;
  nome: string;
  preco_venda: number | string;
  quantidade_estoque: number;
  unidade_medida?: string;
  codigo_barras?: string | null;
}

interface VendasProps {
  onBack?: () => void;
}

export default function Vendas({ onBack }: VendasProps) {
  // State lists
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Loading and Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and Search State
  const [selectedFilter, setSelectedFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals visibility
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form State for new sale
  const [formClientId, setFormClientId] = useState<string>("");
  const [formSellerId, setFormSellerId] = useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("Pix");
  const [formStatus, setFormStatus] = useState<'pendente' | 'concluída' | 'cancelada'>("pendente");
  const [formItems, setFormItems] = useState<{
    id_produto: string;
    quantidade: string;
    preco_unitario: string;
  }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");

  const handleAddProductToCart = (prod: Product) => {
    const existingIndex = formItems.findIndex(item => item.id_produto === String(prod.id));

    if (existingIndex > -1) {
      const updated = [...formItems];
      const currentQty = parseFloat(updated[existingIndex].quantidade) || 0;
      updated[existingIndex].quantidade = String(currentQty + 1);
      setFormItems(updated);
    } else {
      setFormItems([
        ...formItems,
        {
          id_produto: String(prod.id),
          quantidade: "1",
          preco_unitario: String(prod.preco_venda)
        }
      ]);
    }
    setProductSearchTerm("");
  };

  const handleIncrementQty = (idx: number) => {
    const updated = [...formItems];
    const qty = parseFloat(updated[idx].quantidade) || 0;
    updated[idx].quantidade = String(qty + 1);
    setFormItems(updated);
  };

  const handleDecrementQty = (idx: number) => {
    const updated = [...formItems];
    const qty = parseFloat(updated[idx].quantidade) || 0;
    if (qty > 1) {
      updated[idx].quantidade = String(qty - 1);
      setFormItems(updated);
    } else {
      setFormItems(formItems.filter((_, i) => i !== idx));
    }
  };

  const searchedProducts = productSearchTerm.trim() === ""
    ? []
    : products.filter(p => 
        p.nome.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(productSearchTerm.toLowerCase()))
      );

  const quickAddProducts = products.filter(p => p.quantidade_estoque > 0);

  // Fetch all necessary data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Sales
      const salesRes = await fetch(ENDPOINTS.vendas);
      if (!salesRes.ok) throw new Error("Erro ao buscar vendas");
      const salesData = await salesRes.json();
      setSales(salesData);

      // Fetch Clients
      const clientsRes = await fetch(ENDPOINTS.clientes);
      if (!clientsRes.ok) throw new Error("Erro ao buscar clientes");
      const clientsData = await clientsRes.json();
      setClients(clientsData);

      // Fetch Sellers/Users
      const sellersRes = await fetch(ENDPOINTS.usuarios);
      if (!sellersRes.ok) throw new Error("Erro ao buscar usuários");
      const sellersData = await sellersRes.json();
      setSellers(sellersData);
      if (sellersData.length > 0) {
        setFormSellerId(String(sellersData[0].id));
      }

      // Fetch Products
      const productsRes = await fetch(ENDPOINTS.produtos);
      if (!productsRes.ok) throw new Error("Erro ao buscar produtos");
      const productsData = await productsRes.json();
      setProducts(productsData);

    } catch (err: any) {
      console.error(err);
      setError("Não foi possível conectar ao servidor. Verifique se a API está online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch full details of a specific sale
  const handleViewDetails = async (sale: Sale) => {
    try {
      const res = await fetch(`${ENDPOINTS.vendas}/${sale.id}`);
      if (!res.ok) throw new Error("Erro ao buscar detalhes da venda");
      const fullSale = await res.json();
      setSelectedSale(fullSale);
      setDetailsModalVisible(true);
    } catch (err: any) {
      console.error(err);
      alert("Não foi possível carregar os detalhes da venda.");
    }
  };

  // Update sale status
  const handleUpdateStatus = async (saleId: number, newStatus: string) => {
    try {
      const res = await fetch(`${ENDPOINTS.vendas}/${saleId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao atualizar status");
      }

      setDetailsModalVisible(false);
      setSelectedSale(null);
      fetchData();
      alert("Status atualizado com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao atualizar status.");
    }
  };

  // Delete sale
  const handleDeleteSale = async (saleId: number) => {
    if (!window.confirm("Deseja realmente excluir esta venda? (O estoque dos produtos será devolvido, a menos que a venda já esteja cancelada)")) return;
    
    try {
      const res = await fetch(`${ENDPOINTS.vendas}/${saleId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao excluir venda");
      }

      setDetailsModalVisible(false);
      setSelectedSale(null);
      fetchData();
      alert("Venda excluída com sucesso.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir venda.");
    }
  };

  // Handle Form Submission (Create Sale)
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) {
      setFormError("Selecione um cliente.");
      return;
    }
    if (!formSellerId) {
      setFormError("Selecione o vendedor.");
      return;
    }
    if (formItems.length === 0) {
      setFormError("Adicione pelo menos um item à venda.");
      return;
    }

    // Validate items
    for (const item of formItems) {
      if (!item.id_produto) {
        setFormError("Selecione o produto para todos os itens.");
        return;
      }
      const qty = parseFloat(item.quantidade);
      if (isNaN(qty) || qty <= 0) {
        setFormError("A quantidade de todos os itens deve ser maior que zero.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        id_cliente: parseInt(formClientId),
        id_usuario: parseInt(formSellerId),
        forma_pagamento: formPaymentMethod,
        status: formStatus,
        itens: formItems.map(item => ({
          id_produto: parseInt(item.id_produto),
          quantidade: parseFloat(item.quantidade),
          preco_unitario: item.preco_unitario ? parseFloat(item.preco_unitario) : undefined
        }))
      };

      const res = await fetch(ENDPOINTS.vendas, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao criar venda");
      }

      // Reset form
      setFormClientId("");
      setFormSellerId("");
      setFormPaymentMethod("Pix");
      setFormStatus("pendente");
      setFormItems([]);
      setModalVisible(false);
      fetchData();
      alert("Venda realizada com sucesso!");
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Ocorreu um erro ao registrar a venda.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting functions
  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0,00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0,00" : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "concluída") return "badge-status-concluida";
    if (status === "pendente") return "badge-status-pendente";
    return "badge-status-cancelada";
  };

  const getStatusIcon = (status: string) => {
    if (status === "concluída") return <CheckCircle size={12} color="#16a34a" />;
    if (status === "pendente") return <Clock size={12} color="#d97706" />;
    return <XCircle size={12} color="#b91c1c" />;
  };

  // Calculate live total for form items
  const calculateFormTotal = () => {
    return formItems.reduce((acc, item) => {
      const qty = parseFloat(item.quantidade) || 0;
      const price = parseFloat(item.preco_unitario) || 0;
      return acc + (qty * price);
    }, 0);
  };

  // Filter Sales list
  const filteredSales = sales
    .filter(sale => {
      if (selectedFilter === "TODOS") return true;
      return sale.status.toLowerCase() === selectedFilter.toLowerCase();
    })
    .filter(sale => {
      return sale.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase());
    });

  return (
    <div className="vendas-container page-content">
      {/* Header */}
      <header className="header-container">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={24} color="#64748b" />
          </button>
          <div className="title-container">
            <h2 className="header-title">VENDAS</h2>
            <span className="header-subtitle">
              {loading ? "Carregando..." : `${sales.length} vendas registradas`}
            </span>
          </div>
        </div>

        <button 
          className="new-button"
          onClick={() => {
          setFormError(null);
          setFormClientId("");
          setFormSellerId(sellers.length > 0 ? String(sellers[0].id) : "");
          setFormPaymentMethod("Pix");
          setFormStatus("pendente");
          setFormItems([]);
          setProductSearchTerm("");
          setModalVisible(true);
        }}
        >
          + REGISTRAR
        </button>
      </header>

      {/* Search Bar */}
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar pelo nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters */}
      {!loading && !error && (
        <div className="filters-container">
          <div className="filters-scroll">
            {["TODOS", "CONCLUÍDA", "PENDENTE", "CANCELADA"].map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  className={`filter-chip ${isActive ? 'filter-chip-active' : ''}`}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter === "CONCLUÍDA" ? "CONCLUÍDAS" : filter === "PENDENTE" ? "PENDENTES" : filter === "CANCELADA" ? "CANCELADAS" : filter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <span className="loader-text">Buscando dados das vendas...</span>
        </div>
      ) : error ? (
        <div className="center-container">
          <WifiOff size={48} color={colors.error.text} className="error-icon" />
          <p className="error-msg-text">{error}</p>
          <button className="retry-button" onClick={fetchData}>
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="sales-list-wrapper">
          <div className="counter-container">
            <span className="counter-text">
              {filteredSales.length} {filteredSales.length === 1 ? "VENDA" : "VENDAS"}
            </span>
          </div>

          {filteredSales.length === 0 ? (
            <div className="center-container">
              <ShoppingBag size={40} color={colors.textSecondary} className="empty-icon" />
              <span className="counter-text">Nenhuma venda encontrada para esta busca.</span>
            </div>
          ) : (
            <div className="sales-card">
              {filteredSales.map((sale, index) => {
                const isLast = index === filteredSales.length - 1;
                return (
                  <button
                    key={sale.id}
                    className={`sale-item-btn ${!isLast ? 'sale-item-divider' : ''}`}
                    onClick={() => handleViewDetails(sale)}
                  >
                    <div className="sale-details-left">
                      <span className="sale-client-name">{sale.nome_cliente}</span>
                      <span className="sale-subinfo">Vendedor: {sale.nome_usuario}</span>
                      <div className="sale-meta-row">
                        <span className="sale-date">{formatDate(sale.data_venda).split(" às ")[0]}</span>
                        <span className="sale-payment-method">• {sale.forma_pagamento}</span>
                      </div>
                    </div>

                    <div className="sale-details-right">
                      <span className="sale-total-value">
                        {formatPrice(sale.valor_total)}
                      </span>
                      <div className={`status-badge-mini ${getStatusBadgeClass(sale.status)}`}>
                        {getStatusIcon(sale.status)}
                        <span className="status-badge-mini-text">{sale.status}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sale Details Modal */}
      {detailsModalVisible && selectedSale && (
        <div className="modal-overlay">
          <div className="details-modal-content">
            <div className="details-header">
              <div className="details-header-info">
                <span className="details-sale-number">VENDA #{selectedSale.id}</span>
                <div className={`status-badge-mini ${getStatusBadgeClass(selectedSale.status)}`} style={{ marginTop: '4px' }}>
                  {getStatusIcon(selectedSale.status)}
                  <span className="status-badge-mini-text">{selectedSale.status}</span>
                </div>
              </div>
              <button
                className="close-details-button"
                onClick={() => {
                  setDetailsModalVisible(false);
                  setSelectedSale(null);
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div className="details-body">
              {/* Client and Seller Info */}
              <div className="details-section">
                <div className="info-block">
                  <User size={14} color="#64748b" className="info-icon" />
                  <div>
                    <span className="info-label">CLIENTE</span>
                    <span className="info-val">{selectedSale.nome_cliente}</span>
                    {selectedSale.email_cliente && <span className="info-subval">{selectedSale.email_cliente}</span>}
                  </div>
                </div>

                <div className="info-block">
                  <Calendar size={14} color="#64748b" className="info-icon" />
                  <div>
                    <span className="info-label">DATA DA VENDA</span>
                    <span className="info-val">{formatDate(selectedSale.data_venda)}</span>
                  </div>
                </div>

                <div className="info-block">
                  <CreditCard size={14} color="#64748b" className="info-icon" />
                  <div>
                    <span className="info-label">FORMA DE PAGAMENTO</span>
                    <span className="info-val">{selectedSale.forma_pagamento}</span>
                  </div>
                </div>

                <div className="info-block">
                  <User size={14} color="#64748b" className="info-icon" />
                  <div>
                    <span className="info-label">VENDEDOR / REGISTRADO POR</span>
                    <span className="info-val">{selectedSale.nome_usuario}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="details-section">
                <span className="details-section-label">ITENS DA VENDA</span>
                <div className="sale-items-table">
                  {selectedSale.itens && selectedSale.itens.map((item, idx) => {
                    const subtotal = Number(item.preco_unitario) * item.quantidade;
                    return (
                      <div key={item.id || idx} className="sale-item-row">
                        <div className="item-row-info">
                          <span className="item-product-name">{item.nome_produto}</span>
                          <span className="item-product-qty">
                            {item.quantidade} x {formatPrice(item.preco_unitario)}
                          </span>
                        </div>
                        <span className="item-row-subtotal">{formatPrice(subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Value */}
              <div className="details-section total-section">
                <span className="total-label">VALOR TOTAL</span>
                <span className="total-val">{formatPrice(selectedSale.valor_total)}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="details-footer">
              <button
                className="details-delete-button"
                onClick={() => handleDeleteSale(selectedSale.id)}
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                EXCLUIR
              </button>

              <div className="action-buttons-group">
                {selectedSale.status === "pendente" && (
                  <>
                    <button
                      className="status-btn btn-cancelar"
                      onClick={() => handleUpdateStatus(selectedSale.id, "cancelada")}
                    >
                      CANCELAR
                    </button>
                    <button
                      className="status-btn btn-concluir"
                      onClick={() => handleUpdateStatus(selectedSale.id, "concluída")}
                    >
                      CONCLUIR
                    </button>
                  </>
                )}
                {selectedSale.status === "concluída" && (
                  <button
                    className="status-btn btn-cancelar"
                    onClick={() => handleUpdateStatus(selectedSale.id, "cancelada")}
                  >
                    CANCELAR
                  </button>
                )}
                {selectedSale.status === "cancelada" && (
                  <button
                    className="status-btn btn-reativar"
                    onClick={() => handleUpdateStatus(selectedSale.id, "pendente")}
                  >
                    REATIVAR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sale Modal Form */}
      {modalVisible && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateSale}>
            <h3 className="modal-title">Registrar Venda</h3>
            
            <div className="form-scroll">
              {/* Select Client */}
              <label className="input-label">CLIENTE *</label>
              <select
                className="input select-input"
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nome} ({client.cpf_cnpj})
                  </option>
                ))}
              </select>

              {/* Vendedor / Operador auto-defaulted to the first seller (Administrador) */}

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">FORMA PAGAMENTO *</label>
                  <select
                    className="input select-input"
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
                <div className="half-input-container">
                  <label className="input-label">STATUS INICIAL *</label>
                  <select
                    className="input select-input"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    required
                  >
                    <option value="pendente">Pendente</option>
                    <option value="concluída">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Pesquisar Produto */}
              <div className="product-search-section" style={{ marginTop: '20px' }}>
                <label className="input-label">PESQUISAR PRODUTO PARA ADICIONAR</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input search-product-input"
                    placeholder="Digite o nome ou código do produto..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                  
                  {searchedProducts.length > 0 && (
                    <div className="search-results-dropdown">
                      {searchedProducts.map(prod => (
                        <button
                          type="button"
                          key={prod.id}
                          className="search-result-row"
                          onClick={() => handleAddProductToCart(prod)}
                          disabled={prod.quantidade_estoque <= 0 && formStatus !== 'cancelada'}
                        >
                          <div className="search-result-info">
                            <span className="search-result-name">{prod.nome}</span>
                            <span className="search-result-stock">
                              Estoque: {prod.quantidade_estoque} {prod.unidade_medida || "un"}
                            </span>
                          </div>
                          <span className="search-result-price">{formatPrice(prod.preco_venda)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Add Chips */}
              {quickAddProducts.length > 0 && (
                <div className="quick-add-section">
                  <span className="quick-add-title">Adicionar Rapidamente:</span>
                  <div className="quick-add-chips">
                    {quickAddProducts.map(prod => (
                      <button
                        type="button"
                        key={prod.id}
                        className="quick-add-chip-btn"
                        onClick={() => handleAddProductToCart(prod)}
                      >
                        <span className="quick-add-btn-name">+ {prod.nome}</span>
                        <span className="quick-add-btn-meta">
                          {formatPrice(prod.preco_venda)} (Estoque: {prod.quantidade_estoque} {prod.unidade_medida || "un"})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              )}

              {/* Sale Items Section (Cart) */}
              <div className="cart-header-title" style={{ marginTop: '20px', marginBottom: '8px' }}>
                <span className="disc-section-title">ITENS SELECIONADOS</span>
              </div>

              {formItems.length === 0 ? (
                <div className="empty-cart-message">
                  <span>Nenhum produto adicionado. Use a pesquisa acima ou clique em "Mais Vendidos" para adicionar itens rapidamente.</span>
                </div>
              ) : (
                <div className="cart-items-list">
                  {formItems.map((item, idx) => {
                    const selectedProd = products.find(p => p.id === parseInt(item.id_produto));
                    const itemSubtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.preco_unitario) || 0);

                    return (
                      <div key={idx} className="cart-item-row-edit">
                        <div className="cart-item-info-col">
                          <span className="cart-item-name">{selectedProd?.nome || "Carregando..."}</span>
                          <span className="cart-item-stock-info">Estoque: {selectedProd?.quantidade_estoque} {selectedProd?.unidade_medida || "un"}</span>
                        </div>

                        <div className="cart-item-controls-col">
                          {/* Qty controller */}
                          <div className="qty-controller-wrapper">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleDecrementQty(idx)}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="any"
                              className="qty-val-input"
                              value={item.quantidade}
                              onChange={(e) => {
                                const updated = [...formItems];
                                updated[idx].quantidade = e.target.value;
                                setFormItems(updated);
                              }}
                              required
                            />
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleIncrementQty(idx)}
                            >
                              +
                            </button>
                          </div>

                          {/* Price input */}
                          <div className="price-input-wrapper">
                            <span className="currency-prefix">R$</span>
                            <input
                              type="number"
                              step="any"
                              className="price-val-input"
                              placeholder="0.00"
                              value={item.preco_unitario}
                              onChange={(e) => {
                                const updated = [...formItems];
                                updated[idx].preco_unitario = e.target.value;
                                setFormItems(updated);
                              }}
                              required
                            />
                          </div>

                          {/* Subtotal */}
                          <span className="cart-item-subtotal">{formatPrice(itemSubtotal)}</span>

                          {/* Delete button */}
                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={16} color={colors.error.text} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Total Display */}
              <div className="form-total-banner">
                <span className="form-total-label">Total da Venda:</span>
                <span className="form-total-val">{formatPrice(calculateFormTotal())}</span>
              </div>

              {formError && (
                <div className="form-error-banner">
                  <AlertCircle size={16} color={colors.error.text} style={{ marginRight: '6px' }} />
                  <span className="form-error-text">{formError}</span>
                </div>
              )}
            </div>

            <div className="button-row">
              <button 
                type="button"
                className="cancel-button"
                onClick={() => {
                  setModalVisible(false);
                  setFormItems([]);
                }}
                disabled={submitting}
              >
                CANCELAR
              </button>
              
              <button 
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? "..." : "SALVAR VENDA"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

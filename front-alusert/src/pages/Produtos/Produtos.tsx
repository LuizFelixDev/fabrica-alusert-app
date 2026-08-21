import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  WifiOff, 
  Package, 
  Disc, 
  Trash2, 
  Edit, 
  X,
  PlusCircle
} from "lucide-react";
import "./Produtos.css";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";

interface ProductMateriaPrima {
  link_id?: number;
  id_materia_prima: number;
  nome?: string;
  unidade_medida?: string;
  quantidade_utilizada: number | string;
  tipo_componente?: string | null;
  diametro_mm?: number | string | null;
  altura_mm?: number | string | null;
  peso?: number | string | null;
  valor_unitario?: number | string | null;
}

interface BackendProduct {
  id: number;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  tamanho_numero: number | null;
  unidade_medida: string | null;
  quantidade_estoque: number;
  estoque_minimo: number;
  peso_kg: number | null;
  preco_custo: number | string | null;
  preco_venda: number | string | null;
  status: boolean;
  data_cadastro?: string;
  data_atualizacao?: string;
  materias_primas?: ProductMateriaPrima[];
}

interface ProdutosProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export default function Produtos({ onBack }: ProdutosProps) {
  // State Management
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("TODOS");
  const [filters, setFilters] = useState<string[]>(["TODOS"]);

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<BackendProduct | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form State
  const [formNome, setFormNome] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formEstoque, setFormEstoque] = useState("");
  const [formUnidade, setFormUnidade] = useState("kg");
  const [formPrecoCusto, setFormPrecoCusto] = useState("");
  const [formPrecoVenda, setFormPrecoVenda] = useState("");
  const [formCodigoBarras, setFormCodigoBarras] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTamanhoNumero, setFormTamanhoNumero] = useState("");
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState("");
  const [formPesoKg, setFormPesoKg] = useState("");
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formMaterials, setFormMaterials] = useState<{
    id_materia_prima: string;
    quantidade_utilizada: string;
  }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);

  // Quick Create Raw Material State
  const [rawModalVisible, setRawModalVisible] = useState<boolean>(false);
  const [rawNome, setRawNome] = useState("");
  const [rawDescricao, setRawDescricao] = useState("");
  const [rawUnidade, setRawUnidade] = useState("kg");
  const [rawEstoque, setRawEstoque] = useState("");
  const [rawValorUnitario, setRawValorUnitario] = useState("");
  const [rawEstoqueMinimo, setRawEstoqueMinimo] = useState("");
  const [rawTipoComponente, setRawTipoComponente] = useState("");
  const [rawDiametro, setRawDiametro] = useState("");
  const [rawAltura, setRawAltura] = useState("");
  const [rawPeso, setRawPeso] = useState("");
  const [rawSubmitting, setRawSubmitting] = useState<boolean>(false);
  const [rawError, setRawError] = useState<string | null>(null);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(ENDPOINTS.produtos);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data: BackendProduct[] = await response.json();
      setProducts(data);

      // Extract unique categories dynamically
      const extractedCategories = data
        .map(p => p.categoria?.trim() || "")
        .filter(Boolean)
        .map(cat => cat.toUpperCase());
      
      const uniqueCats = ["TODOS", ...Array.from(new Set(extractedCategories))];
      setFilters(uniqueCats);
      
    } catch (err: any) {
      console.error("Erro ao buscar produtos do backend:", err);
      setError("Não foi possível carregar os produtos do servidor. Verifique se o backend está ativo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMaterials = async () => {
    try {
      const response = await fetch(ENDPOINTS.materiasPrimas);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      setAvailableMaterials(data);
    } catch (err) {
      console.error("Erro ao buscar matérias-primas:", err);
    }
  };

  const handleQuickCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNome.trim() || !rawUnidade.trim()) {
      setRawError("Nome e Unidade de Medida são obrigatórios.");
      return;
    }

    try {
      setRawSubmitting(true);
      setRawError(null);

      const payload = {
        nome: rawNome.trim(),
        descricao: rawDescricao.trim() || null,
        unidade_medida: rawUnidade.trim(),
        quantidade_estoque: rawEstoque ? parseFloat(rawEstoque) : 0,
        valor_unitario: rawValorUnitario ? parseFloat(rawValorUnitario) : 0,
        estoque_minimo: rawEstoqueMinimo ? parseFloat(rawEstoqueMinimo) : 0,
        tipo_componente: rawTipoComponente.trim() || null,
        diametro_mm: rawDiametro ? parseFloat(rawDiametro) : null,
        altura_mm: rawAltura ? parseFloat(rawAltura) : null,
        peso: rawPeso ? parseFloat(rawPeso) : null,
      };

      const response = await fetch(ENDPOINTS.materiasPrimas, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Erro HTTP: ${response.status}`);
      }

      const newMat = await response.json();
      
      // Update available materials list
      setAvailableMaterials((prev) => [...prev, newMat]);

      // Automatically link it to the product form!
      setFormMaterials((prev) => [
        ...prev,
        { id_materia_prima: String(newMat.id), quantidade_utilizada: "1" },
      ]);

      // Reset fields
      setRawNome("");
      setRawDescricao("");
      setRawUnidade("kg");
      setRawEstoque("");
      setRawValorUnitario("");
      setRawEstoqueMinimo("");
      setRawTipoComponente("");
      setRawDiametro("");
      setRawAltura("");
      setRawPeso("");
      setRawModalVisible(false);
    } catch (err: any) {
      console.error("Erro ao salvar matéria-prima rápida:", err);
      setRawError(err.message || "Erro ao salvar matéria-prima.");
    } finally {
      setRawSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchAvailableMaterials();
  }, []);

  // Form submission handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormError("O nome do produto é obrigatório.");
      return;
    }
    if (!formCategoria.trim()) {
      setFormError("A categoria é obrigatória.");
      return;
    }
    if (!formPrecoVenda.trim()) {
      setFormError("O preço de venda é obrigatório.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        nome: formNome.trim(),
        categoria: formCategoria.trim(),
        quantidade_estoque: formEstoque ? parseFloat(formEstoque) : 0,
        unidade_medida: formUnidade.trim(),
        preco_custo: formPrecoCusto ? parseFloat(formPrecoCusto) : null,
        preco_venda: parseFloat(formPrecoVenda),
        codigo_barras: formCodigoBarras.trim() || null,
        descricao: formDescricao.trim() || null,
        tamanho_numero: formTamanhoNumero ? parseFloat(formTamanhoNumero) : null,
        estoque_minimo: formEstoqueMinimo ? parseInt(formEstoqueMinimo, 10) : 0,
        peso_kg: formPesoKg ? parseFloat(formPesoKg) : null,
        status: formStatus,
        materias_primas: formMaterials
          .filter(m => m.id_materia_prima !== "" && m.quantidade_utilizada !== "")
          .map(m => ({
            id_materia_prima: parseInt(m.id_materia_prima, 10),
            quantidade_utilizada: parseFloat(m.quantidade_utilizada)
          }))
      };

      const url = isEditing && selectedProduct
        ? `${ENDPOINTS.produtos}/${selectedProduct.id}`
        : ENDPOINTS.produtos;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      // Reset form & reload
      setFormNome("");
      setFormCategoria("");
      setFormEstoque("");
      setFormUnidade("kg");
      setFormPrecoCusto("");
      setFormPrecoVenda("");
      setFormCodigoBarras("");
      setFormDescricao("");
      setFormTamanhoNumero("");
      setFormEstoqueMinimo("");
      setFormPesoKg("");
      setFormStatus(true);
      setFormMaterials([]);
      setIsEditing(false);
      setSelectedProduct(null);
      setModalVisible(false);
      
      fetchProducts();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      setFormError(err.message || "Ocorreu um erro ao salvar o produto.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product handler
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    const confirmed = window.confirm(`Tem certeza que deseja excluir o produto "${selectedProduct.nome}"?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`${ENDPOINTS.produtos}/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      setDetailsModalVisible(false);
      setSelectedProduct(null);
      fetchProducts();
      alert("Produto excluído com sucesso.");
    } catch (err: any) {
      console.error("Erro ao excluir produto:", err);
      alert(err.message || "Ocorreu um erro ao excluir o produto.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare edit form handler
  const handleEditPress = () => {
    if (!selectedProduct) return;

    setDetailsModalVisible(false);

    setFormNome(selectedProduct.nome || "");
    setFormCodigoBarras(selectedProduct.codigo_barras || "");
    setFormDescricao(selectedProduct.descricao || "");
    setFormCategoria(selectedProduct.categoria || "");
    setFormUnidade(selectedProduct.unidade_medida || "kg");
    setFormTamanhoNumero(selectedProduct.tamanho_numero !== null ? String(selectedProduct.tamanho_numero) : "");
    setFormPesoKg(selectedProduct.peso_kg !== null ? String(selectedProduct.peso_kg) : "");
    setFormEstoque(String(selectedProduct.quantidade_estoque));
    setFormEstoqueMinimo(String(selectedProduct.estoque_minimo));
    setFormPrecoCusto(selectedProduct.preco_custo !== null ? String(selectedProduct.preco_custo) : "");
    setFormPrecoVenda(selectedProduct.preco_venda !== null ? String(selectedProduct.preco_venda) : "");
    setFormStatus(selectedProduct.status);

    if (selectedProduct.materias_primas && selectedProduct.materias_primas.length > 0) {
      setFormMaterials(
        selectedProduct.materias_primas.map(m => ({
          id_materia_prima: String(m.id_materia_prima),
          quantidade_utilizada: String(m.quantidade_utilizada)
        }))
      );
    } else {
      setFormMaterials([]);
    }

    setIsEditing(true);
    setFormError(null);
    setModalVisible(true);
  };

  // Helper functions
  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0.00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0.00" : `R$ ${num.toFixed(2)}`;
  };

  const calculateMargin = (costVal?: string | number | null, sellVal?: string | number | null) => {
    const cost = costVal ? Number(costVal) : 0;
    const sell = sellVal ? Number(sellVal) : 0;
    if (!cost || !sell || isNaN(cost) || isNaN(sell) || sell === 0) return "N/A";
    const margin = ((sell - cost) / sell) * 100;
    return `${Math.round(margin)}%`;
  };

  const getTagStyle = (category?: string | null) => {
    const clean = (category || "").toUpperCase().trim();
    if (clean.includes("PERFIL")) return { bg: "#eff6ff", text: "#2563eb" };
    if (clean.includes("TUBO")) return { bg: "#ecfeff", text: "#0891b2" };
    if (clean.includes("CHAPA")) return { bg: "#f5f3ff", text: "#7c3aed" };
    if (clean.includes("CANTONEIRA")) return { bg: "#f0fdf4", text: "#16a34a" };
    if (clean.includes("BARRA")) return { bg: "#fff7ed", text: "#ea580c" };
    if (clean.includes("CUSCUZEIRA")) return { bg: "#fdf2f8", text: "#db2777" };
    if (clean.includes("CAFETEIRA")) return { bg: "#f5f5f4", text: "#78716c" };
    return { bg: "#f1f5f9", text: "#475569" };
  };

  const filteredProducts = selectedFilter === "TODOS"
    ? products
    : products.filter(p => p.categoria?.toUpperCase().trim() === selectedFilter);

  return (
    <div className="produtos-container page-content">
      {/* Header */}
      <header className="header-container">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={24} color="#64748b" />
          </button>
          <div className="title-container">
            <h2 className="header-title">PRODUTOS</h2>
            <span className="header-subtitle">
              {loading ? "Carregando..." : `${products.length} produtos`}
            </span>
          </div>
        </div>

        <button 
          className="new-button"
          onClick={() => {
            setFormError(null);
            setFormMaterials([]);
            setIsEditing(false);
            setSelectedProduct(null);
            setFormNome("");
            setFormCategoria("");
            setFormEstoque("");
            setFormUnidade("kg");
            setFormPrecoCusto("");
            setFormPrecoVenda("");
            setFormCodigoBarras("");
            setFormDescricao("");
            setFormTamanhoNumero("");
            setFormEstoqueMinimo("");
            setFormPesoKg("");
            setFormStatus(true);
            setModalVisible(true);
          }}
        >
          + NOVO
        </button>
      </header>

      {/* Category filters bar */}
      {!loading && !error && (
        <div className="filters-container">
          <div className="filters-scroll">
            {filters.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  className={`filter-chip ${isActive ? 'filter-chip-active' : ''}`}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loader, Error, or Product List */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <span className="loader-text">Carregando produtos...</span>
        </div>
      ) : error ? (
        <div className="center-container">
          <WifiOff size={48} color={colors.error.text} className="error-icon" />
          <p className="error-msg-text">{error}</p>
          <button className="retry-button" onClick={fetchProducts}>
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="products-list-wrapper">
          <div className="counter-container">
            <span className="counter-text">
              {filteredProducts.length} {filteredProducts.length === 1 ? "ITEM" : "ITENS"}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="center-container">
              <Package size={40} color={colors.textSecondary} className="empty-icon" />
              <span className="counter-text">Nenhum produto cadastrado nesta categoria.</span>
            </div>
          ) : (
            <div className="products-card">
              {filteredProducts.map((product, index) => {
                const isLast = index === filteredProducts.length - 1;
                const tagColors = getTagStyle(product.categoria);

                return (
                  <button
                    key={product.id}
                    className={`product-item ${!isLast ? 'product-item-divider' : ''}`}
                    onClick={() => {
                      setSelectedProduct(product);
                      setDetailsModalVisible(true);
                    }}
                  >
                    <div className="product-details">
                      <span className="product-name">{product.nome}</span>
                      
                      <div className="tag" style={{ backgroundColor: tagColors.bg }}>
                        <span className="tag-text" style={{ color: tagColors.text }}>
                          {product.categoria || "PRODUTO"}
                        </span>
                      </div>

                      <div className="meta-row">
                        <span className="meta-text">
                          Estoque:{" "}
                          <span className="meta-value">
                            {product.quantidade_estoque} {product.unidade_medida || "kg"}
                          </span>
                        </span>
                        <span className="margin-text">
                          Margem:{" "}
                          <span className="margin-value">
                            {calculateMargin(product.preco_custo, product.preco_venda)}
                          </span>
                        </span>
                      </div>

                      {product.materias_primas && product.materias_primas.length > 0 && (
                        <div className="specs-container">
                          {product.materias_primas.map((mat, matIdx) => {
                            const isDisc = !!mat.tipo_componente;
                            return (
                              <div key={mat.link_id || matIdx} className="spec-badge">
                                {isDisc ? (
                                  <Disc size={10} color="#475569" className="spec-icon" />
                                ) : (
                                  <span style={{ fontSize: '8px', marginRight: '4px' }}>⚙️</span>
                                )}
                                <span className="spec-badge-text">
                                  {mat.nome} ({mat.quantidade_utilizada}{mat.unidade_medida})
                                  {isDisc && ` Ø${Number(mat.diametro_mm)}mm × ${Number(mat.altura_mm)}mm`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="price-container">
                      <span className="price-value">
                        {formatPrice(product.preco_venda)}
                      </span>
                      <span className="price-unit">
                        /{product.unidade_medida || "kg"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Details Modal */}
      {detailsModalVisible && selectedProduct && (
        <div className="modal-overlay">
          <div className="details-modal-content">
            {/* Header */}
            <div className="details-header">
              <div className="details-header-info">
                <h3 className="details-title">{selectedProduct.nome}</h3>
                <div 
                  className="tag" 
                  style={{ 
                    backgroundColor: getTagStyle(selectedProduct.categoria).bg, 
                    marginTop: '4px' 
                  }}
                >
                  <span className="tag-text" style={{ color: getTagStyle(selectedProduct.categoria).text }}>
                    {selectedProduct.categoria || "PRODUTO"}
                  </span>
                </div>
              </div>
              <button
                className="close-details-button"
                onClick={() => {
                  setDetailsModalVisible(false);
                  setSelectedProduct(null);
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Body */}
            <div className="details-body">
              {selectedProduct.descricao && (
                <div className="details-section">
                  <span className="details-section-label">DESCRIÇÃO</span>
                  <div className="details-desc-text">{selectedProduct.descricao}</div>
                </div>
              )}

              {/* Informações Gerais */}
              <div className="details-section">
                <span className="details-section-label">INFORMAÇÕES DE ESTOQUE</span>
                <div className="details-grid">
                  <div className="details-grid-item">
                    <span className="details-item-label">Estoque Atual</span>
                    <span className="details-item-value">
                      {selectedProduct.quantidade_estoque} {selectedProduct.unidade_medida || "kg"}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Estoque Mínimo</span>
                    <span className="details-item-value">
                      {selectedProduct.estoque_minimo} {selectedProduct.unidade_medida || "kg"}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Status</span>
                    <span
                      className="details-item-value"
                      style={{ color: selectedProduct.status ? colors.success.text : colors.error.text }}
                    >
                      {selectedProduct.status ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="details-section">
                <span className="details-section-label">VALORES</span>
                <div className="details-grid">
                  <div className="details-grid-item">
                    <span className="details-item-label">Preço de Custo</span>
                    <span className="details-item-value">
                      {formatPrice(selectedProduct.preco_custo)}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Preço de Venda</span>
                    <span className="details-item-value">
                      {formatPrice(selectedProduct.preco_venda)}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Margem</span>
                    <span className="details-item-value" style={{ color: colors.success.text }}>
                      {calculateMargin(selectedProduct.preco_custo, selectedProduct.preco_venda)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Especificações do Produto */}
              <div className="details-section">
                <span className="details-section-label">ESPECIFICAÇÕES DO PRODUTO</span>
                <div className="details-grid">
                  <div className="details-grid-item">
                    <span className="details-item-label">Tamanho / Número</span>
                    <span className="details-item-value">
                      {selectedProduct.tamanho_numero !== null ? Number(selectedProduct.tamanho_numero) : "N/A"}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Peso (KG)</span>
                    <span className="details-item-value">
                      {selectedProduct.peso_kg !== null ? `${Number(selectedProduct.peso_kg)} kg` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matérias-Primas e Discos Vinculados */}
              {selectedProduct.materias_primas && selectedProduct.materias_primas.length > 0 && (
                <div className="details-section">
                  <span className="details-section-label">MATÉRIAS-PRIMAS / COMPONENTES</span>
                  <div className="details-discs-list">
                    {selectedProduct.materias_primas.map((mat, matIdx) => {
                      const isDisc = !!mat.tipo_componente;
                      return (
                        <div key={mat.link_id || matIdx} className="details-disc-item" style={{ marginBottom: '8px' }}>
                          {isDisc ? (
                            <Disc size={14} color={colors.primary} style={{ marginRight: '8px' }} />
                          ) : (
                            <Package size={14} color="#64748b" style={{ marginRight: '8px' }} />
                          )}
                          <span className="details-disc-item-text">
                            <strong>{mat.nome}</strong>: Consome <strong>{mat.quantidade_utilizada} {mat.unidade_medida}</strong>
                            {isDisc && ` | Ø${Number(mat.diametro_mm)}mm × ${Number(mat.altura_mm)}mm`}
                            {mat.peso !== null && mat.peso !== undefined && ` | Peso: ${Number(mat.peso)} kg`}
                            {mat.valor_unitario !== null && mat.valor_unitario !== undefined && ` | Custo Unitário: R$ ${Number(mat.valor_unitario).toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="details-footer">
              <button
                className="details-delete-button"
                onClick={handleDeleteProduct}
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                EXCLUIR
              </button>

              <button
                className="details-edit-button"
                onClick={handleEditPress}
              >
                <Edit size={16} style={{ marginRight: '6px' }} />
                ALTERAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal Form */}
      {modalVisible && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateProduct}>
            <h3 className="modal-title">
              {isEditing ? "Editar Produto" : "Novo Produto"}
            </h3>
            
            <div className="form-scroll">
              <label className="input-label">NOME DO PRODUTO *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Cuscuzeira 22 ou Tubo Redondo Ø70"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
              />

              <label className="input-label">CÓDIGO DE BARRAS (DEIXE EM BRANCO PARA GERAR AUTOMATICAMENTE)</label>
              <input
                type="text"
                className="input"
                placeholder="Gerado automaticamente se deixado em branco..."
                value={formCodigoBarras}
                onChange={(e) => setFormCodigoBarras(e.target.value)}
              />

              <label className="input-label">DESCRIÇÃO</label>
              <textarea
                className="input textarea"
                placeholder="Descrição detalhada do produto..."
                rows={3}
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">CATEGORIA *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Cuscuzeira"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    required
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">UNIDADE DE MEDIDA</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: kg, un, cm, L"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">TAMANHO / NÚMERO</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 16.00"
                    value={formTamanhoNumero}
                    onChange={(e) => setFormTamanhoNumero(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">PESO (KG)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 0.450"
                    value={formPesoKg}
                    onChange={(e) => setFormPesoKg(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">ESTOQUE INICIAL</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ex: 100"
                    value={formEstoque}
                    onChange={(e) => setFormEstoque(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ESTOQUE MÍNIMO</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ex: 20"
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">PREÇO DE CUSTO (R$)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 15.00"
                    value={formPrecoCusto}
                    onChange={(e) => setFormPrecoCusto(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">PREÇO DE VENDA (R$) *</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 30.00"
                    value={formPrecoVenda}
                    onChange={(e) => setFormPrecoVenda(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="toggle-row">
                <span className="toggle-label">PRODUTO ATIVO NO SISTEMA</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={formStatus}
                    onChange={(e) => setFormStatus(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Matérias-Primas do Produto */}
              <div className="disc-section-header" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <span className="disc-section-title">MATÉRIAS-PRIMAS DO PRODUTO</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="add-disc-button"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', boxShadow: 'none' }}
                    onClick={() => setRawModalVisible(true)}
                  >
                    ⚡ Novo Cadastro
                  </button>
                  <button
                    type="button"
                    className="add-disc-button"
                    onClick={() => setFormMaterials([...formMaterials, { id_materia_prima: "", quantidade_utilizada: "" }])}
                  >
                    <PlusCircle size={14} style={{ marginRight: '4px' }} />
                    Vincular
                  </button>
                </div>
              </div>

              {formMaterials.map((link, idx) => {
                const selectedMat = availableMaterials.find(m => String(m.id) === link.id_materia_prima);
                return (
                  <div key={idx} className="disc-item-container" style={{ padding: '12px', marginBottom: '10px' }}>
                    <div className="disc-item-header" style={{ marginBottom: '8px' }}>
                      <span className="disc-item-number">Matéria-Prima #{idx + 1}</span>
                      <button
                        type="button"
                        className="delete-disc-btn"
                        onClick={() => setFormMaterials(formMaterials.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={16} color={colors.error.text} />
                      </button>
                    </div>

                    <div className="form-row">
                      <div className="half-input-container" style={{ flex: 1.5 }}>
                        <label className="input-label">SELECIONAR MATÉRIA-PRIMA</label>
                        <select
                          className="input"
                          value={link.id_materia_prima}
                          onChange={(e) => {
                            const updated = [...formMaterials];
                            updated[idx].id_materia_prima = e.target.value;
                            setFormMaterials(updated);
                          }}
                          style={{ width: '100%', height: '40px', padding: '0 8px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="">-- Escolha --</option>
                          {availableMaterials.map((mat) => {
                            const detail = mat.tipo_componente ? ` (${mat.tipo_componente} Ø${Number(mat.diametro_mm)}x${Number(mat.altura_mm)}mm)` : "";
                            return (
                              <option key={mat.id} value={mat.id}>
                                {mat.nome}{detail}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="half-input-container" style={{ flex: 0.8 }}>
                        <label className="input-label">QTD UTILIZADA ({selectedMat ? selectedMat.unidade_medida : '?'})</label>
                        <input
                          type="number"
                          step="any"
                          className="input"
                          placeholder="Ex: 0.45"
                          value={link.quantidade_utilizada}
                          onChange={(e) => {
                            const updated = [...formMaterials];
                            updated[idx].quantidade_utilizada = e.target.value;
                            setFormMaterials(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {formError && <p className="form-error-text">{formError}</p>}
            </div>

            <div className="button-row">
              <button 
                type="button"
                className="cancel-button"
                onClick={() => {
                  setModalVisible(false);
                  setFormMaterials([]);
                  setIsEditing(false);
                  setSelectedProduct(null);
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
                {submitting ? "..." : (isEditing ? "SALVAR" : "CADASTRAR")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Create Raw Material Modal */}
      {rawModalVisible && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <form className="modal-content" onSubmit={handleQuickCreateMaterial} style={{ maxHeight: '90vh' }}>
            <h3 className="modal-title">Cadastrar Matéria-Prima Rápido</h3>
            
            <div className="form-scroll">
              <label className="input-label">NOME *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Disco de Alumínio 22cm"
                value={rawNome}
                onChange={(e) => setRawNome(e.target.value)}
                required
              />

              <label className="input-label">DESCRIÇÃO</label>
              <input
                type="text"
                className="input"
                placeholder="Descrição opcional..."
                value={rawDescricao}
                onChange={(e) => setRawDescricao(e.target.value)}
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">UNIDADE DE MEDIDA *</label>
                  <select
                    className="input"
                    value={rawUnidade}
                    onChange={(e) => setRawUnidade(e.target.value)}
                    required
                    style={{ width: '100%', height: '40px', padding: '0 8px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="kg">kg</option>
                    <option value="un">un</option>
                    <option value="m">m</option>
                    <option value="m²">m²</option>
                    <option value="L">L</option>
                    <option value="pç">pç</option>
                    <option value="cx">cx</option>
                    <option value="barra">barra</option>
                    <option value="bobina">bobina</option>
                    <option value="rolo">rolo</option>
                  </select>
                </div>
                <div className="half-input-container">
                  <label className="input-label">VALOR UNITÁRIO (R$)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 15.50"
                    value={rawValorUnitario}
                    onChange={(e) => setRawValorUnitario(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">QUANTIDADE ESTOQUE</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 500"
                    value={rawEstoque}
                    onChange={(e) => setRawEstoque(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ESTOQUE MÍNIMO</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 100"
                    value={rawEstoqueMinimo}
                    onChange={(e) => setRawEstoqueMinimo(e.target.value)}
                  />
                </div>
              </div>

              {/* Especificações de Disco/Componente */}
              <div className="disc-section-header" style={{ marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span className="disc-section-title" style={{ fontSize: '10px' }}>ESPECIFICAÇÕES DE DISCO (OPCIONAL)</span>
              </div>

              <label className="input-label">TIPO DE COMPONENTE</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Disco, Alça, Anel"
                value={rawTipoComponente}
                onChange={(e) => setRawTipoComponente(e.target.value)}
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">DIÂMETRO (MM)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 260.00"
                    value={rawDiametro}
                    onChange={(e) => setRawDiametro(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ALTURA (MM)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 90.00"
                    value={rawAltura}
                    onChange={(e) => setRawAltura(e.target.value)}
                  />
                </div>
              </div>

              <label className="input-label">PESO (KG)</label>
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Ex: 0.350"
                value={rawPeso}
                onChange={(e) => setRawPeso(e.target.value)}
              />

              {rawError && <p className="form-error-text">{rawError}</p>}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setRawModalVisible(false)}
                disabled={rawSubmitting}
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={rawSubmitting}
                style={{ backgroundColor: '#10b981' }}
              >
                {rawSubmitting ? "..." : "CADASTRAR"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

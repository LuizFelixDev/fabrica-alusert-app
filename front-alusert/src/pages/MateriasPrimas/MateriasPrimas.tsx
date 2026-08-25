import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  WifiOff, 
  X, 
  Trash2, 
  Edit, 
  AlertCircle,
  Package
} from "lucide-react";
import "./MateriasPrimas.css";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";

interface MateriaPrima {
  id: number;
  nome: string;
  descricao: string | null;
  unidade_medida: string;
  quantidade_estoque: number | string;
  valor_unitario: number | string;
  estoque_minimo: number | string;
  tipo_componente: string | null;
  diametro_mm: number | string | null;
  altura_mm: number | string | null;
  peso: number | string | null;
}

interface MateriasPrimasProps {
  onBack?: () => void;
}

// Available Units from Postgres ENUM
const UNIDADES_MEDIDA = [
  "kg",
  "m",
  "m²",
  "L",
  "un",
  "pç",
  "cx",
  "barra",
  "bobina",
  "rolo"
];

export default function MateriasPrimas({ onBack }: MateriasPrimasProps) {
  const [materials, setMaterials] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("TODOS");

  // Modal States
  const [selectedMaterial, setSelectedMaterial] = useState<MateriaPrima | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form States
  const [formNome, setFormNome] = useState<string>("");
  const [formDescricao, setFormDescricao] = useState<string>("");
  const [formUnidade, setFormUnidade] = useState<string>("kg");
  const [formQuantidadeEstoque, setFormQuantidadeEstoque] = useState<string>("");
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState<string>("");
  const [formValorUnitario, setFormValorUnitario] = useState<string>("");
  const [formTipoComponente, setFormTipoComponente] = useState<string>("");
  const [formDiametro, setFormDiametro] = useState<string>("");
  const [formAltura, setFormAltura] = useState<string>("");
  const [formPeso, setFormPeso] = useState<string>("");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Raw Materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.materiasPrimas);
      if (!res.ok) throw new Error("Erro ao buscar matérias-primas do servidor");
      const data = await res.json();
      setMaterials(data);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Form Submission
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Simple validation
    if (!formNome.trim() || !formUnidade.trim()) {
      setFormError("Os campos Nome e Unidade de Medida são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing && selectedMaterial 
        ? `${ENDPOINTS.materiasPrimas}/${selectedMaterial.id}` 
        : ENDPOINTS.materiasPrimas;
      const method = isEditing ? "PUT" : "POST";

      const body = {
        nome: formNome.trim(),
        descricao: formDescricao.trim() || null,
        unidade_medida: formUnidade.trim(),
        quantidade_estoque: formQuantidadeEstoque ? parseFloat(formQuantidadeEstoque) : 0,
        valor_unitario: formValorUnitario ? parseFloat(formValorUnitario) : 0,
        estoque_minimo: formEstoqueMinimo ? parseFloat(formEstoqueMinimo) : 0,
        tipo_componente: formTipoComponente.trim() || null,
        diametro_mm: formDiametro ? parseFloat(formDiametro) : null,
        altura_mm: formAltura ? parseFloat(formAltura) : null,
        peso: formPeso ? parseFloat(formPeso) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Erro ao salvar matéria-prima");
      }

      await fetchMaterials();
      setFormModalVisible(false);
      
      // Update details view if editing
      if (isEditing) {
        setSelectedMaterial(resData);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Raw Material
  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta matéria-prima?")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${ENDPOINTS.materiasPrimas}/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao deletar matéria-prima");
      }

      setDetailsModalVisible(false);
      setSelectedMaterial(null);
      await fetchMaterials();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir matéria-prima.");
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Form
  const openEditForm = (mat: MateriaPrima) => {
    setFormError(null);
    setIsEditing(true);
    setFormNome(mat.nome);
    setFormDescricao(mat.descricao || "");
    setFormUnidade(mat.unidade_medida);
    setFormQuantidadeEstoque(String(mat.quantidade_estoque));
    setFormEstoqueMinimo(String(mat.estoque_minimo));
    setFormValorUnitario(String(mat.valor_unitario));
    setFormTipoComponente(mat.tipo_componente || "");
    setFormDiametro(mat.diametro_mm !== null ? String(mat.diametro_mm) : "");
    setFormAltura(mat.altura_mm !== null ? String(mat.altura_mm) : "");
    setFormPeso(mat.peso !== null ? String(mat.peso) : "");
    
    setDetailsModalVisible(false);
    setFormModalVisible(true);
  };

  // Open Create Form
  const openNewForm = () => {
    setFormError(null);
    setIsEditing(false);
    setFormNome("");
    setFormDescricao("");
    setFormUnidade("kg");
    setFormQuantidadeEstoque("");
    setFormEstoqueMinimo("");
    setFormValorUnitario("");
    setFormTipoComponente("");
    setFormDiametro("");
    setFormAltura("");
    setFormPeso("");
    setFormModalVisible(true);
  };

  // Pricing format helper
  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0,00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0,00" : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Style component tags dynamically
  const getTagStyle = (componentType?: string | null) => {
    const clean = (componentType || "").toUpperCase().trim();
    if (!clean) return { bg: "#f1f5f9", text: "#475569" };
    if (clean.includes("DISCO")) return { bg: "#eff6ff", text: "#2563eb" };
    if (clean.includes("CHAPA")) return { bg: "#f5f3ff", text: "#7c3aed" };
    if (clean.includes("BARRA")) return { bg: "#fff7ed", text: "#ea580c" };
    return { bg: "#f0fdf4", text: "#16a34a" };
  };

  // Filters logic
  const filteredMaterials = materials.filter(m => {
    // 1. Text filter
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      m.nome.toLowerCase().includes(q) ||
      (m.descricao && m.descricao.toLowerCase().includes(q)) ||
      (m.tipo_componente && m.tipo_componente.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // 2. Chip Filter
    if (selectedFilter === "ESTOQUE BAIXO") {
      return Number(m.quantidade_estoque) < Number(m.estoque_minimo);
    }
    if (selectedFilter === "COMPONENTES") {
      return !!m.tipo_componente && m.tipo_componente.trim() !== "";
    }

    return true;
  });

  return (
    <div className="materias-primas-container page-content">
      {/* Header */}
      <header className="header-container">
        <div className="header-left">
          <button className="back-button" onClick={onBack} title="Voltar ao início">
            <ChevronLeft size={24} color="#64748b" />
          </button>
          <div className="title-container">
            <h2 className="header-title">MATÉRIAS-PRIMAS</h2>
            <span className="header-subtitle">
              {loading ? "Carregando..." : `${materials.length} itens`}
            </span>
          </div>
        </div>

        <button className="new-button" onClick={openNewForm}>
          + NOVO
        </button>
      </header>

      {/* Category filters bar */}
      {!loading && !error && (
        <div className="filters-container">
          <div className="filters-scroll">
            {["TODOS", "ESTOQUE BAIXO", "COMPONENTES"].map((filter) => {
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

      {/* Search Filter */}
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar por nome, descrição ou componente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loader */}
      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <span className="loader-text">Carregando estoque...</span>
        </div>
      )}

      {/* Connection error */}
      {!loading && error && (
        <div className="center-container">
          <WifiOff size={48} color={colors.error.text} className="error-icon" />
          <p className="error-msg-text">{error}</p>
          <button className="retry-button" onClick={fetchMaterials}>Tentar Recarregar</button>
        </div>
      )}

      {/* Materials List */}
      {!loading && !error && (
        <div className="materials-list-wrapper">
          <div className="counter-container">
            <span className="counter-text">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? "ITEM" : "ITENS"}
            </span>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="center-container">
              <Package size={40} color={colors.textSecondary} className="empty-icon" />
              <span className="counter-text">Nenhuma matéria-prima cadastrada ou encontrada.</span>
            </div>
          ) : (
            <div className="materials-card">
              {filteredMaterials.map((mat) => {
                const isLowStock = Number(mat.quantidade_estoque) < Number(mat.estoque_minimo);
                const tagColors = getTagStyle(mat.tipo_componente);

                return (
                  <button
                    key={mat.id}
                    className="material-item-btn"
                    onClick={() => {
                      setSelectedMaterial(mat);
                      setDetailsModalVisible(true);
                    }}
                  >
                    <div className="material-details-left">
                      <span className="material-name">{mat.nome}</span>
                      
                      {mat.tipo_componente && (
                        <div className="tag" style={{ backgroundColor: tagColors.bg }}>
                          <span className="tag-text" style={{ color: tagColors.text }}>
                            {mat.tipo_componente.toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="material-meta-row">
                        <span className="material-meta-text">
                          Estoque:{" "}
                          <span className={`material-meta-val ${isLowStock ? 'stock-alert' : ''}`}>
                            {Number(mat.quantidade_estoque).toLocaleString('pt-BR')} {mat.unidade_medida}
                          </span>
                        </span>
                        
                        {isLowStock && (
                          <span className="stock-alert" style={{ fontSize: '10px', fontWeight: 'bold' }}>
                            ⚠️ Baixo!
                          </span>
                        )}
                      </div>

                      {/* Spec tags */}
                      {(mat.diametro_mm || mat.altura_mm || mat.peso) && (
                        <div className="specs-container">
                          {mat.diametro_mm && (
                            <div className="spec-badge">
                              <span className="spec-badge-text">Ø {Number(mat.diametro_mm)}mm</span>
                            </div>
                          )}
                          {mat.altura_mm && (
                            <div className="spec-badge">
                              <span className="spec-badge-text">Alt: {Number(mat.altura_mm)}mm</span>
                            </div>
                          )}
                          {mat.peso && (
                            <div className="spec-badge">
                              <span className="spec-badge-text">{Number(mat.peso)} kg</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="price-container">
                      <span className="price-value">
                        {formatPrice(mat.valor_unitario)}
                      </span>
                      <span className="price-unit">
                        /{mat.unidade_medida}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Details View */}
      {detailsModalVisible && selectedMaterial && (
        <div className="modal-overlay">
          <div className="details-modal-content">
            <div className="details-header">
              <div>
                <span className="details-material-title">{selectedMaterial.nome}</span>
                {selectedMaterial.tipo_componente && (
                  <div 
                    className="tag" 
                    style={{ 
                      backgroundColor: getTagStyle(selectedMaterial.tipo_componente).bg, 
                      marginTop: '4px' 
                    }}
                  >
                    <span className="tag-text" style={{ color: getTagStyle(selectedMaterial.tipo_componente).text }}>
                      {selectedMaterial.tipo_componente.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <button 
                className="close-details-button"
                onClick={() => {
                  setDetailsModalVisible(false);
                  setSelectedMaterial(null);
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="details-body">
              {selectedMaterial.descricao && (
                <div className="details-section">
                  <span className="details-section-label">DESCRIÇÃO</span>
                  <div className="details-desc-text">{selectedMaterial.descricao}</div>
                </div>
              )}

              {/* Informações Gerais */}
              <div className="details-section">
                <span className="details-section-label">INFORMAÇÕES DE ESTOQUE</span>
                <div className="details-grid">
                  <div className="details-grid-item">
                    <span className="details-item-label">Estoque Atual</span>
                    <span className={`details-item-value ${Number(selectedMaterial.quantidade_estoque) < Number(selectedMaterial.estoque_minimo) ? 'stock-alert' : ''}`}>
                      {Number(selectedMaterial.quantidade_estoque).toLocaleString('pt-BR')} {selectedMaterial.unidade_medida}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Estoque Mínimo</span>
                    <span className="details-item-value">
                      {Number(selectedMaterial.estoque_minimo).toLocaleString('pt-BR')} {selectedMaterial.unidade_medida}
                    </span>
                  </div>
                  <div className="details-grid-item">
                    <span className="details-item-label">Unidade de Medida</span>
                    <span className="details-item-value">
                      {selectedMaterial.unidade_medida}
                    </span>
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="details-section">
                <span className="details-section-label">VALORES</span>
                <div className="details-grid">
                  <div className="details-grid-item" style={{ minWidth: '100%' }}>
                    <span className="details-item-label">Preço/Valor Unitário</span>
                    <span className="details-item-value" style={{ color: colors.success.text, fontSize: '14px' }}>
                      {formatPrice(selectedMaterial.valor_unitario)} /{selectedMaterial.unidade_medida}
                    </span>
                  </div>
                </div>
              </div>

              {/* Especificações Físicas */}
              {(selectedMaterial.diametro_mm || selectedMaterial.altura_mm || selectedMaterial.peso) && (
                <div className="details-section">
                  <span className="details-section-label">ESPECIFICAÇÕES FÍSICAS</span>
                  <div className="details-grid">
                    {selectedMaterial.diametro_mm && (
                      <div className="details-grid-item">
                        <span className="details-item-label">Diâmetro (Ø)</span>
                        <span className="details-item-value">{Number(selectedMaterial.diametro_mm)} mm</span>
                      </div>
                    )}
                    {selectedMaterial.altura_mm && (
                      <div className="details-grid-item">
                        <span className="details-item-label">Altura</span>
                        <span className="details-item-value">{Number(selectedMaterial.altura_mm)} mm</span>
                      </div>
                    )}
                    {selectedMaterial.peso && (
                      <div className="details-grid-item">
                        <span className="details-item-label">Peso</span>
                        <span className="details-item-value">{Number(selectedMaterial.peso)} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons footer */}
            <div className="details-footer">
              <button
                className="details-delete-button"
                onClick={() => handleDeleteMaterial(selectedMaterial.id)}
              >
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                EXCLUIR
              </button>
              <button
                className="details-edit-button"
                onClick={() => openEditForm(selectedMaterial)}
              >
                <Edit size={16} style={{ marginRight: '6px' }} />
                EDITAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Form Create/Edit */}
      {formModalVisible && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveMaterial}>
            <h3 className="modal-title">
              {isEditing ? "Editar Matéria-Prima" : "Nova Matéria-Prima"}
            </h3>

            <div className="form-scroll">
              <label className="input-label">NOME DO MATERIAL *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Disco Alumínio Ø120"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
              />

              <label className="input-label">DESCRIÇÃO</label>
              <textarea
                className="input textarea"
                placeholder="Descrição ou observações..."
                rows={3}
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">UNIDADE DE MEDIDA *</label>
                  <select
                    className="input"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    required
                    style={{ appearance: 'auto', paddingLeft: '8px' }}
                  >
                    {UNIDADES_MEDIDA.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="half-input-container">
                  <label className="input-label">VALOR UNITÁRIO (R$)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 14.50"
                    value={formValorUnitario}
                    onChange={(e) => setFormValorUnitario(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">ESTOQUE ATUAL</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="0.00"
                    value={formQuantidadeEstoque}
                    onChange={(e) => setFormQuantidadeEstoque(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ESTOQUE MÍNIMO</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="0.00"
                    value={formEstoqueMinimo}
                    onChange={(e) => setFormEstoqueMinimo(e.target.value)}
                  />
                </div>
              </div>

              <div className="disc-section-header" style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px' }}>
                <span className="disc-section-title">PROPRIEDADES ADICIONAIS / DISCOS</span>
              </div>

              <label className="input-label">TIPO DE COMPONENTE</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Disco, Chapa, Tarugo"
                value={formTipoComponente}
                onChange={(e) => setFormTipoComponente(e.target.value)}
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">DIÂMETRO (MM)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 120"
                    value={formDiametro}
                    onChange={(e) => setFormDiametro(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ALTURA (MM)</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder="Ex: 8"
                    value={formAltura}
                    onChange={(e) => setFormAltura(e.target.value)}
                  />
                </div>
              </div>

              <label className="input-label">PESO INDIVIDUAL (KG)</label>
              <input
                type="number"
                step="any"
                className="input"
                placeholder="Ex: 0.150"
                value={formPeso}
                onChange={(e) => setFormPeso(e.target.value)}
              />

              {formError && (
                <div className="form-error-banner">
                  <AlertCircle size={14} color={colors.error.text} style={{ marginRight: '6px', flexShrink: 0 }} />
                  <span className="form-error-text">{formError}</span>
                </div>
              )}
            </div>

            <div className="button-row">
              <button 
                type="button"
                className="cancel-button"
                onClick={() => setFormModalVisible(false)}
                disabled={submitting}
              >
                CANCELAR
              </button>
              <button 
                type="submit"
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? "SALVANDO..." : (isEditing ? "SALVAR" : "CADASTRAR")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

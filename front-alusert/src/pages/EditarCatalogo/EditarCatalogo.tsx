import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  Search, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Tag
} from "lucide-react";
import { catalogoApi } from "../../services/catalogoApi";
import type { CatalogoItem, UpdateCatalogoItemPayload } from "../../services/catalogoApi";
import "./EditarCatalogo.css";

interface EditarCatalogoProps {
  catalogoId: number;
  clienteNome?: string;
  tokenLinkInitial?: string;
  ativoInitial?: boolean;
  onBack: () => void;
}

export default function EditarCatalogo({
  catalogoId,
  clienteNome,
  tokenLinkInitial,
  ativoInitial = true,
  onBack
}: EditarCatalogoProps) {
  // State for Catalog metadata
  const [tokenLink] = useState<string>(tokenLinkInitial || "");
  const [ativo, setAtivo] = useState<boolean>(ativoInitial);
  const [togglingAtivo, setTogglingAtivo] = useState<boolean>(false);

  // Items State
  const [initialItems, setInitialItems] = useState<CatalogoItem[]>([]);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [filterText, setFilterText] = useState<string>("");

  // Saving state & feedback
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Validation state: map of product ID to error message if any
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  // Auto hide toast message after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load items from API
  const fetchItens = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogoApi.getCatalogoItens(catalogoId);
      setInitialItems(JSON.parse(JSON.stringify(data)));
      setItems(JSON.parse(JSON.stringify(data)));
      setValidationErrors({});
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Não foi possível carregar os produtos do catálogo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItens();
  }, [catalogoId]);

  // Toggle active status (PATCH /catalogos/:id)
  const handleToggleAtivo = async () => {
    const nextState = !ativo;
    setAtivo(nextState);
    setTogglingAtivo(true);

    try {
      await catalogoApi.toggleCatalogoAtivo(catalogoId, nextState);
      setToastMessage({
        type: "success",
        text: `Catálogo ${nextState ? "ativado" : "desativado"} com sucesso!`
      });
    } catch (err: any) {
      console.error("Erro ao alterar status do catálogo:", err);
      // Revert state on error
      setAtivo(!nextState);
      setToastMessage({
        type: "error",
        text: err.message || "Falha ao alterar status do catálogo."
      });
    } finally {
      setTogglingAtivo(false);
    }
  };

  // Copy public link to clipboard
  const handleCopyLink = () => {
    const domain = window.location.origin;
    const publicUrl = tokenLink ? `${domain}/c/${tokenLink}` : `${domain}/c/cat_${catalogoId}`;

    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(err => {
      console.error("Erro ao copiar link:", err);
    });
  };

  // Inline changes handlers
  const handlePrecoNegociadoChange = (idProduto: number, valueStr: string) => {
    const newValidationErrors = { ...validationErrors };

    // Sanitization & parsing
    if (valueStr === "" || valueStr === null || valueStr === undefined) {
      delete newValidationErrors[idProduto];
    } else {
      const parsed = parseFloat(valueStr.replace(",", "."));
      if (isNaN(parsed) || parsed <= 0) {
        newValidationErrors[idProduto] = "O preço deve ser um valor positivo (maior que R$ 0).";
      } else {
        delete newValidationErrors[idProduto];
      }
    }
    setValidationErrors(newValidationErrors);

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id_produto === idProduto) {
          if (valueStr === "") {
            return { ...item, preco_negociado: null };
          }
          const numVal = parseFloat(valueStr.replace(",", "."));
          return { ...item, preco_negociado: isNaN(numVal) ? null : numVal };
        }
        return item;
      })
    );
  };

  const handleVisivelToggle = (idProduto: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id_produto === idProduto
          ? { ...item, visivel: !item.visivel }
          : item
      )
    );
  };

  // Filter products by search input
  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const q = filterText.toLowerCase().trim();
    return items.filter(item => item.nome_produto.toLowerCase().includes(q));
  }, [items, filterText]);

  // Check if any items have changed compared to initialItems
  const modifiedItems = useMemo(() => {
    const delta: UpdateCatalogoItemPayload[] = [];

    items.forEach(item => {
      const initial = initialItems.find(i => i.id_produto === item.id_produto);
      if (!initial) {
        delta.push({
          id_produto: item.id_produto,
          preco_negociado: item.preco_negociado,
          visivel: item.visivel
        });
      } else {
        const priceChanged = item.preco_negociado !== initial.preco_negociado;
        const visivelChanged = item.visivel !== initial.visivel;
        if (priceChanged || visivelChanged) {
          delta.push({
            id_produto: item.id_produto,
            preco_negociado: item.preco_negociado,
            visivel: item.visivel
          });
        }
      }
    });

    return delta;
  }, [items, initialItems]);

  const hasChanges = modifiedItems.length > 0;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Handle Save (PUT /catalogos/:id/itens)
  const handleSave = async () => {
    if (!hasChanges || hasValidationErrors) return;

    try {
      setSaving(true);
      // We can send the modified delta items (or full list). Let's send the modified delta.
      await catalogoApi.updateCatalogoItens(catalogoId, modifiedItems);
      
      // Update baseline state on successful save
      setInitialItems(JSON.parse(JSON.stringify(items)));
      setToastMessage({
        type: "success",
        text: `Sucesso! ${modifiedItems.length} produto(s) atualizado(s) no catálogo.`
      });
    } catch (err: any) {
      console.error("Erro ao salvar catálogo:", err);
      setToastMessage({
        type: "error",
        text: err.message || "Erro ao salvar alterações no catálogo."
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper: Format BRL Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Helper: Calculate discount or surcharge percentage badge
  const renderPriceBadge = (precoVenda: number, precoNegociado: number | null) => {
    if (precoNegociado === null || precoNegociado <= 0 || precoNegociado === precoVenda) {
      return null;
    }

    const diffPercent = ((precoNegociado - precoVenda) / precoVenda) * 100;
    const isDiscount = diffPercent < 0;
    const formattedPercent = Math.abs(diffPercent).toFixed(0);

    if (isDiscount) {
      return (
        <span className="badge-discount" title={`Desconto de ${formattedPercent}% sobre o preço normal`}>
          -{formattedPercent}%
        </span>
      );
    } else {
      return (
        <span className="badge-increase" title={`Aumento de ${formattedPercent}% sobre o preço normal`}>
          +{formattedPercent}%
        </span>
      );
    }
  };

  // Domain for public link representation
  const publicLinkDisplay = tokenLink 
    ? `seusite.com/c/${tokenLink}` 
    : `seusite.com/c/cat_${catalogoId}`;

  return (
    <div className="editar-catalogo-container page-content">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="catalogo-header">
        <div className="catalogo-header-left">
          <button className="back-button" onClick={onBack} title="Voltar para Clientes">
            <ChevronLeft size={24} color="#64748b" />
          </button>
          <div className="catalogo-header-title-box">
            <div className="catalogo-header-badge-row">
              <span className="catalogo-tag"><Tag size={12} /> Catálogo do Cliente</span>
            </div>
            <h2 className="catalogo-cliente-name">
              {clienteNome || `Cliente #${catalogoId}`}
            </h2>
          </div>
        </div>

        {/* Toggle Switch Ativo/Inativo */}
        <div className="catalogo-status-toggle">
          <span className={`status-label ${ativo ? "ativo" : "inativo"}`}>
            {ativo ? "Ativo" : "Inativo"}
          </span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={ativo} 
              disabled={togglingAtivo}
              onChange={handleToggleAtivo}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </header>

      {/* Public Link Card */}
      <div className="link-card">
        <div className="link-info-col">
          <span className="link-label">Link Público de Acesso</span>
          <div className="link-url-box">
            <ExternalLink size={14} className="link-icon" />
            <span className="link-url-text">{publicLinkDisplay}</span>
          </div>
        </div>

        <button 
          className={`copy-link-btn ${copiedLink ? "copied" : ""}`}
          onClick={handleCopyLink}
          title="Copiar link do catálogo para área de transferência"
        >
          {copiedLink ? (
            <>
              <Check size={16} />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copiar Link</span>
            </>
          )}
        </button>
      </div>

      {/* Filter / Search Bar above table */}
      <div className="catalogo-filter-bar">
        <div className="filter-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="catalogo-search-input"
            placeholder="Buscar produto neste catálogo..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
          {filterText && (
            <button className="clear-search-btn" onClick={() => setFilterText("")}>
              ✕
            </button>
          )}
        </div>
        
        <div className="table-stats">
          <span>{filteredItems.length} de {items.length} produtos</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="catalogo-loading-state">
          <RefreshCw size={32} className="spin-icon" />
          <span>Carregando itens do catálogo...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="catalogo-error-card">
          <AlertCircle size={40} className="error-icon" />
          <h3>Erro ao carregar dados</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchItens}>
            <RefreshCw size={16} /> Tentar Novamente
          </button>
        </div>
      )}

      {/* Table Content */}
      {!loading && !error && (
        <div className="catalogo-table-wrapper">
          {filteredItems.length === 0 ? (
            <div className="empty-table-state">
              <p>Nenhum produto encontrado com a busca "{filterText}".</p>
            </div>
          ) : (
            <table className="catalogo-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Produto</th>
                  <th style={{ width: "20%" }}>Preço Normal</th>
                  <th style={{ width: "30%" }}>Preço Negociado</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Visível</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const hasError = !!validationErrors[item.id_produto];
                  const rawInputValue = item.preco_negociado !== null ? String(item.preco_negociado) : "";

                  return (
                    <tr 
                      key={item.id_produto} 
                      className={`catalogo-row ${!item.visivel ? "row-hidden" : ""} ${hasError ? "row-error" : ""}`}
                    >
                      {/* 1. Nome do Produto */}
                      <td className="col-produto">
                        <div className="product-name-box">
                          <span className="product-name">{item.nome_produto}</span>
                          {!item.visivel && (
                            <span className="badge-oculto">Oculto</span>
                          )}
                        </div>
                      </td>

                      {/* 2. Preço Normal */}
                      <td className="col-preco-normal">
                        <span className="preco-normal-val">
                          {formatCurrency(item.preco_venda)}
                        </span>
                      </td>

                      {/* 3. Preço Negociado (Editable Input + Badge) */}
                      <td className="col-preco-negociado">
                        <div className="input-negociado-cell">
                          <div className="input-currency-wrapper">
                            <span className="currency-prefix">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              className={`preco-input ${hasError ? "input-invalid" : ""}`}
                              placeholder={formatCurrency(item.preco_venda).replace("R$", "").trim()}
                              value={rawInputValue}
                              onChange={e => handlePrecoNegociadoChange(item.id_produto, e.target.value)}
                            />
                          </div>

                          {/* Discount / Increase percentage badge */}
                          {renderPriceBadge(item.preco_venda, item.preco_negociado)}
                        </div>

                        {hasError && (
                          <span className="inline-error-msg">{validationErrors[item.id_produto]}</span>
                        )}
                      </td>

                      {/* 4. Visível Checkbox */}
                      <td className="col-visivel" style={{ textAlign: "center" }}>
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={item.visivel}
                            onChange={() => handleVisivelToggle(item.id_produto)}
                          />
                          <span className="checkmark">
                            {item.visivel ? <Eye size={16} /> : <EyeOff size={16} />}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sticky Bottom Action Bar with "Salvar alterações" */}
      {!loading && !error && (
        <div className="catalogo-footer-bar">
          <div className="footer-status-text">
            {hasValidationErrors ? (
              <span className="status-err"><AlertCircle size={16} /> Corrija os erros destacados antes de salvar</span>
            ) : hasChanges ? (
              <span className="status-mod"><span className="dot-pulse"></span> {modifiedItems.length} alteração(ões) pendente(s)</span>
            ) : (
              <span className="status-clean">Sem alterações pendentes</span>
            )}
          </div>

          <button
            className="save-changes-btn"
            disabled={!hasChanges || hasValidationErrors || saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Salvar alterações</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

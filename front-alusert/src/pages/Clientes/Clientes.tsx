import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  WifiOff, 
  User, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle,
  BookOpen,
  RefreshCw,
  Search,
  Plus
} from "lucide-react";
import "./Clientes.css";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";
import { catalogoApi } from "../../services/catalogoApi";
import EditarCatalogo from "../EditarCatalogo/EditarCatalogo";

export interface Client {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  email: string | null;
  rua?: string;
  bairro?: string;
  cidade: string | null;
  estado: string | null;
  data_cadastro?: string;
}

interface SelectedCatalogState {
  id: number;
  clienteNome: string;
  tokenLink?: string;
  ativo?: boolean;
}

interface ClientesProps {
  onBack?: () => void;
}

export default function Clientes({ onBack }: ClientesProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search state with ~400ms debounce
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // Screen 2 active catalog state
  const [activeCatalog, setActiveCatalog] = useState<SelectedCatalogState | null>(null);
  const [openingCatalogId, setOpeningCatalogId] = useState<number | null>(null);

  // Modal States for Client creation/editing/details
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form States
  const [formNome, setFormNome] = useState<string>("");
  const [formCpfCnpj, setFormCpfCnpj] = useState<string>("");
  const [formTelefone, setFormTelefone] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formRua, setFormRua] = useState<string>("");
  const [formBairro, setFormBairro] = useState<string>("");
  const [formCidade, setFormCidade] = useState<string>("");
  const [formEstado, setFormEstado] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Debounce handler (~400ms) for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Clients from API with optional search filter GET /clientes?busca=texto
  const fetchClients = async (query: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogoApi.getClientes(query);
      setClients(data);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível carregar a lista de clientes. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when debounced search term updates
  useEffect(() => {
    fetchClients(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Handle clicking "Catálogo" button -> POST /clientes/:id/catalogo & navigate to Screen 2
  const handleOpenCatalogo = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details modal
    try {
      setOpeningCatalogId(client.id);
      const catalogData = await catalogoApi.getOrCreateCatalogo(client.id);

      setActiveCatalog({
        id: catalogData.id,
        clienteNome: client.nome,
        tokenLink: catalogData.token_link,
        ativo: catalogData.ativo
      });
    } catch (err: any) {
      console.error("Erro ao abrir catálogo do cliente:", err);
      alert(err.message || "Erro ao abrir ou criar o catálogo deste cliente.");
    } finally {
      setOpeningCatalogId(null);
    }
  };

  // Handle Save Client (Create or Update)
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNome.trim() || !formCpfCnpj.trim()) {
      setFormError("Os campos Nome e CPF/CNPJ são obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing && selectedClient 
        ? `${ENDPOINTS.clientes}/${selectedClient.id}` 
        : ENDPOINTS.clientes;
      const method = isEditing ? "PUT" : "POST";

      const body = {
        nome: formNome.trim(),
        cpf_cnpj: formCpfCnpj.trim(),
        telefone: formTelefone.trim() || null,
        email: formEmail.trim() || null,
        rua: formRua.trim() || null,
        bairro: formBairro.trim() || null,
        cidade: formCidade.trim() || null,
        estado: formEstado.trim().toUpperCase() || null
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || resData.message || "Erro ao salvar cliente");
      }

      await fetchClients(debouncedSearchTerm);
      setFormModalVisible(false);
      
      if (isEditing) {
        setSelectedClient(resData);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Client
  const handleDeleteClient = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este cliente? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${ENDPOINTS.clientes}/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao deletar cliente");
      }

      setDetailsModalVisible(false);
      setSelectedClient(null);
      await fetchClients(debouncedSearchTerm);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir cliente.");
    } finally {
      setLoading(false);
    }
  };

  // Open Form for Editing
  const openEditForm = (client: Client) => {
    setFormError(null);
    setIsEditing(true);
    setFormNome(client.nome);
    setFormCpfCnpj(client.cpf_cnpj);
    setFormTelefone(client.telefone || "");
    setFormEmail(client.email || "");
    setFormRua(client.rua || "");
    setFormBairro(client.bairro || "");
    setFormCidade(client.cidade || "");
    setFormEstado(client.estado || "");
    
    setDetailsModalVisible(false);
    setFormModalVisible(true);
  };

  // Open Form for Creating New
  const openNewForm = () => {
    setFormError(null);
    setIsEditing(false);
    setFormNome("");
    setFormCpfCnpj("");
    setFormTelefone("");
    setFormEmail("");
    setFormRua("");
    setFormBairro("");
    setFormCidade("");
    setFormEstado("");
    setFormModalVisible(true);
  };

  // Format Date
  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  // IF Screen 2 "Editar Catálogo" is active, render EditarCatalogo component
  if (activeCatalog) {
    return (
      <EditarCatalogo
        catalogoId={activeCatalog.id}
        clienteNome={activeCatalog.clienteNome}
        tokenLinkInitial={activeCatalog.tokenLink}
        ativoInitial={activeCatalog.ativo}
        onBack={() => setActiveCatalog(null)}
      />
    );
  }

  return (
    <div className="clientes-container page-content">
      {/* Header */}
      <header className="header-container">
        <div className="header-left">
          {onBack && (
            <button className="back-button" onClick={onBack} title="Voltar ao início">
              <ChevronLeft size={24} color="#64748b" />
            </button>
          )}
          <div className="title-container">
            <h2 className="header-title">CLIENTES</h2>
            <span className="header-subtitle">
              {loading ? "Carregando..." : `${clients.length} cliente(s) encontrado(s)`}
            </span>
          </div>
        </div>

        <button className="new-button" onClick={openNewForm}>
          <Plus size={14} style={{ marginRight: 4 }} /> NOVO
        </button>
      </header>

      {/* Search Input with Debounce */}
      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-bar-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nome do cliente (busca automática com debounce)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-input-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="loading-container">
          <RefreshCw size={24} className="spin-icon" style={{ color: colors.primary }} />
          <span className="loading-text">Carregando lista de clientes...</span>
        </div>
      )}

      {/* Connection error */}
      {!loading && error && (
        <div className="connection-error-container">
          <WifiOff size={44} color={colors.error.text} style={{ marginBottom: "14px" }} />
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={() => fetchClients(debouncedSearchTerm)}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Tentar Recarregar
          </button>
        </div>
      )}

      {/* Clientes List */}
      {!loading && !error && (
        <div className="clients-list-wrapper">
          {clients.length === 0 ? (
            <div className="empty-state-container">
              <span>Nenhum cliente cadastrado ou encontrado para a busca.</span>
            </div>
          ) : (
            <div className="clients-card">
              {clients.map((client, idx) => {
                const isOpeningThis = openingCatalogId === client.id;

                return (
                  <div key={client.id} className="client-row-item">
                    <button
                      className="client-item-btn"
                      onClick={() => {
                        setSelectedClient(client);
                        setDetailsModalVisible(true);
                      }}
                    >
                      <div className="client-details-left">
                        <span className="client-name">{client.nome}</span>
                        <span className="client-subinfo">CPF/CNPJ: {client.cpf_cnpj}</span>
                        
                        {/* Telefone and Cidade display */}
                        <div className="client-meta-row">
                          {client.telefone && (
                            <span className="client-phone">📞 {client.telefone}</span>
                          )}
                          {client.cidade && (
                            <span className="client-cidade">📍 {client.cidade}{client.estado ? ` - ${client.estado}` : ""}</span>
                          )}
                        </div>
                      </div>

                      {/* Botão "Catálogo" */}
                      <div className="client-details-right">
                        <button
                          className="btn-open-catalogo"
                          disabled={isOpeningThis}
                          onClick={(e) => handleOpenCatalogo(client, e)}
                          title="Gerenciar catálogo de preços deste cliente"
                        >
                          {isOpeningThis ? (
                            <>
                              <RefreshCw size={14} className="spin-icon" />
                              <span>Abrindo...</span>
                            </>
                          ) : (
                            <>
                              <BookOpen size={14} />
                              <span>Catálogo</span>
                            </>
                          )}
                        </button>
                      </div>
                    </button>
                    {idx < clients.length - 1 && (
                      <div className="client-item-divider" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Details View */}
      {detailsModalVisible && selectedClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="details-client-title">Detalhes do Cliente</span>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setDetailsModalVisible(false);
                  setSelectedClient(null);
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div className="form-scroll">
              <div className="info-block">
                <User size={16} color={colors.primary} className="info-icon" />
                <div>
                  <span className="info-label">Nome Completo</span>
                  <span className="info-val">{selectedClient.nome}</span>
                </div>
              </div>

              <div className="info-block">
                <AlertCircle size={16} color={colors.primary} className="info-icon" />
                <div>
                  <span className="info-label">CPF / CNPJ</span>
                  <span className="info-val">{selectedClient.cpf_cnpj}</span>
                </div>
              </div>

              {selectedClient.telefone && (
                <div className="info-block">
                  <Phone size={16} color={colors.primary} className="info-icon" />
                  <div>
                    <span className="info-label">Telefone</span>
                    <span className="info-val">{selectedClient.telefone}</span>
                  </div>
                </div>
              )}

              {selectedClient.email && (
                <div className="info-block">
                  <Mail size={16} color={colors.primary} className="info-icon" />
                  <div>
                    <span className="info-label">E-mail</span>
                    <span className="info-val">{selectedClient.email}</span>
                  </div>
                </div>
              )}

              {(selectedClient.rua || selectedClient.cidade) && (
                <div className="info-block">
                  <MapPin size={16} color={colors.primary} className="info-icon" />
                  <div>
                    <span className="info-label">Endereço</span>
                    <span className="info-val">
                      {selectedClient.rua && `${selectedClient.rua}`}
                      {selectedClient.bairro && `, ${selectedClient.bairro}`}
                      {selectedClient.cidade && `, ${selectedClient.cidade}`}
                      {selectedClient.estado && ` - ${selectedClient.estado.toUpperCase()}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="info-block">
                <Calendar size={16} color={colors.primary} className="info-icon" />
                <div>
                  <span className="info-label">Cadastrado Em</span>
                  <span className="info-val">{formatDate(selectedClient.data_cadastro)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div className="action-buttons-group">
                <button
                  className="action-btn btn-delete"
                  onClick={() => handleDeleteClient(selectedClient.id)}
                >
                  EXCLUIR
                </button>
                <button
                  className="action-btn btn-edit"
                  onClick={() => openEditForm(selectedClient)}
                >
                  EDITAR
                </button>
                <button
                  className="action-btn btn-catalogo-modal"
                  onClick={(e) => {
                    setDetailsModalVisible(false);
                    handleOpenCatalogo(selectedClient, e);
                  }}
                >
                  <BookOpen size={14} style={{ marginRight: 4 }} /> CATÁLOGO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Form Create/Edit */}
      {formModalVisible && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveClient}>
            <h3 className="modal-title">
              {isEditing ? "Editar Cliente" : "Cadastrar Cliente"}
            </h3>

            <div className="form-scroll">
              <label className="input-label">NOME COMPLETO *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Alusert Serralheria"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
              />

              <label className="input-label">CPF / CNPJ *</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: 123.456.789-00 ou 12.345.678/0001-99"
                value={formCpfCnpj}
                onChange={(e) => setFormCpfCnpj(e.target.value)}
                required
              />

              <div className="form-row">
                <div className="half-input-container">
                  <label className="input-label">TELEFONE</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: (81) 98888-8888"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">E-MAIL</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="cliente@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: "8px" }}>
                <div className="half-input-container">
                  <label className="input-label">RUA / LOGRADOURO</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Av. Principal, 100"
                    value={formRua}
                    onChange={(e) => setFormRua(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">BAIRRO</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Centro"
                    value={formBairro}
                    onChange={(e) => setFormBairro(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: "8px" }}>
                <div className="half-input-container">
                  <label className="input-label">CIDADE</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Caruaru"
                    value={formCidade}
                    onChange={(e) => setFormCidade(e.target.value)}
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">ESTADO (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    className="input"
                    placeholder="Ex: PE"
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div className="form-error-banner">
                  <AlertCircle size={14} color={colors.error.text} style={{ marginRight: "6px", flexShrink: 0 }} />
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

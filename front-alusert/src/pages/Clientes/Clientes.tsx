import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  WifiOff, 
  User, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertCircle
} from "lucide-react";
import "./Clientes.css";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";

interface Client {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  email: string | null;
  rua: string;
  bairro: string;
  cidade: string | null;
  estado: string | null;
  data_cadastro: string;
}

interface ClientesProps {
  onBack?: () => void;
}

export default function Clientes({ onBack }: ClientesProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal States
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

  // Fetch Clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.clientes);
      if (!res.ok) throw new Error("Erro ao buscar clientes do servidor");
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Handle Create or Update Submit
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Simple validation
    if (!formNome.trim() || !formCpfCnpj.trim() || !formRua.trim() || !formBairro.trim()) {
      setFormError("Os campos Nome, CPF/CNPJ, Rua e Bairro são obrigatórios.");
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
        rua: formRua.trim(),
        bairro: formBairro.trim(),
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
        throw new Error(resData.error || "Erro ao salvar cliente");
      }

      await fetchClients();
      setFormModalVisible(false);
      
      // If editing, update details view
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
      await fetchClients();
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
    setFormRua(client.rua);
    setFormBairro(client.bairro);
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
  const formatDate = (isoString: string) => {
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

  // Filter clients locally
  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nome.toLowerCase().includes(q) ||
      c.cpf_cnpj.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="clientes-container page-content">
      {/* Header toolbar */}
      <div className="toolbar">
        <button className="back-button" onClick={onBack} title="Voltar ao início">
          <ChevronLeft size={20} color={colors.textSecondary} />
          <span>Início</span>
        </button>

        <button className="new-button" onClick={openNewForm}>
          + CADASTRAR
        </button>
      </div>

      <div className="header-title-section" style={{ marginTop: '12px' }}>
        <span className="date-text">Gestão de Parceiros</span>
        <h2 className="main-title">
          CLIENTES <span className="highlight-text">CADASTRADOS</span>
        </h2>
      </div>

      {/* Search Filter */}
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar por nome, CPF/CNPJ ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loader */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Carregando clientes...</span>
        </div>
      )}

      {/* Connection error */}
      {!loading && error && (
        <div className="connection-error-container">
          <WifiOff size={48} color={colors.error.text} style={{ marginBottom: '14px' }} />
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={fetchClients}>Tentar Recarregar</button>
        </div>
      )}

      {/* Clientes List */}
      {!loading && !error && (
        <div className="clients-list-wrapper">
          {filteredClients.length === 0 ? (
            <div className="empty-state-container">
              <span>Nenhum cliente cadastrado ou encontrado.</span>
            </div>
          ) : (
            <div className="clients-card">
              {filteredClients.map((client, idx) => (
                <div key={client.id}>
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
                      <div className="client-meta-row">
                        {client.telefone && (
                          <span className="client-phone">📞 {client.telefone}</span>
                        )}
                        {client.email && (
                          <span className="client-email-mini">✉️ {client.email}</span>
                        )}
                      </div>
                    </div>
                  </button>
                  {idx < filteredClients.length - 1 && (
                    <div className="client-item-divider" />
                  )}
                </div>
              ))}
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

              <div className="info-block">
                <MapPin size={16} color={colors.primary} className="info-icon" />
                <div>
                  <span className="info-label">Endereço</span>
                  <span className="info-val">
                    {selectedClient.rua}, {selectedClient.bairro}
                    {selectedClient.cidade && `, ${selectedClient.cidade}`}
                    {selectedClient.estado && ` - ${selectedClient.estado.toUpperCase()}`}
                  </span>
                </div>
              </div>

              <div className="info-block">
                <Calendar size={16} color={colors.primary} className="info-icon" />
                <div>
                  <span className="info-label">Cadastrado Em</span>
                  <span className="info-val">{formatDate(selectedClient.data_cadastro)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons footer */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
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
                placeholder="Ex: João da Silva"
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

              <div className="form-row" style={{ marginTop: '8px' }}>
                <div className="half-input-container">
                  <label className="input-label">RUA / LOGRADOURO *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Av. Principal, 100"
                    value={formRua}
                    onChange={(e) => setFormRua(e.target.value)}
                    required
                  />
                </div>
                <div className="half-input-container">
                  <label className="input-label">BAIRRO *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Centro"
                    value={formBairro}
                    onChange={(e) => setFormBairro(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '8px' }}>
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

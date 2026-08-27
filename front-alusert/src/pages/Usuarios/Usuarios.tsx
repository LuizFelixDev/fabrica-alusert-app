import { useState, useEffect } from "react";
import { ChevronLeft, Trash2, X, Mail, User, Key, AlertCircle } from "lucide-react";
import { ENDPOINTS } from "../../constants/api";
import "./Usuarios.css";

interface UserItem {
  id: number;
  nome: string;
  email: string;
  cadastro: string;
}

interface UsuariosProps {
  onBack?: () => void;
  currentUser?: { id: number; nome: string; email: string };
}

export default function Usuarios({ onBack, currentUser }: UsuariosProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.usuarios);
      if (!res.ok) throw new Error("Erro ao buscar lista de usuários autorizados.");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setModalError("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      const res = await fetch(ENDPOINTS.usuarios, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          senha: senha
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar usuário.");
      }

      setUsers([...users, data]);
      setModalOpen(false);
      setNome("");
      setEmail("");
      setSenha("");
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Ocorreu um erro ao autorizar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: UserItem) => {
    if (currentUser && currentUser.id === userToDelete.id) {
      alert("Você não pode excluir o seu próprio usuário logado!");
      return;
    }

    if (!window.confirm(`Deseja realmente remover o acesso de ${userToDelete.nome} (${userToDelete.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`${ENDPOINTS.usuarios}/${userToDelete.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao remover usuário.");
      }

      setUsers(users.filter(u => u.id !== userToDelete.id));
      alert("Acesso removido com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Não foi possível remover o acesso do usuário.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="usuarios-container page-content">
      {/* Header */}
      <header className="header-container">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <ChevronLeft size={24} color="#64748b" />
          </button>
          <div className="title-container">
            <h2 className="header-title">ACESSOS</h2>
            <span className="header-subtitle">
              {loading ? "Carregando..." : `${users.length} e-mails autorizados`}
            </span>
          </div>
        </div>

        <button 
          className="new-button"
          onClick={() => {
            setModalError(null);
            setNome("");
            setEmail("");
            setSenha("");
            setModalOpen(true);
          }}
        >
          + NOVO
        </button>
      </header>

      {/* Main List */}
      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <span className="loader-text">Carregando usuários...</span>
        </div>
      ) : error ? (
        <div className="center-container">
          <AlertCircle size={40} color="#ef4444" />
          <span className="counter-text">{error}</span>
          <button className="retry-button" onClick={fetchUsers}>Tentar Novamente</button>
        </div>
      ) : (
        <div className="users-list-wrapper">
          <div className="counter-container">
            <span className="counter-text">E-MAILS QUE PODEM ENTRAR NO SISTEMA</span>
          </div>

          <div className="users-card">
            {users.map((user, idx) => {
              const isLast = idx === users.length - 1;
              const isSelf = currentUser?.id === user.id;

              return (
                <div key={user.id} className={`user-item-row ${!isLast ? 'user-item-divider' : ''}`}>
                  <div className="user-info-left">
                    <div className="user-icon-circle">
                      <User size={18} color="#0284c7" />
                    </div>
                    <div className="user-details-text">
                      <span className="user-name">
                        {user.nome} {isSelf && <span className="self-tag">(Você)</span>}
                      </span>
                      <span className="user-email">{user.email}</span>
                      <span className="user-date-added">Autorizado em: {formatDate(user.cadastro)}</span>
                    </div>
                  </div>

                  <button 
                    className="delete-user-btn" 
                    onClick={() => handleDeleteUser(user)}
                    disabled={isSelf}
                    title={isSelf ? "Não é possível excluir a si mesmo" : "Remover acesso"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateUser}>
            <div className="modal-header">
              <h3 className="modal-title">Autorizar E-mail</h3>
              <button type="button" className="close-details-button" onClick={() => setModalOpen(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {modalError && (
              <div className="login-error-banner" style={{ margin: "0 0 16px 0", width: "100%" }}>
                <AlertCircle size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <div className="form-scroll">
              <label className="input-label">NOME COMPLETO *</label>
              <div className="modal-input-wrapper">
                <User size={16} className="modal-input-icon" />
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: João Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <label className="input-label">E-MAIL DO USUÁRIO *</label>
              <div className="modal-input-wrapper">
                <Mail size={16} className="modal-input-icon" />
                <input
                  type="email"
                  className="input"
                  placeholder="Ex: joao@icloud.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <span className="input-help-text" style={{ display: "block", marginTop: "-8px", marginBottom: "12px", fontSize: "9px", color: "#64748b" }}>
                Permite qualquer e-mail válido (ex: @icloud.com, @gmail.com, etc.).
              </span>

              <label className="input-label">SENHA DE ACESSO *</label>
              <div className="modal-input-wrapper">
                <Key size={16} className="modal-input-icon" />
                <input
                  type="password"
                  className="input"
                  placeholder="Defina uma senha..."
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: "24px" }}>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                CANCELAR
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={submitting}
              >
                {submitting ? "SALVANDO..." : "AUTORIZAR"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

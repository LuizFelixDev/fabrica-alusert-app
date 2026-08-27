import React, { useState } from "react";
import { Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { ENDPOINTS } from "../../constants/api";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (user: { id: number; nome: string; email: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(ENDPOINTS.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          senha: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao realizar login");
      }

      // Save user session in localStorage
      localStorage.setItem("user", JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão. Verifique se o servidor está online.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <span className="login-logo-symbol">🛡️</span>
          </div>
          <h2 className="login-title">Alusert</h2>
          <p className="login-subtitle">Acesse o painel de controle</p>
        </div>

        {error && (
          <div className="login-error-banner">
            <AlertCircle size={16} style={{ marginRight: "8px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-input-label">E-MAIL AUTORIZADO</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                type="text"
                className="login-input-field"
                placeholder="Ex: seu-email@icloud.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <span className="login-input-help">Suporta e-mails iCloud, Gmail, etc.</span>
          </div>

          <div className="login-input-group">
            <label className="login-input-label">SENHA DE ACESSO</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="login-input-field"
                placeholder="Sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-button" disabled={loading}>
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              "ENTRAR NO SISTEMA"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Seu e-mail precisa estar previamente cadastrado para obter acesso.</p>
        </div>
      </div>
    </div>
  );
}

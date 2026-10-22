import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home as HomeIcon, RefreshCw } from "lucide-react";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Nome da tela, exibido na mensagem de erro. */
  pageName?: string;
  /** Volta ao menu principal. */
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura erros de renderização de uma tela do menu para que uma falha
 * isolada não derrube o aplicativo inteiro (tela branca).
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Erro na tela ${this.props.pageName ?? ""}:`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  goHome = () => {
    this.reset();
    this.props.onGoHome?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary page-content" role="alert">
        <div className="error-boundary-card">
          <div className="error-boundary-icon">
            <AlertTriangle size={34} />
          </div>
          <h2 className="error-boundary-title">Algo deu errado</h2>
          <p className="error-boundary-desc">
            Não foi possível exibir {this.props.pageName ? <strong>{this.props.pageName}</strong> : "esta tela"}.
            Seus dados não foram perdidos.
          </p>
          <div className="error-boundary-actions">
            <button id="error-boundary-retry" type="button" className="error-boundary-btn secondary" onClick={this.reset}>
              <RefreshCw size={15} /> Tentar novamente
            </button>
            {this.props.onGoHome && (
              <button id="error-boundary-home" type="button" className="error-boundary-btn primary" onClick={this.goHome}>
                <HomeIcon size={15} /> Voltar ao menu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

import { useState } from 'react';
import Home from './pages/Home/Home';
import Produtos from './pages/Produtos/Produtos';
import Vendas from './pages/Vendas/Vendas';
import Clientes from './pages/Clientes/Clientes';
import MateriasPrimas from './pages/MateriasPrimas/MateriasPrimas';
import Relatorios from './pages/Relatorios/Relatorios';
import Login from './pages/Login/Login';
import Usuarios from './pages/Usuarios/Usuarios';
import AppBar from './components/AppBar/AppBar';
import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

import PublicCatalogo from './pages/PublicCatalogo/PublicCatalogo';
import {
  isValidPage,
  loadSessionUser,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  type PageName,
  type SessionUser
} from './utils/navigation';

const PAGE_LABELS: Record<PageName, string> = {
  Home: 'o Painel de Controle',
  Produtos: 'Produtos',
  Vendas: 'Vendas',
  Clientes: 'Clientes',
  MateriasPrimas: 'Matérias-Primas',
  Relatorios: 'Relatórios',
  Usuarios: 'Acessos'
};

export default function App() {
  // Check if current route is a public catalog link (/c/:token or /catalogo/:token)
  // Feito antes de qualquer hook em um componente separado, respeitando as Rules of Hooks.
  const pathname = window.location.pathname;
  const publicMatch = pathname.match(/^\/(?:c|catalogo)\/([^/]+)/);
  if (publicMatch && publicMatch[1]) {
    return <PublicCatalogo tokenLink={publicMatch[1]} />;
  }
  return <MainApp />;
}

function MainApp() {
  const [user, setUser] = useState<SessionUser | null>(() => loadSessionUser());
  const [darkMode, setDarkMode] = useState<boolean>(() => safeStorageGet("theme") === "dark");
  const [currentPage, setCurrentPage] = useState<PageName>("Home");
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  const goHome = () => setCurrentPage("Home");

  // Navegação do menu: ignora destinos inexistentes em vez de exibir tela em branco
  const navigate = (page: string) => {
    if (isValidPage(page)) {
      setCurrentPage(page);
    } else {
      console.warn(`Página de menu desconhecida: "${page}". Voltando ao início.`);
      setCurrentPage("Home");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      safeStorageSet("theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      safeStorageRemove("user");
      setScannerOpen(false);
      setUser(null);
      setCurrentPage("Home");
    }
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "Produtos":
        return <Produtos onBack={goHome} />;
      case "Vendas":
        return <Vendas onBack={goHome} />;
      case "Clientes":
        return <Clientes onBack={goHome} />;
      case "MateriasPrimas":
        return <MateriasPrimas onBack={goHome} />;
      case "Relatorios":
        return <Relatorios onBack={goHome} />;
      case "Usuarios":
        return <Usuarios currentUser={user} onBack={goHome} />;
      case "Home":
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <AppBar 
        onScanClick={currentPage === "Home" ? () => setScannerOpen(true) : undefined} 
        onLogoutClick={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* key garante que o erro de uma tela seja descartado ao navegar para outra */}
      <ErrorBoundary
        key={currentPage}
        pageName={PAGE_LABELS[currentPage]}
        onGoHome={currentPage !== "Home" ? goHome : undefined}
      >
        {renderPage()}
      </ErrorBoundary>

      {scannerOpen && (
        <ErrorBoundary pageName="o Leitor de Código de Barras" onGoHome={() => setScannerOpen(false)}>
          <BarcodeScanner onClose={() => setScannerOpen(false)} />
        </ErrorBoundary>
      )}
    </div>
  );
}

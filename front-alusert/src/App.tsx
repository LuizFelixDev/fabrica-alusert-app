import { useState } from 'react';
import Home from './pages/Home/Home';
import Produtos from './pages/Produtos/Produtos';
import Vendas from './pages/Vendas/Vendas';
import Clientes from './pages/Clientes/Clientes';
import MateriasPrimas from './pages/MateriasPrimas/MateriasPrimas';
import Login from './pages/Login/Login';
import Usuarios from './pages/Usuarios/Usuarios';
import AppBar from './components/AppBar/AppBar';
import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';

export default function App() {
  const [user, setUser] = useState<{ id: number; nome: string; email: string } | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      localStorage.removeItem("user");
      setUser(null);
      setCurrentPage("Home");
    }
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-container">
      <AppBar 
        onScanClick={currentPage === "Home" ? () => setScannerOpen(true) : undefined} 
        onLogoutClick={handleLogout}
      />
      {currentPage === "Home" && (
        <Home onNavigate={(page) => setCurrentPage(page)} />
      )}
      {currentPage === "Produtos" && (
        <Produtos onBack={() => setCurrentPage("Home")} />
      )}
      {currentPage === "Vendas" && (
        <Vendas onBack={() => setCurrentPage("Home")} />
      )}
      {currentPage === "Clientes" && (
        <Clientes onBack={() => setCurrentPage("Home")} />
      )}
      {currentPage === "MateriasPrimas" && (
        <MateriasPrimas onBack={() => setCurrentPage("Home")} />
      )}
      {currentPage === "Usuarios" && (
        <Usuarios currentUser={user} onBack={() => setCurrentPage("Home")} />
      )}

      {scannerOpen && (
        <BarcodeScanner onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}



import { useState } from 'react';
import Home from './pages/Home/Home';
import Produtos from './pages/Produtos/Produtos';
import Vendas from './pages/Vendas/Vendas';
import Clientes from './pages/Clientes/Clientes';
import MateriasPrimas from './pages/MateriasPrimas/MateriasPrimas';
import AppBar from './components/AppBar/AppBar';
import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  return (
    <div className="app-container">
      <AppBar onScanClick={currentPage === "Home" ? () => setScannerOpen(true) : undefined} />
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

      {scannerOpen && (
        <BarcodeScanner onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}



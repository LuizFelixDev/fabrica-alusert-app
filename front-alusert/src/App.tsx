import { useState } from 'react';
import Home from './pages/Home/Home';
import Produtos from './pages/Produtos/Produtos';
import AppBar from './components/AppBar/AppBar';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("Home");

  return (
    <div className="app-container">
      <AppBar />
      {currentPage === "Home" ? (
        <Home onNavigate={(page) => setCurrentPage(page)} />
      ) : (
        <Produtos onBack={() => setCurrentPage("Home")} />
      )}
    </div>
  );
}

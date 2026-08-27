import './AppBar.css';
import logo from '../../assets/logo.png';
import { Scan, LogOut, Sun, Moon } from 'lucide-react';

interface AppBarProps {
  onScanClick?: () => void;
  onLogoutClick?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AppBar({ onScanClick, onLogoutClick, darkMode, onToggleDarkMode }: AppBarProps) {
  return (
    <header className="app-bar">
      <div className="header-content">
        <img src={logo} className="app-logo" alt="Alusert Logo" />
        <h1 className="app-title">
          Alu<span className="title-orange">sert</span>
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
        <button 
          className="scan-trigger-btn" 
          onClick={onToggleDarkMode} 
          title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {darkMode ? <Sun size={20} color="#f18e04" /> : <Moon size={20} color="#64748b" />}
        </button>

        {onScanClick && (
          <button className="scan-trigger-btn" onClick={onScanClick} title="Escanear Código de Barras">
            <Scan size={22} color="#f18e04" />
          </button>
        )}
        {onLogoutClick && (
          <button 
            className="scan-trigger-btn" 
            onClick={onLogoutClick} 
            title="Sair do Sistema"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={20} color="#ef4444" />
          </button>
        )}
      </div>
    </header>
  );
}


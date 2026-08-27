import './AppBar.css';
import logo from '../../assets/logo.png';
import { Scan, LogOut } from 'lucide-react';

interface AppBarProps {
  onScanClick?: () => void;
  onLogoutClick?: () => void;
}

export default function AppBar({ onScanClick, onLogoutClick }: AppBarProps) {
  return (
    <header className="app-bar">
      <div className="header-content">
        <img src={logo} className="app-logo" alt="Alusert Logo" />
        <h1 className="app-title">
          Alu<span className="title-orange">sert</span>
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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


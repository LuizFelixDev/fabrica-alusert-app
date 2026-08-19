import './AppBar.css';
import logo from '../../assets/logo.png';
import { Scan } from 'lucide-react';

interface AppBarProps {
  onScanClick?: () => void;
}

export default function AppBar({ onScanClick }: AppBarProps) {
  return (
    <header className="app-bar">
      <div className="header-content">
        <img src={logo} className="app-logo" alt="Alusert Logo" />
        <h1 className="app-title">
          Alu<span className="title-orange">sert</span>
        </h1>
      </div>
      {onScanClick && (
        <button className="scan-trigger-btn" onClick={onScanClick} title="Escanear Código de Barras">
          <Scan size={22} color="#f18e04" />
        </button>
      )}
    </header>
  );
}


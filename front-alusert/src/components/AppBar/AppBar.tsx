import './AppBar.css';
import logo from '../../assets/logo.png';

export default function AppBar() {
  return (
    <header className="app-bar">
      <div className="header-content">
        <img src={logo} className="app-logo" alt="Alusert Logo" />
        <h1 className="app-title">
          Alu<span className="title-orange">sert</span>
        </h1>
      </div>
    </header>
  );
}

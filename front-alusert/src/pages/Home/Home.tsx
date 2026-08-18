import { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  AlertTriangle, 
  Home as HomeIcon, 
  BarChart2, 
  UserPlus, 
  FileText, 
  Hexagon, 
  Star, 
  User 
} from 'lucide-react';
import './Home.css';
import colors from '../../constants/colors';

interface HomeProps {
  onNavigate?: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [activeTab, setActiveTab] = useState("inicio");

  const getFormattedDate = () => {
    const days = [
      "Domingo",
      "Segunda-Feira",
      "Terça-Feira",
      "Quarta-Feira",
      "Quinta-Feira",
      "Sexta-Feira",
      "Sábado",
    ];
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    return `${dayName}, ${dayNum} De ${monthName}`;
  };

  // Mock Data
  const chartData = [
    { day: "Seg", value: 30, active: false },
    { day: "Ter", value: 45, active: false },
    { day: "Qua", value: 35, active: false },
    { day: "Qui", value: 75, active: false },
    { day: "Sex", value: 40, active: false },
    { day: "Sáb", value: 70, active: false },
    { day: "Dom", value: 85, active: true },
  ];

  const quickAccessItems = [
    {
      id: "1",
      title: "MATÉRIA\nPRIMA",
      icon: Hexagon,
      colorKey: "materiaPrima",
    },
    {
      id: "2",
      title: "PRODUTOS",
      icon: FileText,
      colorKey: "produtos",
    },
    {
      id: "3",
      title: "VENDAS",
      icon: Star,
      colorKey: "vendas",
    },
    {
      id: "4",
      title: "CLIENTES",
      icon: User,
      colorKey: "clientes",
    },
    {
      id: "5",
      title: "RELATÓRIOS",
      icon: FileText,
      colorKey: "relatorios",
    },
  ];

  const lastSales = [
    {
      id: "#1048",
      company: "Construtora Alfa",
      description: "Perfil T-60 · 120 kg",
      price: "R$ 2.640",
      status: "PAGO",
    },
    {
      id: "#1047",
      company: "Indústria Beta",
      description: "Tubo Redondo · 85 kg",
      price: "R$ 1.870",
      status: "PENDENTE",
    },
    {
      id: "#1046",
      company: "Serralheria Gama",
      description: "Chapa 2mm · 200 kg",
      price: "R$ 4.400",
      status: "PAGO",
    },
  ];

  return (
    <div className="home-container page-content">
      {/* Title Section */}
      <div className="header-title-section">
        <span className="date-text">{getFormattedDate()}</span>
        <h2 className="main-title">
          PAINEL DE <span className="highlight-text">CONTROLE</span>
        </h2>
      </div>

      {/* Dashboard Cards Container */}
      <div className="dashboard-cards-row">
        {/* Card 1: Vendas Hoje */}
        <div className="dashboard-card">
          <span className="card-label">VENDAS HOJE</span>
          <span className="card-value">R$ 14.280</span>
          <div className="badge-success">
            <ArrowUp size={10} color={colors.success.text} />
            <span className="badge-text">+8,3%</span>
          </div>
        </div>

        {/* Card 2: Estoque */}
        <div className="dashboard-card">
          <span className="card-label">ESTOQUE (KG)</span>
          <span className="card-value">3.640</span>
          <div className="badge-error">
            <ArrowDown size={10} color={colors.error.text} />
            <span className="badge-text">-2,1%</span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">VENDAS — 7 DIAS</h3>
          <span className="chart-subtitle">R$/dia</span>
        </div>

        <div className="chart-container">
          {chartData.map((data, index) => {
            const maxBarHeight = 80;
            const barHeight = (data.value / 100) * maxBarHeight;

            return (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-background">
                  <div
                    className={`chart-bar-value ${data.active ? 'chart-bar-active' : ''}`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <span className={`chart-bar-label ${data.active ? 'chart-bar-label-active' : ''}`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Access */}
      <div className="section-header-container">
        <h3 className="section-title">ACESSO RÁPIDO</h3>
      </div>

      <div className="quick-access-scroll">
        <div className="quick-access-container">
          {quickAccessItems.map((item) => {
            const colorsSet = (colors.quickAccess as any)[item.colorKey];
            const Icon = item.icon;
            return (
              <button 
                key={item.id} 
                className="quick-access-item"
                onClick={() => {
                  if (item.title.includes("PRODUTOS") && onNavigate) {
                    onNavigate("Produtos");
                  }
                }}
              >
                <div
                  className="quick-access-icon-container"
                  style={{ backgroundColor: colorsSet?.bg || "#f3f4f6" }}
                >
                  <Icon size={22} color={colorsSet?.icon || "#000"} />
                </div>
                <span className="quick-access-text">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Last Sales */}
      <div className="section-header-container-with-link">
        <h3 className="section-title">ÚLTIMAS VENDAS</h3>
        <button className="section-header-link">VER TODAS →</button>
      </div>

      <div className="sales-card">
        {lastSales.map((sale) => {
          const isPago = sale.status === "PAGO";

          return (
            <div
              key={sale.id}
              className="sale-item"
            >
              <div className="sale-info">
                <span className="sale-company">{sale.company}</span>
                <span className="sale-description">
                  {sale.id} · {sale.description}
                </span>
              </div>
              <div className="sale-status-container">
                <span className="sale-price">{sale.price}</span>
                <div
                  className={`status-badge ${isPago ? 'status-badge-pago' : 'status-badge-pendente'}`}
                >
                  <span
                    className={`status-badge-text ${isPago ? 'status-badge-text-pago' : 'status-badge-text-pendente'}`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert Banner */}
      <div className="alert-banner">
        <div className="alert-icon-container">
          <AlertTriangle size={18} color={colors.error.text} />
        </div>
        <div className="alert-text-container">
          <span className="alert-title">ESTOQUE BAIXO</span>
          <p className="alert-description">
            Alumínio bruto — <span className="alert-highlight">40 kg restantes</span> (mín. 100 kg)
          </p>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="tab-bar">
        <button
          className="tab-item"
          onClick={() => setActiveTab("inicio")}
        >
          <div className={`tab-icon-wrapper ${activeTab === 'inicio' ? 'tab-icon-wrapper-active' : ''}`}>
            <HomeIcon size={20} color={activeTab === 'inicio' ? colors.tabBar.active : colors.tabBar.inactive} />
          </div>
          <span className={`tab-label ${activeTab === 'inicio' ? 'tab-label-active' : ''}`}>
            INÍCIO
          </span>
        </button>

        <button
          className="tab-item"
          onClick={() => setActiveTab("vendas")}
        >
          <div className={`tab-icon-wrapper ${activeTab === 'vendas' ? 'tab-icon-wrapper-active' : ''}`}>
            <BarChart2 size={20} color={activeTab === 'vendas' ? colors.tabBar.active : colors.tabBar.inactive} />
          </div>
          <span className={`tab-label ${activeTab === 'vendas' ? 'tab-label-active' : ''}`}>
            VENDAS
          </span>
        </button>

        <button
          className="tab-item"
          onClick={() => setActiveTab("clientes")}
        >
          <div className={`tab-icon-wrapper ${activeTab === 'clientes' ? 'tab-icon-wrapper-active' : ''}`}>
            <UserPlus size={20} color={activeTab === 'clientes' ? colors.tabBar.active : colors.tabBar.inactive} />
          </div>
          <span className={`tab-label ${activeTab === 'clientes' ? 'tab-label-active' : ''}`}>
            CLIENTES
          </span>
        </button>

        <button
          className="tab-item"
          onClick={() => setActiveTab("relatorios")}
        >
          <div className={`tab-icon-wrapper ${activeTab === 'relatorios' ? 'tab-icon-wrapper-active' : ''}`}>
            <FileText size={20} color={activeTab === 'relatorios' ? colors.tabBar.active : colors.tabBar.inactive} />
          </div>
          <span className={`tab-label ${activeTab === 'relatorios' ? 'tab-label-active' : ''}`}>
            RELATÓRIOS
          </span>
        </button>
      </div>
    </div>
  );
}

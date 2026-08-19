import { useState, useEffect } from 'react';
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
  User,
  WifiOff
} from 'lucide-react';
import './Home.css';
import colors from '../../constants/colors';
import { ENDPOINTS } from '../../constants/api';

interface HomeProps {
  onNavigate?: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [activeTab, setActiveTab] = useState("inicio");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

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

  // Fetch Dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesRes, rawRes, clientsRes] = await Promise.all([
        fetch(ENDPOINTS.vendas),
        fetch(ENDPOINTS.materiasPrimas),
        fetch(ENDPOINTS.clientes)
      ]);

      if (!salesRes.ok || !rawRes.ok || !clientsRes.ok) {
        throw new Error("Erro ao buscar dados do servidor");
      }

      const [salesData, rawData, clientsData] = await Promise.all([
        salesRes.json(),
        rawRes.json(),
        clientsRes.json()
      ]);

      setSales(salesData);
      setRawMaterials(rawData);
      setClients(clientsData);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick access config
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

  // Helper formatting price
  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0,00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0,00" : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  // Calculations for Indicators
  
  // 1. Sales indicators
  const todayVal = new Date();
  const yesterdayVal = new Date();
  yesterdayVal.setDate(yesterdayVal.getDate() - 1);

  const todaySales = sales.filter(s => s.status !== 'cancelada' && new Date(s.data_venda).toDateString() === todayVal.toDateString());
  const todayTotal = todaySales.reduce((acc, s) => acc + parseFloat(s.valor_total || 0), 0);

  const yesterdaySales = sales.filter(s => s.status !== 'cancelada' && new Date(s.data_venda).toDateString() === yesterdayVal.toDateString());
  const yesterdayTotal = yesterdaySales.reduce((acc, s) => acc + parseFloat(s.valor_total || 0), 0);

  const salesDiff = todayTotal - yesterdayTotal;
  const salesGrowth = yesterdayTotal > 0 ? (salesDiff / yesterdayTotal) * 100 : (todayTotal > 0 ? 100 : 0);

  // 2. Stock indicators
  const kgMaterials = rawMaterials.filter(m => m.unidade_medida === 'kg');
  const totalStockKg = kgMaterials.reduce((acc, m) => acc + parseFloat(m.quantidade_estoque || 0), 0);
  const totalMinKg = kgMaterials.reduce((acc, m) => acc + parseFloat(m.estoque_minimo || 0), 0);
  
  const stockDiff = totalStockKg - totalMinKg;
  const stockPercentage = totalMinKg > 0 ? (stockDiff / totalMinKg) * 100 : 0;

  // 3. Chart data for last 7 days
  const getLast7DaysData = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = days[d.getDay()];
      const daySales = sales.filter(s => s.status !== 'cancelada' && new Date(s.data_venda).toDateString() === d.toDateString());
      const total = daySales.reduce((acc, s) => acc + parseFloat(s.valor_total || 0), 0);
      result.push({
        day: dayLabel,
        value: total,
        active: i === 0 // Today is active
      });
    }
    return result;
  };

  const chartData = getLast7DaysData();
  const maxVal = Math.max(...chartData.map(d => d.value), 100); // Scale reference

  // 4. Last 3 Sales
  const lastSalesVal = [...sales]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  // 5. Low stock alerts
  const lowStockMaterials = rawMaterials.filter(m => parseFloat(m.quantidade_estoque) < parseFloat(m.estoque_minimo));

  return (
    <div className="home-container page-content">
      {/* Title Section */}
      <div className="header-title-section">
        <span className="date-text">{getFormattedDate()}</span>
        <h2 className="main-title">
          PAINEL DE <span className="highlight-text">CONTROLE</span>
        </h2>
      </div>

      {loading && (
        <div className="loading-container" style={{ margin: '40px 0' }}>
          <div className="spinner"></div>
          <span className="loading-text">Carregando painel...</span>
        </div>
      )}

      {!loading && error && (
        <div className="connection-error-container" style={{ margin: '40px 0' }}>
          <WifiOff size={44} color={colors.error.text} style={{ marginBottom: '12px' }} />
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={fetchDashboardData}>Recarregar Painel</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Dashboard Cards Container */}
          <div className="dashboard-cards-row">
            {/* Card 1: Vendas Hoje */}
            <div className="dashboard-card">
              <span className="card-label">VENDAS HOJE</span>
              <span className="card-value">{formatPrice(todayTotal)}</span>
              <div className={salesGrowth >= 0 ? "badge-success" : "badge-error"}>
                {salesGrowth >= 0 ? (
                  <ArrowUp size={10} color={colors.success.text} />
                ) : (
                  <ArrowDown size={10} color={colors.error.text} />
                )}
                <span className="badge-text">
                  {salesGrowth >= 0 ? "+" : ""}{salesGrowth.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card 2: Estoque */}
            <div className="dashboard-card">
              <span className="card-label">ESTOQUE (KG)</span>
              <span className="card-value">
                {totalStockKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
              </span>
              <div className={stockPercentage >= 0 ? "badge-success" : "badge-error"}>
                {stockPercentage >= 0 ? (
                  <ArrowUp size={10} color={colors.success.text} />
                ) : (
                  <ArrowDown size={10} color={colors.error.text} />
                )}
                <span className="badge-text">
                  {stockPercentage >= 0 ? "+" : ""}{stockPercentage.toFixed(1)}%
                </span>
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
                const barHeight = (data.value / maxVal) * maxBarHeight;

                return (
                  <div key={index} className="chart-bar-wrapper" title={`${data.day}: ${formatPrice(data.value)}`}>
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
        </>
      )}

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
                  } else if (item.title.includes("VENDAS") && onNavigate) {
                    onNavigate("Vendas");
                  } else if (item.title.includes("CLIENTES") && onNavigate) {
                    onNavigate("Clientes");
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
      {!loading && !error && (
        <>
          <div className="section-header-container-with-link">
            <h3 className="section-title">ÚLTIMAS VENDAS</h3>
            <button className="section-header-link" onClick={() => onNavigate && onNavigate("Vendas")}>VER TODAS →</button>
          </div>

          <div className="sales-card">
            {lastSalesVal.length === 0 ? (
              <div className="empty-state-container" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.tabBar.inactive }}>Nenhuma venda registrada no sistema.</span>
              </div>
            ) : (
              lastSalesVal.map((sale) => {
                const isPago = sale.status === "concluída";
                const isCancelada = sale.status === "cancelada";
                const clientObj = clients.find(c => c.id === sale.id_cliente);
                const statusLabel = sale.status === "concluída" ? "PAGO" : sale.status === "cancelada" ? "CANCELADO" : "PENDENTE";

                return (
                  <div
                    key={sale.id}
                    className="sale-item"
                  >
                    <div className="sale-info">
                      <span className="sale-company">{clientObj?.nome || "Cliente Avulso"}</span>
                      <span className="sale-description">
                        ID: #{sale.id} · {formatDate(sale.data_venda)} · {sale.forma_pagamento}
                      </span>
                    </div>
                    <div className="sale-status-container">
                      <span className="sale-price">{formatPrice(sale.valor_total)}</span>
                      <div
                        className={`status-badge ${
                          isPago 
                            ? 'status-badge-pago' 
                            : isCancelada 
                            ? 'status-badge-cancelada' 
                            : 'status-badge-pendente'
                        }`}
                        style={{
                          backgroundColor: isPago ? '#dcfce7' : isCancelada ? '#fee2e2' : '#fef3c7',
                          color: isPago ? '#16a34a' : isCancelada ? '#b91c1c' : '#d97706'
                        }}
                      >
                        <span
                          className="status-badge-text"
                          style={{
                            color: isPago ? '#16a34a' : isCancelada ? '#b91c1c' : '#d97706'
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Low Stock Alert Banner */}
      {!loading && !error && lowStockMaterials.length > 0 && (
        <div className="alert-banner">
          <div className="alert-icon-container">
            <AlertTriangle size={18} color={colors.error.text} />
          </div>
          <div className="alert-text-container">
            <span className="alert-title">ESTOQUE BAIXO</span>
            <p className="alert-description">
              {lowStockMaterials[0].nome} — <span className="alert-highlight">{Number(lowStockMaterials[0].quantidade_estoque).toLocaleString('pt-BR')} {lowStockMaterials[0].unidade_medida} restantes</span> (mín. {Number(lowStockMaterials[0].estoque_minimo).toLocaleString('pt-BR')} {lowStockMaterials[0].unidade_medida})
            </p>
          </div>
        </div>
      )}

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
          onClick={() => {
            setActiveTab("vendas");
            if (onNavigate) onNavigate("Vendas");
          }}
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
          onClick={() => {
            setActiveTab("clientes");
            if (onNavigate) onNavigate("Clientes");
          }}
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


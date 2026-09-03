import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  X, 
  Layers,
  ShoppingBag,
  FileSpreadsheet,
  CheckCircle2,
  Factory,
  PackageCheck,
  Flame
} from "lucide-react";
import "./Relatorios.css";
import { ENDPOINTS } from "../../constants/api";

interface RelatoriosProps {
  onBack?: () => void;
}

export interface ExtraExpense {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
}

interface ItemReport {
  id_produto: number;
  nome_produto: string;
  categoria: string;
  quantidade_vendida: number;
  preco_venda_unitario: number;
  faturamento_total: number; // Entradas
  custo_producao_unitario: number; // Custo de produção
  custo_producao_total: number; // Saídas de produção
  lucro_bruto_item: number; // Entradas - Saídas de produção
  margem_percentual: number;
}

export default function Relatorios({ onBack }: RelatoriosProps) {
  // Navigation view: 'hub' | 'vendas' | 'estoque'
  const [activeView, setActiveView] = useState<'hub' | 'vendas' | 'estoque'>('hub');

  // Loading and Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Extra Expenses state with localStorage persistence
  const [extraExpenses, setExtraExpenses] = useState<ExtraExpense[]>(() => {
    try {
      const saved = localStorage.getItem("alusert_gastos_extras");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar gastos extras do localStorage:", e);
    }
    // Default initial mock/sample expense if empty
    return [
      {
        id: "exp-1",
        descricao: "Frete e transporte de alumínio",
        categoria: "Transporte / Frete",
        valor: 150.00,
        data: new Date().toISOString().substring(0, 10)
      }
    ];
  });

  // Save extra expenses to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem("alusert_gastos_extras", JSON.stringify(extraExpenses));
    } catch (e) {
      console.error("Erro ao salvar gastos extras:", e);
    }
  }, [extraExpenses]);

  // Date Filter State
  const [periodPreset, setPeriodPreset] = useState<string>("mes_atual");
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  // Extra Expense Modal State
  const [modalExpenseOpen, setModalExpenseOpen] = useState<boolean>(false);
  const [formDesc, setFormDesc] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Transporte / Frete");
  const [formVal, setFormVal] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Search filter inside item report table
  const [itemSearchTerm, setItemSearchTerm] = useState<string>("");

  // Fetch sales, products, and raw materials
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesRes, prodRes] = await Promise.all([
        fetch(ENDPOINTS.vendas),
        fetch(ENDPOINTS.produtos)
      ]);

      if (!salesRes.ok || !prodRes.ok) {
        throw new Error("Erro ao buscar dados do servidor para o relatório.");
      }

      const salesData = await salesRes.json();
      const prodData = await prodRes.json();

      // Fetch detailed items for each sale if missing
      const salesWithItems = await Promise.all(
        salesData.map(async (sale: any) => {
          if (sale.itens && sale.itens.length > 0) {
            return sale;
          }
          try {
            const detailRes = await fetch(`${ENDPOINTS.vendas}/${sale.id}`);
            if (detailRes.ok) {
              const fullSale = await detailRes.json();
              return fullSale;
            }
          } catch (e) {
            console.error(`Erro ao carregar itens da venda #${sale.id}:`, e);
          }
          return sale;
        })
      );

      setSales(salesWithItems);
      setProducts(prodData);
    } catch (err: any) {
      console.error(err);
      setError("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Handle preset date choices
  const handleSelectPreset = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === "mes_atual") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(first.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === "mes_anterior") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(first.toISOString().substring(0, 10));
      setEndDate(last.toISOString().substring(0, 10));
    } else if (preset === "ultimos_30") {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === "ano_atual") {
      const first = new Date(now.getFullYear(), 0, 1);
      setStartDate(first.toISOString().substring(0, 10));
      setEndDate(now.toISOString().substring(0, 10));
    } else if (preset === "todos") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Helper formatting price
  const formatMoney = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter Sales by Date Range
  const filteredSales = sales.filter((sale) => {
    if (sale.status === 'cancelada') return false; // Ignore cancelled sales for revenue/profit
    if (!startDate && !endDate) return true;

    try {
      const saleDate = new Date(sale.data_venda).toISOString().substring(0, 10);
      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;
      return true;
    } catch {
      return true;
    }
  });

  // Filter Extra Expenses by Date Range
  const filteredExpenses = extraExpenses.filter((exp) => {
    if (!startDate && !endDate) return true;
    if (startDate && exp.data < startDate) return false;
    if (endDate && exp.data > endDate) return false;
    return true;
  });

  // Calculate Product Production Cost helper
  const getProductProductionCost = (product: any): number => {
    // 1. If explicit preco_custo exists and is > 0, use it
    if (product.preco_custo !== null && product.preco_custo !== undefined) {
      const costNum = Number(product.preco_custo);
      if (!isNaN(costNum) && costNum > 0) return costNum;
    }

    // 2. Otherwise, sum the cost of its linked materias_primas (Bill of Materials)
    if (product.materias_primas && Array.isArray(product.materias_primas) && product.materias_primas.length > 0) {
      let bomCost = 0;
      for (const mat of product.materias_primas) {
        const qty = Number(mat.quantidade_utilizada || 0);
        const unitVal = Number(mat.valor_unitario || 0);
        bomCost += qty * unitVal;
      }
      if (bomCost > 0) return bomCost;
    }

    return 0;
  };

  // Build Itemized Report Table Data
  const itemReportMap: { [productId: number]: ItemReport } = {};

  filteredSales.forEach((sale) => {
    if (!sale.itens || !Array.isArray(sale.itens)) return;

    sale.itens.forEach((item: any) => {
      const prodId = item.id_produto;
      const qty = Number(item.quantidade || 0);
      const unitSellPrice = Number(item.preco_unitario || 0);
      const totalRevenue = qty * unitSellPrice;

      // Find matching product metadata
      const prodObj = products.find(p => p.id === prodId) || {};
      const prodCostUnit = getProductProductionCost(prodObj);
      const totalCost = qty * prodCostUnit;

      if (!itemReportMap[prodId]) {
        itemReportMap[prodId] = {
          id_produto: prodId,
          nome_produto: item.nome_produto || prodObj.nome || `Produto #${prodId}`,
          categoria: prodObj.categoria || "Geral",
          quantidade_vendida: qty,
          preco_venda_unitario: unitSellPrice,
          faturamento_total: totalRevenue,
          custo_producao_unitario: prodCostUnit,
          custo_producao_total: totalCost,
          lucro_bruto_item: totalRevenue - totalCost,
          margem_percentual: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
        };
      } else {
        const existing = itemReportMap[prodId];
        existing.quantidade_vendida += qty;
        existing.faturamento_total += totalRevenue;
        existing.custo_producao_total += totalCost;
        existing.lucro_bruto_item = existing.faturamento_total - existing.custo_producao_total;
        existing.margem_percentual = existing.faturamento_total > 0
          ? (existing.lucro_bruto_item / existing.faturamento_total) * 100
          : 0;
      }
    });
  });

  const itemReportList = Object.values(itemReportMap).filter(item => {
    if (!itemSearchTerm.trim()) return true;
    return item.nome_produto.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
           item.categoria.toLowerCase().includes(itemSearchTerm.toLowerCase());
  });

  // Calculate Overall Financial Totals
  const totalFaturamento = filteredSales.reduce((acc, sale) => acc + Number(sale.valor_total || 0), 0);
  const totalCustoProducao = Object.values(itemReportMap).reduce((acc, item) => acc + item.custo_producao_total, 0);
  const totalLucroBruto = totalFaturamento - totalCustoProducao;
  const totalGastosExtras = filteredExpenses.reduce((acc, exp) => acc + exp.valor, 0);
  const totalLucroReal = totalLucroBruto - totalGastosExtras;
  const margemLucroReal = totalFaturamento > 0 ? (totalLucroReal / totalFaturamento) * 100 : 0;
  const isLoss = totalLucroReal < 0;

  // Build Stock & Production Demand Data
  const stockReportList = products.map((prod) => {
    let totalVendida = 0;
    let faturamentoTotal = 0;

    sales.forEach((sale) => {
      if (sale.status === 'cancelada' || !sale.itens) return;
      sale.itens.forEach((it: any) => {
        if (it.id_produto === prod.id) {
          const qty = Number(it.quantidade || 0);
          const price = Number(it.preco_unitario || 0);
          totalVendida += qty;
          faturamentoTotal += qty * price;
        }
      });
    });

    const stockQty = Number(prod.quantidade_estoque || 0);
    // Demanda de fabricação: unidades vendidas que superaram o estoque disponível
    const initialAvailableStock = Math.max(0, stockQty + totalVendida);
    const qtdPendenteFabricar = Math.max(0, totalVendida - initialAvailableStock);

    return {
      id_produto: prod.id,
      nome_produto: prod.nome,
      categoria: prod.categoria || "Geral",
      quantidade_estoque: stockQty,
      preco_venda: Number(prod.preco_venda || 0),
      quantidade_vendida: totalVendida,
      faturamento_total: faturamentoTotal,
      qtd_pendente_fabricar: qtdPendenteFabricar
    };
  });

  // Demandas de fabricação (apenas produtos com vendas ativas > 0 e que necessitam de produção)
  const productsPendingFabrication = stockReportList
    .filter(item => item.quantidade_vendida > 0 && item.qtd_pendente_fabricar > 0)
    .sort((a, b) => b.qtd_pendente_fabricar - a.qtd_pendente_fabricar);

  const totalUnitsToManufacture = productsPendingFabrication.reduce((acc, item) => acc + item.qtd_pendente_fabricar, 0);

  // Produtos com estoque baixo (<= 5 unidades)
  const lowStockProducts = stockReportList
    .filter(item => item.quantidade_estoque <= 5)
    .sort((a, b) => a.quantidade_estoque - b.quantidade_estoque);

  // Produtos mais vendidos
  const topSellersList = [...stockReportList].sort((a, b) => b.quantidade_vendida - a.quantidade_vendida);
  const topSellerProduct = topSellersList.length > 0 && topSellersList[0].quantidade_vendida > 0 ? topSellersList[0] : null;

  // Produtos menos vendidos (baixa saída)
  const leastSellersList = [...stockReportList].sort((a, b) => a.quantidade_vendida - b.quantidade_vendida);

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim() || !formVal) return;

    const valNum = parseFloat(formVal);
    if (isNaN(valNum) || valNum <= 0) return;

    const newExpense: ExtraExpense = {
      id: `exp-${Date.now()}`,
      descricao: formDesc.trim(),
      categoria: formCategory,
      valor: valNum,
      data: formDate
    };

    setExtraExpenses(prev => [newExpense, ...prev]);

    // Reset modal
    setFormDesc("");
    setFormVal("");
    setModalExpenseOpen(false);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Deseja realmente remover este gasto extra?")) {
      setExtraExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="relatorios-container page-content">
      {/* Header */}
      <header className="relatorios-header">
        <div className="relatorios-header-left">
          <button 
            className="back-btn" 
            onClick={() => {
              if (activeView === 'vendas' || activeView === 'estoque') {
                setActiveView('hub');
              } else if (onBack) {
                onBack();
              }
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="relatorios-title">
              {activeView === 'vendas' ? "RELATÓRIO FINANCEIRO & VENDAS" : activeView === 'estoque' ? "RELATÓRIO DE ESTOQUE & FABRICAÇÃO" : "CENTRAL DE RELATÓRIOS"}
            </h2>
            <span className="relatorios-subtitle">
              {activeView === 'vendas' ? "Controle de Faturamento, Custos e Lucro Real" : activeView === 'estoque' ? "Demandas de Produção, Baixo Estoque e Rotatividade de Produtos" : "Selecione o módulo de relatório"}
            </span>
          </div>
        </div>
      </header>

      {loading && (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Carregando dados financeiros e vendas...</p>
        </div>
      )}

      {!loading && error && (
        <div className="loss-alert-banner" style={{ margin: '20px auto', maxWidth: '800px' }}>
          <AlertTriangle size={24} />
          <div>
            <div className="loss-alert-title">Erro ao carregar dados</div>
            <div className="loss-alert-desc">{error}</div>
            <button className="btn-secondary" style={{ marginTop: '8px' }} onClick={fetchReportData}>Tentar Novamente</button>
          </div>
        </div>
      )}

      {/* HUB VIEW: Two Large Cards (Estoque & Vendas) */}
      {!loading && !error && activeView === 'hub' && (
        <div className="hub-container">
          <div className="hub-title-section">
            <h2 className="hub-main-title">
              RELATÓRIOS <span>GERENCIAIS</span>
            </h2>
            <p className="hub-desc">
              Escolha uma categoria para visualizar métricas, faturamento e balanço.
            </p>
          </div>

          <div className="hub-cards-grid">
            {/* Card 1: Estoque (Active) */}
            <div 
              className="hub-card" 
              onClick={() => setActiveView('estoque')}
            >
              <span className="hub-badge hub-badge-active">Disponível</span>
              <div className="hub-card-icon-wrapper">
                <Package size={36} />
              </div>
              <h3 className="hub-card-title">RELATÓRIO DE ESTOQUE</h3>
              <p className="hub-card-desc">
                Demandas de fabricação (produtos a fabricar), produtos com baixo estoque e rotatividade (mais e menos vendidos).
              </p>
            </div>

            {/* Card 2: Vendas (Active) */}
            <div 
              className="hub-card"
              onClick={() => setActiveView('vendas')}
            >
              <span className="hub-badge hub-badge-active">Disponível</span>
              <div className="hub-card-icon-wrapper">
                <TrendingUp size={36} />
              </div>
              <h3 className="hub-card-title">RELATÓRIO DE VENDAS</h3>
              <p className="hub-card-desc">
                Entradas e saídas por item, custos de produção, adição de gastos extras e cálculo do lucro real.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SALES REPORT VIEW */}
      {activeView === 'vendas' && (
        <div className="report-content">

          {/* Period Filter Card */}
          <div className="period-filter-card">
            <div className="period-header">
              <span className="period-title">
                <Calendar size={16} color="#f18e04" /> FILTRO DE PERÍODO (TEMPO)
              </span>

              <div className="period-chips">
                <button 
                  className={`period-chip ${periodPreset === 'mes_atual' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('mes_atual')}
                >
                  Este Mês
                </button>
                <button 
                  className={`period-chip ${periodPreset === 'mes_anterior' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('mes_anterior')}
                >
                  Mês Anterior
                </button>
                <button 
                  className={`period-chip ${periodPreset === 'ultimos_30' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('ultimos_30')}
                >
                  Últimos 30 dias
                </button>
                <button 
                  className={`period-chip ${periodPreset === 'ano_atual' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('ano_atual')}
                >
                  Este Ano
                </button>
                <button 
                  className={`period-chip ${periodPreset === 'todos' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('todos')}
                >
                  Todo o Período
                </button>
              </div>
            </div>

            <div className="custom-date-inputs">
              <div className="date-input-group">
                <span className="date-input-label">DE:</span>
                <input 
                  type="date" 
                  className="date-picker" 
                  value={startDate} 
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPeriodPreset("custom");
                  }}
                />
              </div>

              <div className="date-input-group">
                <span className="date-input-label">ATÉ:</span>
                <input 
                  type="date" 
                  className="date-picker" 
                  value={endDate} 
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPeriodPreset("custom");
                  }}
                />
              </div>

              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                {filteredSales.length} {filteredSales.length === 1 ? 'venda considerada' : 'vendas consideradas'}
              </span>
            </div>
          </div>

          {/* Loss Warning Banner if Lucro Real < 0 */}
          {isLoss && (
            <div className="loss-alert-banner">
              <AlertTriangle size={28} className="loss-alert-icon" />
              <div>
                <div className="loss-alert-title">ATENÇÃO: BALANÇO COM PREJUÍZO REGISTRADO!</div>
                <div className="loss-alert-desc">
                  Os custos de produção e gastos extras superaram as entradas no período selecionado. Verifique os gastos extras ou ajuste as margens de venda.
                </div>
              </div>
            </div>
          )}

          {/* Financial KPI Grid */}
          <div className="kpi-grid">
            {/* 1. Entradas / Faturamento Bruto */}
            <div className="kpi-card faturamento">
              <div className="kpi-card-header">
                <span className="kpi-label">ENTRADAS (FATURAMENTO)</span>
                <TrendingUp size={18} color="#3b82f6" />
              </div>
              <span className="kpi-value">{formatMoney(totalFaturamento)}</span>
              <span className="kpi-subtext">Total de vendas no período</span>
            </div>

            {/* 2. Saídas de Produção */}
            <div className="kpi-card custo-producao">
              <div className="kpi-card-header">
                <span className="kpi-label">SAÍDAS (PRODUÇÃO)</span>
                <TrendingDown size={18} color="#8b5cf6" />
              </div>
              <span className="kpi-value">{formatMoney(totalCustoProducao)}</span>
              <span className="kpi-subtext">Custo direto das peças</span>
            </div>

            {/* 3. Lucro Bruto */}
            <div className="kpi-card lucro-bruto">
              <div className="kpi-card-header">
                <span className="kpi-label">LUCRO BRUTO PEÇAS</span>
                <DollarSign size={18} color="#06b6d4" />
              </div>
              <span className="kpi-value">{formatMoney(totalLucroBruto)}</span>
              <span className="kpi-subtext">Entradas - Custo Produção</span>
            </div>

            {/* 4. Gastos Extras */}
            <div className="kpi-card gastos-extras">
              <div className="kpi-card-header">
                <span className="kpi-label">GASTOS EXTRAS</span>
                <Layers size={18} color="#f59e0b" />
              </div>
              <span className="kpi-value">{formatMoney(totalGastosExtras)}</span>
              <span className="kpi-subtext">{filteredExpenses.length} despesas registradas</span>
            </div>

            {/* 5. Lucro Real / Saldo Real */}
            <div className={`kpi-card lucro-real ${isLoss ? 'prejuizo' : ''}`}>
              <div className="kpi-card-header">
                <span className="kpi-label">LUCRO REAL (SALDO)</span>
                <span className={`kpi-badge ${isLoss ? 'loss' : 'profit'}`}>
                  {isLoss ? 'PREJUÍZO' : `${margemLucroReal.toFixed(1)}%`}
                </span>
              </div>
              <span className="kpi-value">{formatMoney(totalLucroReal)}</span>
              <span className="kpi-subtext">Resultado líquido final</span>
            </div>
          </div>

          {/* SECTION 1: ITENIZED BREAKDOWN (Entradas e Saídas por Item) */}
          <div className="report-section">
            <div className="section-top-bar">
              <div className="section-title-wrapper">
                <FileSpreadsheet size={20} color="#f18e04" />
                <h3 className="section-heading">ENTRADAS E SAÍDAS POR ITEM</h3>
                <span className="section-count-badge">{itemReportList.length} ITENS</span>
              </div>

              <input 
                type="text" 
                className="form-input" 
                style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
                placeholder="Buscar item ou categoria..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
              />
            </div>

            {itemReportList.length === 0 ? (
              <div className="empty-state">
                <ShoppingBag size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>Nenhuma venda ou item registrado neste período.</p>
              </div>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>PEÇA / PRODUTO</th>
                      <th style={{ textAlign: 'center' }}>QTD VENDIDA</th>
                      <th style={{ textAlign: 'right' }}>VALOR ENTRADA (UN / TOTAL)</th>
                      <th style={{ textAlign: 'right' }}>VALOR SAÍDA (PRODUÇÃO UN / TOTAL)</th>
                      <th style={{ textAlign: 'right' }}>LUCRO BRUTO ITEM</th>
                      <th style={{ textAlign: 'center' }}>MARGEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemReportList.map((item) => (
                      <tr key={item.id_produto}>
                        <td>
                          <div className="product-cell-name">{item.nome_produto}</div>
                          <div className="product-cell-cat">{item.categoria}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>
                          {item.quantidade_vendida} un
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="val-entradas">{formatMoney(item.faturamento_total)}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            un: {formatMoney(item.preco_venda_unitario)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="val-saidas">{formatMoney(item.custo_producao_total)}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            un: {formatMoney(item.custo_producao_unitario)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={`val-lucro ${item.lucro_bruto_item < 0 ? 'negative' : ''}`}>
                            {formatMoney(item.lucro_bruto_item)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span 
                            className={`kpi-badge ${item.margem_percentual >= 0 ? 'profit' : 'loss'}`}
                            style={{ fontSize: '10px' }}
                          >
                            {item.margem_percentual.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: GASTOS EXTRAS (Despesas não contabilizadas diretamente na produção) */}
          <div className="report-section">
            <div className="section-top-bar">
              <div className="section-title-wrapper">
                <Layers size={20} color="#f59e0b" />
                <h3 className="section-heading">GASTOS EXTRAS DO PERÍODO</h3>
                <span className="section-count-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  {filteredExpenses.length} GASTOS
                </span>
              </div>

              <button 
                className="add-expense-btn" 
                onClick={() => setModalExpenseOpen(true)}
              >
                <Plus size={16} /> + ADICIONAR GASTO EXTRA
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Cadastre despesas operacionais (fretes, transporte, manutenção, energia, impostos) para descontar do lucro bruto e calcular o saldo real exato.
            </p>

            {filteredExpenses.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '8px', opacity: 0.7 }} />
                <p>Nenhum gasto extra cadastrado para este período.</p>
              </div>
            ) : (
              <div>
                {filteredExpenses.map((exp) => (
                  <div key={exp.id} className="expense-item-row">
                    <div className="expense-info">
                      <span className="expense-desc">{exp.descricao}</span>
                      <div className="expense-meta">
                        <span className="expense-category-chip">{exp.categoria}</span>
                        <span>• Data: {new Date(exp.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="expense-actions">
                      <span className="expense-val">- {formatMoney(exp.valor)}</span>
                      <button 
                        className="icon-action-btn"
                        onClick={() => handleDeleteExpense(exp.id)}
                        title="Remover Gasto Extra"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK & MANUFACTURING REPORT VIEW */}
      {activeView === 'estoque' && (
        <div className="report-content">
          {/* Top Stock KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card faturamento" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="kpi-card-header">
                <span className="kpi-label">DEMANDAS A FABRICAR</span>
                <Factory size={18} color="#f59e0b" />
              </div>
              <span className="kpi-value" style={{ color: '#d97706' }}>
                {totalUnitsToManufacture.toLocaleString('pt-BR')} un
              </span>
              <span className="kpi-subtext">
                {productsPendingFabrication.length} {productsPendingFabrication.length === 1 ? 'produto pendente' : 'produtos pendentes'}
              </span>
            </div>

            <div className="kpi-card custo-producao" style={{ borderLeftColor: '#ef4444' }}>
              <div className="kpi-card-header">
                <span className="kpi-label">BAIXO ESTOQUE</span>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <span className="kpi-value" style={{ color: '#dc2626' }}>
                {lowStockProducts.length} itens
              </span>
              <span className="kpi-subtext">Estoque zerado ou crítico</span>
            </div>

            <div className="kpi-card lucro-bruto" style={{ borderLeftColor: '#10b981' }}>
              <div className="kpi-card-header">
                <span className="kpi-label">MAIS VENDIDO (LÍDER)</span>
                <Flame size={18} color="#10b981" />
              </div>
              <span className="kpi-value" style={{ fontSize: '16px', color: '#059669' }}>
                {topSellerProduct ? topSellerProduct.nome_produto : 'Nenhum'}
              </span>
              <span className="kpi-subtext">
                {topSellerProduct ? `${topSellerProduct.quantidade_vendida} un vendidas` : 'Sem vendas'}
              </span>
            </div>

            <div className="kpi-card gastos-extras" style={{ borderLeftColor: '#6366f1' }}>
              <div className="kpi-card-header">
                <span className="kpi-label">TOTAL PRODUTOS</span>
                <Package size={18} color="#6366f1" />
              </div>
              <span className="kpi-value" style={{ color: '#4f46e5' }}>
                {products.length} cadastrados
              </span>
              <span className="kpi-subtext">Catálogo da fábrica</span>
            </div>
          </div>

          {/* SECTION 1: DEMANDAS DE FABRICAÇÃO (PRODUTOS A FABRICAR) */}
          <div className="report-section">
            <div className="section-top-bar">
              <div className="section-title-wrapper">
                <Factory size={20} color="#f59e0b" />
                <h3 className="section-heading">DEMANDAS DE FABRICAÇÃO (PRODUTOS A FABRICAR)</h3>
                <span className="section-count-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>
                  {productsPendingFabrication.length} PRODUTOS
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Relação de produtos cujas vendas superam o estoque disponível no momento da venda (ou com estoque zerado), necessitando de fabricação para atendimento.
            </p>

            {productsPendingFabrication.length === 0 ? (
              <div className="empty-state">
                <PackageCheck size={36} color="#10b981" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <p>Nenhuma pendência de fabricação no momento! Todo o estoque atende às vendas registradas.</p>
              </div>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>PRODUTO / PANELAS</th>
                      <th style={{ textAlign: 'center' }}>QTD VENDIDA</th>
                      <th style={{ textAlign: 'center' }}>ESTOQUE ATUAL</th>
                      <th style={{ textAlign: 'center' }}>PENDENTE A FABRICAR</th>
                      <th style={{ textAlign: 'center' }}>PRIORIDADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsPendingFabrication.map(item => (
                      <tr key={item.id_produto}>
                        <td>
                          <div className="product-cell-name">{item.nome_produto}</div>
                          <div className="product-cell-cat">{item.categoria}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>
                          {item.quantidade_vendida} un
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`stock-status-chip ${item.quantidade_estoque === 0 ? 'zero' : 'low'}`}>
                            {item.quantidade_estoque} un
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="pending-fabrication-highlight">
                            ⚡ {item.qtd_pendente_fabricar} un
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="priority-badge urgent">ALTA PRIORIDADE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: PRODUTOS EM BAIXO ESTOQUE */}
          <div className="report-section">
            <div className="section-top-bar">
              <div className="section-title-wrapper">
                <AlertTriangle size={20} color="#ef4444" />
                <h3 className="section-heading">PRODUTOS COM ESTOQUE CRÍTICO / BAIXO ESTOQUE</h3>
                <span className="section-count-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
                  {lowStockProducts.length} ITENS
                </span>
              </div>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '8px', opacity: 0.8 }} />
                <p>Todos os produtos estão com níveis saudáveis de estoque.</p>
              </div>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>PRODUTO</th>
                      <th style={{ textAlign: 'center' }}>ESTOQUE ATUAL</th>
                      <th style={{ textAlign: 'right' }}>PREÇO DE VENDA</th>
                      <th style={{ textAlign: 'center' }}>STATUS ESTOQUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(item => (
                      <tr key={item.id_produto}>
                        <td>
                          <div className="product-cell-name">{item.nome_produto}</div>
                          <div className="product-cell-cat">{item.categoria}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>
                          <span className={`stock-status-chip ${item.quantidade_estoque === 0 ? 'zero' : 'low'}`}>
                            {item.quantidade_estoque} un
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          {formatMoney(item.preco_venda)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`kpi-badge ${item.quantidade_estoque === 0 ? 'loss' : 'warning'}`}>
                            {item.quantidade_estoque === 0 ? 'ESTOQUE ZERADO' : 'BAIXO ESTOQUE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: TOP VENDIDOS vs MENOS VENDIDOS GRID */}
          <div className="rankings-grid">
            {/* Top Sellers */}
            <div className="report-section" style={{ margin: 0 }}>
              <div className="section-top-bar">
                <div className="section-title-wrapper">
                  <Flame size={20} color="#10b981" />
                  <h3 className="section-heading">PRODUTOS MAIS VENDIDOS</h3>
                </div>
              </div>

              {topSellersList.length === 0 ? (
                <div className="empty-state"><p>Sem histórico de vendas.</p></div>
              ) : (
                <div className="rankings-list">
                  {topSellersList.slice(0, 5).map((item, idx) => (
                    <div key={item.id_produto} className="ranking-item-row">
                      <div className="ranking-number gold">#{idx + 1}</div>
                      <div className="ranking-info">
                        <span className="ranking-name">{item.nome_produto}</span>
                        <span className="ranking-sub">{item.quantidade_vendida} un vendidas • {formatMoney(item.faturamento_total)}</span>
                      </div>
                      <div className="ranking-tag top">🔥 Mais Vendido</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Least Sellers */}
            <div className="report-section" style={{ margin: 0 }}>
              <div className="section-top-bar">
                <div className="section-title-wrapper">
                  <TrendingDown size={20} color="#8b5cf6" />
                  <h3 className="section-heading">PRODUTOS MENOS VENDIDOS</h3>
                </div>
              </div>

              {leastSellersList.length === 0 ? (
                <div className="empty-state"><p>Sem dados de produtos.</p></div>
              ) : (
                <div className="rankings-list">
                  {leastSellersList.slice(0, 5).map((item, idx) => (
                    <div key={item.id_produto} className="ranking-item-row">
                      <div className="ranking-number silver">#{idx + 1}</div>
                      <div className="ranking-info">
                        <span className="ranking-name">{item.nome_produto}</span>
                        <span className="ranking-sub">{item.quantidade_vendida} un vendidas • Estoque: {item.quantidade_estoque} un</span>
                      </div>
                      <div className="ranking-tag low">📉 Menos Vendido</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR GASTO EXTRA */}
      {modalExpenseOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Adicionar Gasto Extra</h3>
              <button className="close-btn" onClick={() => setModalExpenseOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">DESCRIÇÃO DO GASTO *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Frete de transporte, Energia elétrica da fábrica..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CATEGORIA *</label>
                  <select 
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Transporte / Frete">Transporte / Frete</option>
                    <option value="Energia / Água">Energia / Água</option>
                    <option value="Manutenção de Máquinas">Manutenção de Máquinas</option>
                    <option value="Impostos / Taxas">Impostos / Taxas</option>
                    <option value="Embalagem / Material Extra">Embalagem / Material Extra</option>
                    <option value="Aluguel / Estrutura">Aluguel / Estrutura</option>
                    <option value="Outros Gastos">Outros Gastos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">VALOR DO GASTO (R$) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={formVal}
                    onChange={(e) => setFormVal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DATA DO OCORRIDO *</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setModalExpenseOpen(false)}
                >
                  CANCELAR
                </button>
                <button type="submit" className="btn-primary">
                  SALVAR GASTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

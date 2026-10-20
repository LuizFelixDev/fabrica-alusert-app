import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  CheckCircle2,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  Wallet
} from "lucide-react";
import "./ChequesDashboard.css";

export interface ChequePagar {
  id: string;
  favorecido: string;
  numero: string;
  banco: string;
  valor: number;
  data_pagamento: string; // YYYY-MM-DD
  observacao?: string;
  pago: boolean;
}

interface ChequesDashboardProps {
  sales: any[];
  formatMoney: (val: number) => string;
}

type FiltroStatus = "pendentes" | "quitados" | "todos";

const STORAGE_PAGAR = "alusert_cheques_pagar";
const STORAGE_RECEBIDOS = "alusert_cheques_recebidos";

// Normaliza qualquer data (ISO, Date string) para YYYY-MM-DD
const toYMD = (val: any): string | null => {
  if (!val) return null;
  const str = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().substring(0, 10);
};

// Diferença em dias entre a data informada e hoje (negativo = vencido)
const daysUntil = (ymd: string | null): number | null => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const formatDateBR = (ymd: string | null) => {
  if (!ymd) return "Sem data";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
};

const getDueInfo = (ymd: string | null, quitado: boolean, quitadoLabel: string) => {
  if (quitado) return { cls: "ok", label: quitadoLabel };
  const diff = daysUntil(ymd);
  if (diff === null) return { cls: "neutral", label: "SEM DATA" };
  if (diff < 0) return { cls: "late", label: `VENCIDO HÁ ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "DIA" : "DIAS"}` };
  if (diff === 0) return { cls: "today", label: "VENCE HOJE" };
  if (diff <= 7) return { cls: "soon", label: `VENCE EM ${diff} ${diff === 1 ? "DIA" : "DIAS"}` };
  return { cls: "future", label: `EM ${diff} DIAS` };
};

export default function ChequesDashboard({ sales, formatMoney }: ChequesDashboardProps) {
  // ===== CHEQUES A RECEBER (derivados das vendas) =====
  const [recebidos, setRecebidos] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECEBIDOS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_RECEBIDOS, JSON.stringify(recebidos));
  }, [recebidos]);

  const [filtroReceber, setFiltroReceber] = useState<FiltroStatus>("pendentes");

  const chequesReceber = sales
    .filter((s) => s.forma_pagamento === "Cheque" && s.status !== "cancelada")
    .map((s) => {
      const vencimento = toYMD(s.data_vencimento_cheque);
      return {
        id: s.id as number,
        cliente: s.nome_cliente || "Cliente",
        valor: Number(s.valor_total || 0),
        data_venda: toYMD(s.data_venda),
        vencimento,
        compensado: recebidos.includes(s.id),
        diff: daysUntil(vencimento)
      };
    })
    .sort((a, b) => (a.vencimento || "9999").localeCompare(b.vencimento || "9999"));

  const receberPendentes = chequesReceber.filter((c) => !c.compensado);
  const totalReceber = receberPendentes.reduce((acc, c) => acc + c.valor, 0);
  const receberVencidos = receberPendentes.filter((c) => c.diff !== null && c.diff < 0);
  const receberProximos = receberPendentes.filter((c) => c.diff !== null && c.diff >= 0 && c.diff <= 7);

  const listaReceber = chequesReceber.filter((c) =>
    filtroReceber === "todos" ? true : filtroReceber === "pendentes" ? !c.compensado : c.compensado
  );

  const toggleRecebido = (id: number) => {
    setRecebidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // ===== CHEQUES A PAGAR (cadastro manual) =====
  const [chequesPagar, setChequesPagar] = useState<ChequePagar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PAGAR);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_PAGAR, JSON.stringify(chequesPagar));
  }, [chequesPagar]);

  const [filtroPagar, setFiltroPagar] = useState<FiltroStatus>("pendentes");
  const [modalOpen, setModalOpen] = useState(false);
  const [fFavorecido, setFFavorecido] = useState("");
  const [fNumero, setFNumero] = useState("");
  const [fBanco, setFBanco] = useState("");
  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(new Date().toISOString().substring(0, 10));
  const [fObs, setFObs] = useState("");

  const pagarOrdenados = [...chequesPagar].sort((a, b) => a.data_pagamento.localeCompare(b.data_pagamento));
  const pagarPendentes = pagarOrdenados.filter((c) => !c.pago);
  const totalPagar = pagarPendentes.reduce((acc, c) => acc + c.valor, 0);
  const pagarVencidos = pagarPendentes.filter((c) => (daysUntil(c.data_pagamento) ?? 0) < 0);
  const pagarProximos = pagarPendentes.filter((c) => {
    const d = daysUntil(c.data_pagamento);
    return d !== null && d >= 0 && d <= 7;
  });

  const listaPagar = pagarOrdenados.filter((c) =>
    filtroPagar === "todos" ? true : filtroPagar === "pendentes" ? !c.pago : c.pago
  );

  const resetForm = () => {
    setFFavorecido("");
    setFNumero("");
    setFBanco("");
    setFValor("");
    setFObs("");
    setFData(new Date().toISOString().substring(0, 10));
  };

  const handleAddChequePagar = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(fValor);
    if (!fFavorecido.trim() || isNaN(valorNum) || valorNum <= 0 || !fData) return;

    const novo: ChequePagar = {
      id: `chq-${Date.now()}`,
      favorecido: fFavorecido.trim(),
      numero: fNumero.trim(),
      banco: fBanco.trim(),
      valor: valorNum,
      data_pagamento: fData,
      observacao: fObs.trim() || undefined,
      pago: false
    };
    setChequesPagar((prev) => [...prev, novo]);
    resetForm();
    setModalOpen(false);
  };

  const togglePago = (id: string) => {
    setChequesPagar((prev) => prev.map((c) => (c.id === id ? { ...c, pago: !c.pago } : c)));
  };

  const handleDeletePagar = (id: string) => {
    if (window.confirm("Deseja realmente remover este cheque a pagar?")) {
      setChequesPagar((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const renderFiltro = (value: FiltroStatus, setter: (f: FiltroStatus) => void, quitadoLabel: string) => (
    <div className="cheque-filter">
      {(["pendentes", "quitados", "todos"] as FiltroStatus[]).map((f) => (
        <button
          key={f}
          type="button"
          className={`cheque-filter-btn ${value === f ? "active" : ""}`}
          onClick={() => setter(f)}
        >
          {f === "pendentes" ? "Pendentes" : f === "quitados" ? quitadoLabel : "Todos"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="cheques-grid">
      {/* ================= CHEQUES A RECEBER ================= */}
      <div className="report-section cheque-panel receber">
        <div className="section-top-bar">
          <div className="section-title-wrapper">
            <ArrowDownCircle size={20} color="#10b981" />
            <h3 className="section-heading">CHEQUES A RECEBER</h3>
            <span className="section-count-badge cheque-badge-receber">{receberPendentes.length} PENDENTES</span>
          </div>
          {renderFiltro(filtroReceber, setFiltroReceber, "Compensados")}
        </div>

        <div className="cheque-kpis">
          <div className="cheque-kpi">
            <Wallet size={16} />
            <div>
              <span className="cheque-kpi-label">A RECEBER</span>
              <span className="cheque-kpi-value green">{formatMoney(totalReceber)}</span>
            </div>
          </div>
          <div className="cheque-kpi">
            <AlertTriangle size={16} />
            <div>
              <span className="cheque-kpi-label">VENCIDOS</span>
              <span className="cheque-kpi-value red">
                {receberVencidos.length} · {formatMoney(receberVencidos.reduce((a, c) => a + c.valor, 0))}
              </span>
            </div>
          </div>
          <div className="cheque-kpi">
            <Clock size={16} />
            <div>
              <span className="cheque-kpi-label">PRÓXIMOS 7 DIAS</span>
              <span className="cheque-kpi-value amber">
                {receberProximos.length} · {formatMoney(receberProximos.reduce((a, c) => a + c.valor, 0))}
              </span>
            </div>
          </div>
        </div>

        <p className="cheque-hint">
          Gerado automaticamente a partir das vendas com forma de pagamento <strong>Cheque</strong>.
        </p>

        {listaReceber.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: "8px", opacity: 0.7 }} />
            <p>Nenhum cheque a receber nesta visão.</p>
          </div>
        ) : (
          <div className="cheque-list">
            {listaReceber.map((c) => {
              const due = getDueInfo(c.vencimento, c.compensado, "COMPENSADO");
              return (
                <div key={c.id} className={`cheque-row ${due.cls}`}>
                  <div className="cheque-date-box">
                    <span className="cheque-date-label">VENCE</span>
                    <span className="cheque-date-value">{formatDateBR(c.vencimento)}</span>
                  </div>
                  <div className="cheque-info">
                    <span className="cheque-title">{c.cliente}</span>
                    <span className="cheque-meta">
                      Venda #{c.id} · {formatDateBR(c.data_venda)}
                    </span>
                    <span className={`cheque-status ${due.cls}`}>{due.label}</span>
                  </div>
                  <div className="cheque-actions">
                    <span className="cheque-val green">{formatMoney(c.valor)}</span>
                    <button
                      className={`cheque-action-btn ${c.compensado ? "undo" : "confirm"}`}
                      onClick={() => toggleRecebido(c.id)}
                      title={c.compensado ? "Desfazer compensação" : "Marcar como compensado"}
                    >
                      {c.compensado ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= CHEQUES A PAGAR ================= */}
      <div className="report-section cheque-panel pagar">
        <div className="section-top-bar">
          <div className="section-title-wrapper">
            <ArrowUpCircle size={20} color="#ef4444" />
            <h3 className="section-heading">CHEQUES A PAGAR</h3>
            <span className="section-count-badge cheque-badge-pagar">{pagarPendentes.length} PENDENTES</span>
          </div>
          <button className="add-expense-btn" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> CADASTRAR CHEQUE
          </button>
        </div>

        <div className="cheque-kpis">
          <div className="cheque-kpi">
            <Wallet size={16} />
            <div>
              <span className="cheque-kpi-label">A PAGAR</span>
              <span className="cheque-kpi-value red">{formatMoney(totalPagar)}</span>
            </div>
          </div>
          <div className="cheque-kpi">
            <AlertTriangle size={16} />
            <div>
              <span className="cheque-kpi-label">ATRASADOS</span>
              <span className="cheque-kpi-value red">
                {pagarVencidos.length} · {formatMoney(pagarVencidos.reduce((a, c) => a + c.valor, 0))}
              </span>
            </div>
          </div>
          <div className="cheque-kpi">
            <Clock size={16} />
            <div>
              <span className="cheque-kpi-label">PRÓXIMOS 7 DIAS</span>
              <span className="cheque-kpi-value amber">
                {pagarProximos.length} · {formatMoney(pagarProximos.reduce((a, c) => a + c.valor, 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="cheque-toolbar">
          <p className="cheque-hint" style={{ margin: 0 }}>Cheques emitidos pela fábrica e suas datas de pagamento.</p>
          {renderFiltro(filtroPagar, setFiltroPagar, "Pagos")}
        </div>

        {listaPagar.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: "8px", opacity: 0.7 }} />
            <p>Nenhum cheque a pagar nesta visão.</p>
          </div>
        ) : (
          <div className="cheque-list">
            {listaPagar.map((c) => {
              const due = getDueInfo(c.data_pagamento, c.pago, "PAGO");
              return (
                <div key={c.id} className={`cheque-row ${due.cls}`}>
                  <div className="cheque-date-box">
                    <span className="cheque-date-label">PAGAR</span>
                    <span className="cheque-date-value">{formatDateBR(c.data_pagamento)}</span>
                  </div>
                  <div className="cheque-info">
                    <span className="cheque-title">{c.favorecido}</span>
                    <span className="cheque-meta">
                      {c.numero ? `Nº ${c.numero}` : "Sem número"}
                      {c.banco ? ` · ${c.banco}` : ""}
                      {c.observacao ? ` · ${c.observacao}` : ""}
                    </span>
                    <span className={`cheque-status ${due.cls}`}>{due.label}</span>
                  </div>
                  <div className="cheque-actions">
                    <span className="cheque-val red">- {formatMoney(c.valor)}</span>
                    <button
                      className={`cheque-action-btn ${c.pago ? "undo" : "confirm"}`}
                      onClick={() => togglePago(c.id)}
                      title={c.pago ? "Desfazer pagamento" : "Marcar como pago"}
                    >
                      {c.pago ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                    <button
                      className="icon-action-btn"
                      onClick={() => handleDeletePagar(c.id)}
                      title="Remover cheque"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CADASTRAR CHEQUE A PAGAR */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Cheque a Pagar</h3>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddChequePagar}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">FAVORECIDO / FORNECEDOR *</label>
                  <input
                    id="cheque-pagar-favorecido"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Fornecedor de alumínio"
                    value={fFavorecido}
                    onChange={(e) => setFFavorecido(e.target.value)}
                    required
                  />
                </div>

                <div className="cheque-form-row">
                  <div className="form-group">
                    <label className="form-label">Nº DO CHEQUE</label>
                    <input
                      id="cheque-pagar-numero"
                      type="text"
                      className="form-input"
                      placeholder="000123"
                      value={fNumero}
                      onChange={(e) => setFNumero(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">BANCO</label>
                    <input
                      id="cheque-pagar-banco"
                      type="text"
                      className="form-input"
                      placeholder="Ex: Banco do Brasil"
                      value={fBanco}
                      onChange={(e) => setFBanco(e.target.value)}
                    />
                  </div>
                </div>

                <div className="cheque-form-row">
                  <div className="form-group">
                    <label className="form-label">VALOR (R$) *</label>
                    <input
                      id="cheque-pagar-valor"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={fValor}
                      onChange={(e) => setFValor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">DATA PARA PAGAR *</label>
                    <input
                      id="cheque-pagar-data"
                      type="date"
                      className="form-input"
                      value={fData}
                      onChange={(e) => setFData(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">OBSERVAÇÃO</label>
                  <input
                    id="cheque-pagar-obs"
                    type="text"
                    className="form-input"
                    placeholder="Opcional"
                    value={fObs}
                    onChange={(e) => setFObs(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  CANCELAR
                </button>
                <button type="submit" className="btn-primary">
                  SALVAR CHEQUE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

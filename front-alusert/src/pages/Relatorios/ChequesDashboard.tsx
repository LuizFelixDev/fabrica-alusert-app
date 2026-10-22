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
import {
  STORAGE_PAGAR,
  STORAGE_RECEBIDOS,
  buildChequesReceber,
  criarChequePagar,
  daysUntil,
  filtrarPorStatus,
  formatDateBR,
  getDueInfo,
  loadChequesPagar,
  loadRecebidos,
  resumoVencimentos,
  safeSave,
  somarValores,
  todayYMD,
  validarChequePagar,
  type ChequePagar,
  type FiltroStatus
} from "../../utils/cheques";

export type { ChequePagar } from "../../utils/cheques";

interface ChequesDashboardProps {
  sales: any[];
  formatMoney: (val: number) => string;
}

export default function ChequesDashboard({ sales, formatMoney }: ChequesDashboardProps) {
  // ===== CHEQUES A RECEBER (derivados das vendas) =====
  const [recebidos, setRecebidos] = useState<number[]>(() => loadRecebidos());

  useEffect(() => {
    safeSave(STORAGE_RECEBIDOS, recebidos);
  }, [recebidos]);

  const [filtroReceber, setFiltroReceber] = useState<FiltroStatus>("pendentes");

  const chequesReceber = buildChequesReceber(sales, recebidos);

  const receberPendentes = chequesReceber.filter((c) => !c.compensado);
  const totalReceber = somarValores(receberPendentes);
  const { vencidos: receberVencidos, proximos: receberProximos } = resumoVencimentos(receberPendentes, (c) => c.diff);

  const listaReceber = filtrarPorStatus(chequesReceber, filtroReceber, (c) => c.compensado);

  const toggleRecebido = (id: number) => {
    setRecebidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // ===== CHEQUES A PAGAR (cadastro manual) =====
  const [chequesPagar, setChequesPagar] = useState<ChequePagar[]>(() => loadChequesPagar());

  useEffect(() => {
    safeSave(STORAGE_PAGAR, chequesPagar);
  }, [chequesPagar]);

  const [filtroPagar, setFiltroPagar] = useState<FiltroStatus>("pendentes");
  const [modalOpen, setModalOpen] = useState(false);
  const [fFavorecido, setFFavorecido] = useState("");
  const [fNumero, setFNumero] = useState("");
  const [fBanco, setFBanco] = useState("");
  const [fValor, setFValor] = useState("");
  const [fData, setFData] = useState(() => todayYMD());
  const [fObs, setFObs] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const pagarOrdenados = [...chequesPagar].sort((a, b) => a.data_pagamento.localeCompare(b.data_pagamento));
  const pagarPendentes = pagarOrdenados.filter((c) => !c.pago);
  const totalPagar = somarValores(pagarPendentes);
  const { vencidos: pagarVencidos, proximos: pagarProximos } = resumoVencimentos(pagarPendentes, (c) =>
    daysUntil(c.data_pagamento)
  );

  const listaPagar = filtrarPorStatus(pagarOrdenados, filtroPagar, (c) => c.pago);

  const resetForm = () => {
    setFFavorecido("");
    setFNumero("");
    setFBanco("");
    setFValor("");
    setFObs("");
    setFData(todayYMD());
    setFormError(null);
  };

  const closeModal = () => {
    resetForm();
    setModalOpen(false);
  };

  const handleAddChequePagar = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { favorecido: fFavorecido, numero: fNumero, banco: fBanco, valor: fValor, data: fData, observacao: fObs };
    const erro = validarChequePagar(input);
    if (erro) {
      setFormError(erro);
      return;
    }

    setChequesPagar((prev) => [...prev, criarChequePagar(input)]);
    closeModal();
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
              <button className="close-btn" onClick={closeModal} title="Fechar">
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

                {formError && (
                  <p className="cheque-form-error" role="alert">
                    <AlertTriangle size={14} /> {formError}
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
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

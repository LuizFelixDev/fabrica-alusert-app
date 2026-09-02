import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Search, WifiOff, AlertTriangle, Disc } from "lucide-react";
import "./BarcodeScanner.css";
import { ENDPOINTS } from "../../constants/api";
import colors from "../../constants/colors";
import { BarcodeCard } from "../BarcodeCard/BarcodeCard";

interface ProductMateriaPrima {
  link_id?: number;
  id_materia_prima: number;
  nome?: string;
  unidade_medida?: string;
  quantidade_utilizada: number | string;
  tipo_componente?: string | null;
  diametro_mm?: number | string | null;
  altura_mm?: number | string | null;
  peso?: number | string | null;
  valor_unitario?: number | string | null;
}

interface Product {
  id: number;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  quantidade_estoque: number;
  estoque_minimo: number;
  unidade_medida: string | null;
  tamanho_numero: number | null;
  peso_kg: number | null;
  preco_custo: number | string | null;
  preco_venda: number | string | null;
  status: boolean;
  materias_primas?: ProductMateriaPrima[];
}

interface BarcodeScannerProps {
  onClose: () => void;
}

export default function BarcodeScanner({ onClose }: BarcodeScannerProps) {

  const [product, setProduct] = useState<Product | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader";

  // Start Camera Scanner
  const startScanner = () => {
    setProduct(null);
    setSearchError(null);

    
    // Check if camera container exists
    setTimeout(() => {
      const container = document.getElementById(scannerId);
      if (!container) return;

      try {
        const html5Qrcode = new Html5Qrcode(scannerId);
        html5QrcodeRef.current = html5Qrcode;

        html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.777778
          },
          (decodedText) => {
            handleCodeScanned(decodedText);
          },
          () => {
            // Failure (silent)
          }
        ).then(() => {
          setCameraActive(true);
        }).catch(err => {
          console.error("Camera start error:", err);
          setCameraActive(false);
        });
      } catch (err) {
        console.error("Html5Qrcode initialization error:", err);
      }
    }, 100);
  };

  // Stop Camera Scanner
  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
        setCameraActive(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  // Handle scanned or typed code
  const handleCodeScanned = async (code: string) => {
    if (!code.trim()) return;

    stopScanner();
    
    try {
      setLoading(true);
      setSearchError(null);

      const response = await fetch(ENDPOINTS.produtos);
      if (!response.ok) throw new Error("Erro ao buscar produtos");

      const products: Product[] = await response.json();
      const foundProduct = products.find(
        p => p.codigo_barras && p.codigo_barras.trim().toLowerCase() === code.trim().toLowerCase()
      );

      if (foundProduct) {
        // Fetch detailed product info to get its specifications
        const detailsRes = await fetch(`${ENDPOINTS.produtos}/${foundProduct.id}`);
        if (detailsRes.ok) {
          const detailedProduct = await detailsRes.json();
          setProduct(detailedProduct);
        } else {
          setProduct(foundProduct);
        }
      } else {
        setSearchError(`Nenhum produto cadastrado com o código: ${code}`);
      }
    } catch (err) {
      console.error(err);
      setSearchError("Erro de conexão ao buscar detalhes do produto.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeScanned(manualCode.trim());
    }
  };

  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0,00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0,00" : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateMargin = (costVal?: string | number | null, sellVal?: string | number | null) => {
    const cost = costVal ? Number(costVal) : 0;
    const sell = sellVal ? Number(sellVal) : 0;
    if (!cost || !sell || isNaN(cost) || isNaN(sell) || sell === 0) return "N/A";
    const margin = ((sell - cost) / sell) * 100;
    return `${Math.round(margin)}%`;
  };

  return (
    <div className="scanner-modal-overlay">
      <div className="scanner-modal-content">
        {/* Header */}
        <div className="scanner-modal-header">
          <h3 className="scanner-modal-title">Escanear Produto</h3>
          <button className="scanner-close-btn" onClick={onClose}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div className="scanner-modal-body">
          {loading && (
            <div className="scanner-loading-container">
              <div className="spinner"></div>
              <span className="scanner-loading-text">Buscando produto...</span>
            </div>
          )}

          {/* 1. Camera View / Scanning state */}
          {!loading && !product && !searchError && (
            <div className="scanning-view">
              <div className="camera-frame-container">
                <div id={scannerId} className="camera-viewport"></div>
                {!cameraActive && (
                  <div className="camera-fallback-msg">
                    <AlertTriangle size={32} color="#d97706" style={{ marginBottom: '8px' }} />
                    <span>Câmera não disponível ou permissão negada.</span>
                  </div>
                )}
              </div>

              {/* Manual Input Fallback */}
              <form className="manual-input-form" onSubmit={handleManualSearch}>
                <label className="manual-input-label">Ou digite o código de barras:</label>
                <div className="manual-input-row">
                  <input
                    type="text"
                    className="manual-text-input"
                    placeholder="Ex: CUSC16-020826-001"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <button type="submit" className="manual-search-btn">
                    <Search size={16} color="#ffffff" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && searchError && (
            <div className="scanner-error-container">
              <WifiOff size={40} color={colors.error.text} style={{ marginBottom: '10px' }} />
              <p className="scanner-error-text">{searchError}</p>
              <button 
                className="scanner-retry-btn"
                onClick={() => {
                  setManualCode("");
                  startScanner();
                }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* 3. Product Details Display */}
          {!loading && product && (
            <div className="scanned-product-details">
              <div className="scanned-product-header">
                <h4 className="scanned-title">{product.nome}</h4>
                <span className="scanned-barcode-tag">{product.codigo_barras}</span>
              </div>

              <div className="scanned-details-scroll">
                {product.descricao && (
                  <div className="scanned-section">
                    <span className="scanned-section-label">DESCRIÇÃO</span>
                    <p className="scanned-desc">{product.descricao}</p>
                  </div>
                )}

                <div className="scanned-section">
                  <span className="scanned-section-label">INFORMAÇÕES DE ESTOQUE</span>
                  <div className="scanned-grid">
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Estoque Atual</span>
                      <span className="scanned-item-value">
                        {product.quantidade_estoque} un
                      </span>
                    </div>
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Estoque Mínimo</span>
                      <span className="scanned-item-value">
                        {product.estoque_minimo} un
                      </span>
                    </div>
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Status</span>
                      <span 
                        className="scanned-item-value"
                        style={{ color: product.status ? colors.success.text : colors.error.text }}
                      >
                        {product.status ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="scanned-section">
                  <span className="scanned-section-label">VALORES</span>
                  <div className="scanned-grid">
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Preço Custo</span>
                      <span className="scanned-item-value">{formatPrice(product.preco_custo)}</span>
                    </div>
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Preço Venda</span>
                      <span className="scanned-item-value">{formatPrice(product.preco_venda)}</span>
                    </div>
                    <div className="scanned-grid-item">
                      <span className="scanned-item-label">Margem Lucro</span>
                      <span className="scanned-item-value" style={{ color: colors.success.text }}>
                        {calculateMargin(product.preco_custo, product.preco_venda)}
                      </span>
                    </div>
                  </div>
                </div>

                {(product.peso_kg !== null || product.tamanho_numero !== null) && (
                  <div className="scanned-section">
                    <span className="scanned-section-label">ESPECIFICAÇÕES DO PRODUTO</span>
                    <div className="scanned-grid">
                      {product.tamanho_numero !== null && (
                        <div className="scanned-grid-item">
                          <span className="scanned-item-label">Tamanho / Número</span>
                          <span className="scanned-item-value">
                            {Number(product.tamanho_numero)}{product.unidade_medida ? ` ${product.unidade_medida}` : ''}
                          </span>
                        </div>
                      )}
                      {product.peso_kg !== null && (
                        <div className="scanned-grid-item">
                          <span className="scanned-item-label">Peso</span>
                          <span className="scanned-item-value">{Number(product.peso_kg)} kg</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Matérias-Primas e Discos Vinculados */}
                {product.materias_primas && product.materias_primas.length > 0 && (
                  <div className="scanned-section">
                    <span className="scanned-section-label">MATÉRIAS-PRIMAS / COMPONENTES</span>
                    <div className="scanned-specs-list">
                      {product.materias_primas.map((mat, matIdx) => {
                        const isDisc = !!mat.tipo_componente;
                        return (
                          <div key={mat.link_id || matIdx} className="scanned-spec-item">
                            <Disc size={12} color={colors.primary} style={{ marginRight: '6px', flexShrink: 0 }} />
                            <div className="scanned-spec-texts">
                              <span className="scanned-spec-name">
                                <strong>{mat.nome}</strong>: Consome {mat.quantidade_utilizada} {mat.unidade_medida}
                                {isDisc && ` (Ø${Number(mat.diametro_mm)}mm × ${Number(mat.altura_mm)}mm)`}
                              </span>
                              <span className="scanned-spec-subtext">
                                {mat.peso !== null && mat.peso !== undefined && `Peso: ${Number(mat.peso)} kg`}
                                {mat.valor_unitario !== null && mat.valor_unitario !== undefined && ` | Custo Unitário: R$ ${Number(mat.valor_unitario).toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Código de Barras */}
                <div className="scanned-section">
                  <span className="scanned-section-label">CÓDIGO DE BARRAS</span>
                  <BarcodeCard
                    barcodeValue={product.codigo_barras}
                    productName={product.nome}
                    showDownloadButton={true}
                  />
                </div>
              </div>

              {/* Scan Another Button */}
              <div className="scanned-footer-actions">
                <button 
                  className="scanner-scan-another-btn"
                  onClick={() => {
                    setManualCode("");
                    startScanner();
                  }}
                >
                  Escanear Outro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

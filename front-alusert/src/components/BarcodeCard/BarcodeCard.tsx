import React, { useEffect, useRef } from "react";
import { Download, Barcode as BarcodeIcon } from "lucide-react";
import { renderBarcodeToCanvas, downloadBarcodeImage } from "../../utils/barcode";
import "./BarcodeCard.css";

interface BarcodeCardProps {
  barcodeValue: string | null | undefined;
  productName: string;
  className?: string;
  showDownloadButton?: boolean;
}

export const BarcodeCard: React.FC<BarcodeCardProps> = ({
  barcodeValue,
  productName,
  className = "",
  showDownloadButton = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && barcodeValue) {
      renderBarcodeToCanvas(canvasRef.current, barcodeValue, {
        width: 2,
        height: 80,
        fontSize: 18,
        margin: 15,
        textMargin: 6,
      });
    }
  }, [barcodeValue]);

  if (!barcodeValue) {
    return (
      <div className={`barcode-card-empty ${className}`}>
        <BarcodeIcon size={24} color="#94a3b8" />
        <span className="barcode-empty-text">Nenhum código de barras cadastrado para este produto.</span>
      </div>
    );
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadBarcodeImage(barcodeValue, productName);
  };

  return (
    <div className={`barcode-card-container ${className}`}>
      <div className="barcode-card-header">
        <div className="barcode-badge">
          <BarcodeIcon size={16} color="#0f172a" />
          <span className="barcode-value-text">{barcodeValue}</span>
        </div>
      </div>

      <div className="barcode-preview-wrapper" title="Clique no botão para baixar a imagem em alta resolução">
        <canvas ref={canvasRef} className="barcode-canvas-preview" />
      </div>

      {showDownloadButton && (
        <button
          type="button"
          className="barcode-download-button"
          onClick={handleDownload}
        >
          <Download size={16} />
          <span>Baixar Imagem do Código de Barras</span>
        </button>
      )}
    </div>
  );
};

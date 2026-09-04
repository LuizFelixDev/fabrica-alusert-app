import JsBarcode from "jsbarcode";

export interface BarcodeOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  font?: string;
  margin?: number;
  textMargin?: number;
  background?: string;
  lineColor?: string;
}

const DEFAULT_OPTIONS: BarcodeOptions = {
  width: 2.5,
  height: 110,
  fontSize: 22,
  font: "Arial, sans-serif",
  margin: 20,
  textMargin: 8,
  background: "#ffffff",
  lineColor: "#000000",
};

/**
 * Sanitizes barcode strings by removing accents and special non-ASCII characters (e.g. Ç -> C)
 * required for CODE128 barcode standard compatibility.
 */
export function sanitizeBarcodeValue(value: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/gi, "c")
    .replace(/Ç/g, "C")
    .toUpperCase();
}

/**
 * Renders a barcode onto a canvas element.
 */
export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  options?: BarcodeOptions
): boolean {
  if (!canvas || !value) return false;
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cleanValue = sanitizeBarcodeValue(value);
    JsBarcode(canvas, cleanValue, {
      format: "CODE128",
      width: opts.width,
      height: opts.height,
      displayValue: true,
      font: opts.font,
      textAlign: "center",
      textPosition: "bottom",
      textMargin: opts.textMargin,
      fontSize: opts.fontSize,
      background: opts.background,
      lineColor: opts.lineColor,
      margin: opts.margin,
    });
    return true;
  } catch (err) {
    console.error("Erro ao gerar código de barras no canvas:", err);
    return false;
  }
}

/**
 * Generates an image file of the barcode and triggers a browser download.
 */
export function downloadBarcodeImage(barcodeValue: string, productName: string): void {
  if (!barcodeValue) return;

  const canvas = document.createElement("canvas");
  const success = renderBarcodeToCanvas(canvas, barcodeValue, {
    width: 2.5,
    height: 120,
    fontSize: 24,
    margin: 25,
    textMargin: 10,
  });

  if (!success) {
    alert("Não foi possível gerar a imagem do código de barras.");
    return;
  }

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const cleanName = productName
    ? productName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/gi, "c")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/gi, "_")
    : "produto";

  const cleanBarcode = sanitizeBarcodeValue(barcodeValue);
  link.download = `codigo_barras_${cleanName}_${cleanBarcode}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

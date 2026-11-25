import { toCanvas } from "html-to-image";

const PADDING = 24;
const LINE_HEIGHT = 22;
const NO_MEASUREMENTS_NOTE = "No measurements selected yet";

// camelCase field key -> readable label, e.g. "shoulderWidth" -> "Shoulder width".
// Mirrors MeasurementSliderPanel.jsx's formatFieldLabel.
function formatFieldLabel(field) {
  const spaced = field.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function definedEntries(measurements) {
  return Object.entries(measurements).filter(([, value]) => value !== "" && value != null);
}

// Composites the rendered sketch element with a text readout of the given
// measurements onto one canvas, then triggers a browser download of the PNG.
// Pure client-side: no backend call.
export async function exportSketchPng(sketchElement, measurements = {}) {
  const sketchCanvas = await toCanvas(sketchElement, { pixelRatio: 2, backgroundColor: "#ffffff" });

  const entries = definedEntries(measurements);
  const lineCount = entries.length > 0 ? entries.length : 1;
  const textBlockHeight = PADDING * 2 + lineCount * LINE_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = sketchCanvas.width;
  canvas.height = sketchCanvas.height + textBlockHeight;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sketchCanvas, 0, 0);

  ctx.fillStyle = "#1f2937";
  ctx.font = "16px sans-serif";
  let y = sketchCanvas.height + PADDING;
  if (entries.length === 0) {
    ctx.fillText(NO_MEASUREMENTS_NOTE, PADDING, y);
  } else {
    for (const [field, value] of entries) {
      ctx.fillText(`${formatFieldLabel(field)}: ${value}`, PADDING, y);
      y += LINE_HEIGHT;
    }
  }

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "sketch.png";
  link.click();
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

let detector: Detector | null | undefined;

async function getDetector(): Promise<Detector | null> {
  if (detector !== undefined) return detector;
  detector = null;
  const BD = (globalThis as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
  if (BD) {
    try {
      const formats = (await BD.getSupportedFormats?.()) ?? ["qr_code"];
      if (formats.includes("qr_code")) detector = new BD({ formats: ["qr_code"] });
    } catch {
      detector = null;
    }
  }
  return detector;
}

/** Decode a QR from a canvas: native BarcodeDetector first, then jsQR. */
export async function decodeCanvas(canvas: HTMLCanvasElement, thorough = false): Promise<string | null> {
  const d = await getDetector();
  if (d) {
    try {
      const r = await d.detect(canvas);
      if (r[0]?.rawValue) return r[0].rawValue;
    } catch {
      /* fall through */
    }
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // ZXing (WASM) — much stronger on dense ZATCA Phase 2 codes, blur, angles.
  try {
    const { readBarcodes } = await import("zxing-wasm/reader");
    const r = await readBarcodes(img, { formats: ["QRCode"], tryHarder: true, tryRotate: true, tryInvert: thorough, tryDownscale: true, maxNumberOfSymbols: 1 });
    const hit = r.find((x) => x.isValid && x.text);
    if (hit) return hit.text;
  } catch {
    /* fall through to jsQR */
  }
  const jsQR = (await import("jsqr")).default;
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: thorough ? "attemptBoth" : "dontInvert" });
  return res?.data || null;
}

/** Decode a QR from an uploaded image file, trying several scales. */
export async function decodeFile(file: File): Promise<string | null> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  for (const max of [1600, 1000, 2400, 700]) {
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const r = await decodeCanvas(canvas, true);
    if (r) return r;
  }
  return null;
}

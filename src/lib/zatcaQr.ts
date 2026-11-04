export interface ZatcaQrData {
  seller?: string;
  vatNumber?: string;
  timestamp?: string;
  total?: string;
  vat?: string;
}

/** Decode a ZATCA (Fatoora) TLV base64 QR string. Returns null if not valid. */
export function parseZatcaQr(raw: string): ZatcaQrData | null {
  let bytes: Uint8Array;
  try {
    const bin = atob(raw.trim());
    bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  const decoder = new TextDecoder('utf-8');
  const out: ZatcaQrData = {};
  let i = 0;
  while (i + 2 <= bytes.length) {
    const tag = bytes[i];
    const len = bytes[i + 1];
    const start = i + 2;
    if (start + len > bytes.length) break;
    const value = decoder.decode(bytes.slice(start, start + len));
    if (tag === 1) out.seller = value;
    else if (tag === 2) out.vatNumber = value;
    else if (tag === 3) out.timestamp = value;
    else if (tag === 4) out.total = value;
    else if (tag === 5) out.vat = value;
    i = start + len;
  }
  if (!out.total || isNaN(parseFloat(out.total))) return null;
  return out;
}

/** Convert ZATCA timestamp to yyyy-MM-dd */
export function zatcaDateToInput(ts?: string): string {
  if (!ts) return '';
  const m = ts.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

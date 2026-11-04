export interface ZatcaQrData {
  seller?: string;
  vatNumber?: string;
  timestamp?: string;
  total?: string;
  vat?: string;
}

function toBytes(raw: string): Uint8Array | null {
  let s = raw.trim().replace(/\s+/g, '');
  try { if (/%[0-9A-F]{2}/i.test(s)) s = decodeURIComponent(s); } catch { /* ignore */ }
  // Some QRs embed data in a URL (?d=... or last path part)
  const m = s.match(/[?&](?:d|data|qr)=([^&]+)/i);
  if (m) s = m[1];
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  try {
    const bin = atob(s);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Decode ZATCA Phase 1 & Phase 2 (Fatoora) TLV base64 QR. Returns null if no total found. */
export function parseZatcaQr(raw: string): ZatcaQrData | null {
  const bytes = toBytes(raw);
  const out: ZatcaQrData = {};
  if (bytes) {
    const decoder = new TextDecoder('utf-8');
    let i = 0;
    while (i + 2 <= bytes.length) {
      const tag = bytes[i];
      let len = bytes[i + 1];
      let start = i + 2;
      // BER long-form length (Phase 2 signature/key fields can exceed 127 bytes)
      if (len & 0x80 && tag > 5) {
        const n = len & 0x7f;
        if (n > 0 && n <= 2 && start + n <= bytes.length) {
          len = 0;
          for (let k = 0; k < n; k++) len = (len << 8) | bytes[start + k];
          start += n;
        }
      }
      if (start + len > bytes.length) break;
      if (tag >= 1 && tag <= 5) {
        const value = decoder.decode(bytes.slice(start, start + len)).trim();
        if (tag === 1) out.seller = value;
        else if (tag === 2) out.vatNumber = value;
        else if (tag === 3) out.timestamp = value;
        else if (tag === 4) out.total = value;
        else if (tag === 5) out.vat = value;
      }
      if (tag >= 5 && out.total && out.timestamp && tag > 5) break; // rest is crypto data
      i = start + len;
    }
  }
  // Fallback: plain-text QR (some printers)
  if (!out.total) {
    const t = raw.match(/(?:total|الإجمالي|المبلغ)[^\d]*([\d,]+\.?\d*)/i);
    if (t) out.total = t[1].replace(/,/g, '');
    const d = raw.match(/\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/);
    if (d) out.timestamp = d[0];
  }
  if (out.total) out.total = out.total.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!out.total || isNaN(parseFloat(out.total))) return null;
  return out;
}

/** Convert ZATCA timestamp to yyyy-MM-dd */
export function zatcaDateToInput(ts?: string): string {
  if (!ts) return '';
  const m = ts.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

/** Convert ZATCA timestamp to HH:mm (local Saudi time if Z suffix) */
export function zatcaTimeToInput(ts?: string): string {
  if (!ts) return '';
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(ts)) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Riyadh' });
    }
  }
  const m = ts.match(/[T ](\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
}

export function formatSaudiPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different input formats
  let normalized = digits;
  
  // If starts with 00966, remove 00
  if (normalized.startsWith('00966')) {
    normalized = normalized.slice(2);
  }
  // If starts with 966, keep as is
  else if (normalized.startsWith('966')) {
    // Already in correct format
  }
  // If starts with 05 (local Saudi mobile), add 966
  else if (normalized.startsWith('05')) {
    normalized = '966' + normalized.slice(1);
  }
  // If starts with 5, add 966
  else if (normalized.startsWith('5') && normalized.length === 9) {
    normalized = '966' + normalized;
  }
  // If just 9 digits starting with 5
  else if (normalized.length === 9 && normalized.startsWith('5')) {
    normalized = '966' + normalized;
  }
  
  return normalized;
}

export function displayPhone(phone: string): string {
  const formatted = formatSaudiPhone(phone);
  if (formatted.startsWith('966') && formatted.length === 12) {
    // Format as +966 5X XXX XXXX
    return `+${formatted.slice(0, 3)} ${formatted.slice(3, 5)} ${formatted.slice(5, 8)} ${formatted.slice(8)}`;
  }
  return phone;
}

export function validateSaudiPhone(phone: string): boolean {
  const formatted = formatSaudiPhone(phone);
  // Saudi mobile numbers: 966 5X XXX XXXX (12 digits total)
  return /^9665\d{8}$/.test(formatted);
}

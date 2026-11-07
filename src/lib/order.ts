// Customer-facing order numbers: VST-100042 (internal order_no + 100000)
export const orderCode = (no: number | string) => `VST-${100000 + Number(no)}`;
/** Accepts "VST-100042", "100042" or "42" and returns the internal order_no. */
export function parseOrder(input: string): number | null {
  const d = Number(String(input).replace(/\D/g, ''));
  if (!d) return null;
  return d >= 100000 ? d - 100000 : d;
}

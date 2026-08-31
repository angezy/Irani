export function hideSupplierBranding(value, fallback = "") {
  const cleaned = String(value ?? "")
    // Product copy is supplied by the store catalog; no external supplier name is injected.
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || fallback;
}

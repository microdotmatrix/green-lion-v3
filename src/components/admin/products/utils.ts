export function formatCurrency(value: string | null) {
  if (!value) return "—";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

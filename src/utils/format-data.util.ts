export function formatCPF(value: string): string {
  let v = value.replace(/\D/g, "");
  v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  return v;
}

export function formatPhone(value: string): string {
  let v = value.replace(/\D/g, "");
  v = v.slice(0, 11);
  if (v.length <= 10) {
    v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else {
    v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  }
  return v.trim().replace(/-$/, "");
}

export const formatDate = (dateString: string) => {
  // Fix timezone issue: date-only strings (YYYY-MM-DD) are parsed as UTC
  // which can show 1 day less in negative timezone offsets (e.g. Brazil)
  const date = new Date(dateString);
  if (dateString && dateString.length === 10) {
    // Date-only string: parse as local date
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  // Add timezone offset to prevent day shift for ISO strings
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() + offset * 60000);
  return localDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
};

export const formatCurrency = (value: string): string => {
  if (!value) return "";

  const numericValue = value.replace(/[^\d.]/g, "");

  if (!numericValue) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(numericValue));
};

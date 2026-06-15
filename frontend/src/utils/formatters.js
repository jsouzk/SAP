export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function onlyDigits(value = "") {
  return value.replace(/\D/g, "");
}

export function formatCpfInput(value = "") {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCpf(value = "") {
  const formatted = formatCpfInput(value);
  if (!formatted) return "-";
  return formatted.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, "***.$2.$3-**");
}

export function formatPhoneInput(value = "") {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function buildBirthdayWhatsAppUrl({ nome = "", telefone = "" } = {}) {
  const digits = onlyDigits(telefone);
  if (!digits) return "";

  const phone = digits.length <= 11 ? `55${digits}` : digits;
  const firstName = nome.trim().split(/\s+/)[0] || "tudo bem";
  const message = `Feliz aniversario, ${firstName}! Desejamos muita saude, paz e realizacoes neste novo ciclo. Um forte abraco!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

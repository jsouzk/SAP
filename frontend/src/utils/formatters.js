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

function isBirthdayToday(dataNascimento) {
  if (!dataNascimento) return false;

  const match = String(dataNascimento).match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!match) return false;

  const today = new Date();
  const birthdayMonth = Number(match[1]);
  const birthdayDay = Number(match[2]);

  return birthdayMonth === today.getMonth() + 1 && birthdayDay === today.getDate();
}

export function buildBirthdayWhatsAppUrl({ nome = "", telefone = "", data_nascimento = "" } = {}) {
  if (!isBirthdayToday(data_nascimento)) return "";

  const digits = onlyDigits(telefone);
  if (!digits) return "";

  const phone = digits.length <= 11 ? `55${digits}` : digits;
  const firstName = nome.trim().split(/\s+/)[0] || "tudo bem";
  const message = `Feliz aniversário, ${firstName}! Desejamos muita saúde, paz e realizações neste novo ciclo. Um forte abraço!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

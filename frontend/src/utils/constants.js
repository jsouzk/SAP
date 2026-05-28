export const USER_TYPES = [
  { value: "administrador", label: "Administrador" },
  { value: "assessor", label: "Assessor" },
  { value: "atendente", label: "Atendente" },
  { value: "vereador", label: "Vereador" },
];

export const assuntoOptions = [
  "Saúde",
  "Educação",
  "Assistência social",
  "Infraestrutura",
  "Regularização",
  "Outros",
];

export const ATENDIMENTO_STATUS = [
  { value: "novo", label: "Novo" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "encaminhado", label: "Encaminhado" },
  { value: "resolvido", label: "Resolvido" },
  { value: "arquivado", label: "Arquivado" },
];

export const ATENDIMENTO_STATUS_LABELS = Object.fromEntries(
  ATENDIMENTO_STATUS.map((status) => [status.value, status.label]),
);

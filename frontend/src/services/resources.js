import api from "./api";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  return [];
};

const normalizeList = (data) => {
  const rawResults = data?.results ?? data;
  const results = asArray(rawResults).filter(Boolean);

  return {
    results,
    count: Number.isFinite(data?.count) ? data.count : results.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
  };
};

export function createResource(path) {
  return {
    async list(params = {}) {
      const { data } = await api.get(path, { params });
      return normalizeList(data);
    },
    async get(id) {
      const { data } = await api.get(`${path}${id}/`);
      return data;
    },
    async create(payload) {
      const { data } = await api.post(path, payload);
      return data;
    },
    async update(id, payload) {
      const { data } = await api.put(`${path}${id}/`, payload);
      return data;
    },
    async remove(id) {
      await api.delete(`${path}${id}/`);
    },
  };
}

export const atendimentosApi = createResource("/atendimentos/");
export const encaminhamentosApi = createResource("/encaminhamentos/");
export const oficiosApi = createResource("/oficios/");
oficiosApi.gerarDeEncaminhamento = async (encaminhamento) => {
  const { data } = await api.post("/oficios/gerar-de-encaminhamento/", { encaminhamento });
  return data;
};
export const usuariosApi = createResource("/usuarios/");
export const historicoApi = createResource("/historico/");
export const gabinetesApi = createResource("/gabinetes/");
gabinetesApi.cobrar = async (id, payload = {}) => {
  const { data } = await api.post(`/gabinetes/${id}/cobrar/`, payload);
  return data;
};
gabinetesApi.renovar = async (id, dias = 30) => {
  const { data } = await api.post(`/gabinetes/${id}/renovar/`, { dias });
  return data;
};
gabinetesApi.teste = async (id, dias = 7) => {
  const { data } = await api.post(`/gabinetes/${id}/teste/`, { dias });
  return data;
};
gabinetesApi.suspender = async (id) => {
  const { data } = await api.post(`/gabinetes/${id}/suspender/`);
  return data;
};
export const pessoasApi = createResource("/pessoas/");
export const pendenciasApi = createResource("/pendencias/");
export const auditoriaApi = createResource("/auditoria/");
export const comentariosApi = createResource("/comentarios/");
export const anexosApi = createResource("/anexos/");
export const minhaAssinaturaApi = {
  async get() {
    const { data } = await api.get("/minha-assinatura/");
    return data;
  },
};

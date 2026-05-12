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
export const usuariosApi = createResource("/usuarios/");
export const historicoApi = createResource("/historico/");

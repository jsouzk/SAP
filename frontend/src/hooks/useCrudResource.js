import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function apiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "object") {
    const [field, messages] = Object.entries(data)[0] || [];
    if (field) {
      const message = Array.isArray(messages) ? messages[0] : messages;
      return `${field}: ${message}`;
    }
  }
  return fallback;
}

export function useCrudResource(resource, initialParams = {}, options = {}) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ page: 1, search: "", ...initialParams });
  const paramsRef = useRef(params);

  const updateParams = useCallback((nextParams) => {
    paramsRef.current = nextParams;
    setParams(nextParams);
  }, []);

  const load = useCallback(
    async (overrides = {}) => {
      setLoading(true);
      try {
        const nextParams = { ...paramsRef.current, ...overrides };
        const data = await resource.list(nextParams);
        setItems(data.results);
        setCount(data.count);
        updateParams(nextParams);
      } catch (error) {
        toast.error(error.response?.data?.detail || "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    },
    [resource, updateParams],
  );

  useEffect(() => {
    if (options.enabled === false) return;
    load();
  }, [load, options.enabled]);

  const save = async (payload, id) => {
    const action = id ? resource.update(id, payload) : resource.create(payload);
    await toast.promise(action, {
      loading: "Salvando...",
      success: "Registro salvo com sucesso.",
      error: (error) => apiErrorMessage(error, "Erro ao salvar registro."),
    });
    await load();
  };

  const remove = async (id) => {
    await toast.promise(resource.remove(id), {
      loading: "Excluindo...",
      success: "Registro excluído.",
      error: (error) => apiErrorMessage(error, "Erro ao excluir registro."),
    });
    await load();
  };

  return { items, count, loading, params, setParams: updateParams, load, save, remove };
}

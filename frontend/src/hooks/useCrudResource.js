import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export function useCrudResource(resource, initialParams = {}) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ page: 1, search: "", ...initialParams });

  const load = useCallback(
    async (overrides = {}) => {
      setLoading(true);
      try {
        const nextParams = { ...params, ...overrides };
        const data = await resource.list(nextParams);
        setItems(data.results);
        setCount(data.count);
        setParams(nextParams);
      } catch (error) {
        toast.error(error.response?.data?.detail || "Nao foi possivel carregar os dados.");
      } finally {
        setLoading(false);
      }
    },
    [params, resource],
  );

  useEffect(() => {
    load();
  }, []);

  const save = async (payload, id) => {
    const action = id ? resource.update(id, payload) : resource.create(payload);
    await toast.promise(action, {
      loading: "Salvando...",
      success: "Registro salvo com sucesso.",
      error: "Erro ao salvar registro.",
    });
    await load();
  };

  const remove = async (id) => {
    await toast.promise(resource.remove(id), {
      loading: "Excluindo...",
      success: "Registro excluido.",
      error: "Erro ao excluir registro.",
    });
    await load();
  };

  return { items, count, loading, params, setParams, load, save, remove };
}

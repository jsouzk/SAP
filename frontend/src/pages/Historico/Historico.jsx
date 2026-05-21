import { useEffect, useState } from "react";
import { ClipboardList, FileText, Send } from "lucide-react";

import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import { useModuleSearch } from "../../context/SearchContext";
import { historicoApi } from "../../services/resources";
import { formatDateTime } from "../../utils/formatters";

const icons = {
  atendimento: ClipboardList,
  encaminhamento: Send,
  oficio: FileText,
};

export default function Historico() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search, setSearch } = useModuleSearch();

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const data = await historicoApi.list(params);
      setItems(data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load({ search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  return (
    <>
      <PageHeader title="Histórico" description="Linha do tempo consolidada de atendimentos, encaminhamentos e ofícios gerados." />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar no histórico" />
      {loading ? <LoadingState /> : (
        <section className="panel p-5">
          {items.length === 0 && <EmptyState title="Histórico vazio" description="Os eventos administrativos aparecerão aqui conforme o fluxo for executado." />}
          <div className="space-y-4">
            {items.map((item) => {
              const Icon = icons[item.tipo] || ClipboardList;
              return (
                <article className="flex gap-4" key={`${item.tipo}-${item.id}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon size={19} /></div>
                  <div className="flex-1 border-b border-slate-100 pb-4">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                      <p className="font-bold text-slate-950">{item.titulo}</p>
                      <p className="text-xs font-semibold text-slate-500">{formatDateTime(item.data)}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.descricao}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

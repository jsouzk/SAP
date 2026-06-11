import { AlertTriangle, CalendarPlus, CheckCheck, Clock, ExternalLink, FileWarning, Filter, UserRoundCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import TipBox from "../../components/ui/TipBox";
import { pendenciasApi } from "../../services/resources";
import { ATENDIMENTO_STATUS_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";

const cards = [
  { key: "prazo_vencido", label: "Prazos vencidos", icon: AlertTriangle, tone: "bg-rose-50 text-rose-700" },
  { key: "vence_hoje", label: "Vencem hoje", icon: Clock, tone: "bg-orange-50 text-orange-700" },
  { key: "vence_3_dias", label: "Vencem em 3 dias", icon: Clock, tone: "bg-yellow-50 text-yellow-700" },
  { key: "sem_responsavel", label: "Sem responsável", icon: UserX, tone: "bg-amber-50 text-amber-700" },
  { key: "encaminhamento_sem_oficio", label: "Sem ofício", icon: FileWarning, tone: "bg-cyan-50 text-cyan-700" },
  { key: "em_andamento_antigo", label: "Em andamento há 7+ dias", icon: Clock, tone: "bg-violet-50 text-violet-700" },
];

const typeLabels = {
  prazo_vencido: "Prazo vencido",
  vence_hoje: "Vence hoje",
  vence_3_dias: "Vence em 3 dias",
  sem_responsavel: "Sem responsável",
  encaminhamento_sem_oficio: "Encaminhamento sem ofício",
  em_andamento_antigo: "Em andamento antigo",
};

const atendimentoTypes = ["prazo_vencido", "vence_hoje", "vence_3_dias", "sem_responsavel", "em_andamento_antigo"];

function isAtendimento(item) {
  return atendimentoTypes.includes(item.tipo);
}

export default function Pendencias() {
  const [data, setData] = useState({ resumo: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [responsavelFilter, setResponsavelFilter] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [responsaveis, setResponsaveis] = useState({});
  const [prazos, setPrazos] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pendenciasApi.list();
      setData({ resumo: response.resumo || {}, results: response.results || [] });
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredResults = useMemo(() => {
    return data.results.filter((item) => {
      const matchesType = !typeFilter || item.tipo === typeFilter;
      const matchesResponsavel = !responsavelFilter || (item.responsavel || "").toLowerCase().includes(responsavelFilter.toLowerCase());
      return matchesType && matchesResponsavel;
    });
  }, [data.results, responsavelFilter, typeFilter]);

  const atendimentoItems = useMemo(() => filteredResults.filter(isAtendimento), [filteredResults]);
  const selectedItems = useMemo(() => atendimentoItems.filter((item) => selected.has(`${item.tipo}-${item.id}`)), [atendimentoItems, selected]);

  const setItemSelected = (item, checked) => {
    setSelected((current) => {
      const next = new Set(current);
      const key = `${item.tipo}-${item.id}`;
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const resolveAtendimento = async (item) => {
    if (!isAtendimento(item)) return;
    await toast.promise(pendenciasApi.resolverAtendimento(item.id), {
      loading: "Resolvendo atendimento...",
      success: "Atendimento resolvido.",
      error: "Não foi possível resolver o atendimento.",
    });
    await load();
  };

  const bulkResolve = async () => {
    if (selectedItems.length === 0) return;
    await toast.promise(Promise.all(selectedItems.map((item) => pendenciasApi.resolverAtendimento(item.id))), {
      loading: "Resolvendo selecionados...",
      success: "Pendências resolvidas.",
      error: "Não foi possível resolver todos os itens.",
    });
    await load();
  };

  const assignAtendimento = async (item) => {
    const responsavel = responsaveis[item.id]?.trim();
    if (!responsavel) {
      toast.error("Informe o responsável.");
      return;
    }
    await toast.promise(pendenciasApi.atribuirAtendimento(item.id, responsavel), {
      loading: "Atualizando responsável...",
      success: "Responsável atualizado.",
      error: "Não foi possível atualizar o responsável.",
    });
    setResponsaveis((current) => ({ ...current, [item.id]: "" }));
    await load();
  };

  const postponeAtendimento = async (item) => {
    const prazo = prazos[item.id];
    if (!prazo) {
      toast.error("Informe o novo prazo.");
      return;
    }
    await toast.promise(pendenciasApi.adiarAtendimento(item.id, prazo), {
      loading: "Atualizando prazo...",
      success: "Prazo atualizado.",
      error: "Não foi possível atualizar o prazo.",
    });
    setPrazos((current) => ({ ...current, [item.id]: "" }));
    await load();
  };

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Pendências" description="Atendimentos e encaminhamentos que precisam de acompanhamento do gabinete." />
      <TipBox>Use esta tela como sua lista diária de trabalho: comece pelos prazos vencidos, depois veja o que vence hoje e o que está sem responsável.</TipBox>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, tone }) => (
          <section className="panel p-5" key={key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{data.resumo[key] || 0}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={22} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="panel mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[180px_minmax(180px,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="label">Tipo</span>
            <select className="input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">Todos</option>
              {cards.map((card) => <option value={card.key} key={card.key}>{card.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Responsável</span>
            <input className="input" value={responsavelFilter} onChange={(event) => setResponsavelFilter(event.target.value)} placeholder="Filtrar por responsável" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={() => { setTypeFilter(""); setResponsavelFilter(""); }}>
              <Filter size={16} /> Limpar
            </button>
            <button className="btn-primary" type="button" onClick={bulkResolve} disabled={selectedItems.length === 0}>
              <CheckCheck size={16} /> Resolver {selectedItems.length || ""}
            </button>
          </div>
        </div>
      </section>

      {loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th w-10"></th>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Título</th>
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Responsável</th>
                  <th className="table-th">Prazo/Data</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Atualizar</th>
                  <th className="table-th text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((item, index) => (
                  <tr key={`${item.tipo}-${item.id}-${index}`}>
                    <td className="table-td">
                      {isAtendimento(item) ? (
                        <input type="checkbox" checked={selected.has(`${item.tipo}-${item.id}`)} onChange={(event) => setItemSelected(item, event.target.checked)} aria-label={`Selecionar ${item.titulo}`} />
                      ) : "-"}
                    </td>
                    <td className="table-td font-bold text-slate-900">{typeLabels[item.tipo] || item.tipo}</td>
                    <td className="table-td">{item.titulo || "-"}</td>
                    <td className="table-td max-w-md truncate">{item.descricao || "-"}</td>
                    <td className="table-td">{item.responsavel || "-"}</td>
                    <td className="table-td">{formatDate(item.prazo_retorno || item.data)}</td>
                    <td className="table-td">{ATENDIMENTO_STATUS_LABELS[item.status] || item.status || "-"}</td>
                    <td className="table-td min-w-[360px]">
                      {isAtendimento(item) ? (
                        <div className="grid gap-2 xl:grid-cols-2">
                          <div className="flex gap-2">
                            <input className="input h-10" value={responsaveis[item.id] || ""} onChange={(event) => setResponsaveis((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Responsável" />
                            <button className="btn-secondary h-10 min-h-10 px-3" type="button" onClick={() => assignAtendimento(item)} aria-label="Atribuir responsável">
                              <UserRoundCheck size={16} />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input className="input h-10" type="date" value={prazos[item.id] || ""} onChange={(event) => setPrazos((current) => ({ ...current, [item.id]: event.target.value }))} />
                            <button className="btn-secondary h-10 min-h-10 px-3" type="button" onClick={() => postponeAtendimento(item)} aria-label="Adiar prazo">
                              <CalendarPlus size={16} />
                            </button>
                          </div>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="table-td text-right">
                      <div className="flex justify-end gap-2">
                        {isAtendimento(item) && item.status !== "resolvido" ? <button className="btn-secondary text-emerald-700" onClick={() => resolveAtendimento(item)}>Resolver</button> : null}
                        {isAtendimento(item) ? (
                          <Link className="btn-secondary h-10 min-h-10 px-3" to={`/atendimentos?search=${encodeURIComponent(item.titulo || "")}`} aria-label="Abrir atendimento">
                            <ExternalLink size={16} />
                          </Link>
                        ) : "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResults.length === 0 && <div className="p-4"><EmptyState title="Nenhuma pendência encontrada" /></div>}
        </section>
      )}
    </>
  );
}

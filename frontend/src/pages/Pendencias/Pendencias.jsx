import { AlertTriangle, Clock, FileWarning, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import TipBox from "../../components/ui/TipBox";
import { atendimentosApi, pendenciasApi } from "../../services/resources";
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

export default function Pendencias() {
  const [data, setData] = useState({ resumo: {}, results: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await pendenciasApi.list();
      setData({ resumo: response.resumo || {}, results: response.results || [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAtendimento = async (item) => {
    if (!["prazo_vencido", "vence_hoje", "vence_3_dias", "sem_responsavel", "em_andamento_antigo"].includes(item.tipo)) return;
    const atendimento = await atendimentosApi.get(item.id);
    await atendimentosApi.update(item.id, { ...atendimento, status: "resolvido" });
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

      {loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Tipo</th>
                  <th className="table-th">Título</th>
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Responsável</th>
                  <th className="table-th">Prazo/Data</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((item, index) => (
                  <tr key={`${item.tipo}-${item.id}-${index}`}>
                    <td className="table-td font-bold text-slate-900">{typeLabels[item.tipo] || item.tipo}</td>
                    <td className="table-td">{item.titulo || "-"}</td>
                    <td className="table-td max-w-md truncate">{item.descricao || "-"}</td>
                    <td className="table-td">{item.responsavel || "-"}</td>
                    <td className="table-td">{formatDate(item.prazo_retorno || item.data)}</td>
                    <td className="table-td">{ATENDIMENTO_STATUS_LABELS[item.status] || item.status || "-"}</td>
                    <td className="table-td text-right">
                      {item.status && item.status !== "resolvido" ? <button className="btn-secondary text-emerald-700" onClick={() => resolveAtendimento(item)}>Resolver</button> : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.results.length === 0 && <div className="p-4"><EmptyState title="Nenhuma pendência encontrada" /></div>}
        </section>
      )}
    </>
  );
}

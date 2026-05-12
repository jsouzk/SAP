import { ClipboardList, FileText, Send, Users } from "lucide-react";
import { useEffect, useState } from "react";

import api from "../../services/api";
import { formatDateTime } from "../../utils/formatters";

const fallback = {
  total_atendimentos: 0,
  total_encaminhamentos: 0,
  total_oficios: 0,
  total_usuarios: 0,
  recentes: [],
};

export default function Dashboard() {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/")
      .then((response) => setData({ ...fallback, ...response.data }))
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Atendimentos", value: data.total_atendimentos, icon: ClipboardList, color: "bg-brand-700" },
    { label: "Encaminhamentos", value: data.total_encaminhamentos, icon: Send, color: "bg-emerald-600" },
    { label: "Oficios gerados", value: data.total_oficios, icon: FileText, color: "bg-slate-700" },
    { label: "Usuarios", value: data.total_usuarios, icon: Users, color: "bg-teal-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <section className="panel p-5" key={label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{loading ? "..." : value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-white ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Movimento mensal</h2>
            <span className="rounded-md bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Atualizado em tempo real</span>
          </div>
          <div className="flex h-72 items-end gap-3">
            {[42, 58, 37, 72, 65, 88, 79, 94].map((height, index) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={height + index}>
                <div className="w-full rounded-t-md bg-brand-700" style={{ height: `${height}%` }} />
                <span className="text-xs font-semibold text-slate-500">{index + 1}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Atendimentos recentes</h2>
          <div className="mt-4 space-y-3">
            {data.recentes.length === 0 && <p className="text-sm text-slate-500">Nenhum atendimento recente encontrado.</p>}
            {data.recentes.map((item) => (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={item.id}>
                <p className="font-semibold text-slate-900">{item.nome}</p>
                <p className="text-sm text-slate-500">{item.assunto}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.criado_em)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

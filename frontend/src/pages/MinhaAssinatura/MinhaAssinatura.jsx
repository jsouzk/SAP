import { AlertTriangle, CalendarDays, CheckCircle2, Mail, Phone, RefreshCw, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import { minhaAssinaturaApi } from "../../services/resources";
import { formatDate } from "../../utils/formatters";

const statusClasses = {
  ativa: "bg-emerald-50 text-emerald-700",
  teste: "bg-cyan-50 text-cyan-700",
  suspensa: "bg-amber-50 text-amber-700",
  expirada: "bg-red-50 text-red-700",
};

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <Icon className="text-brand-700" size={20} />
      <p className="mt-3 text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default function MinhaAssinatura() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setData(await minhaAssinaturaApi.get());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;

  const gabinete = data?.gabinete;
  const ativa = Boolean(gabinete?.licenca_ativa);
  const diasRestantes = gabinete?.dias_restantes;
  const precisaRenovar = !ativa || (Number.isFinite(Number(diasRestantes)) && Number(diasRestantes) <= 5);

  return (
    <>
      <PageHeader title="Licenca do gabinete" description="Acompanhe a situacao de acesso do seu gabinete." />

      {precisaRenovar && (
        <section className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={22} />
            <div>
              <h2 className="font-black">Renovacao necessaria</h2>
              <p className="mt-1 text-sm font-semibold">
                Entre em contato com o administrador da plataforma para renovar ou liberar a licenca deste gabinete.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500">Gabinete</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{gabinete?.nome || "-"}</h2>
              <p className="mt-1 text-sm text-slate-600">{gabinete?.vereador || "-"}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClasses[gabinete?.status_licenca] || "bg-slate-100 text-slate-700"}`}>
              {gabinete?.status_licenca || "-"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Vencimento" value={formatDate(gabinete?.fim_licenca)} />
            <InfoCard icon={ativa ? CheckCircle2 : XCircle} label="Situacao" value={gabinete?.mensagem_licenca} />
            <InfoCard icon={Users} label="Limite de usuarios" value={gabinete?.limite_usuarios} />
            <InfoCard icon={Mail} label="Email responsavel" value={gabinete?.email_responsavel} />
            <InfoCard icon={Phone} label="Telefone" value={gabinete?.telefone} />
          </div>
        </div>

        <aside className="panel p-5">
          <h3 className="text-lg font-black text-slate-950">Resumo</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Status</span><strong className="capitalize">{gabinete?.status_licenca || "-"}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Dias restantes</span><strong>{diasRestantes ?? "-"}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Acesso</span><strong>{ativa ? "Liberado" : "Indisponivel"}</strong></div>
          </div>
          <button className="btn-secondary mt-4 w-full" type="button" onClick={load}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </aside>
      </section>
    </>
  );
}

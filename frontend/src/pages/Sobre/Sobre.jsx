import { BarChart3, ClipboardList, FileText, HeartHandshake, ListChecks, Send, ShieldCheck, UserRound } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";

const modules = [
  {
    title: "Cadastro de pessoas",
    description: "Centraliza moradores, eleitores, contatos e dados de acompanhamento para agilizar novos atendimentos.",
    icon: UserRound,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Atendimentos",
    description: "Organiza demandas recebidas pelo gabinete, com assunto, responsável, prazo e histórico da solicitação.",
    icon: ClipboardList,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Encaminhamentos",
    description: "Registra o envio das demandas para secretarias, órgãos e setores responsáveis pela resposta.",
    icon: Send,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Ofícios",
    description: "Apoia a produção de documentos oficiais vinculados aos encaminhamentos do gabinete.",
    icon: FileText,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Pendências",
    description: "Mostra o que precisa de retorno, decisão ou atualização para reduzir demandas paradas.",
    icon: ListChecks,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Relatórios",
    description: "Transforma registros de rotina em indicadores para acompanhamento e prestação de contas.",
    icon: BarChart3,
    tone: "bg-slate-100 text-slate-700",
  },
];

const principles = [
  "Organizar o atendimento ao cidadão em um único fluxo.",
  "Dar visibilidade aos prazos, responsáveis e encaminhamentos.",
  "Preservar histórico para consultas futuras e relatórios.",
  "Facilitar a rotina operacional sem tirar autonomia da equipe.",
];

export default function Sobre() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Sobre o SAP"
        description="Sistema de Atendimento Parlamentar para organizar demandas, encaminhamentos, documentos e acompanhamento do gabinete."
      />

      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-7">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-brand-700/25 to-transparent" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-100">Atendimento Parlamentar</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Uma base clara para acompanhar cada demanda do cidadão.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                O SAP ajuda o gabinete a registrar pessoas atendidas, controlar solicitações, emitir documentos e manter o histórico de cada movimentação.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Ambiente atual</p>
              <p className="mt-2 text-2xl font-black">{user?.gabinete_nome || "Plataforma SAP"}</p>
              <p className="mt-1 text-sm text-slate-300">{user?.nome || "Usuário autenticado"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="panel p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <HeartHandshake size={23} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Propósito</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  O sistema foi pensado para gabinetes que precisam responder melhor, acompanhar demandas com responsabilidade e consultar informações sem depender de controles espalhados.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {principles.map((principle, index) => (
                <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3" key={principle}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-slate-700">{principle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">O que o sistema cobre</h2>
                <p className="mt-1 text-sm text-slate-500">Principais áreas integradas ao fluxo de atendimento.</p>
              </div>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 sm:flex">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {modules.map(({ title, description, icon: Icon, tone }) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={title}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  ShieldAlert,
  UserX,
  Users,
} from "lucide-react";

import Actions from "../../components/ui/Actions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import LoadingState from "../../components/ui/LoadingState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useModuleSearch } from "../../context/SearchContext";
import { useCrudResource } from "../../hooks/useCrudResource";
import api from "../../services/api";
import { auditoriaApi, gabinetesApi, usuariosApi } from "../../services/resources";
import { formatDate, formatDateTime } from "../../utils/formatters";

const emptyForm = {
  nome: "",
  vereador: "",
  email_responsavel: "",
  telefone: "",
  status_licenca: "suspensa",
  inicio_licenca: new Date().toISOString().slice(0, 10),
  fim_licenca: "",
  limite_usuarios: 5,
  logo_url: "",
  assinatura_nome: "",
  assinatura_cargo: "Vereador",
  dias_prazo_padrao: 7,
  secretarias_padrao: "",
  assuntos_padrao: "",
  template_oficio: "",
  observacoes: "",
};

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "ativa", label: "Ativa" },
  { value: "teste", label: "Teste" },
  { value: "suspensa", label: "Suspensa" },
  { value: "expirada", label: "Expirada" },
];

const riskOptions = [
  { value: "", label: "Todos os riscos" },
  { value: "vencendo", label: "Vencendo em 7 dias" },
  { value: "expirada", label: "Expiradas" },
  { value: "sem_usuarios", label: "Sem usuarios" },
  { value: "perto_limite", label: "Perto do limite" },
  { value: "acima_limite", label: "Acima do limite" },
];

const tabs = [
  { id: "resumo", label: "Resumo" },
  { id: "usuarios", label: "Usuarios" },
  { id: "licenca", label: "Licenca" },
  { id: "uso", label: "Uso" },
  { id: "auditoria", label: "Auditoria" },
];

function MetricCard({ label, value, icon: Icon, tone = "brand", onClick, active }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <button
      type="button"
      className={`panel p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "ring-2 ring-brand-500" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone] || tones.brand}`}>
          <Icon size={21} />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ gabinete }) {
  const active = gabinete.licenca_ativa;
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {gabinete.status_licenca}
    </span>
  );
}

function RiskTags({ risks = [] }) {
  if (!risks.length) {
    return <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Sem alerta</span>;
  }

  const labels = {
    vencendo: "Vencendo",
    expirada: "Expirada",
    sem_usuarios: "Sem usuarios",
    perto_limite: "Perto do limite",
    acima_limite: "Acima do limite",
  };

  return (
    <div className="flex flex-wrap gap-1">
      {risks.map((risk) => (
        <span key={risk} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
          {labels[risk] || risk}
        </span>
      ))}
    </div>
  );
}

export default function AdminSaas() {
  const { user } = useAuth();
  const { search, setSearch } = useModuleSearch();
  const canAccess = user?.is_platform_admin || user?.is_superuser;
  const [filters, setFilters] = useState({ status_licenca: "", risco: "" });
  const resource = useCrudResource(gabinetesApi, filters, { enabled: canAccess });
  const [overview, setOverview] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailTab, setDetailTab] = useState("resumo");
  const [auditItems, setAuditItems] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: emptyForm });

  const gabineteUsuarios = useMemo(
    () => usuarios.filter((usuario) => usuario.gabinete === viewing?.id),
    [usuarios, viewing?.id],
  );

  const loadOverview = async () => {
    const { data } = await api.get("/admin-saas/overview/");
    setOverview(data);
  };

  const loadUsuarios = async () => {
    const data = await usuariosApi.list({ page_size: 100 });
    setUsuarios(data.results);
  };

  const refreshAdmin = async () => {
    await Promise.all([
      resource.load({ page: 1, search, ...filters }),
      loadOverview(),
      loadUsuarios(),
    ]);
  };

  useEffect(() => {
    if (!canAccess) return;
    loadOverview().catch(() => setOverview(null));
    loadUsuarios().catch(() => setUsuarios([]));
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search, ...filters });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search, filters.status_licenca, filters.risco, canAccess]);

  useEffect(() => {
    if (!viewing?.id || detailTab !== "auditoria") return;
    setAuditLoading(true);
    auditoriaApi
      .list({ model_name: "assinaturas.Gabinete", object_id: viewing.id, page_size: 20 })
      .then((data) => setAuditItems(data.results))
      .catch(() => setAuditItems([]))
      .finally(() => setAuditLoading(false));
  }, [viewing?.id, detailTab]);

  if (!canAccess) {
    return (
      <section className="panel p-6">
        <h2 className="text-lg font-bold text-slate-950">Acesso restrito</h2>
        <p className="mt-2 text-sm text-slate-600">Somente administradores da plataforma podem acessar esta area.</p>
      </section>
    );
  }

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item ? { ...item, fim_licenca: item.fim_licenca || "" } : emptyForm);
  };

  const openDetails = (item) => {
    setViewing(item);
    setDetailTab("resumo");
    setAuditItems([]);
  };

  const submit = async (values) => {
    await resource.save({ ...values, fim_licenca: values.fim_licenca || null }, editing?.id);
    setEditing(null);
    await refreshAdmin();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
    await loadOverview();
  };

  const setRiskFilter = (risco) => {
    setFilters((current) => ({ ...current, risco: current.risco === risco ? "" : risco }));
  };

  const updateStatusFilter = (event) => {
    setFilters((current) => ({ ...current, status_licenca: event.target.value }));
  };

  const updateRiskFilter = (event) => {
    setFilters((current) => ({ ...current, risco: event.target.value }));
  };

  const applyLicenseAction = async (gabinete, action, label, payload) => {
    const calls = {
      renovar: () => gabinetesApi.renovar(gabinete.id, payload?.dias),
      teste: () => gabinetesApi.teste(gabinete.id, payload?.dias),
      suspender: () => gabinetesApi.suspender(gabinete.id),
    };

    await toast.promise(calls[action](), {
      loading: `${label}...`,
      success: "Licenca atualizada.",
      error: "Nao foi possivel atualizar a licenca.",
    });
    await refreshAdmin();
    if (viewing?.id === gabinete.id) {
      const updated = await gabinetesApi.get(gabinete.id);
      setViewing(updated);
    }
  };

  const cards = [
    { label: "Gabinetes", value: overview?.total_gabinetes || 0, icon: Building2, tone: "brand", risk: "" },
    { label: "Ativas", value: overview?.licencas_ativas || 0, icon: CheckCircle2, tone: "emerald", risk: "" },
    { label: "Vencendo em 7 dias", value: overview?.licencas_vencendo_7_dias || 0, icon: CalendarClock, tone: "amber", risk: "vencendo" },
    { label: "Expiradas", value: overview?.licencas_expiradas || 0, icon: ShieldAlert, tone: "red", risk: "expirada" },
    { label: "Sem usuarios", value: overview?.gabinetes_sem_usuarios || 0, icon: UserX, tone: "amber", risk: "sem_usuarios" },
    { label: "Acima do limite", value: overview?.gabinetes_acima_limite || 0, icon: AlertTriangle, tone: "red", risk: "acima_limite" },
    { label: "Usuarios", value: overview?.usuarios || 0, icon: Users, tone: "slate", risk: "" },
    { label: "Documentos", value: (overview?.encaminhamentos || 0) + (overview?.oficios || 0), icon: FileText, tone: "slate", risk: "" },
  ];

  return (
    <>
      <PageHeader title="Admin SaaS" description="Gerencie gabinetes, licencas, usuarios, uso e auditoria da plataforma." actionLabel="Novo gabinete" onAction={() => openForm()} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon, tone, risk }) => (
          <MetricCard key={label} label={label} value={value} icon={icon} tone={tone} active={filters.risco === risk && Boolean(risk)} onClick={() => risk && setRiskFilter(risk)} />
        ))}
      </div>

      <section className="panel mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_14rem_auto]">
          <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por gabinete, vereador ou status" />
          <select className="input" value={filters.status_licenca} onChange={updateStatusFilter} aria-label="Status da licenca">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="input" value={filters.risco} onChange={updateRiskFilter} aria-label="Filtro de risco">
            {riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" className="btn-secondary" onClick={() => setFilters({ status_licenca: "", risco: "" })}>
            <Filter size={18} />
            Limpar
          </button>
        </div>
      </section>

      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Gabinete</th>
                  <th className="table-th">Licenca</th>
                  <th className="table-th">Usuarios</th>
                  <th className="table-th">Uso</th>
                  <th className="table-th">Risco</th>
                  <th className="table-th">Ultima atividade</th>
                  <th className="table-th text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td">
                      <p className="font-semibold text-slate-950">{item.nome}</p>
                      <p className="text-xs text-slate-500">{item.vereador}</p>
                    </td>
                    <td className="table-td">
                      <StatusBadge gabinete={item} />
                      <p className="mt-1 text-xs text-slate-500">{item.mensagem_licenca}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-semibold">{item.usuarios_count || 0}/{item.limite_usuarios}</p>
                      <p className="text-xs text-slate-500">{item.email_responsavel}</p>
                    </td>
                    <td className="table-td">
                      <p>{item.atendimentos_count || 0} atend. / {item.oficios_count || 0} oficios</p>
                      <p className="text-xs text-slate-500">{item.pessoas_count || 0} pessoas / {item.encaminhamentos_count || 0} encaminh.</p>
                    </td>
                    <td className="table-td"><RiskTags risks={item.risco_admin} /></td>
                    <td className="table-td text-sm">{formatDateTime(item.ultima_atividade)}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button className="btn-secondary h-9 px-3 py-0 text-xs" onClick={() => openDetails(item)}>
                          <Eye size={16} />
                          Ver
                        </button>
                        <button className="btn-secondary h-9 px-3 py-0 text-xs text-emerald-700" onClick={() => applyLicenseAction(item, "renovar", "Renovando licenca", { dias: 30 })}>+30 dias</button>
                        <button className="btn-secondary h-9 px-3 py-0 text-xs text-amber-700" onClick={() => applyLicenseAction(item, "teste", "Ativando teste", { dias: 7 })}>Teste</button>
                        <Actions onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState title="Nenhum gabinete encontrado" /></div>}
        </section>
      )}

      <Modal open={Boolean(viewing)} title={viewing?.nome || "Detalhes do gabinete"} onClose={() => setViewing(null)} size="max-w-5xl">
        {viewing && (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button key={tab.id} type="button" className={`btn-secondary h-9 px-3 py-0 text-xs ${detailTab === tab.id ? "border-brand-300 bg-brand-50 text-brand-800" : ""}`} onClick={() => setDetailTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {detailTab === "resumo" && (
              <div className="grid gap-3 md:grid-cols-2">
                <InfoCard icon={Building2} label="Vereador" value={viewing.vereador} />
                <InfoCard icon={CheckCircle2} label="Status" value={`${viewing.status_licenca} - vence em ${formatDate(viewing.fim_licenca)}`} />
                <InfoCard icon={Users} label="Usuarios" value={`${viewing.usuarios_count || 0}/${viewing.limite_usuarios}`} />
                <InfoCard icon={Clock3} label="Ultima atividade" value={formatDateTime(viewing.ultima_atividade)} />
                <div className="rounded-lg border border-slate-200 p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase text-slate-500">Alertas</p>
                  <div className="mt-2"><RiskTags risks={viewing.risco_admin} /></div>
                </div>
              </div>
            )}

            {detailTab === "usuarios" && (
              <div className="grid gap-3 md:grid-cols-2">
                {gabineteUsuarios.map((usuario) => (
                  <article className="rounded-lg border border-slate-200 p-4" key={usuario.id}>
                    <p className="font-bold text-slate-950">{usuario.nome}</p>
                    <p className="text-sm text-slate-500">{usuario.email}</p>
                    <p className="mt-2 text-xs font-semibold uppercase text-brand-700">{usuario.tipo_usuario}</p>
                  </article>
                ))}
                {gabineteUsuarios.length === 0 && <EmptyState title="Nenhum usuario vinculado" />}
              </div>
            )}

            {detailTab === "licenca" && (
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoCard icon={CheckCircle2} label="Situacao" value={viewing.mensagem_licenca} />
                  <InfoCard icon={CalendarClock} label="Inicio" value={formatDate(viewing.inicio_licenca)} />
                  <InfoCard icon={CalendarClock} label="Fim" value={formatDate(viewing.fim_licenca)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary text-emerald-700" onClick={() => applyLicenseAction(viewing, "renovar", "Renovando licenca", { dias: 30 })}>Renovar 30 dias</button>
                  <button className="btn-secondary text-emerald-700" onClick={() => applyLicenseAction(viewing, "renovar", "Renovando licenca", { dias: 90 })}>Renovar 90 dias</button>
                  <button className="btn-secondary text-brand-700" onClick={() => applyLicenseAction(viewing, "renovar", "Renovando licenca", { dias: 365 })}>Renovar 1 ano</button>
                  <button className="btn-secondary text-amber-700" onClick={() => applyLicenseAction(viewing, "teste", "Ativando teste", { dias: 7 })}>Teste 7 dias</button>
                  <button className="btn-danger" onClick={() => applyLicenseAction(viewing, "suspender", "Suspendendo licenca")}>
                    <Ban size={18} />
                    Suspender
                  </button>
                  <button className="btn-secondary" onClick={() => openForm(viewing)}>Editar vencimento</button>
                </div>
              </div>
            )}

            {detailTab === "uso" && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard icon={Users} label="Pessoas" value={viewing.pessoas_count || 0} />
                <InfoCard icon={Activity} label="Atendimentos" value={viewing.atendimentos_count || 0} />
                <InfoCard icon={FileText} label="Encaminhamentos" value={viewing.encaminhamentos_count || 0} />
                <InfoCard icon={FileText} label="Oficios" value={viewing.oficios_count || 0} />
              </div>
            )}

            {detailTab === "auditoria" && (
              <div className="space-y-3">
                {auditLoading ? <LoadingState /> : auditItems.map((item) => (
                  <article className="rounded-lg border border-slate-200 p-4" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold capitalize text-slate-950">{item.action}</p>
                      <p className="text-xs font-semibold text-slate-500">{formatDateTime(item.criado_em)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{item.user_nome || item.user_email || "Sistema"} - {item.ip_address || "IP nao registrado"}</p>
                  </article>
                ))}
                {!auditLoading && auditItems.length === 0 && <EmptyState title="Nenhum registro de auditoria" />}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={Boolean(editing)} title={editing?.id ? "Editar gabinete" : "Novo gabinete"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <FormField label="Nome do gabinete" error={errors.nome}><input className="input" {...register("nome", { required: "Informe o nome" })} /></FormField>
          <FormField label="Vereador" error={errors.vereador}><input className="input" {...register("vereador", { required: "Informe o vereador" })} /></FormField>
          <FormField label="Email responsavel" error={errors.email_responsavel}><input className="input" type="email" {...register("email_responsavel", { required: "Informe o email" })} /></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" {...register("telefone")} /></FormField>
          <FormField label="Status da licenca" error={errors.status_licenca}>
            <select className="input" {...register("status_licenca")}>
              {statusOptions.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </FormField>
          <FormField label="Inicio da licenca" error={errors.inicio_licenca}><input className="input" type="date" {...register("inicio_licenca")} /></FormField>
          <FormField label="Fim da licenca" error={errors.fim_licenca}><input className="input" type="date" {...register("fim_licenca")} /></FormField>
          <FormField label="Limite de usuarios" error={errors.limite_usuarios}><input className="input" type="number" min="1" {...register("limite_usuarios", { valueAsNumber: true })} /></FormField>
          <FormField label="URL do logo" error={errors.logo_url}><input className="input" {...register("logo_url")} /></FormField>
          <FormField label="Nome da assinatura" error={errors.assinatura_nome}><input className="input" {...register("assinatura_nome")} /></FormField>
          <FormField label="Cargo da assinatura" error={errors.assinatura_cargo}><input className="input" {...register("assinatura_cargo")} /></FormField>
          <FormField label="Prazo padrao em dias" error={errors.dias_prazo_padrao}><input className="input" type="number" min="1" {...register("dias_prazo_padrao", { valueAsNumber: true })} /></FormField>
          <FormField label="Secretarias padrao" error={errors.secretarias_padrao}><textarea className="input min-h-20" placeholder="Uma secretaria por linha" {...register("secretarias_padrao")} /></FormField>
          <FormField label="Assuntos padrao" error={errors.assuntos_padrao}><textarea className="input min-h-20" placeholder="Um assunto por linha" {...register("assuntos_padrao")} /></FormField>
          <FormField label="Template do oficio" error={errors.template_oficio}><textarea className="input min-h-32" placeholder="Use {nome}, {assunto}, {descricao}, {secretaria}, {vereador}" {...register("template_oficio")} /></FormField>
          <FormField label="Observacoes" error={errors.observacoes}><textarea className="input min-h-24" {...register("observacoes")} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} message={`Excluir gabinete ${deleting?.nome || ""}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          <p className="mt-1 font-semibold text-slate-950">{value || "-"}</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Building2, CreditCard, DollarSign, ExternalLink, FileText, Receipt, Users } from "lucide-react";

import Actions from "../../components/ui/Actions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import LoadingState from "../../components/ui/LoadingState";
import MercadoPagoWallet from "../../components/payments/MercadoPagoWallet";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import { useAuth } from "../../context/AuthContext";
import { useModuleSearch } from "../../context/SearchContext";
import { useCrudResource } from "../../hooks/useCrudResource";
import api from "../../services/api";
import { cobrancasApi, gabinetesApi, usuariosApi } from "../../services/resources";

const emptyForm = {
  nome: "",
  vereador: "",
  email_responsavel: "",
  telefone: "",
  status_licenca: "suspensa",
  inicio_licenca: new Date().toISOString().slice(0, 10),
  fim_licenca: "",
  valor_mensal: "0.00",
  limite_usuarios: 5,
  observacoes: "",
};

const emptyCobranca = {
  gabinete: "",
  referencia: "",
  valor: "0.00",
  vencimento: new Date().toISOString().slice(0, 10),
  pago_em: "",
  status: "aberta",
  metodo_pagamento: "pix",
  codigo_pagamento: "",
  gateway: "",
  gateway_payment_id: "",
  observacoes: "",
};

const statuses = [
  { value: "teste", label: "Teste" },
  { value: "ativa", label: "Ativa" },
  { value: "suspensa", label: "Suspensa" },
  { value: "expirada", label: "Expirada" },
];

const currentReference = () => {
  const today = new Date();
  return `${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
};

const todayAsInput = () => new Date().toISOString().slice(0, 10);

const money = (value) => `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const apiErrorMessage = (fallback) => (error) => error.response?.data?.detail || fallback;

export default function AdminSaas() {
  const { user } = useAuth();
  const { search, setSearch } = useModuleSearch();
  const canAccess = user?.is_platform_admin || user?.is_superuser;
  const resource = useCrudResource(gabinetesApi, {}, { enabled: canAccess });
  const cobrancasResource = useCrudResource(cobrancasApi, { page_size: 100 }, { enabled: canAccess });
  const [overview, setOverview] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingCobranca, setEditingCobranca] = useState(null);
  const [chargingGabinete, setChargingGabinete] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingCobranca, setDeletingCobranca] = useState(null);
  const deletingId = deleting?.id;
  const deletingCobrancaId = deletingCobranca?.id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: emptyForm });
  const cobrancaForm = useForm({ defaultValues: emptyCobranca });
  const chargeForm = useForm({ defaultValues: { referencia: currentReference(), vencimento: todayAsInput(), valor: "0.00" } });


  useEffect(() => {
    if (!canAccess) return;
    api.get("/admin-saas/overview/").then((response) => setOverview(response.data)).catch(() => setOverview(null));
    usuariosApi.list({ page_size: 100 }).then((data) => setUsuarios(data.results)).catch(() => setUsuarios([]));
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess) return;
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search, canAccess]);

  if (!canAccess) {
    return (
      <section className="panel p-6">
        <h2 className="text-lg font-bold text-slate-950">Acesso restrito</h2>
        <p className="mt-2 text-sm text-slate-600">Somente administradores da plataforma podem acessar esta área.</p>
      </section>
    );
  }

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item || emptyForm);
  };

  const submit = async (values) => {
    await resource.save({ ...values, fim_licenca: values.fim_licenca || null }, editing?.id);
    setEditing(null);
    const { data } = await api.get("/admin-saas/overview/");
    setOverview(data);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  const openCobranca = (item = null) => {
    setEditingCobranca(item || {});
    cobrancaForm.reset(item || emptyCobranca);
  };

  const openCharge = (gabinete) => {
    setChargingGabinete(gabinete);
    chargeForm.reset({
      referencia: currentReference(),
      vencimento: todayAsInput(),
      valor: gabinete.valor_mensal || "0.00",
    });
  };

  const submitCobranca = async (values) => {
    await cobrancasResource.save({ ...values, pago_em: values.pago_em || null }, editingCobranca?.id);
    setEditingCobranca(null);
  };

  const confirmDeleteCobranca = async () => {
    if (!deletingCobrancaId) return;
    await cobrancasResource.remove(deletingCobrancaId);
    setDeletingCobranca(null);
  };

  const gerarPagamento = async (cobranca) => {
    const data = await toast.promise(cobrancasApi.gerarPagamento(cobranca.id), {
      loading: "Gerando link do Mercado Pago...",
      success: "Link de pagamento gerado.",
      error: apiErrorMessage("Não foi possível gerar o pagamento."),
    });
    await cobrancasResource.load();

    const pagamento = data.pagamento || {};
    setCheckout({
      cobranca: data,
      preferenceId: pagamento.preference_id,
      checkoutUrl: pagamento.checkout_url || pagamento.init_point || data.codigo_pagamento,
    });
  };

  const cobrarGabinete = async (values) => {
    if (!chargingGabinete?.id) return;

    const data = await toast.promise(gabinetesApi.cobrar(chargingGabinete.id, values), {
      loading: "Criando cobrança e checkout...",
      success: "Cobrança pronta para pagamento.",
      error: apiErrorMessage("Não foi possível gerar a cobrança."),
    });

    setChargingGabinete(null);
    await cobrancasResource.load();
    const overviewResponse = await api.get("/admin-saas/overview/");
    setOverview(overviewResponse.data);

    const pagamento = data.pagamento || {};
    setCheckout({
      cobranca: data,
      preferenceId: pagamento.preference_id,
      checkoutUrl: pagamento.checkout_url || pagamento.init_point || data.codigo_pagamento,
    });
  };

  const cards = [
    { label: "Gabinetes", value: overview?.total_gabinetes || 0, icon: Building2 },
    { label: "Licenças ativas", value: overview?.licencas_ativas || 0, icon: CreditCard },
    { label: "Usuários", value: overview?.usuarios || 0, icon: Users },
    { label: "Documentos", value: (overview?.encaminhamentos || 0) + (overview?.oficios || 0), icon: FileText },
    { label: "Cobranças abertas", value: overview?.cobrancas_abertas || 0, icon: Receipt },
    { label: "Receita paga", value: money(overview?.receita_paga), icon: DollarSign },
  ];

  return (
    <>
      <PageHeader title="Admin SaaS" description="Gerencie gabinetes, licenças, usuários e uso geral da plataforma." actionLabel="Novo gabinete" onAction={() => openForm()} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <section className="panel p-5" key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon size={21} /></div>
            </div>
          </section>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por gabinete, vereador ou status" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Gabinete</th><th className="table-th">Vereador</th><th className="table-th">Licença</th><th className="table-th">Usuários</th><th className="table-th">Uso</th><th className="table-th text-right">Ações</th></tr>
              </thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td font-semibold text-slate-950">{item.nome}</td>
                    <td className="table-td">{item.vereador}</td>
                    <td className="table-td"><span className={`rounded-md px-2 py-1 text-xs font-bold ${item.licenca_ativa ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.status_licenca}</span></td>
                    <td className="table-td">{item.usuarios_count || 0}/{item.limite_usuarios}</td>
                    <td className="table-td">{item.atendimentos_count || 0} atend. / {item.oficios_count || 0} oficios</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-secondary h-9 w-9 p-0 text-emerald-700" onClick={() => openCharge(item)} aria-label="Cobrar gabinete" title="Cobrar gabinete">
                          <DollarSign size={16} />
                        </button>
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
      <section className="panel mt-5 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-950">Cobranças e pagamentos</h3>
          <button className="btn-primary" onClick={() => openCobranca()}>Nova cobrança</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50"><tr><th className="table-th">Gabinete</th><th className="table-th">Referência</th><th className="table-th">Valor</th><th className="table-th">Vencimento</th><th className="table-th">Status</th><th className="table-th">Gateway</th><th className="table-th text-right">Ações</th></tr></thead>
            <tbody>
              {cobrancasResource.items.map((cobranca) => (
                <tr key={cobranca.id}>
                  <td className="table-td font-semibold">{cobranca.gabinete_nome}</td>
                  <td className="table-td">{cobranca.referencia}</td>
                  <td className="table-td">R$ {cobranca.valor}</td>
                  <td className="table-td">{cobranca.vencimento}</td>
                  <td className="table-td capitalize">{cobranca.status}</td>
                  <td className="table-td">{cobranca.gateway || "manual"}</td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1">
                      {cobranca.status !== "paga" && (
                        <button className="btn-secondary h-9 w-9 p-0 text-brand-700" onClick={() => gerarPagamento(cobranca)} aria-label="Gerar pagamento Mercado Pago" title="Gerar pagamento Mercado Pago">
                          <CreditCard size={16} />
                        </button>
                      )}
                      {cobranca.codigo_pagamento && (
                        <button className="btn-secondary h-9 w-9 p-0" onClick={() => window.open(cobranca.codigo_pagamento, "_blank", "noopener,noreferrer")} aria-label="Abrir link de pagamento" title="Abrir link de pagamento">
                          <ExternalLink size={16} />
                        </button>
                      )}
                      <Actions onEdit={() => openCobranca(cobranca)} onDelete={() => setDeletingCobranca(cobranca)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cobrancasResource.items.length === 0 && <EmptyState title="Nenhuma cobrança cadastrada" description="Cadastre mensalidades, pagamentos manuais ou referências de gateway." />}
      </section>
      <section className="panel mt-5 p-5">
        <h3 className="text-lg font-bold text-slate-950">Usuários usando a plataforma</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {usuarios.map((usuario) => (
            <article className="rounded-lg border border-slate-200 p-4" key={usuario.id}>
              <p className="font-bold text-slate-950">{usuario.nome}</p>
              <p className="text-sm text-slate-500">{usuario.email}</p>
              <p className="mt-2 text-xs font-semibold uppercase text-brand-700">{usuario.gabinete_nome || "Sem gabinete"} - {usuario.tipo_usuario}</p>
            </article>
          ))}
        </div>
      </section>
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar gabinete" : "Novo gabinete"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <FormField label="Nome do gabinete" error={errors.nome}><input className="input" {...register("nome", { required: "Informe o nome" })} /></FormField>
          <FormField label="Vereador" error={errors.vereador}><input className="input" {...register("vereador", { required: "Informe o vereador" })} /></FormField>
          <FormField label="Email responsável" error={errors.email_responsavel}><input className="input" type="email" {...register("email_responsavel", { required: "Informe o email" })} /></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" {...register("telefone")} /></FormField>
          <FormField label="Status da licença" error={errors.status_licenca}><select className="input" {...register("status_licenca")}>{statuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}</select></FormField>
          <FormField label="Limite de usuários" error={errors.limite_usuarios}><input className="input" type="number" min="1" {...register("limite_usuarios", { valueAsNumber: true })} /></FormField>
          <FormField label="Início da licença" error={errors.inicio_licenca}><input className="input" type="date" {...register("inicio_licenca", { required: "Informe a data" })} /></FormField>
          <FormField label="Fim da licença" error={errors.fim_licenca}><input className="input" type="date" {...register("fim_licenca")} /></FormField>
          <FormField label="Valor mensal" error={errors.valor_mensal}><input className="input" type="number" step="0.01" min="0" {...register("valor_mensal")} /></FormField>
          <FormField label="Observações" error={errors.observacoes}><textarea className="input min-h-24" {...register("observacoes")} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(editingCobranca)} title={editingCobranca?.id ? "Editar cobrança" : "Nova cobrança"} onClose={() => setEditingCobranca(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={cobrancaForm.handleSubmit(submitCobranca)}>
          <FormField label="Gabinete" error={cobrancaForm.formState.errors.gabinete}><select className="input" {...cobrancaForm.register("gabinete", { required: "Selecione o gabinete" })}><option value="">Selecione</option>{resource.items.map((gabinete) => <option value={gabinete.id} key={gabinete.id}>{gabinete.nome}</option>)}</select></FormField>
          <FormField label="Referência" error={cobrancaForm.formState.errors.referencia}><input className="input" placeholder="05/2026" {...cobrancaForm.register("referencia", { required: "Informe a referência" })} /></FormField>
          <FormField label="Valor" error={cobrancaForm.formState.errors.valor}><input className="input" type="number" step="0.01" min="0" {...cobrancaForm.register("valor", { required: "Informe o valor" })} /></FormField>
          <FormField label="Vencimento" error={cobrancaForm.formState.errors.vencimento}><input className="input" type="date" {...cobrancaForm.register("vencimento", { required: "Informe o vencimento" })} /></FormField>
          <FormField label="Pago em" error={cobrancaForm.formState.errors.pago_em}><input className="input" type="date" {...cobrancaForm.register("pago_em")} /></FormField>
          <FormField label="Status" error={cobrancaForm.formState.errors.status}><select className="input" {...cobrancaForm.register("status")}><option value="aberta">Aberta</option><option value="paga">Paga</option><option value="atrasada">Atrasada</option><option value="cancelada">Cancelada</option></select></FormField>
          <FormField label="Método" error={cobrancaForm.formState.errors.metodo_pagamento}><select className="input" {...cobrancaForm.register("metodo_pagamento")}><option value="pix">PIX</option><option value="boleto">Boleto</option><option value="cartao">Cartão</option><option value="transferencia">Transferência</option><option value="manual">Manual</option></select></FormField>
          <FormField label="Código/link de pagamento" error={cobrancaForm.formState.errors.codigo_pagamento}><input className="input" {...cobrancaForm.register("codigo_pagamento")} /></FormField>
          <FormField label="Gateway" error={cobrancaForm.formState.errors.gateway}><input className="input" placeholder="mercadopago, stripe..." {...cobrancaForm.register("gateway")} /></FormField>
          <FormField label="ID no gateway" error={cobrancaForm.formState.errors.gateway_payment_id}><input className="input" {...cobrancaForm.register("gateway_payment_id")} /></FormField>
          <FormField label="Observações" error={cobrancaForm.formState.errors.observacoes}><textarea className="input min-h-24" {...cobrancaForm.register("observacoes")} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditingCobranca(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(chargingGabinete)} title="Cobrar gabinete" onClose={() => setChargingGabinete(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={chargeForm.handleSubmit(cobrarGabinete)}>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-500">Gabinete</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{chargingGabinete?.nome}</p>
            <p className="mt-1 text-sm text-slate-600">{chargingGabinete?.vereador}</p>
          </div>
          <FormField label="Referência" error={chargeForm.formState.errors.referencia}>
            <input className="input" placeholder="05/2026" {...chargeForm.register("referencia", { required: "Informe a referência" })} />
          </FormField>
          <FormField label="Vencimento" error={chargeForm.formState.errors.vencimento}>
            <input className="input" type="date" {...chargeForm.register("vencimento", { required: "Informe o vencimento" })} />
          </FormField>
          <FormField label="Valor" error={chargeForm.formState.errors.valor}>
            <input className="input" type="number" step="0.01" min="0" {...chargeForm.register("valor", { required: "Informe o valor" })} />
          </FormField>
          <div className="flex items-end text-sm text-slate-500">
            A cobrança será criada e o checkout do Mercado Pago será gerado automaticamente.
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setChargingGabinete(null)}>Cancelar</button>
            <button className="btn-primary">Criar cobrança</button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(checkout)} title="Pagamento Mercado Pago" onClose={() => setCheckout(null)}>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-500">Cobrança</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{checkout?.cobranca?.gabinete_nome} - {checkout?.cobranca?.referencia}</p>
            <p className="mt-1 text-sm text-slate-600">Valor: R$ {checkout?.cobranca?.valor}</p>
          </div>
          <MercadoPagoWallet preferenceId={checkout?.preferenceId} />
          {checkout?.checkoutUrl && (
            <button className="btn-secondary w-full" type="button" onClick={() => window.open(checkout.checkoutUrl, "_blank", "noopener,noreferrer")}>
              Abrir checkout em nova aba
            </button>
          )}
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir gabinete ${deleting?.nome || ""}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
      <ConfirmDialog open={Boolean(deletingCobranca)} message={`Excluir cobrança ${deletingCobranca?.referencia || ""}?`} onCancel={() => setDeletingCobranca(null)} onConfirm={confirmDeleteCobranca} />
    </>
  );
}

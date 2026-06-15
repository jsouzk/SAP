import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";

import Actions from "../../components/ui/Actions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import EntityActivity from "../../components/ui/EntityActivity";
import FormField from "../../components/ui/FormField";
import LoadingState from "../../components/ui/LoadingState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import { useModuleSearch } from "../../context/SearchContext";
import { useCrudResource } from "../../hooks/useCrudResource";
import { pessoasApi } from "../../services/resources";
import api from "../../services/api";
import { ATENDIMENTO_STATUS_LABELS } from "../../utils/constants";
import { buildBirthdayWhatsAppUrl, formatCpfInput, formatDateTime, formatPhoneInput, maskCpf, onlyDigits } from "../../utils/formatters";

const emptyForm = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  data_nascimento: "",
  local_trabalho: "",
  titulo_eleitor: "",
  zona_eleitoral: "",
  secao_eleitoral: "",
  local_votacao: "",
  endereco: "",
  bairro: "",
  cidade: "Iranduba",
  observacoes: "",
};

export default function Pessoas() {
  const resource = useCrudResource(pessoasApi);
  const { load } = resource;
  const { search, setSearch } = useModuleSearch();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues: emptyForm });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load({ page: 1, search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [load, search]);

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item || emptyForm);
  };

  const submit = async (values) => {
    if (values.cpf && onlyDigits(values.cpf).length !== 11) {
      setValue("cpf", values.cpf, { shouldValidate: true });
      return;
    }
    await resource.save({ ...values, data_nascimento: values.data_nascimento || null }, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  const exportCsv = async () => {
    const response = await api.get("/pessoas/exportar/", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pessoas.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    const payload = new FormData();
    payload.append("arquivo", arquivo);
    setImporting(true);
    try {
      await api.post("/pessoas/importar/", payload);
      await resource.load();
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <PageHeader title="Pessoas atendidas" description="Cadastro dos moradores e eleitores atendidos pelo gabinete." actionLabel="Nova pessoa" onAction={() => openForm()} />
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <label className="btn-secondary cursor-pointer">
          {importing ? "Importando..." : "Importar CSV"}
          <input className="hidden" type="file" accept=".csv,text/csv" onChange={importCsv} disabled={importing} />
        </label>
        <button className="btn-secondary" type="button" onClick={exportCsv}>Exportar CSV</button>
      </div>
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por nome, CPF, telefone ou título" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Nome</th><th className="table-th">CPF</th><th className="table-th">Telefone</th><th className="table-th">Nascimento</th><th className="table-th">Trabalho</th><th className="table-th">Título</th><th className="table-th text-right">Ações</th></tr></thead>
              <tbody>
                {resource.items.map((item) => {
                  const birthdayUrl = buildBirthdayWhatsAppUrl(item);
                  return (
                  <tr key={item.id}>
                    <td className="table-td font-semibold text-slate-950">{item.nome}</td>
                    <td className="table-td">{maskCpf(item.cpf)}</td>
                    <td className="table-td">{item.telefone || "-"}</td>
                    <td className="table-td">{item.data_nascimento || "-"}</td>
                    <td className="table-td">{item.local_trabalho || "-"}</td>
                    <td className="table-td">{item.titulo_eleitor || "-"}</td>
                    <td className="table-td">
                      <div className="flex flex-wrap justify-end gap-1">
                        {birthdayUrl && (
                          <a className="btn-secondary min-h-9 px-3 py-1.5 text-emerald-700" href={birthdayUrl} target="_blank" rel="noreferrer" aria-label={`Desejar feliz aniversario para ${item.nome}`}>
                            <Gift size={15} />
                            <span className="hidden xl:inline">Aniversario</span>
                          </a>
                        )}
                        <Link className="btn-secondary min-h-9 px-3 py-1.5" to={`/pessoas/${item.id}`}>Detalhes</Link>
                        <Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState title="Nenhuma pessoa cadastrada" /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => resource.load({ page })} />
        </section>
      )}
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar pessoa" : "Nova pessoa"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <FormField label="Nome" error={errors.nome}><input className="input" {...register("nome", { required: "Informe o nome" })} /></FormField>
          <FormField label="CPF" error={errors.cpf}><input className="input" {...register("cpf", { validate: (value) => !value || onlyDigits(value).length === 11 || "CPF precisa ter 11 dígitos", onChange: (event) => setValue("cpf", formatCpfInput(event.target.value), { shouldValidate: true }) })} /></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" {...register("telefone", { onChange: (event) => setValue("telefone", formatPhoneInput(event.target.value)) })} /></FormField>
          <FormField label="Email" error={errors.email}><input className="input" type="email" {...register("email")} /></FormField>
          <FormField label="Data de nascimento" error={errors.data_nascimento}><input className="input" type="date" {...register("data_nascimento")} /></FormField>
          <FormField label="Local de trabalho" error={errors.local_trabalho}><input className="input" {...register("local_trabalho")} /></FormField>
          <FormField label="Titulo de eleitor" error={errors.titulo_eleitor}><input className="input" {...register("titulo_eleitor")} /></FormField>
          <FormField label="Zona eleitoral" error={errors.zona_eleitoral}><input className="input" {...register("zona_eleitoral")} /></FormField>
          <FormField label="Secao eleitoral" error={errors.secao_eleitoral}><input className="input" {...register("secao_eleitoral")} /></FormField>
          <FormField label="Onde vota" error={errors.local_votacao}><input className="input" {...register("local_votacao")} /></FormField>
          <FormField label="Endereço" error={errors.endereco}><input className="input" {...register("endereco")} /></FormField>
          <FormField label="Bairro" error={errors.bairro}><input className="input" {...register("bairro")} /></FormField>
          <FormField label="Cidade" error={errors.cidade}><input className="input" {...register("cidade")} /></FormField>
          <FormField label="Observações" error={errors.observacoes}><textarea className="input min-h-24" {...register("observacoes")} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(viewing)} title="Dados cadastrais" onClose={() => setViewing(null)} size="max-w-3xl">
        {viewing && (
          <div className="space-y-5">
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              {Object.entries(viewing).filter(([key]) => key !== "linha_tempo").map(([key, value]) => (
                <div className="rounded-md bg-slate-50 p-3" key={key}>
                  <p className="font-bold capitalize text-slate-500">{key.replaceAll("_", " ")}</p>
                  <p>{String(value || "-")}</p>
                </div>
              ))}
            </div>
            <section>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Linha do tempo</h3>
              <div className="mt-3 space-y-3">
                {(viewing.linha_tempo || []).length === 0 && <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Nenhum evento vinculado.</p>}
                {(viewing.linha_tempo || []).map((evento, index) => (
                  <article className="rounded-md border border-slate-100 bg-white p-3 text-sm shadow-sm" key={`${evento.tipo}-${evento.data}-${index}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-950">{evento.tipo}: {evento.titulo || "-"}</p>
                      <span className="text-xs font-semibold text-slate-500">{formatDateTime(evento.data)}</span>
                    </div>
                    {evento.status && <p className="mt-1 text-xs font-bold text-brand-700">{ATENDIMENTO_STATUS_LABELS[evento.status] || evento.status}</p>}
                    {evento.descricao && <p className="mt-2 text-slate-600">{evento.descricao}</p>}
                  </article>
                ))}
              </div>
            </section>
            <EntityActivity tipo="pessoa" objetoId={viewing.id} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir pessoa ${deleting?.nome || ""}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

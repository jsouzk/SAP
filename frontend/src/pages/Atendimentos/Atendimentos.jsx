import { useEffect, useState } from "react";

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
import TipBox from "../../components/ui/TipBox";
import { useModuleSearch } from "../../context/SearchContext";
import { useCrudResource } from "../../hooks/useCrudResource";
import { atendimentosApi, minhaAssinaturaApi, pessoasApi } from "../../services/resources";
import api from "../../services/api";
import { ATENDIMENTO_STATUS, ATENDIMENTO_STATUS_LABELS } from "../../utils/constants";
import { formatDate, formatPhoneInput } from "../../utils/formatters";

const createEmptyForm = () => ({
  nome: "",
  pessoa: "",
  endereco: "",
  telefone: "",
  data_nascimento: "",
  data_atendimento: new Date().toISOString().slice(0, 10),
  quem_atendeu: "",
  local_trabalho: "",
  assunto: "",
  status: "novo",
  prazo_retorno: "",
  responsavel_retorno: "",
  proxima_acao: "",
});

export default function Atendimentos() {
  const resource = useCrudResource(atendimentosApi);
  const { search, setSearch } = useModuleSearch();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pessoas, setPessoas] = useState([]);
  const [assuntosPadrao, setAssuntosPadrao] = useState([]);
  const [formData, setFormData] = useState(createEmptyForm);
  const [filters, setFilters] = useState({ status: "", prazo_vencido: false, responsavel_retorno: "", assunto: "", bairro: "", data_inicio: "", data_fim: "" });
  const [errors, setErrors] = useState({});
  const deletingId = deleting?.id;
  const exportCsv = async () => {
    const response = await api.get("/atendimentos/exportar/", { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atendimentos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search, ...filters, prazo_vencido: filters.prazo_vencido ? "true" : "" });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search, filters]);

  useEffect(() => {
    pessoasApi.list({ page_size: 100 }).then((data) => setPessoas(data.results)).catch(() => setPessoas([]));
    minhaAssinaturaApi.get().then((data) => {
      const assuntos = (data.gabinete?.assuntos_padrao || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      setAssuntosPadrao(assuntos);
    }).catch(() => setAssuntosPadrao([]));
  }, []);

  const openForm = (item = null) => {
    setEditing(item || {});
    setErrors({});
    setFormData(item ? { ...createEmptyForm(), ...item } : createEmptyForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "telefone" ? formatPhoneInput(value) : value;
    if (name === "pessoa") {
      const pessoaSelecionada = pessoas.find((pessoa) => String(pessoa.id) === String(value));
      setFormData((current) => ({
        ...current,
        pessoa: value,
        nome: pessoaSelecionada?.nome || current.nome,
        telefone: pessoaSelecionada?.telefone || current.telefone,
        endereco: pessoaSelecionada?.endereco || current.endereco,
        data_nascimento: pessoaSelecionada?.data_nascimento || current.data_nascimento,
        local_trabalho: pessoaSelecionada?.local_trabalho || current.local_trabalho,
      }));
      setErrors((current) => ({ ...current, pessoa: "" }));
      return;
    }
    setFormData((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nome.trim()) nextErrors.nome = "Informe o nome";
    if (!formData.telefone.trim()) nextErrors.telefone = "Informe o telefone";
    if (!formData.data_atendimento) nextErrors.data_atendimento = "Informe a data do atendimento";
    if (!formData.quem_atendeu.trim()) nextErrors.quem_atendeu = "Digite quem atendeu";
    if (!formData.assunto.trim()) nextErrors.assunto = "Digite o assunto";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    await resource.save({
      ...formData,
      pessoa: formData.pessoa || null,
      data_nascimento: formData.data_nascimento || null,
      prazo_retorno: formData.prazo_retorno || null,
    }, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  const resolveAtendimento = async (item) => {
    await resource.save({ ...item, status: "resolvido" }, item.id);
  };

  return (
    <>
      <PageHeader title="Atendimentos" description="Cadastro completo das demandas apresentadas pela população ao gabinete." actionLabel="Novo atendimento" onAction={() => openForm()} />
      <TipBox>Para um cadastro rápido, preencha apenas nome, telefone, data, quem atendeu e assunto. Se escolher uma pessoa cadastrada, os dados principais são preenchidos automaticamente.</TipBox>
      <div className="mb-4 flex justify-end">
        <button className="btn-secondary" type="button" onClick={exportCsv}>Exportar CSV</button>
      </div>
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por nome, telefone ou assunto" />
      <section className="panel mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label className="block">
            <span className="label">Status</span>
            <select className="input" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">Todos</option>
              {ATENDIMENTO_STATUS.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Responsável</span>
            <input className="input" value={filters.responsavel_retorno} onChange={(event) => setFilters((current) => ({ ...current, responsavel_retorno: event.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Assunto</span>
            <input className="input" value={filters.assunto} onChange={(event) => setFilters((current) => ({ ...current, assunto: event.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Bairro</span>
            <input className="input" value={filters.bairro} onChange={(event) => setFilters((current) => ({ ...current, bairro: event.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Início</span>
            <input className="input" type="date" value={filters.data_inicio} onChange={(event) => setFilters((current) => ({ ...current, data_inicio: event.target.value }))} />
          </label>
          <label className="block">
            <span className="label">Fim</span>
            <input className="input" type="date" value={filters.data_fim} onChange={(event) => setFilters((current) => ({ ...current, data_fim: event.target.value }))} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={filters.prazo_vencido} onChange={(event) => setFilters((current) => ({ ...current, prazo_vencido: event.target.checked }))} />
            Prazo vencido
          </label>
        </div>
      </section>
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Nome</th><th className="table-th">Telefone</th><th className="table-th">Assunto</th><th className="table-th">Status</th><th className="table-th">Prazo</th><th className="table-th">Atendido por</th><th className="table-th text-right">Ações</th></tr>
              </thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td font-semibold text-slate-900">{item.nome}</td>
                    <td className="table-td">{item.telefone}</td>
                    <td className="table-td">{item.assunto}</td>
                    <td className="table-td">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {ATENDIMENTO_STATUS_LABELS[item.status] || item.status || "Novo"}
                      </span>
                    </td>
                    <td className="table-td">{formatDate(item.prazo_retorno)}</td>
                    <td className="table-td">{item.quem_atendeu || "-"}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        {item.status !== "resolvido" && <button className="btn-secondary min-h-9 px-3 py-1.5 text-emerald-700" onClick={() => resolveAtendimento(item)}>Resolver</button>}
                        <Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {resource.items.map((item) => (
              <article className="rounded-lg border border-slate-200 p-4" key={item.id}>
                <p className="font-bold text-slate-950">{item.nome}</p>
                <p className="text-sm text-slate-500">{item.telefone} - {item.assunto}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {ATENDIMENTO_STATUS_LABELS[item.status] || "Novo"} - prazo: {formatDate(item.prazo_retorno)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status !== "resolvido" && <button className="btn-secondary min-h-9 px-3 py-1.5 text-emerald-700" onClick={() => resolveAtendimento(item)}>Resolver</button>}
                  <Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} />
                </div>
              </article>
            ))}
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => resource.load({ page })} />
        </section>
      )}
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar atendimento" : "Novo atendimento"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormField label="Nome" error={errors.nome}><input className="input" name="nome" value={formData.nome} onChange={handleChange} /></FormField>
          <FormField label="Pessoa cadastrada" error={errors.pessoa}><select className="input" name="pessoa" value={formData.pessoa || ""} onChange={handleChange}><option value="">Atendimento avulso</option>{pessoas.map((pessoa) => <option value={pessoa.id} key={pessoa.id}>{pessoa.nome} - {pessoa.cpf || pessoa.telefone || "sem documento"}</option>)}</select></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" name="telefone" value={formData.telefone} onChange={handleChange} /></FormField>
          <FormField label="Endereço" error={errors.endereco}><input className="input" name="endereco" value={formData.endereco} onChange={handleChange} /></FormField>
          <FormField label="Data de nascimento" error={errors.data_nascimento}><input className="input" name="data_nascimento" type="date" value={formData.data_nascimento || ""} onChange={handleChange} /></FormField>
          <FormField label="Data do atendimento" error={errors.data_atendimento}><input className="input" name="data_atendimento" type="date" value={formData.data_atendimento || ""} onChange={handleChange} /></FormField>
          <FormField label="Quem atendeu" error={errors.quem_atendeu}><input className="input" name="quem_atendeu" value={formData.quem_atendeu || ""} onChange={handleChange} placeholder="Digite quem atendeu" type="text" /></FormField>
          <FormField label="Local de trabalho" error={errors.local_trabalho}><input className="input" name="local_trabalho" value={formData.local_trabalho || ""} onChange={handleChange} /></FormField>
          <FormField label="Assunto" error={errors.assunto}>
            {assuntosPadrao.length > 0 ? (
              <select className="input" name="assunto" value={formData.assunto || ""} onChange={handleChange}>
                <option value="">Selecione</option>
                {assuntosPadrao.map((assunto) => <option value={assunto} key={assunto}>{assunto}</option>)}
                <option value="Outros">Outros</option>
              </select>
            ) : (
              <input className="input" name="assunto" value={formData.assunto || ""} onChange={handleChange} placeholder="Digite o assunto" type="text" />
            )}
          </FormField>
          <FormField label="Status" error={errors.status}>
            <select className="input" name="status" value={formData.status || "novo"} onChange={handleChange}>
              {ATENDIMENTO_STATUS.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
            </select>
          </FormField>
          <FormField label="Prazo de retorno" error={errors.prazo_retorno}><input className="input" name="prazo_retorno" type="date" value={formData.prazo_retorno || ""} onChange={handleChange} /></FormField>
          <FormField label="Responsável pelo retorno" error={errors.responsavel_retorno}><input className="input" name="responsavel_retorno" value={formData.responsavel_retorno || ""} onChange={handleChange} /></FormField>
          <FormField label="Próxima ação" error={errors.proxima_acao}><textarea className="input min-h-24" name="proxima_acao" value={formData.proxima_acao || ""} onChange={handleChange} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(viewing)} title="Detalhes do atendimento" onClose={() => setViewing(null)} size="max-w-2xl">
        {viewing && (
          <>
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">{Object.entries(viewing).map(([key, value]) => <div className="rounded-md bg-slate-50 p-3" key={key}><p className="font-bold capitalize text-slate-500">{key.replaceAll("_", " ")}</p><p>{String(value || "-")}</p></div>)}</div>
            <EntityActivity tipo="atendimento" objetoId={viewing.id} />
          </>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir atendimento de ${deleting?.nome || "este cidadão"}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

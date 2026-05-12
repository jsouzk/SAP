import { useEffect, useState } from "react";

import Actions from "../../components/ui/Actions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import LoadingState from "../../components/ui/LoadingState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import { useModuleSearch } from "../../context/SearchContext";
import { useCrudResource } from "../../hooks/useCrudResource";
import { atendimentosApi } from "../../services/resources";
import { formatDate } from "../../utils/formatters";

const createEmptyForm = () => ({
  nome: "",
  endereco: "",
  telefone: "",
  data_nascimento: "",
  data_atendimento: new Date().toISOString().slice(0, 10),
  quem_atendeu: "",
  local_trabalho: "",
  assunto: "",
});

export default function Atendimentos() {
  const resource = useCrudResource(atendimentosApi);
  const { search, setSearch } = useModuleSearch();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const deletingId = deleting?.id;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openForm = (item = null) => {
    setEditing(item || {});
    setErrors({});
    setFormData(item ? { ...createEmptyForm(), ...item } : createEmptyForm());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.nome.trim()) nextErrors.nome = "Informe o nome";
    if (!formData.telefone.trim()) nextErrors.telefone = "Informe o telefone";
    if (!formData.endereco.trim()) nextErrors.endereco = "Informe o endereco";
    if (!formData.data_atendimento) nextErrors.data_atendimento = "Informe a data do atendimento";
    if (!formData.quem_atendeu.trim()) nextErrors.quem_atendeu = "Digite quem atendeu";
    if (!formData.assunto.trim()) nextErrors.assunto = "Digite o assunto";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    await resource.save({ ...formData, data_nascimento: formData.data_nascimento || null }, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Atendimentos" description="Cadastro completo das demandas apresentadas pela populacao ao gabinete." actionLabel="Novo atendimento" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por nome, telefone ou assunto" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Nome</th><th className="table-th">Telefone</th><th className="table-th">Assunto</th><th className="table-th">Atendimento</th><th className="table-th">Atendido por</th><th className="table-th text-right">Acoes</th></tr>
              </thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td font-semibold text-slate-900">{item.nome}</td>
                    <td className="table-td">{item.telefone}</td>
                    <td className="table-td">{item.assunto}</td>
                    <td className="table-td">{formatDate(item.data_atendimento)}</td>
                    <td className="table-td">{item.quem_atendeu || "-"}</td>
                    <td className="table-td"><Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td>
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
                <p className="mt-1 text-xs font-semibold text-slate-500">Atendimento: {formatDate(item.data_atendimento)} - {item.quem_atendeu || "Nao informado"}</p>
                <div className="mt-3"><Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></div>
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
          <FormField label="Telefone" error={errors.telefone}><input className="input" name="telefone" value={formData.telefone} onChange={handleChange} /></FormField>
          <FormField label="Endereco" error={errors.endereco}><input className="input" name="endereco" value={formData.endereco} onChange={handleChange} /></FormField>
          <FormField label="Data de nascimento" error={errors.data_nascimento}><input className="input" name="data_nascimento" type="date" value={formData.data_nascimento || ""} onChange={handleChange} /></FormField>
          <FormField label="Data do atendimento" error={errors.data_atendimento}><input className="input" name="data_atendimento" type="date" value={formData.data_atendimento || ""} onChange={handleChange} /></FormField>
          <FormField label="Quem atendeu" error={errors.quem_atendeu}><input className="input" name="quem_atendeu" value={formData.quem_atendeu || ""} onChange={handleChange} placeholder="Digite quem atendeu" type="text" /></FormField>
          <FormField label="Local de trabalho" error={errors.local_trabalho}><input className="input" name="local_trabalho" value={formData.local_trabalho || ""} onChange={handleChange} /></FormField>
          <FormField label="Assunto" error={errors.assunto}><input className="input" name="assunto" value={formData.assunto || ""} onChange={handleChange} placeholder="Digite o assunto" type="text" /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(viewing)} title="Detalhes do atendimento" onClose={() => setViewing(null)} size="max-w-2xl">
        {viewing && <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">{Object.entries(viewing).map(([key, value]) => <div className="rounded-md bg-slate-50 p-3" key={key}><p className="font-bold capitalize text-slate-500">{key.replaceAll("_", " ")}</p><p>{String(value || "-")}</p></div>)}</div>}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir atendimento de ${deleting?.nome || "este cidadao"}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

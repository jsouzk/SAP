import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
import { pessoasApi } from "../../services/resources";

const emptyForm = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  data_nascimento: "",
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
  const { search, setSearch } = useModuleSearch();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: emptyForm });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item || emptyForm);
  };

  const submit = async (values) => {
    await resource.save({ ...values, data_nascimento: values.data_nascimento || null }, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Pessoas atendidas" description="Cadastro dos moradores e eleitores atendidos pelo gabinete." actionLabel="Nova pessoa" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por nome, CPF, telefone ou título" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Nome</th><th className="table-th">CPF</th><th className="table-th">Telefone</th><th className="table-th">Título</th><th className="table-th">Votação</th><th className="table-th text-right">Ações</th></tr></thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td font-semibold text-slate-950">{item.nome}</td>
                    <td className="table-td">{item.cpf || "-"}</td>
                    <td className="table-td">{item.telefone || "-"}</td>
                    <td className="table-td">{item.titulo_eleitor || "-"}</td>
                    <td className="table-td">{item.local_votacao || "-"}</td>
                    <td className="table-td"><Actions onView={() => setViewing(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td>
                  </tr>
                ))}
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
          <FormField label="CPF" error={errors.cpf}><input className="input" {...register("cpf")} /></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" {...register("telefone")} /></FormField>
          <FormField label="Email" error={errors.email}><input className="input" type="email" {...register("email")} /></FormField>
          <FormField label="Data de nascimento" error={errors.data_nascimento}><input className="input" type="date" {...register("data_nascimento")} /></FormField>
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
      <Modal open={Boolean(viewing)} title="Dados cadastrais" onClose={() => setViewing(null)} size="max-w-2xl">
        {viewing && <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">{Object.entries(viewing).map(([key, value]) => <div className="rounded-md bg-slate-50 p-3" key={key}><p className="font-bold capitalize text-slate-500">{key.replaceAll("_", " ")}</p><p>{String(value || "-")}</p></div>)}</div>}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir pessoa ${deleting?.nome || ""}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

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
import { usuariosApi } from "../../services/resources";
import { USER_TYPES } from "../../utils/constants";

const emptyForm = { nome: "", email: "", cpf: "", telefone: "", tipo_usuario: "atendente", password: "" };

export default function Usuarios() {
  const resource = useCrudResource(usuariosApi);
  const { search, setSearch } = useModuleSearch();
  const [editing, setEditing] = useState(null);
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
    reset(item ? { ...item, password: "" } : emptyForm);
  };

  const submit = async (values) => {
    const payload = values.password ? values : { ...values, password: undefined };
    await resource.save(payload, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Usuarios" description="Gerenciamento de perfis de administrador, assessor, atendente e vereador." actionLabel="Novo usuario" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por nome, email ou CPF" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Nome</th><th className="table-th">Email</th><th className="table-th">CPF</th><th className="table-th">Perfil</th><th className="table-th text-right">Acoes</th></tr></thead>
              <tbody>{resource.items.map((item) => <tr key={item.id}><td className="table-td font-semibold">{item.nome}</td><td className="table-td">{item.email}</td><td className="table-td">{item.cpf}</td><td className="table-td capitalize">{item.tipo_usuario}</td><td className="table-td"><Actions onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => resource.load({ page })} />
        </section>
      )}
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar usuario" : "Novo usuario"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <FormField label="Nome" error={errors.nome}><input className="input" {...register("nome", { required: "Informe o nome" })} /></FormField>
          <FormField label="Email" error={errors.email}><input className="input" type="email" {...register("email", { required: "Informe o email" })} /></FormField>
          <FormField label="CPF" error={errors.cpf}><input className="input" {...register("cpf", { required: "Informe o CPF" })} /></FormField>
          <FormField label="Telefone" error={errors.telefone}><input className="input" {...register("telefone")} /></FormField>
          <FormField label="Tipo de usuario" error={errors.tipo_usuario}><select className="input" {...register("tipo_usuario", { required: "Selecione o perfil" })}>{USER_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></FormField>
          <FormField label={editing?.id ? "Nova senha" : "Senha"} error={errors.password}><input className="input" type="password" {...register("password", { required: editing?.id ? false : "Informe a senha" })} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message={`Excluir usuario ${deleting?.nome || ""}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

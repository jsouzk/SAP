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
import { atendimentosApi, encaminhamentosApi } from "../../services/resources";
import { formatDate } from "../../utils/formatters";

const emptyForm = { atendimento: "", vereador: "", secretaria_destino: "", responsavel: "", descricao: "", data: "" };

export default function Encaminhamentos() {
  const resource = useCrudResource(encaminhamentosApi);
  const { search, setSearch } = useModuleSearch();
  const [atendimentos, setAtendimentos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: emptyForm });

  useEffect(() => {
    atendimentosApi.list().then((data) => setAtendimentos(data.results.filter((item) => item?.id))).catch(() => setAtendimentos([]));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item ? { ...item, atendimento: item.atendimento?.id || item.atendimento } : emptyForm);
  };

  const submit = async (values) => {
    await resource.save(values, editing?.id);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Encaminhamentos" description="Controle das demandas enviadas para secretarias, responsaveis e gabinete." actionLabel="Novo encaminhamento" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por secretaria, vereador ou responsavel" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Atendimento</th><th className="table-th">Vereador</th><th className="table-th">Destino</th><th className="table-th">Data</th><th className="table-th text-right">Acoes</th></tr></thead>
              <tbody>{resource.items.map((item) => <tr key={item.id}><td className="table-td font-semibold">{item.atendimento_nome || item.atendimento?.nome || item.atendimento || "-"}</td><td className="table-td">{item.vereador || "-"}</td><td className="table-td">{item.secretaria_destino || "-"}</td><td className="table-td">{formatDate(item.data)}</td><td className="table-td"><Actions onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => resource.load({ page })} />
        </section>
      )}
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar encaminhamento" : "Novo encaminhamento"} onClose={() => setEditing(null)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <FormField label="Atendimento" error={errors.atendimento}><select className="input" {...register("atendimento", { required: "Selecione o atendimento" })}><option value="">Selecione</option>{atendimentos.map((item) => <option value={item.id} key={item.id}>{item.nome || "Sem nome"} - {item.assunto || "Sem assunto"}</option>)}</select></FormField>
          <FormField label="Vereador" error={errors.vereador}><input className="input" {...register("vereador", { required: "Informe o vereador" })} /></FormField>
          <FormField label="Secretaria destino" error={errors.secretaria_destino}><input className="input" {...register("secretaria_destino", { required: "Informe o destino" })} /></FormField>
          <FormField label="Responsavel" error={errors.responsavel}><input className="input" {...register("responsavel", { required: "Informe o responsavel" })} /></FormField>
          <FormField label="Data" error={errors.data}><input className="input" type="date" {...register("data", { required: "Informe a data" })} /></FormField>
          <FormField label="Descricao" error={errors.descricao}><textarea className="input min-h-28" {...register("descricao", { required: "Informe a descricao" })} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message="Excluir este encaminhamento?" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

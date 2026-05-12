import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
import { encaminhamentosApi, oficiosApi } from "../../services/resources";
import { formatDate } from "../../utils/formatters";

const emptyForm = { encaminhamento: "", conteudo: "" };

export default function Oficios() {
  const resource = useCrudResource(oficiosApi);
  const { search, setSearch } = useModuleSearch();
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const previewRef = useRef(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: emptyForm });
  const previewNumber = preview?.numero || "sem-numero";

  useEffect(() => {
    encaminhamentosApi.list().then((data) => setEncaminhamentos(data.results.filter((item) => item?.id))).catch(() => setEncaminhamentos([]));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      resource.load({ page: 1, search });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openForm = (item = null) => {
    setEditing(item || {});
    reset(item ? { ...item, encaminhamento: item.encaminhamento?.id || item.encaminhamento } : emptyForm);
  };

  const submit = async (values) => {
    await resource.save(values, editing?.id);
    setEditing(null);
  };

  const exportPdf = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`oficio-${previewNumber}.pdf`);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Oficios" description="Geracao, revisao, impressao e exportacao em PDF dos documentos oficiais." actionLabel="Novo oficio" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por numero ou conteudo" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Numero</th><th className="table-th">Encaminhamento</th><th className="table-th">Criado em</th><th className="table-th text-right">Acoes</th></tr></thead>
              <tbody>{resource.items.map((item) => <tr key={item.id}><td className="table-td font-bold text-slate-950">{item.numero || "-"}</td><td className="table-td">{item.encaminhamento_resumo || item.encaminhamento || "-"}</td><td className="table-td">{formatDate(item.criado_em)}</td><td className="table-td"><Actions onView={() => setPreview(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => resource.load({ page })} />
        </section>
      )}
      <Modal open={Boolean(editing)} title={editing?.id ? "Editar oficio" : "Novo oficio"} onClose={() => setEditing(null)}>
        <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
          <FormField label="Encaminhamento" error={errors.encaminhamento}><select className="input" {...register("encaminhamento", { required: "Selecione o encaminhamento" })}><option value="">Selecione</option>{encaminhamentos.map((item) => <option value={item.id} key={item.id}>{item.secretaria_destino || "Destino nao informado"} - {item.responsavel || "Responsavel nao informado"}</option>)}</select></FormField>
          <FormField label="Conteudo" error={errors.conteudo}><textarea className="input min-h-56" placeholder="Se vazio, a API gera o conteudo automaticamente." {...register("conteudo")} /></FormField>
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(preview)} title={`Preview do oficio ${preview?.numero || ""}`} onClose={() => setPreview(null)} size="max-w-4xl">
        {preview && <><div className="mb-4 flex justify-end gap-2"><button className="btn-secondary" onClick={() => window.print()}><Printer size={18} />Imprimir</button><button className="btn-primary" onClick={exportPdf}><Download size={18} />PDF</button></div><article ref={previewRef} className="mx-auto min-h-[800px] max-w-3xl bg-white p-10 text-slate-950"><p className="text-center text-sm font-bold uppercase">Camara Municipal de Iranduba</p><p className="mt-8 text-right">Oficio No {previewNumber}</p><div className="mt-10 whitespace-pre-line leading-8">{preview.conteudo}</div></article></>}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message="Excluir este oficio?" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

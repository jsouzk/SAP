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
import { atendimentosApi, encaminhamentosApi } from "../../services/resources";
import { formatDate } from "../../utils/formatters";
import logoCamara from "../../components/Header/images/logo.png";

const emptyForm = { atendimento: "", vereador: "", secretaria_destino: "", responsavel: "", descricao: "", data: "" };

function FieldLine({ label, value, boldLabel = false }) {
  return (
    <div className="flex items-end gap-2 text-[22px] leading-9">
      <span className={boldLabel ? "font-bold" : "font-medium"}>{label}</span>
      <span className="min-w-0 flex-1 border-b-2 border-slate-500 px-3 pb-0.5 font-handwriting text-[27px] leading-8 text-blue-900">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

function EncaminhamentoDocument({ encaminhamento, documentRef }) {
  const vereador = encaminhamento.vereador || "Vereador(a)";
  const secretaria = encaminhamento.secretaria_destino || "Secretaria destino";
  const responsavel = encaminhamento.responsavel || "Responsável";
  const atendido = encaminhamento.atendimento_nome || "Cidadão(a)";
  const assunto = encaminhamento.descricao || encaminhamento.atendimento_assunto || "Assunto não informado";

  return (
    <article ref={documentRef} className="mx-auto h-[794px] w-[1123px] bg-white p-8 text-slate-950 shadow-soft">
      <div className="flex h-full flex-col border-2 border-slate-600">
        <header className="grid grid-cols-[1fr_1.2fr_1fr] items-end border-b-2 border-slate-600 px-5 pb-2 pt-7">
          <div />
          <div className="text-center">
            <img src={logoCamara} alt="Câmara Municipal de Iranduba" className="mx-auto h-20 w-20 object-contain" />
            <p className="mt-2 font-serif text-[22px] italic leading-7">Estado do Amazonas</p>
            <p className="font-serif text-[22px] italic leading-7">Câmara Municipal de Iranduba</p>
            <p className="font-serif text-[22px] italic leading-7">Assessoria da Presidência</p>
          </div>
          <div className="text-right text-[25px] font-bold uppercase">Encaminhamento</div>
        </header>

        <main className="flex-1 px-5 py-6">
          <div className="space-y-5">
            <FieldLine label="Do: Vereador(a)" value={vereador} boldLabel />
            <FieldLine label="Para:" value={secretaria} />
            <FieldLine label="Exmo(a) Sr.(a)," value={responsavel} />
            <div className="flex items-end gap-2 text-[22px] leading-9">
              <span>Pelo presente encaminhamos o(a) Sr(a)</span>
              <span className="min-w-0 flex-1 border-b-2 border-slate-500 px-3 pb-0.5 font-handwriting text-[27px] leading-8 text-blue-900">{atendido}</span>
            </div>
            <div className="flex items-end gap-2 text-[22px] leading-9">
              <span className="flex-1 border-b-2 border-slate-500 px-3 pb-0.5 font-handwriting text-[27px] leading-8 text-blue-900">{encaminhamento.atendimento_assunto || "\u00a0"}</span>
              <span>que necessita de atendimento</span>
            </div>
          </div>

          <section className="mt-8">
            <p className="text-[23px] font-bold">Discriminação do Assunto:</p>
            <div className="mt-3 space-y-5">
              <div className="border-b-2 border-slate-500 px-4 pb-1 font-handwriting text-[27px] leading-8 text-blue-900">{assunto}</div>
              <div className="border-b-2 border-slate-500 px-4 pb-1 font-handwriting text-[27px] leading-8 text-blue-900">&nbsp;</div>
            </div>
          </section>
        </main>

        <footer className="grid grid-cols-[1fr_320px] items-end gap-8 px-5 pb-5">
          <p className="text-[22px] font-bold">Grato pela atenção dispensada.</p>
          <div className="text-center">
            <div className="mb-1 h-px w-full bg-slate-600" />
            <p className="text-sm font-semibold uppercase">{vereador}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default function Encaminhamentos() {
  const resource = useCrudResource(encaminhamentosApi);
  const { search, setSearch } = useModuleSearch();
  const [atendimentos, setAtendimentos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const deletingId = deleting?.id;
  const previewRef = useRef(null);
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

  const exportPdf = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`encaminhamento-${preview?.id || "documento"}.pdf`);
  };

  const printDocument = async () => {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=1200,height=820");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Encaminhamento</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            html, body {
              margin: 0;
              min-height: 100%;
              background: #fff;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 297mm;
              height: 210mm;
              object-fit: contain;
              display: block;
            }
            @media print {
              body { width: 297mm; height: 210mm; }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Encaminhamento" />
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await resource.remove(deletingId);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader title="Encaminhamentos" description="Controle das demandas enviadas para secretarias, responsáveis e gabinete." actionLabel="Novo encaminhamento" onAction={() => openForm()} />
      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por secretaria, vereador ou responsável" />
      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50"><tr><th className="table-th">Atendimento</th><th className="table-th">Vereador</th><th className="table-th">Destino</th><th className="table-th">Data</th><th className="table-th text-right">Ações</th></tr></thead>
              <tbody>{resource.items.map((item) => <tr key={item.id}><td className="table-td font-semibold">{item.atendimento_nome || item.atendimento?.nome || item.atendimento || "-"}</td><td className="table-td">{item.vereador || "-"}</td><td className="table-td">{item.secretaria_destino || "-"}</td><td className="table-td">{formatDate(item.data)}</td><td className="table-td"><Actions onView={() => setPreview(item)} onEdit={() => openForm(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody>
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
          <FormField label="Responsável" error={errors.responsavel}><input className="input" {...register("responsavel", { required: "Informe o responsável" })} /></FormField>
          <FormField label="Data" error={errors.data}><input className="input" type="date" {...register("data", { required: "Informe a data" })} /></FormField>
          <FormField label="Descrição" error={errors.descricao}><textarea className="input min-h-28" {...register("descricao", { required: "Informe a descrição" })} /></FormField>
          <div className="flex justify-end gap-2 md:col-span-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button className="btn-primary">Salvar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(preview)} title="Preview do encaminhamento" onClose={() => setPreview(null)} size="max-w-6xl">
        {preview && (
          <>
            <div className="mb-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={printDocument}><Printer size={18} />Imprimir</button>
              <button className="btn-primary" onClick={exportPdf}><Download size={18} />PDF</button>
            </div>
            <div className="overflow-x-auto rounded-lg bg-slate-100 p-4">
              <EncaminhamentoDocument encaminhamento={preview} documentRef={previewRef} />
            </div>
          </>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message="Excluir este encaminhamento?" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

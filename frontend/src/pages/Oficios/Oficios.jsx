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
import logoCamara from "../../components/Header/images/logo.png";

const emptyForm = { encaminhamento: "", conteudo: "" };

function formatLongDate(value) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatOfficialContent(content = "") {
  const withoutSignature = content.split(/atenciosamente,?/i)[0];
  return withoutSignature
    .split("\n")
    .filter((line) => !line.trim().toLowerCase().startsWith("senhor(a)"))
    .join("\n")
    .trim();
}

function OficioDocument({ oficio, documentRef }) {
  const vereador = oficio.vereador || "RAIMUNDO NONATO NETO CARNEIRO";
  const destinatario = oficio.responsavel || oficio.secretaria_destino || "Destinatario nao informado";
  const cargoDestino = oficio.secretaria_destino || "Camara Municipal de Iranduba";
  const numero = oficio.numero || "0000/2026";
  const conteudo = formatOfficialContent(oficio.conteudo);

  return (
    <article
      ref={documentRef}
      className="relative mx-auto h-[1123px] w-[794px] overflow-hidden bg-white px-[82px] pb-[88px] pt-[62px] text-[15px] leading-7 text-slate-950 shadow-soft"
    >
      <svg className="absolute right-0 top-0 h-52 w-[500px]" viewBox="0 0 520 210" fill="none" aria-hidden="true">
        <path d="M65 0C154 31 232 64 318 70C399 75 466 45 520 20V0H65Z" fill="#f2f8f3" />
        <path d="M112 0C197 48 279 83 377 80C428 79 477 62 520 44" stroke="#15803d" strokeWidth="8" />
        <path d="M152 0C233 53 319 107 424 100C463 97 493 86 520 74" stroke="#79b66a" strokeWidth="4" />
      </svg>

      <header className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <img src={logoCamara} alt="Camara Municipal de Iranduba" className="h-24 w-24 object-contain" />
          <div className="border-l-4 border-brand-700 pl-4">
            <p className="text-[25px] font-semibold uppercase leading-7 tracking-wide text-slate-800">Camara</p>
            <p className="text-[22px] font-semibold uppercase leading-6 tracking-wide text-slate-800">Municipal de</p>
            <p className="text-[26px] font-semibold uppercase leading-7 tracking-wide text-brand-800">Iranduba</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mt-12">
        <p className="text-sm font-bold uppercase">OFICIO N° {numero} - GV/CMI</p>
        <p className="mt-8 text-right">Iranduba, {formatLongDate(oficio.criado_em)}.</p>

        <section className="mt-12 text-[14px] font-bold uppercase leading-6">
          <p>A VOSSA SENHORIA</p>
          <p>{destinatario}</p>
          <p>{cargoDestino}</p>
        </section>

        <p className="mt-10">Excelentissimo(a) Senhor(a),</p>

        <div className="mt-7 whitespace-pre-line text-justify leading-8">
          {conteudo}
        </div>

        <p className="mt-8">Na oportunidade, subscrevo-me.</p>
        <p className="mt-8">Atenciosamente,</p>

        <section className="mt-24 text-center">
          <div className="mx-auto mb-2 h-px w-72 bg-slate-500" />
          <p className="font-bold uppercase">{vereador}</p>
          <p className="font-semibold">Vereador</p>
        </section>
      </main>

      <footer className="absolute bottom-10 left-[82px] right-[82px] text-center text-[11px] leading-5 text-slate-600">
        <svg className="absolute -left-24 -top-28 h-32 w-[460px]" viewBox="0 0 520 160" fill="none" aria-hidden="true">
          <path d="M0 120C94 76 164 53 260 71C357 89 432 67 520 6" stroke="#15803d" strokeWidth="8" />
          <path d="M0 145C91 93 171 69 272 91C370 113 441 89 520 31" stroke="#79b66a" strokeWidth="4" />
        </svg>
        <div className="relative">
          <p>Praca dos Tres Poderes, 30 - Centro</p>
          <p>Iranduba/AM - CEP: 69415-000</p>
          <p>camara.iranduba.am.gov.br</p>
        </div>
      </footer>
    </article>
  );
}

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
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
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
        {preview && (
          <>
            <div className="mb-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => window.print()}><Printer size={18} />Imprimir</button>
              <button className="btn-primary" onClick={exportPdf}><Download size={18} />PDF</button>
            </div>
            <div className="overflow-x-auto rounded-lg bg-slate-100 p-4">
              <OficioDocument oficio={preview} documentRef={previewRef} />
            </div>
          </>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} message="Excluir este oficio?" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </>
  );
}

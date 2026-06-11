import { Download, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import jsPDF from "jspdf";

import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import TipBox from "../../components/ui/TipBox";
import api from "../../services/api";

function Ranking({ title, items }) {
  return (
    <section className="panel p-5">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {(items || []).length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Sem dados no período.</p>}
        {(items || []).map((item) => (
          <div className="grid grid-cols-[1fr_auto] gap-3" key={item.label}>
            <span className="truncate text-sm font-semibold text-slate-700">{item.label || "-"}</span>
            <strong className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{item.total}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function downloadCsv(data) {
  const sections = [
    ["Atendimentos por bairro", data.por_bairro],
    ["Atendimentos por assunto", data.por_assunto],
    ["Produtividade por usuário", data.por_usuario],
    ["Encaminhamentos por secretaria", data.por_secretaria],
    ["Pendências por responsável", data.pendencias_por_responsavel],
  ];
  const rows = [];
  sections.forEach(([title, items]) => {
    rows.push([title]);
    rows.push(["Item", "Total"]);
    (items || []).forEach((item) => rows.push([item.label, item.total]));
    rows.push([]);
  });
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorios.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportPdf(data, filters) {
  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Relatório do gabinete", 20, 22);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Período: ${filters.data_inicio || "início"} a ${filters.data_fim || "hoje"}`, 20, 30);
  pdf.text(`Atendimentos: ${data.totais?.atendimentos || 0} | Encaminhamentos: ${data.totais?.encaminhamentos || 0} | Ofícios: ${data.totais?.oficios || 0}`, 20, 38);
  pdf.text(`Pendências abertas: ${data.totais?.pendencias_abertas || 0} | Tempo médio de resolução: ${data.totais?.dias_resolucao_medio || 0} dia(s)`, 20, 44);
  let y = 52;
  [["Assuntos", data.por_assunto], ["Bairros", data.por_bairro], ["Secretarias", data.por_secretaria], ["Pendências por responsável", data.pendencias_por_responsavel]].forEach(([title, items]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(title, 20, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    (items || []).slice(0, 8).forEach((item) => {
      pdf.text(`${item.label || "-"}: ${item.total}`, 24, y);
      y += 6;
    });
    y += 5;
  });
  pdf.save("relatorio-gabinete.pdf");
}

export default function Relatorios() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ data_inicio: "", data_fim: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/relatorios/", { params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Relatórios" description="Analise atendimentos, encaminhamentos e ofícios por período." />
      <TipBox>Use os filtros de data para montar relatórios mensais, por bairro, assunto, secretaria ou produtividade.</TipBox>

      <section className="panel mb-5 p-4">
        <div className="grid gap-3 md:grid-cols-[180px_180px_auto_auto] md:items-end">
          <label><span className="label">Data inicial</span><input className="input" type="date" value={filters.data_inicio} onChange={(event) => setFilters((current) => ({ ...current, data_inicio: event.target.value }))} /></label>
          <label><span className="label">Data final</span><input className="input" type="date" value={filters.data_fim} onChange={(event) => setFilters((current) => ({ ...current, data_fim: event.target.value }))} /></label>
          <button className="btn-primary" onClick={load}>Filtrar</button>
          <button className="btn-secondary" onClick={() => setFilters({ data_inicio: "", data_fim: "" })}>Limpar</button>
        </div>
      </section>

      {loading ? <LoadingState /> : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <section className="panel p-5"><p className="text-sm font-bold text-slate-500">Atendimentos</p><p className="mt-1 text-3xl font-black">{data?.totais?.atendimentos || 0}</p></section>
            <section className="panel p-5"><p className="text-sm font-bold text-slate-500">Encaminhamentos</p><p className="mt-1 text-3xl font-black">{data?.totais?.encaminhamentos || 0}</p></section>
            <section className="panel p-5"><p className="text-sm font-bold text-slate-500">Ofícios</p><p className="mt-1 text-3xl font-black">{data?.totais?.oficios || 0}</p></section>
            <section className="panel p-5"><p className="text-sm font-bold text-slate-500">Pendências abertas</p><p className="mt-1 text-3xl font-black">{data?.totais?.pendencias_abertas || 0}</p></section>
            <section className="panel p-5"><p className="text-sm font-bold text-slate-500">Média de resolução</p><p className="mt-1 text-3xl font-black">{data?.totais?.dias_resolucao_medio || 0}d</p></section>
          </div>

          <div className="mb-5 flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => downloadCsv(data)}><Download size={16} />CSV</button>
            <button className="btn-primary" onClick={() => exportPdf(data, filters)}><FileText size={16} />PDF</button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <Ranking title="Por assunto" items={data?.por_assunto} />
            <Ranking title="Por bairro" items={data?.por_bairro} />
            <Ranking title="Por secretaria" items={data?.por_secretaria} />
            <Ranking title="Por usuário" items={data?.por_usuario} />
            <Ranking title="Pendências por responsável" items={data?.pendencias_por_responsavel} />
          </div>
        </>
      )}
    </>
  );
}

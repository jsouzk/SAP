import { ArrowUpRight, ClipboardList, Download, FileText, ListChecks, Plus, Printer, RefreshCw, Send, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

import api from "../../services/api";
import { formatDateTime } from "../../utils/formatters";

const fallback = {
  total_atendimentos: 0,
  total_encaminhamentos: 0,
  total_oficios: 0,
  total_usuarios: 0,
  atendimentos_pendentes: 0,
  ranking_bairros: [],
  ranking_assuntos: [],
  ranking_secretarias: [],
  produtividade_usuarios: [],
  serie_mensal: [],
  recentes: [],
};

const metrics = [
  { key: "total_atendimentos", label: "Atendimentos", icon: ClipboardList, tone: "bg-emerald-50 text-emerald-700" },
  { key: "total_encaminhamentos", label: "Encaminhamentos", icon: Send, tone: "bg-cyan-50 text-cyan-700" },
  { key: "total_oficios", label: "Ofícios gerados", icon: FileText, tone: "bg-violet-50 text-violet-700" },
  { key: "total_usuarios", label: "Usuários", icon: Users, tone: "bg-amber-50 text-amber-700" },
  { key: "atendimentos_pendentes", label: "Pendências", icon: RefreshCw, tone: "bg-rose-50 text-rose-700" },
];

const chartLegend = [
  { key: "atendimentos", label: "Atendimentos", className: "bg-emerald-500" },
  { key: "encaminhamentos", label: "Encaminhamentos", className: "bg-cyan-500" },
  { key: "oficios", label: "Ofícios", className: "bg-violet-500" },
];

const quickActions = [
  { to: "/atendimentos", label: "Atendimentos", icon: Plus, tone: "bg-brand-700 text-white hover:bg-brand-800" },
  { to: "/pessoas", label: "Cadastrar pessoa", icon: UserPlus, tone: "bg-white text-slate-800 hover:bg-slate-50" },
  { to: "/pendencias", label: "Ver pendências", icon: ListChecks, tone: "bg-white text-slate-800 hover:bg-slate-50" },
  { to: "/oficios", label: "Gerar ofício", icon: FileText, tone: "bg-white text-slate-800 hover:bg-slate-50" },
];

const firstSteps = [
  "Cadastre ou localize uma pessoa pelo CPF, telefone ou nome.",
  "Registre o atendimento com assunto, responsável e prazo.",
  "Se precisar acionar uma secretaria, crie um encaminhamento.",
  "Gere o ofício a partir do encaminhamento e acompanhe em Pendências.",
];

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function metricRows(data, totalMovimentos) {
  return [
    ["Atendimentos", data.total_atendimentos],
    ["Encaminhamentos", data.total_encaminhamentos],
    ["Ofícios gerados", data.total_oficios],
    ["Usuários", data.total_usuarios],
    ["Atendimentos pendentes", data.atendimentos_pendentes],
    ["Movimentações", totalMovimentos],
  ];
}

function RankingList({ title, items }) {
  return (
    <section className="panel p-5">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {(items || []).length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Sem dados no período.</p>}
        {(items || []).map((item) => (
          <div className="grid grid-cols-[1fr_auto] items-center gap-3" key={item.label}>
            <p className="truncate text-sm font-bold text-slate-700">{item.label || "-"}</p>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-700">{item.total}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ data_inicio: "", data_fim: "" });

  const totalMovimentos = useMemo(
    () => data.total_atendimentos + data.total_encaminhamentos + data.total_oficios,
    [data.total_atendimentos, data.total_encaminhamentos, data.total_oficios],
  );

  const chartData = useMemo(() => {
    const series = Array.isArray(data.serie_mensal) ? data.serie_mensal : [];
    return series.map((item) => ({
      ...item,
      label: item.mes?.slice(5, 7) ? `${item.mes.slice(5, 7)}/${item.mes.slice(2, 4)}` : item.mes,
      total: Number(item.total || 0),
    }));
  }, [data.serie_mensal]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const response = await api.get("/dashboard/", { params });
      setData({ ...fallback, ...response.data, recentes: response.data?.recentes || [] });
    } catch (requestError) {
      setData(fallback);
      setError(requestError.response?.data?.detail || "Não foi possível carregar o dashboard. Verifique login e API.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const exportCsv = () => {
    const rows = [
      ["Relatório do Dashboard"],
      ["Periodo", reportPeriod],
      [],
      ["Indicador", "Quantidade"],
      ...metricRows(data, totalMovimentos),
      [],
      ["Atendimentos recentes"],
      ["Nome", "Assunto", "Data"],
      ...data.recentes.map((item) => [item.nome, item.assunto, formatDateTime(item.criado_em)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
    downloadFile("relatorio-dashboard.csv", csv, "text/csv;charset=utf-8");
  };

  const exportPdf = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const today = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Relatório do Dashboard", 20, 22);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Sistema de Atendimento Parlamentar - gerado em ${today}`, 20, 30);
    pdf.text(`Periodo: ${reportPeriod}`, 20, 36);

    let y = 50;
    metrics.forEach((metric) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(metric.label, 20, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(data[metric.key] || 0), 80, y);
      y += 8;
    });

    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.text("Atendimentos recentes", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    data.recentes.slice(0, 10).forEach((item) => {
      const line = `${item.nome || "-"} - ${item.assunto || "-"} - ${formatDateTime(item.criado_em)}`;
      pdf.text(pdf.splitTextToSize(line, 170), 20, y);
      y += 12;
    });

    pdf.save("relatorio-dashboard.pdf");
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const metricsHtml = metricRows(data, totalMovimentos)
      .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
      .join("");
    const recentHtml = data.recentes.length
      ? data.recentes
          .map((item) => `<tr><td>${item.nome || "-"}</td><td>${item.assunto || "-"}</td><td>${formatDateTime(item.criado_em)}</td></tr>`)
          .join("")
      : `<tr><td colspan="3">Nenhum atendimento recente encontrado.</td></tr>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Relatorio do Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172033; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { margin: 0 0 18px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d8dee8; padding: 9px 10px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; }
            section { margin-top: 24px; }
            @media print { body { margin: 18mm; } }
          </style>
        </head>
        <body>
          <h1>Relatorio do Dashboard</h1>
          <p>Sistema de Atendimento Parlamentar<br />Período: ${reportPeriod}</p>
          <section>
            <h2>Indicadores</h2>
            <table>
              <thead><tr><th>Indicador</th><th>Quantidade</th></tr></thead>
              <tbody>${metricsHtml}</tbody>
            </table>
          </section>
          <section>
            <h2>Atendimentos recentes</h2>
            <table>
              <thead><tr><th>Nome</th><th>Assunto</th><th>Data</th></tr></thead>
              <tbody>${recentHtml}</tbody>
            </table>
          </section>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const reportPeriod = useMemo(() => {
    if (filters.data_inicio && filters.data_fim) return `${filters.data_inicio} a ${filters.data_fim}`;
    if (filters.data_inicio) return `A partir de ${filters.data_inicio}`;
    if (filters.data_fim) return `Até ${filters.data_fim}`;
    return "Todos os registros";
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ data_inicio: "", data_fim: "" });
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ to, label, icon: Icon, tone }) => (
          <Link className={`flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black shadow-sm transition ${tone}`} to={to} key={to}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-black text-slate-950">Primeiros passos</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {firstSteps.map((step, index) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={step}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-black text-white">{index + 1}</span>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10 sm:p-7">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-28 w-2/3 bg-gradient-to-l from-brand-700/25 to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-100">Painel operacional</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Controle o fluxo do gabinete com visão clara do atendimento ao cidadão.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Acompanhe demandas, documentos oficiais, encaminhamentos e gere relatórios do período atual.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Resumo geral</p>
            <p className="mt-2 text-3xl font-black">{loading ? "..." : totalMovimentos}</p>
            <p className="text-sm text-slate-300">movimentacoes registradas</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-950 hover:bg-brand-50" onClick={exportPdf} disabled={loading}>
                <Download size={16} /> PDF
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15" onClick={exportCsv} disabled={loading}>
                <FileText size={16} /> CSV
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15" onClick={printReport}>
                <Printer size={16} /> Imprimir
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/15 hover:bg-white/15" onClick={loadDashboard} disabled={loading}>
                <RefreshCw size={16} /> Atualizar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Filtros do relatório</h3>
            <p className="mt-1 text-sm text-slate-500">Os indicadores, PDF e CSV usam o período selecionado.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[180px_180px_112px_104px] lg:items-end">
            <label className="block min-w-0">
              <span className="label">Data inicial</span>
              <input className="input" type="date" name="data_inicio" value={filters.data_inicio} onChange={handleFilterChange} />
            </label>
            <label className="block min-w-0">
              <span className="label">Data final</span>
              <input className="input" type="date" name="data_fim" value={filters.data_fim} onChange={handleFilterChange} />
            </label>
            <button className="btn-primary h-[42px] w-full" onClick={loadDashboard} disabled={loading}>
              <RefreshCw size={16} /> Filtrar
            </button>
            <button className="btn-secondary h-[42px] w-full" onClick={clearFilters} disabled={loading}>
              Limpar
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand-700">Período atual: {reportPeriod}</p>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ key, label, icon: Icon, tone }) => (
          <section className="panel p-5" key={key}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{loading ? "..." : data[key]}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-700"><ArrowUpRight size={14} /> Atualizado pela API</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                <Icon size={22} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-5">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-950">Movimento mensal</h2>
              <p className="text-sm text-slate-500">Distribuicao visual das rotinas do gabinete</p>
            </div>
            <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-700">Tempo real</span>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            {chartData.length === 0 ? (
              <div className="flex h-72 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-semibold text-slate-500">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-3">
                  {chartLegend.map((legend) => (
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-600" key={legend.key}>
                      <span className={`h-2.5 w-2.5 rounded-full ${legend.className}`} />
                      {legend.label}
                    </span>
                  ))}
                </div>
                <div className="space-y-4">
                  {chartData.map((item) => (
                    <div className="grid gap-2 sm:grid-cols-[72px_1fr_42px] sm:items-center" key={item.mes}>
                      <div className="text-xs font-black uppercase text-slate-500">{item.label}</div>
                      <div className="overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                        <div className="flex h-7 min-w-8 rounded-full">
                          {chartLegend.map((legend) => {
                            const value = Number(item[legend.key] || 0);
                            const width = item.total > 0 ? (value / item.total) * 100 : 0;
                            return (
                              <div
                                className={`${legend.className} transition-all`}
                                key={legend.key}
                                style={{ width: `${width}%` }}
                                title={`${legend.label}: ${value}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right text-sm font-black text-slate-900">{item.total}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-black text-slate-950">Atendimentos recentes</h2>
          <div className="mt-4 space-y-3">
            {data.recentes.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Nenhum atendimento recente encontrado.</p>}
            {data.recentes.map((item) => (
              <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={item.id}>
                <p className="font-bold text-slate-950">{item.nome}</p>
                <p className="mt-1 text-sm text-slate-500">{item.assunto}</p>
                <p className="mt-2 text-xs font-semibold text-slate-400">{formatDateTime(item.criado_em)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <RankingList title="Assuntos frequentes" items={data.ranking_assuntos} />
        <RankingList title="Bairros atendidos" items={data.ranking_bairros} />
        <RankingList title="Secretarias demandadas" items={data.ranking_secretarias} />
        <RankingList title="Produtividade" items={data.produtividade_usuarios} />
      </div>
    </div>
  );
}

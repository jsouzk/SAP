import { Download, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import TipBox from "../../components/ui/TipBox";
import { useCrudResource } from "../../hooks/useCrudResource";
import { auditoriaApi } from "../../services/resources";
import { formatDateTime } from "../../utils/formatters";

const actionMeta = {
  create: { label: "Criado", className: "bg-emerald-50 text-emerald-700" },
  update: { label: "Atualizado", className: "bg-cyan-50 text-cyan-700" },
  delete: { label: "Excluído", className: "bg-red-50 text-red-700" },
};

const modelLabels = {
  "pessoas.PessoaAtendida": "Pessoa",
  "atendimentos.Atendimento": "Atendimento",
  "encaminhamentos.Encaminhamento": "Encaminhamento",
  "oficios.Oficio": "Ofício",
  "usuarios.Usuario": "Usuário",
  "assinaturas.Gabinete": "Gabinete",
  "assinaturas.Cobranca": "Cobrança",
};

const fieldLabels = {
  nome: "Nome",
  email: "Email",
  telefone: "Telefone",
  cpf: "CPF",
  endereco: "Endereço",
  bairro: "Bairro",
  cidade: "Cidade",
  assunto: "Assunto",
  status: "Status",
  status_licenca: "Status da licença",
  prazo_retorno: "Prazo de retorno",
  responsavel_retorno: "Responsável pelo retorno",
  proxima_acao: "Próxima ação",
  local_trabalho: "Local de trabalho",
  data_nascimento: "Data de nascimento",
  valor: "Valor",
  vencimento: "Vencimento",
};

const quickActions = [
  { label: "Todos", value: "" },
  { label: "Criados", value: "create" },
  { label: "Alterados", value: "update" },
  { label: "Excluídos", value: "delete" },
];

const quickModules = [
  { label: "Todos", value: "" },
  { label: "Pessoas", value: "pessoas" },
  { label: "Atendimentos", value: "atendimentos" },
  { label: "Ofícios", value: "oficios" },
  { label: "Usuários", value: "usuarios" },
];

function modelName(value) {
  return modelLabels[value] || value || "-";
}

function fieldName(value) {
  return fieldLabels[value] || value.replaceAll("_", " ");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function diffRows(before = {}, after = {}) {
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  return keys
    .map((key) => ({ field: key, before: before?.[key], after: after?.[key] }))
    .filter((row) => formatValue(row.before) !== formatValue(row.after));
}

function downloadCsv(items) {
  const rows = [
    ["Data", "Usuário", "Ação", "Módulo", "Registro", "IP"],
    ...items.map((item) => [
      formatDateTime(item.criado_em),
      item.user_nome || item.user_email || "-",
      actionMeta[item.action]?.label || item.action,
      modelName(item.model_name),
      item.object_repr || item.object_id,
      item.ip_address || "-",
    ]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "auditoria.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Auditoria() {
  const resource = useCrudResource(auditoriaApi);
  const { load } = resource;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ action: "", model_name: "", user: "", data_inicio: "", data_fim: "" });
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load({ page: 1, search, ...filters });
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [load, search, filters]);

  const summary = useMemo(() => ({
    create: resource.items.filter((item) => item.action === "create").length,
    update: resource.items.filter((item) => item.action === "update").length,
    delete: resource.items.filter((item) => item.action === "delete").length,
    last: resource.items[0]?.criado_em,
  }), [resource.items]);

  const rows = viewing ? diffRows(viewing.before, viewing.after) : [];

  return (
    <>
      <PageHeader title="Auditoria" description="Veja quem criou, alterou ou excluiu registros no sistema." />
      <TipBox>Use os filtros rápidos para achar eventos importantes. Clique em Ver detalhes para conferir o que mudou em cada campo.</TipBox>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <section className="panel p-4"><p className="text-xs font-black uppercase text-slate-500">Criados nesta página</p><p className="mt-1 text-2xl font-black text-emerald-700">{summary.create}</p></section>
        <section className="panel p-4"><p className="text-xs font-black uppercase text-slate-500">Alterados nesta página</p><p className="mt-1 text-2xl font-black text-cyan-700">{summary.update}</p></section>
        <section className="panel p-4"><p className="text-xs font-black uppercase text-slate-500">Excluídos nesta página</p><p className="mt-1 text-2xl font-black text-red-700">{summary.delete}</p></section>
        <section className="panel p-4"><p className="text-xs font-black uppercase text-slate-500">Última alteração</p><p className="mt-1 text-sm font-bold text-slate-900">{formatDateTime(summary.last)}</p></section>
      </div>

      <SearchBar value={search} onChange={setSearch} onSubmit={(event) => event.preventDefault()} placeholder="Buscar por usuário, registro, IP ou módulo" />

      <section className="panel mb-4 p-4">
        <div className="space-y-4">
          <div>
            <p className="label">Ação</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button className={filters.action === action.value ? "btn-primary" : "btn-secondary"} type="button" onClick={() => setFilters((current) => ({ ...current, action: action.value }))} key={action.value}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Módulo</p>
            <div className="flex flex-wrap gap-2">
              {quickModules.map((module) => (
                <button className={filters.model_name === module.value ? "btn-primary" : "btn-secondary"} type="button" onClick={() => setFilters((current) => ({ ...current, model_name: module.value }))} key={module.value}>
                  {module.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
            <label>
              <span className="label">ID do usuário</span>
              <input className="input" value={filters.user} onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))} placeholder="Ex.: 3" />
            </label>
            <label>
              <span className="label">Data inicial</span>
              <input className="input" type="date" value={filters.data_inicio} onChange={(event) => setFilters((current) => ({ ...current, data_inicio: event.target.value }))} />
            </label>
            <label>
              <span className="label">Data final</span>
              <input className="input" type="date" value={filters.data_fim} onChange={(event) => setFilters((current) => ({ ...current, data_fim: event.target.value }))} />
            </label>
            <button className="btn-secondary" type="button" onClick={() => setFilters({ action: "", model_name: "", user: "", data_inicio: "", data_fim: "" })}>
              Limpar filtros
            </button>
          </div>
          <div className="flex justify-end">
            <button className="btn-secondary" type="button" onClick={() => downloadCsv(resource.items)}>
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      {resource.loading ? <LoadingState /> : (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Data</th><th className="table-th">Usuário</th><th className="table-th">Ação</th><th className="table-th">Módulo</th><th className="table-th">Registro alterado</th><th className="table-th">IP</th><th className="table-th text-right">Detalhes</th></tr>
              </thead>
              <tbody>
                {resource.items.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td">{formatDateTime(item.criado_em)}</td>
                    <td className="table-td">{item.user_nome || item.user_email || "-"}</td>
                    <td className="table-td">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${actionMeta[item.action]?.className || "bg-slate-100 text-slate-700"}`}>
                        {actionMeta[item.action]?.label || item.action}
                      </span>
                    </td>
                    <td className="table-td">{modelName(item.model_name)}</td>
                    <td className="table-td">{item.object_repr || item.object_id}</td>
                    <td className="table-td">{item.ip_address || "-"}</td>
                    <td className="table-td text-right">
                      <button className="btn-secondary" onClick={() => setViewing(item)}><Eye size={16} />Ver detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resource.items.length === 0 && <div className="p-4"><EmptyState title="Nenhum registro de auditoria" /></div>}
          <Pagination page={resource.params.page} count={resource.count} onPage={(page) => load({ page, search, ...filters })} />
        </section>
      )}

      <Modal open={Boolean(viewing)} title="Detalhes da auditoria" onClose={() => setViewing(null)} size="max-w-5xl">
        {viewing && (
          <div className="space-y-5">
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-bold text-slate-500">Registro</p><p>{viewing.object_repr || viewing.object_id}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-bold text-slate-500">Módulo</p><p>{modelName(viewing.model_name)}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="font-bold text-slate-500">Usuário</p><p>{viewing.user_nome || viewing.user_email || "-"}</p></div>
            </div>
            <section className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-slate-50"><tr><th className="table-th">Campo</th><th className="table-th">Antes</th><th className="table-th">Depois</th></tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td className="table-td" colSpan="3">Nenhuma diferença de campo registrada.</td></tr>}
                  {rows.map((row) => (
                    <tr key={row.field}>
                      <td className="table-td font-bold text-slate-900">{fieldName(row.field)}</td>
                      <td className="table-td">{formatValue(row.before)}</td>
                      <td className="table-td">{formatValue(row.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}

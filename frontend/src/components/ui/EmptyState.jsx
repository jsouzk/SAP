export default function EmptyState({ title = "Nenhum registro encontrado", description = "Ajuste os filtros ou crie um novo registro." }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
      <h3 className="text-base font-black text-ink-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

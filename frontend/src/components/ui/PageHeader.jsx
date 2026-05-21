import { Plus } from "lucide-react";

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink-950 via-slate-900 to-brand-900 p-5 text-white shadow-lift sm:p-6">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-brand-100">Modulo administrativo</p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {actionLabel && (
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-ink-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-brand-50 sm:w-auto" onClick={onAction}>
            <Plus size={18} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

import { Plus } from "lucide-react";

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-ink-950 sm:text-2xl">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {actionLabel && (
          <button className="btn-primary w-full sm:w-auto" onClick={onAction}>
            <Plus size={18} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, count, onPage }) {
  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row">
      <p className="text-sm font-semibold text-slate-500">
        Página {page} de {totalPages} - {count} registro(s)
      </p>
      <div className="flex items-center gap-2">
        <button className="btn-secondary h-9 w-9 rounded-xl p-0" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
          <ChevronLeft size={18} />
        </button>
        <button className="btn-secondary h-9 w-9 rounded-xl p-0" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Próxima página">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

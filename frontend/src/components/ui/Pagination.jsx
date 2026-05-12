import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, count, onPage }) {
  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Pagina {page} de {totalPages} - {count} registro(s)
      </p>
      <div className="flex items-center gap-2">
        <button className="btn-secondary h-9 w-9 p-0" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Pagina anterior">
          <ChevronLeft size={18} />
        </button>
        <button className="btn-secondary h-9 w-9 p-0" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Proxima pagina">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

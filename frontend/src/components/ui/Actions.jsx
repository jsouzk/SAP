import { Edit, Eye, Trash2 } from "lucide-react";

export default function Actions({ onView, onEdit, onDelete }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {onView && (
        <button className="btn-secondary min-h-9 px-3 py-1.5" onClick={onView} aria-label="Visualizar">
          <Eye size={15} />
          <span className="hidden xl:inline">Ver</span>
        </button>
      )}
      {onEdit && (
        <button className="btn-secondary min-h-9 px-3 py-1.5" onClick={onEdit} aria-label="Editar">
          <Edit size={15} />
          <span className="hidden xl:inline">Editar</span>
        </button>
      )}
      {onDelete && (
        <button className="btn-secondary min-h-9 px-3 py-1.5 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Excluir">
          <Trash2 size={15} />
          <span className="hidden xl:inline">Excluir</span>
        </button>
      )}
    </div>
  );
}

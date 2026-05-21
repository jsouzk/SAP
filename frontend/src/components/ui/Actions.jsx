import { Edit, Eye, Trash2 } from "lucide-react";

export default function Actions({ onView, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <button className="btn-secondary h-9 w-9 rounded-xl p-0" onClick={onView} aria-label="Visualizar">
          <Eye size={16} />
        </button>
      )}
      <button className="btn-secondary h-9 w-9 rounded-xl p-0" onClick={onEdit} aria-label="Editar">
        <Edit size={16} />
      </button>
      <button className="btn-secondary h-9 w-9 rounded-xl p-0 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Excluir">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

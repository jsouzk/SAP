import { X } from "lucide-react";

export default function Modal({ title, children, open, onClose, size = "max-w-3xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4">
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-soft sm:rounded-lg ${size}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button className="btn-secondary h-9 w-9 p-0" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

import { X } from "lucide-react";

export default function Modal({ title, children, open, onClose, size = "max-w-3xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className={`max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-slate-950/25 sm:rounded-[2rem] ${size}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-base font-black text-ink-950">{title}</h2>
          <button className="btn-secondary h-9 w-9 p-0" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

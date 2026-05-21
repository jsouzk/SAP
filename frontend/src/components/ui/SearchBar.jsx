import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, onSubmit, placeholder = "Buscar..." }) {
  return (
    <form className="mb-4 flex flex-col gap-2 rounded-3xl border border-white/80 bg-white/85 p-2.5 shadow-soft ring-1 ring-slate-900/5 sm:flex-row" onSubmit={onSubmit}>
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-700" size={18} />
        <input className="input pl-10" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
      <button className="btn-secondary w-full sm:w-auto" type="submit">
        Filtrar
      </button>
    </form>
  );
}

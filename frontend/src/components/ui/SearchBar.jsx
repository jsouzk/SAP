import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, onSubmit, placeholder = "Buscar..." }) {
  return (
    <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input className="input pl-10" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
      <button className="btn-secondary" type="submit">
        Filtrar
      </button>
    </form>
  );
}

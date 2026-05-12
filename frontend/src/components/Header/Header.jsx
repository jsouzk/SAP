import { LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModuleSearch } from "../../context/SearchContext";

export default function Header({ title, onMenu }) {
  const { user, logout } = useAuth();
  const { search, setSearch } = useModuleSearch();

  const handleChange = (event) => {
    setSearch(event.target.value);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="btn-secondary h-10 w-10 p-0 lg:hidden" onClick={onMenu} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Camara Municipal de Iranduba</p>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
          </div>
        </div>
        <label className="hidden min-w-80 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            className="ml-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
            value={search}
            onChange={handleChange}
            placeholder="Busca rapida no modulo atual"
            type="search"
          />
        </label>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.nome || "Usuario"}</p>
            <p className="text-xs capitalize text-slate-500">{user?.tipo_usuario || "perfil"}</p>
          </div>
          <button className="btn-secondary h-10 w-10 p-0" onClick={logout} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

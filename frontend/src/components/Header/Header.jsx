import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useModuleSearch } from "../../context/SearchContext";

export default function Header({ title, onMenu }) {
  const { user, logout } = useAuth();
  const { search, setSearch } = useModuleSearch();

  const handleChange = (event) => {
    setSearch(event.target.value);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/80 bg-white/75 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex min-h-[78px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="btn-secondary h-10 w-10 p-0 lg:hidden" onClick={onMenu} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-brand-700">Câmara Municipal de Iranduba</p>
            <h1 className="truncate text-xl font-black tracking-tight text-ink-950 sm:text-2xl">{title}</h1>
          </div>
        </div>

        <label className="order-3 flex w-full items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm ring-1 ring-white/80 md:order-none md:w-[420px]">
          <Search size={18} className="text-brand-700" />
          <input
            className="ml-2 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
            value={search}
            onChange={handleChange}
            placeholder="Busca rápida no módulo atual"
            type="search"
          />
        </label>

        <div className="flex items-center gap-3">
          <button className="btn-secondary hidden h-10 w-10 rounded-2xl p-0 sm:inline-flex" aria-label="Notificacoes">
            <Bell size={18} />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.nome || "Usuário"}</p>
            <p className="text-xs capitalize text-slate-500">{user?.gabinete_nome || user?.tipo_usuario || "perfil"}</p>
          </div>
          <button className="btn-secondary h-10 w-10 rounded-2xl p-0" onClick={logout} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

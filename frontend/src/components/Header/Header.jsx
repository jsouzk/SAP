import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Header({ title, onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [notifications, setNotifications] = useState({ count: 0, items: [] });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchRef = useRef(null);

  const resultLabels = {
    pessoa: "Pessoa",
    atendimento: "Atendimento",
    encaminhamento: "Encaminhamento",
    oficio: "Ofício",
    comentario: "Comentário",
  };

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeoutId = window.setTimeout(async () => {
      const { data } = await api.get("/busca-global/", { params: { q: query } });
      setResults(data.results || []);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        setResults([]);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/notificacoes/")
      .then(({ data }) => {
        if (active) setNotifications({ count: data.count || 0, items: data.items || [] });
      })
      .catch(() => {
        if (active) setNotifications({ count: 0, items: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const openResult = (item) => {
    setQuery("");
    setResults([]);
    navigate(item.url);
  };

  const openNotification = (item) => {
    setNotificationsOpen(false);
    navigate(item.url || "/pendencias");
  };

  const isPlatformAdmin = Boolean(user?.is_platform_admin || user?.is_superuser);
  const licenseWarning = !isPlatformAdmin && (user?.gabinete_licenca_ativa === false || Number(user?.gabinete_dias_restantes) <= 5);
  const subtitle = isPlatformAdmin ? "Administração da plataforma" : user?.gabinete_nome || "Sistema de Atendimento Parlamentar";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="btn-secondary h-10 w-10 p-0 lg:hidden" onClick={onMenu} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-tight text-ink-950 sm:text-2xl">{title}</h1>
            <p className={licenseWarning ? "truncate text-xs font-bold text-amber-700" : "truncate text-xs font-semibold text-slate-500"}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="relative order-3 w-full md:order-none md:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input ref={searchRef} className="input pl-9 pr-16" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pessoas, atendimentos, ofícios..." />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-400 md:block">Ctrl K</span>
          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {results.map((item) => (
                <button className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-50" onClick={() => openResult(item)} key={`${item.tipo}-${item.id}`}>
                  <span className="font-bold text-slate-950">{item.titulo}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500">{resultLabels[item.tipo] || item.tipo}</span>
                  <p className="mt-1 text-xs text-slate-500">{item.descricao || "-"}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <button
              className="btn-secondary relative h-10 w-10 rounded-xl p-0"
              type="button"
              onClick={() => setNotificationsOpen((current) => !current)}
              aria-label="Notificações"
            >
              <Bell size={18} />
              {notifications.count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                  {notifications.count > 9 ? "9+" : notifications.count}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-30 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-black text-slate-950">Notificações</p>
                  <p className="text-xs text-slate-500">Pendências que precisam de atenção</p>
                </div>
                {notifications.items.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-500">Nenhuma pendência importante agora.</p>
                ) : (
                  notifications.items.map((item) => (
                    <button className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50" type="button" onClick={() => openNotification(item)} key={item.tipo}>
                      <span className="font-bold text-slate-950">{item.titulo}</span>
                      <p className="mt-1 text-xs text-slate-500">{item.descricao}</p>
                    </button>
                  ))
                )}
                <Link className="block bg-slate-50 px-4 py-3 text-center text-xs font-black uppercase text-brand-700" to="/pendencias" onClick={() => setNotificationsOpen(false)}>
                  Ver pendências
                </Link>
              </div>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.nome || "Usuário"}</p>
            <p className="text-xs capitalize text-slate-500">{user?.tipo_usuario || "perfil"}</p>
          </div>
          <button className="btn-secondary h-10 w-10 rounded-xl p-0" onClick={logout} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

import { ClipboardList, FileText, Gauge, History, Send, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import logoCamara from "../Header/images/logo.png";

const baseItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/pessoas", label: "Pessoas", icon: UserRound },
  { to: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { to: "/encaminhamentos", label: "Encaminhamentos", icon: Send },
  { to: "/oficios", label: "Ofícios", icon: FileText },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/usuarios", label: "Usuários", icon: Users },
];

const adminItem = { to: "/admin-saas", label: "Admin SaaS", icon: ShieldCheck };

function SidebarLink({ item, onClose }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
          isActive ? "bg-white text-brand-800 shadow-lg shadow-black/10" : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 ring-1 ring-white/10 transition group-hover:bg-white/15 group-hover:text-white">
        <Icon size={18} />
      </span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const canAdminSaas = Boolean(user?.is_platform_admin || user?.is_superuser);
  const items = canAdminSaas ? [...baseItems, adminItem] : baseItems;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[304px] bg-ink-950 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_18rem)]" />
      <div className="relative flex h-full min-h-0 flex-col">
        <header className="flex min-h-24 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
              <img src={logoCamara} alt="Câmara Municipal de Iranduba" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-brand-200">SAP</p>
              <p className="truncate text-sm font-black leading-tight">Atendimento Parlamentar</p>
              <p className="truncate text-xs text-slate-400">Câmara Municipal de Iranduba</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </header>

        <section className="px-4 py-5">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lift backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-100">Gabinete digital</p>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-100">Atendimentos, licenças e documentos oficiais em uma única operação.</p>
          </div>
        </section>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} />
          ))}
        </nav>

        <footer className="border-t border-white/10 p-5 text-xs leading-relaxed text-slate-400">
          <p className="font-black text-slate-100">{user?.gabinete_nome || "Plataforma SAP"}</p>
          <p>{user?.nome || "Usuário autenticado"}</p>
        </footer>
      </div>
    </aside>
  );
}

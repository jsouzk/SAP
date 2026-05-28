import { BarChart3, ClipboardList, FileText, Gauge, HelpCircle, History, KeyRound, ListChecks, ScrollText, Send, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import logoCamara from "../Header/images/logo.png";

const routineItems = [
  { to: "/dashboard", label: "Início", icon: Gauge },
  { to: "/pendencias", label: "Pendências", icon: ListChecks },
  { to: "/pessoas", label: "Pessoas", icon: UserRound },
  { to: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { to: "/encaminhamentos", label: "Encaminhamentos", icon: Send },
  { to: "/oficios", label: "Ofícios", icon: FileText },
  { to: "/minha-assinatura", label: "Licença", icon: KeyRound },
];

const managementItems = [
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/historico", label: "Histórico", icon: History },
];

const supportItems = [
  { to: "/sobre", label: "Sobre", icon: HelpCircle },
];

const restrictedManagementItems = [
  { to: "/auditoria", label: "Auditoria", icon: ScrollText },
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
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
          isActive ? "bg-white text-brand-800 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300 ring-1 ring-white/10 transition group-hover:bg-white/15 group-hover:text-white">
        <Icon size={17} />
      </span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function NavGroup({ title, items, onClose }) {
  return (
    <section className="space-y-1">
      <p className="px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{title}</p>
      {items.map((item) => (
        <SidebarLink key={item.to} item={item} onClose={onClose} />
      ))}
    </section>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const canAdminSaas = Boolean(user?.is_platform_admin || user?.is_superuser);
  const canManageUsers = canAdminSaas || user?.tipo_usuario === "administrador";
  const adminItems = [
    ...managementItems,
    ...(canManageUsers ? restrictedManagementItems : []),
    ...(canAdminSaas ? [adminItem] : []),
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[292px] bg-ink-950 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex min-h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
              <img src={logoCamara} alt="Câmara Municipal de Iranduba" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-brand-200">SAP</p>
              <p className="truncate text-sm font-black leading-tight">Atendimento Parlamentar</p>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </header>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
          <NavGroup title="Rotina" items={routineItems} onClose={onClose} />
          <NavGroup title="Gestão" items={adminItems} onClose={onClose} />
          <NavGroup title="Sistema" items={supportItems} onClose={onClose} />
        </nav>

        <footer className="border-t border-white/10 p-5 text-xs leading-relaxed text-slate-400">
          <p className="font-black text-slate-100">{user?.gabinete_nome || "Plataforma SAP"}</p>
          <p>{user?.nome || "Usuário autenticado"}</p>
        </footer>
      </div>
    </aside>
  );
}

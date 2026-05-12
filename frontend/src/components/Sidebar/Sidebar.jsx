import { ClipboardList, FileText, Gauge, History, Send, Users, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { to: "/encaminhamentos", label: "Encaminhamentos", icon: Send },
  { to: "/oficios", label: "Oficios", icon: FileText },
  { to: "/historico", label: "Historico", icon: History },
  { to: "/usuarios", label: "Usuarios", icon: Users },
];

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-brand-900/20 bg-brand-900 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">SAP</p>
          <p className="text-sm font-bold leading-tight">Atendimento Parlamentar</p>
        </div>
        <button className="rounded-md p-2 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>
      <nav className="space-y-1 px-3 py-5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-white text-brand-900" : "text-brand-50 hover:bg-white/10"}`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-5 text-xs leading-relaxed text-brand-100">
        Fluxo administrativo para atendimentos, encaminhamentos e oficios do gabinete parlamentar.
      </div>
    </aside>
  );
}

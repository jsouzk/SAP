import { BarChart3, HelpCircle, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/pendencias", label: "Pendências", icon: ListChecks },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/sobre", label: "Sobre", icon: HelpCircle },
];

export default function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-[1480px] px-3 pb-5 sm:px-5 lg:px-8">
      <div className="border-t border-slate-200 pt-4">
        <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="font-black text-slate-800">SAP - Sistema de Atendimento Parlamentar</p>
            <p className="mt-1 truncate">
              {user?.gabinete_nome || "Plataforma SAP"} · © {year}
            </p>
            <p className="mt-1 font-semibold text-slate-600">Desenvolvido por Júlio Souza</p>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Links do rodapé">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
                to={to}
                key={to}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Header from "../components/Header/Header";
import LicenseBanner from "../components/ui/LicenseBanner";
import Sidebar from "../components/Sidebar/Sidebar";
import { SearchProvider, useModuleSearch } from "../context/SearchContext";

const titles = {
  "/dashboard": "Dashboard",
  "/pessoas": "Pessoas atendidas",
  "/pessoas/:id": "Detalhes da pessoa",
  "/atendimentos": "Atendimentos",
  "/pendencias": "Pendências",
  "/auditoria": "Auditoria",
  "/relatorios": "Relatórios",
  "/minha-assinatura": "Licença do gabinete",
  "/sobre": "Sobre",
  "/encaminhamentos": "Encaminhamentos",
  "/oficios": "Ofícios",
  "/historico": "Histórico",
  "/usuarios": "Usuários",
  "/admin-saas": "Admin SaaS",
};

function AdminLayoutContent() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { setSearch } = useModuleSearch();
  const title = location.pathname.startsWith("/pessoas/") ? titles["/pessoas/:id"] : titles[location.pathname];

  useEffect(() => {
    setSearch("");
  }, [location.pathname, setSearch]);

  return (
    <div className="min-h-screen text-slate-900">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button className="fixed inset-0 z-30 bg-ink-950/55 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <div className="lg:pl-[292px]">
        <Header title={title || "Sistema"} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <LicenseBanner />
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <SearchProvider>
      <AdminLayoutContent />
    </SearchProvider>
  );
}

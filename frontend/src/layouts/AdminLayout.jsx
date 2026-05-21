import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import { SearchProvider, useModuleSearch } from "../context/SearchContext";

const titles = {
  "/dashboard": "Dashboard",
  "/pessoas": "Pessoas atendidas",
  "/atendimentos": "Atendimentos",
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

  useEffect(() => {
    setSearch("");
  }, [location.pathname, setSearch]);

  return (
    <div className="min-h-screen text-slate-900">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button className="fixed inset-0 z-30 bg-ink-950/55 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <div className="lg:pl-[304px]">
        <Header title={titles[location.pathname] || "Sistema"} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <Outlet />
        </main>
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

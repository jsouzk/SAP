import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import { SearchProvider, useModuleSearch } from "../context/SearchContext";

const titles = {
  "/dashboard": "Dashboard",
  "/atendimentos": "Atendimentos",
  "/encaminhamentos": "Encaminhamentos",
  "/oficios": "Oficios",
  "/historico": "Historico",
  "/usuarios": "Usuarios",
};

function AdminLayoutContent() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { setSearch } = useModuleSearch();

  useEffect(() => {
    setSearch("");
  }, [location.pathname, setSearch]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <div className="lg:pl-72">
        <Header title={titles[location.pathname] || "Sistema"} onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

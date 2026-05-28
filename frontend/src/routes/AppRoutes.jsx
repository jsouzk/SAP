import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import LoadingState from "../components/ui/LoadingState";

const Login = lazy(() => import("../pages/Login/Login"));
const PasswordReset = lazy(() => import("../pages/Login/PasswordReset"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Atendimentos = lazy(() => import("../pages/Atendimentos/Atendimentos"));
const Pessoas = lazy(() => import("../pages/Pessoas/Pessoas"));
const PessoaDetalhes = lazy(() => import("../pages/Pessoas/PessoaDetalhes"));
const Encaminhamentos = lazy(() => import("../pages/Encaminhamentos/Encaminhamentos"));
const Oficios = lazy(() => import("../pages/Oficios/Oficios"));
const Historico = lazy(() => import("../pages/Historico/Historico"));
const Usuarios = lazy(() => import("../pages/Usuarios/Usuarios"));
const AdminSaas = lazy(() => import("../pages/AdminSaas/AdminSaas"));
const Pendencias = lazy(() => import("../pages/Pendencias/Pendencias"));
const Auditoria = lazy(() => import("../pages/Auditoria/Auditoria"));
const Relatorios = lazy(() => import("../pages/Relatorios/Relatorios"));
const MinhaAssinatura = lazy(() => import("../pages/MinhaAssinatura/MinhaAssinatura"));
const Sobre = lazy(() => import("../pages/Sobre/Sobre"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingState /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<PasswordReset />} />
        <Route path="/redefinir-senha/:uid/:token" element={<PasswordReset />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pessoas" element={<Pessoas />} />
            <Route path="/pessoas/:id" element={<PessoaDetalhes />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/pendencias" element={<Pendencias />} />
            <Route path="/auditoria" element={<Auditoria />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/minha-assinatura" element={<MinhaAssinatura />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/encaminhamentos" element={<Encaminhamentos />} />
            <Route path="/oficios" element={<Oficios />} />
            <Route path="/historico" element={<Historico />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/admin-saas" element={<AdminSaas />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

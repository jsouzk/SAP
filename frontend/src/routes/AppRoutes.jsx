import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Atendimentos from "../pages/Atendimentos/Atendimentos";
import Encaminhamentos from "../pages/Encaminhamentos/Encaminhamentos";
import Oficios from "../pages/Oficios/Oficios";
import Historico from "../pages/Historico/Historico";
import Usuarios from "../pages/Usuarios/Usuarios";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/atendimentos" element={<Atendimentos />} />
          <Route path="/encaminhamentos" element={<Encaminhamentos />} />
          <Route path="/oficios" element={<Oficios />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/ui/LoadingState";

export default function ProtectedRoute() {
  const { checkingSession, isAuthenticated } = useAuth();
  if (checkingSession) {
    return <div className="p-6"><LoadingState /></div>;
  }
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

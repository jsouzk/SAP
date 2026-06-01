import { AlertTriangle, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function LicenseBanner() {
  const { user } = useAuth();
  const isPlatformAdmin = Boolean(user?.is_platform_admin || user?.is_superuser);
  const days = user?.gabinete_dias_restantes;
  const inactive = user?.gabinete_licenca_ativa === false;
  const nearDue = Number.isFinite(Number(days)) && Number(days) <= 5;

  if (isPlatformAdmin || (!inactive && !nearDue)) return null;

  return (
    <div className={inactive ? "mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800" : "mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-black">{inactive ? "Licença do gabinete bloqueada" : "Licença perto do vencimento"}</p>
            <p className="mt-1 text-sm font-semibold">{user?.gabinete_mensagem_licenca || "Verifique a situação da licença do gabinete."}</p>
          </div>
        </div>
        <Link className="btn-secondary bg-white" to="/minha-assinatura">
          <KeyRound size={16} />
          Ver licença
        </Link>
      </div>
    </div>
  );
}

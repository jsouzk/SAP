import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Lock, Mail } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/ui/FormField";

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success("Login realizado com sucesso.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setShowDemo(true);
      toast.error(error.response?.data?.detail || "Credenciais invalidas ou API indisponivel.");
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Building2 size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Camara Municipal de Iranduba</p>
              <h1 className="text-xl font-bold text-slate-950">Sistema de Atendimento Parlamentar</h1>
            </div>
          </div>
          <form className="panel p-6" onSubmit={handleSubmit(onSubmit)}>
            <h2 className="text-lg font-bold text-slate-950">Acesso restrito</h2>
            <p className="mt-1 text-sm text-slate-500">Entre com seu email institucional e senha para continuar.</p>
            <div className="mt-6 space-y-4">
              <FormField label="Email" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-10" type="email" {...register("email", { required: "Informe o email" })} />
                </div>
              </FormField>
              <FormField label="Senha" error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-10" type="password" {...register("password", { required: "Informe a senha" })} />
                </div>
              </FormField>
            </div>
            {showDemo && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Verifique se o backend esta em http://localhost:8000.</p>}
            <button className="btn-primary mt-6 w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
      <section className="hidden bg-brand-900 px-10 py-12 text-white lg:block">
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Gabinete parlamentar</p>
            <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight">Atendimentos, encaminhamentos e oficios em um fluxo unico.</h2>
          </div>
          <div className="grid gap-3">
            {["Cadastro com historico completo", "Geracao automatica de oficios", "PDF e impressao para protocolo"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-4 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

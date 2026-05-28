import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, CheckCircle2, Lock, Mail } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import FormField from "../../components/ui/FormField";

export default function Login() {
  const { checkingSession, login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "" } });

  if (!checkingSession && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success("Login realizado com sucesso.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setShowHelp(true);
      if (!error.response) {
        toast.error("Não foi possível conectar ao backend em http://localhost:8000.");
        return;
      }
      if (error.response.status === 401) {
        toast.error("Email ou senha inválidos.");
        return;
      }
      toast.error(error.response?.data?.detail || error.response?.data?.user?.gabinete_mensagem_licenca || "Não foi possível entrar no sistema.");
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7faf8] lg:grid-cols-[1fr_0.9fr]">
      <section className="relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-900/20">
              <Building2 size={25} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Câmara Municipal de Iranduba</p>
              <h1 className="text-xl font-black text-ink-950">Sistema de Atendimento Parlamentar</h1>
            </div>
          </div>

          <form className="panel p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
            <h2 className="text-lg font-black text-ink-950">Acesso restrito</h2>
            <p className="mt-1 text-sm text-slate-500">Entre com o email e senha do usuário do gabinete para continuar.</p>

            <div className="mt-6 space-y-4">
              <FormField label="Email" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-10" type="email" autoComplete="email" {...register("email", { required: "Informe o email" })} />
                </div>
              </FormField>
              <FormField label="Senha" error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="input pl-10" type="password" autoComplete="current-password" {...register("password", { required: "Informe a senha" })} />
                </div>
              </FormField>
              <div className="text-right">
                <Link className="text-sm font-bold text-brand-700 transition hover:text-brand-900" to="/esqueci-senha">
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            {showHelp && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">Confira o email, a senha e se o backend está rodando em http://localhost:8000.</p>}

            <button className="btn-primary mt-6 w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>

      <section className="hidden overflow-hidden bg-gradient-to-br from-ink-950 via-slate-900 to-brand-950 px-10 py-12 text-white lg:block">
        <div className="relative flex h-full flex-col justify-between">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand-700/25 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-100">Gabinete parlamentar</p>
            <h2 className="mt-4 max-w-xl text-4xl font-bold leading-tight">Atendimentos, documentos e licenças em uma operação única.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">Uma interface administrativa feita para rotina de gabinete: rápida para cadastrar, fácil de auditar e pronta para imprimir documentos oficiais.</p>
          </div>
          <div className="relative grid gap-3">
            {["Cadastro com histórico completo", "Geração automática de ofícios", "PDF e impressão para protocolo"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-4 text-sm font-semibold backdrop-blur">
                <CheckCircle2 size={18} className="text-brand-100" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

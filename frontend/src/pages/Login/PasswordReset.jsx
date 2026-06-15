import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, KeyRound, Lock, Mail } from "lucide-react";

import FormField from "../../components/ui/FormField";
import api from "../../services/api";

function getErrorMessage(error) {
  if (!error.response) {
    return "Nao foi possivel conectar ao servidor. Verifique se a API esta online e se a URL do backend esta correta.";
  }

  const data = error.response.data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return getErrorMessage({ response: { data: parsed, status: error.response.status } });
    } catch {
      return `Erro ${error.response.status}: o servidor retornou uma resposta inesperada.`;
    }
  }

  const message = data?.detail || data?.token || data?.email || data?.password?.[0] || data?.password_confirm;
  if (Array.isArray(message)) {
    return message[0];
  }
  return message || `Nao foi possivel concluir a solicitacao. Erro ${error.response.status}.`;
}

export default function PasswordReset() {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const isConfirming = Boolean(uid && token);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const defaultValues = useMemo(
    () => (isConfirming ? { password: "", password_confirm: "" } : { email: "" }),
    [isConfirming],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      if (isConfirming) {
        await api.post("/auth/password-reset/confirm/", { ...values, uid, token });
        toast.success("Senha redefinida com sucesso.");
        navigate("/login", { replace: true });
        return;
      }

      await api.post("/auth/password-reset/", values);
      setSubmitted(true);
      toast.success("Solicitacao enviada.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-900/20">
            <Building2 size={25} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-700">Camara Municipal de Iranduba</p>
            <h1 className="text-xl font-black text-ink-950">Sistema de Atendimento Parlamentar</h1>
          </div>
        </div>

        <form className="panel p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5 flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink-950">{isConfirming ? "Criar nova senha" : "Recuperar senha"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isConfirming ? "Informe uma nova senha para acessar sua conta." : "Informe o email cadastrado para receber o link de recuperacao."}
              </p>
            </div>
          </div>

          {submitted && !isConfirming ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
              Se o email estiver cadastrado, o link de recuperacao sera enviado em instantes.
            </div>
          ) : (
            <div className="space-y-4">
              {isConfirming ? (
                <>
                  <FormField label="Nova senha" error={errors.password}>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        className="input pl-10"
                        type="password"
                        autoComplete="new-password"
                        {...register("password", { required: "Informe a nova senha", minLength: { value: 8, message: "Use pelo menos 8 caracteres" } })}
                      />
                    </div>
                  </FormField>
                  <FormField label="Confirmar senha" error={errors.password_confirm}>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        className="input pl-10"
                        type="password"
                        autoComplete="new-password"
                        {...register("password_confirm", { required: "Confirme a nova senha" })}
                      />
                    </div>
                  </FormField>
                </>
              ) : (
                <FormField label="Email" error={errors.email}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input className="input pl-10" type="email" autoComplete="email" {...register("email", { required: "Informe o email" })} />
                  </div>
                </FormField>
              )}
            </div>
          )}

          {!submitted || isConfirming ? (
            <button className="btn-primary mt-6 w-full" disabled={loading}>
              {loading ? "Enviando..." : isConfirming ? "Salvar nova senha" : "Enviar link"}
            </button>
          ) : null}

          <Link className="btn-secondary mt-3 w-full" to="/login">
            <ArrowLeft size={18} />
            Voltar para login
          </Link>
        </form>
      </div>
    </main>
  );
}

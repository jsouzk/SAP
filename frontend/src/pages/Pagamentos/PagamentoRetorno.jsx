import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

import api from "../../services/api";

const statusConfig = {
  sucesso: {
    icon: CheckCircle2,
    title: "Pagamento aprovado",
    message: "O Mercado Pago confirmou a aprovação. A licença será atualizada automaticamente pelo webhook.",
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  falha: {
    icon: AlertCircle,
    title: "Pagamento não aprovado",
    message: "Não foi possível concluir o pagamento. Você pode voltar ao painel e gerar um novo link.",
    tone: "text-red-700 bg-red-50 border-red-200",
  },
  pendente: {
    icon: Clock3,
    title: "Pagamento pendente",
    message: "O pagamento ainda está em processamento ou depende de uma etapa externa. Aguarde a confirmação do Mercado Pago.",
    tone: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

export default function PagamentoRetorno() {
  const { status = "pendente" } = useParams();
  const [searchParams] = useSearchParams();
  const [sync, setSync] = useState({ loading: false, data: null, error: "" });
  const config = statusConfig[status] || statusConfig.pendente;
  const Icon = config.icon;
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const mercadoPagoStatus = searchParams.get("status") || searchParams.get("collection_status");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    if (!paymentId) return;

    let active = true;
    setSync({ loading: true, data: null, error: "" });

    api.post("/mercado-pago/retorno/", {
      payment_id: paymentId,
      status: mercadoPagoStatus,
      external_reference: externalReference,
    }).then((response) => {
      if (active) setSync({ loading: false, data: response.data, error: "" });
    }).catch((error) => {
      if (active) setSync({ loading: false, data: null, error: error.response?.data?.detail || "Não foi possível sincronizar o pagamento." });
    });

    return () => {
      active = false;
    };
  }, [paymentId, mercadoPagoStatus, externalReference]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl border ${config.tone}`}>
          <Icon size={30} />
        </div>
        <h1 className="text-2xl font-bold text-slate-950">{config.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{config.message}</p>

        {sync.loading && (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            Sincronizando pagamento com o servidor...
          </p>
        )}

        {sync.data?.licenca_ativa && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Pagamento confirmado. A licença do gabinete foi liberada automaticamente.
          </p>
        )}

        {sync.error && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            {sync.error}
          </p>
        )}

        <dl className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-slate-500">Status</dt>
            <dd className="text-right font-bold text-slate-900">{mercadoPagoStatus || status}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-slate-500">Pagamento</dt>
            <dd className="text-right text-slate-700">{paymentId || "Aguardando retorno"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-slate-500">Cobrança</dt>
            <dd className="text-right text-slate-700">{externalReference || "Não informada"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-semibold text-slate-500">Licença</dt>
            <dd className="text-right text-slate-700">{sync.data?.licenca_ativa ? "Liberada" : "Aguardando confirmação"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link className="btn-primary flex-1 text-center" to="/admin-saas">Voltar ao Admin SaaS</Link>
          <Link className="btn-secondary flex-1 text-center" to="/dashboard">Ir para o dashboard</Link>
        </div>
      </section>
    </main>
  );
}

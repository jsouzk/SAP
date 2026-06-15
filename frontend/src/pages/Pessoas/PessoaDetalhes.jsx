import { ArrowLeft, Briefcase, Calendar, Gift, IdCard, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EntityActivity from "../../components/ui/EntityActivity";
import LoadingState from "../../components/ui/LoadingState";
import PageHeader from "../../components/ui/PageHeader";
import { pessoasApi } from "../../services/resources";
import { ATENDIMENTO_STATUS_LABELS } from "../../utils/constants";
import { buildBirthdayWhatsAppUrl, formatCpfInput, formatDateTime } from "../../utils/formatters";

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="text-brand-700" size={18} />
      <p className="mt-2 text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default function PessoaDetalhes() {
  const { id } = useParams();
  const [pessoa, setPessoa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pessoasApi.get(id).then(setPessoa).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;

  const birthdayUrl = buildBirthdayWhatsAppUrl(pessoa);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link className="btn-secondary" to="/pessoas"><ArrowLeft size={16} />Voltar</Link>
        {birthdayUrl && (
          <a className="btn-secondary text-emerald-700" href={birthdayUrl} target="_blank" rel="noreferrer">
            <Gift size={16} />
            Feliz aniversario
          </a>
        )}
      </div>
      <PageHeader title={pessoa?.nome || "Pessoa"} description="Dados cadastrais, linha do tempo, comentários e anexos vinculados a esta pessoa." />

      <section className="panel p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info icon={IdCard} label="CPF" value={formatCpfInput(pessoa?.cpf)} />
          <Info icon={Phone} label="Telefone" value={pessoa?.telefone} />
          <Info icon={Mail} label="Email" value={pessoa?.email} />
          <Info icon={Calendar} label="Nascimento" value={pessoa?.data_nascimento} />
          <Info icon={Briefcase} label="Trabalho" value={pessoa?.local_trabalho} />
          <Info icon={MapPin} label="Endereço" value={pessoa?.endereco} />
          <Info icon={MapPin} label="Bairro" value={pessoa?.bairro} />
          <Info icon={MapPin} label="Cidade" value={pessoa?.cidade} />
          <Info icon={Calendar} label="Título" value={pessoa?.titulo_eleitor} />
        </div>
      </section>

      <section className="panel mt-5 p-5">
        <h2 className="text-lg font-black text-slate-950">Linha do tempo</h2>
        <div className="mt-4 space-y-3">
          {(pessoa?.linha_tempo || []).length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Nenhum atendimento vinculado.</p>}
          {(pessoa?.linha_tempo || []).map((evento, index) => (
            <article className="rounded-xl border border-slate-200 bg-white p-4" key={`${evento.tipo}-${evento.data}-${index}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-slate-950">{evento.tipo}: {evento.titulo || "-"}</p>
                <span className="text-xs font-semibold text-slate-500">{formatDateTime(evento.data)}</span>
              </div>
              {evento.status && <p className="mt-1 text-xs font-bold text-brand-700">{ATENDIMENTO_STATUS_LABELS[evento.status] || evento.status}</p>}
              {evento.descricao && <p className="mt-2 text-sm text-slate-600">{evento.descricao}</p>}
            </article>
          ))}
        </div>
      </section>

      {pessoa?.id && <EntityActivity tipo="pessoa" objetoId={pessoa.id} />}
    </>
  );
}

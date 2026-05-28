import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { anexosApi, comentariosApi } from "../../services/resources";
import { formatDateTime } from "../../utils/formatters";

export default function EntityActivity({ tipo, objetoId }) {
  const [comentarios, setComentarios] = useState([]);
  const [anexos, setAnexos] = useState([]);
  const [texto, setTexto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState(null);

  const load = async () => {
    if (!tipo || !objetoId) return;
    const params = { tipo_entidade: tipo, objeto_id: objetoId, page_size: 100 };
    const [comentariosData, anexosData] = await Promise.all([
      comentariosApi.list(params),
      anexosApi.list(params),
    ]);
    setComentarios(comentariosData.results);
    setAnexos(anexosData.results);
  };

  useEffect(() => {
    load().catch(() => {});
  }, [tipo, objetoId]);

  const addComentario = async (event) => {
    event.preventDefault();
    if (!texto.trim()) return;
    await toast.promise(comentariosApi.create({ tipo_entidade: tipo, objeto_id: objetoId, texto }), {
      loading: "Salvando comentário...",
      success: "Comentário registrado.",
      error: "Não foi possível salvar o comentário.",
    });
    setTexto("");
    await load();
  };

  const addAnexo = async (event) => {
    event.preventDefault();
    if (!arquivo) return;
    const payload = new FormData();
    payload.append("tipo_entidade", tipo);
    payload.append("objeto_id", objetoId);
    payload.append("descricao", descricao);
    payload.append("arquivo", arquivo);
    await toast.promise(anexosApi.create(payload), {
      loading: "Enviando anexo...",
      success: "Anexo enviado.",
      error: "Não foi possível enviar o anexo.",
    });
    setArquivo(null);
    setDescricao("");
    event.target.reset();
    await load();
  };

  return (
    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Comentários internos</h3>
        <form className="mt-3 flex flex-col gap-2" onSubmit={addComentario}>
          <textarea className="input min-h-24" value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="Registrar andamento, contato ou retorno" />
          <button className="btn-primary w-fit">Adicionar comentário</button>
        </form>
        <div className="mt-4 space-y-3">
          {comentarios.map((comentario) => (
            <article className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm" key={comentario.id}>
              <p className="text-slate-700">{comentario.texto}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{comentario.criado_por_nome || "Usuário"} - {formatDateTime(comentario.criado_em)}</p>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Anexos</h3>
        <form className="mt-3 grid gap-2" onSubmit={addAnexo}>
          <input className="input" value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Descrição do anexo" />
          <input className="input" type="file" onChange={(event) => setArquivo(event.target.files?.[0] || null)} />
          <button className="btn-primary w-fit">Enviar anexo</button>
        </form>
        <div className="mt-4 space-y-3">
          {anexos.map((anexo) => (
            <article className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm" key={anexo.id}>
              <a className="font-bold text-brand-700 hover:underline" href={anexo.arquivo_url} target="_blank" rel="noreferrer">{anexo.nome_original || "Abrir anexo"}</a>
              <p className="mt-1 text-slate-600">{anexo.descricao || "-"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{anexo.enviado_por_nome || "Usuário"} - {formatDateTime(anexo.criado_em)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

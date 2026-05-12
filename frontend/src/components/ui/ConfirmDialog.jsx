import Modal from "./Modal";

export default function ConfirmDialog({ open, title = "Confirmar exclusao", message, onCancel, onConfirm }) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="max-w-md">
      <p className="text-sm leading-6 text-slate-600">{message || "Essa acao nao pode ser desfeita."}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn-danger" onClick={onConfirm}>
          Excluir
        </button>
      </div>
    </Modal>
  );
}

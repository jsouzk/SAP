export default function LoadingState({ message = "Carregando dados..." }) {
  return (
    <div className="panel flex min-h-48 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      <span className="ml-3 text-sm font-semibold text-slate-600">{message}</span>
    </div>
  );
}

export default function LoadingState({ message = "Carregando dados..." }) {
  return (
    <div className="panel flex min-h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      <span className="ml-3 text-sm font-bold text-slate-600">{message}</span>
    </div>
  );
}

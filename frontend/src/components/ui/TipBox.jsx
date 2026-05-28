import { Info } from "lucide-react";

export default function TipBox({ children }) {
  return (
    <div className="mb-4 flex gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <Info className="mt-0.5 shrink-0" size={18} />
      <p className="leading-6">{children}</p>
    </div>
  );
}

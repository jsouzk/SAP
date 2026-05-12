export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error.message || error}</span>}
    </label>
  );
}

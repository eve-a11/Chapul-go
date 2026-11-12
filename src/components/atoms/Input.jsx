export default function Input({ label, type = "text", value, onChange, placeholder, required = false }) {
  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
}
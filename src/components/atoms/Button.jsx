export default function Button({ children, type = "button", variant = "primary", onClick, disabled = false, className = "" }) {
  const baseStyles = "w-full py-2.5 px-4 rounded-xl font-medium transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-slate-900/20",
    outline: "border border-slate-700 text-slate-300 hover:bg-slate-800"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
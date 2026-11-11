function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700">
        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-blue-500/30">
          🚌
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          Sistema de Transporte
        </h1>
        
        <p className="text-slate-400 text-sm mb-6">
          Tailwind CSS y React están listos. Puedes empezar a construir la estructura del modelo atómico.
        </p>

        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl transition shadow-lg shadow-blue-600/30">
            Iniciar sesión
          </button>
          
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 px-4 rounded-xl transition">
            Modo Kiosco
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
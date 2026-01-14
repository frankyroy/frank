
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true); // Empezamos por registro como pediste
  const [authMethod, setAuthMethod] = useState<'none' | 'google' | 'email'>('none');

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setAuthMethod('google');
    // Simulación del flujo de Google Auth (Registro o Login automático)
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 1800);
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthMethod('email');
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-700">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-2 transform hover:rotate-6 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
              {isRegistering ? 'Crea tu HostalAI' : 'Bienvenido de nuevo'}
            </h1>
            <p className="text-gray-500 font-medium text-sm px-6">
              {isRegistering 
                ? 'Regístrate hoy y empieza a gestionar tus reservas con inteligencia.' 
                : 'Accede a tu panel de control para gestionar tu establecimiento.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Botón Google - El protagonista */}
            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-4 bg-white border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] group disabled:opacity-70 shadow-sm"
            >
              {isLoading && authMethod === 'google' ? (
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-bold text-gray-700">Procesando...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  <span className="font-bold text-gray-700 tracking-tight">
                    {isRegistering ? 'Registrarse con Google' : 'Entrar con Google'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-4 py-2">
              <div className="flex-1 h-[1px] bg-gray-100"></div>
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">O con tu correo</span>
              <div className="flex-1 h-[1px] bg-gray-100"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegistering && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <input 
                    required
                    type="text" 
                    placeholder="Nombre del Hostal"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
                  />
                  <input 
                    required
                    type="text" 
                    placeholder="Tu Nombre"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
                  />
                </div>
              )}
              
              <input 
                required
                type="email" 
                placeholder="Correo electrónico"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
              />
              
              <input 
                required
                type="password" 
                placeholder="Contraseña"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
              />

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-[1.5rem] font-black text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-200"
              >
                {isLoading && authMethod === 'email' 
                  ? 'Iniciando...' 
                  : (isRegistering ? 'Crear mi cuenta' : 'Entrar al panel')}
              </button>
            </form>
          </div>

          <div className="text-center pt-4 border-t border-gray-50">
            <p className="text-sm font-medium text-gray-500">
              {isRegistering ? '¿Ya tienes una cuenta?' : '¿Eres nuevo por aquí?'}
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-indigo-600 font-black hover:underline transition-all"
              >
                {isRegistering ? 'Inicia Sesión' : 'Regístrate ahora'}
              </button>
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center space-y-2 opacity-50">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">HostalAI v2.7 • Professional Edition</p>
          <div className="flex items-center space-x-2 text-[9px] text-white/80 font-bold">
            <span className="bg-indigo-500/50 px-2 py-0.5 rounded text-white">SSL SECURE</span>
            <span className="bg-emerald-500/50 px-2 py-0.5 rounded text-white">G-SUITE AUTH</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

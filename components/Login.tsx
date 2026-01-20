
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu email para confirmar tu cuenta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error con Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-700">
        <div className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-2xl border border-white/20 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-2 transform hover:rotate-6 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
              {isRegistering ? 'Crea tu HostalAI Cloud' : 'HostalAI Cloud Login'}
            </h1>
            <p className="text-gray-500 font-medium text-sm">Gestiona tu hostal desde cualquier lugar con sincronización en la nube.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 animate-bounce">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-4 bg-white border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 py-4 rounded-[1.5rem] transition-all active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              <span className="font-bold text-gray-700">Continuar con Google</span>
            </button>

            <div className="flex items-center space-x-4 py-2">
              <div className="flex-1 h-[1px] bg-gray-100"></div>
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">O con email</span>
              <div className="flex-1 h-[1px] bg-gray-100"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
              />
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:outline-none focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm"
              />

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-[1.5rem] font-black text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Conectando...' : (isRegistering ? 'Crear Cuenta Cloud' : 'Acceder al Panel')}
              </button>
            </form>
          </div>

          <div className="text-center pt-4 border-t border-gray-50">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

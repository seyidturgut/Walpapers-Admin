
import React, { useState } from 'react';
import { Cat, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertTriangle, Mail } from 'lucide-react';
import { CREDENTIALS } from '../config/credentials';
import { loginWithSupabase } from '../services/supabaseClient';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPassword = password.trim();
    const cleanEmail = email.trim();

    try {
        if (cleanEmail) {
            // MODE 1: SUPABASE LOGIN
            // User provided an email, so we try to authenticate with Supabase
            // This is required for RLS (Row Level Security) to work properly.
            await loginWithSupabase(cleanEmail, cleanPassword);
            // If no error thrown, login successful
            onLogin();
        } else {
            // MODE 2: LOCAL ADMIN (FALLBACK)
            // No email provided, check against local hardcoded hash
            // UX delay for realism
            await new Promise(resolve => setTimeout(resolve, 800));

            const reversed = cleanPassword.split('').reverse().join('');
            const encoded = window.btoa(reversed);

            if (encoded === CREDENTIALS.secret) {
                onLogin();
            } else {
                throw new Error("Hatalı yerel yönetici şifresi.");
            }
        }
    } catch (err: any) {
        console.error(err);
        let msg = "Giriş başarısız.";
        if (err.message) {
            if (err.message.includes("Invalid login")) msg = "Hatalı e-posta veya şifre.";
            else msg = err.message;
        }
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
            <div className="inline-flex bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-2xl shadow-xl shadow-purple-900/40 mb-4 animate-bounce-slow">
                <Cat className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Purrfect Admin</h1>
            <p className="text-slate-400">Yönetici Paneli Girişi</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
            
            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Email Input (Optional for Local, Required for Supabase) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            E-Posta <span className="text-slate-600 normal-case font-normal">(Supabase kullanıcısı için)</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                placeholder="admin@example.com (Opsiyonel)"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Şifre <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError(null);
                                }}
                                className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-xl py-3.5 pl-10 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all`}
                                placeholder="Şifrenizi giriniz"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm animate-shake">
                                <AlertTriangle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit"
                        disabled={loading || !password}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Giriş Yap <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
            
            <div className="bg-slate-900/50 p-4 border-t border-slate-700/50 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Güvenli Kimlik Doğrulama</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

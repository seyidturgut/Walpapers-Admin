
import React, { useState } from 'react';
import { Cat, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import { CREDENTIALS } from '../config/credentials';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // UX için ufak bir bekleme süresi
    setTimeout(() => {
      try {
        const cleanInput = password.trim();

        // 1. Adım: Girilen şifreyi ters çevir
        const reversed = cleanInput.split('').reverse().join('');
        
        // 2. Adım: Base64 formatına çevir (window.btoa her tarayıcıda çalışır)
        const encoded = window.btoa(reversed);

        // 3. Adım: Config dosyasındaki değerle karşılaştır
        if (encoded === CREDENTIALS.secret) {
          onLogin();
        } else {
          setError("Hatalı şifre. Lütfen tekrar deneyiniz.");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Doğrulama sırasında bir hata oluştu.");
        setLoading(false);
      }
    }, 800);
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
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                            Yönetici Şifresi
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
                                autoFocus
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

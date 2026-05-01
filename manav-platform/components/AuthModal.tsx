'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X as CloseIcon, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const { signIn, signUp, signInWithGoogle, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [show, setShow] = useState(false);

  // Modal fade animation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        const identifier = form.username.trim() || form.email.trim();
        await signIn(identifier, form.password);
        toast.success('Giriş başarılı, hoş geldin!');
      } else {
        await signUp(form.username.toLowerCase().replace(/\s+/g,''), form.email, form.password);
        toast.success('Hesabın başarıyla oluşturuldu!');
      }
      onClose();
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      const msg = err.message || 'Bir hata oluştu.';
      toast.error(`Hata: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Google ile giriş yapıldı!');
      onClose();
    } catch {
      toast.error('Google girişi başarısız. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      toast.success('Misafir olarak giriş yapıldı!');
      onClose();
    } catch {
      toast.error('Misafir girişi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center sm:p-4 transition-all duration-200 ${
        show ? 'bg-black/40' : 'bg-transparent'
      }`} 
      onClick={onClose}
    >
      
      {/* Container simulating X's rigid strict modal shape */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full h-full sm:w-[600px] sm:h-auto sm:min-h-[650px] bg-white sm:rounded-2xl shadow-xl flex flex-col transition-all duration-300 ease-out overflow-y-auto ${
          show ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.98] opacity-0 translate-y-4'
        }`}
      >
        
        {/* Header - Perfect Symmetry */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200/60 transition-colors text-black"
            aria-label="Kapat"
          >
            <CloseIcon size={20} strokeWidth={2}/>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-serif font-bold text-lg select-none">
              M
            </div>
          </div>
          
          <div className="w-9" /> {/* Spacer to preserve absolute center balance */}
        </div>

        {/* Form Body - Constrained Center Block */}
        <div className="flex-1 flex flex-col items-center pt-2 pb-10">
          
          <div className="w-full max-w-[340px] flex flex-col">
            
            <h1 className="text-[31px] font-bold text-black mt-2 mb-8 tracking-[-0.03em] leading-snug">
              {mode === 'signin' ? "Manavplatform'a giriş yap" : "Manavplatform'a katıl"}
            </h1>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full h-[40px] flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:bg-[#E6E6E6] transition-colors text-[15px] font-semibold text-black outline-none relative"
              >
                <div className="absolute left-4">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span>Google ile kaydol</span>
              </button>

              <button
                onClick={handleGuest}
                disabled={loading}
                className="w-full h-[40px] flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 focus:bg-[#E6E6E6] transition-colors text-[15px] font-semibold text-black outline-none"
              >
                Misafir olarak göz at
              </button>
            </div>

            <div className="flex items-center gap-2 my-2 mt-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[15px] text-gray-800 font-normal">veya</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Inputs aligned exactly like X floating inputs */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              
              {/* --- USERNAME FIELD --- (Always shown) */}
              <div className="relative group rounded border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px] bg-white">
                <input
                  type="text"
                  id="x_username"
                  className="block px-2 pt-6 w-full h-full text-[17px] text-black bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                  placeholder=" "
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <label
                  htmlFor="x_username"
                  className="absolute text-gray-500 text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                >
                  {mode === 'signin' ? 'Kullanıcı Adı veya E-posta' : 'Kullanıcı Adı belirle'}
                </label>
              </div>

              {/* --- EMAIL FIELD --- (Only for signup) */}
              {mode === 'signup' && (
                <div className="relative group rounded border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px] bg-white">
                  <input
                    type="email"
                    id="x_email"
                    className="block px-2 pt-6 w-full h-full text-[17px] text-black bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                    placeholder=" "
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <label
                    htmlFor="x_email"
                    className="absolute text-gray-500 text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                  >
                    E-posta bağla
                  </label>
                </div>
              )}
              
              <div className="relative group rounded border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px] bg-white">
                <input
                  type="password"
                  id="x_password"
                  className="block px-2 pt-6 w-full h-full text-[17px] text-black bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                  placeholder=" "
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <label
                  htmlFor="x_password"
                  className="absolute text-gray-500 text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                >
                  Şifre gir
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-full bg-black hover:bg-gray-800 disabled:opacity-70 text-white font-bold text-[17px] transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader size={18} className="animate-spin text-white/80" />}
                  {mode === 'signin' ? 'İleri' : 'Kaydol'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-[15px] font-normal text-gray-500">
              {mode === 'signin' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              {' '}
              <button
                type="button"
                className="text-[#1d9bf0] hover:underline"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Kaydol' : 'Giriş yap'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

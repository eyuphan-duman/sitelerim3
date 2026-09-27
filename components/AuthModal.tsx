'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { X as CloseIcon, Loader, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export default function AuthModal({ isOpen, onClose, isDark }: Props) {
  const { signIn, signUp, signInWithGoogle, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [detectedDark, setDetectedDark] = useState(false);

  useEffect(() => {
    if (typeof isDark === 'boolean') {
      setDetectedDark(isDark);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('forum_theme');
      setDetectedDark(saved === 'dark' || document.documentElement.classList.contains('forum-dark'));
    }
  }, [isDark, isOpen]);

  const dark = isDark ?? detectedDark;

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
        await signUp(form.username.toLowerCase().replace(/\s+/g,''), form.email.trim(), form.password);
        toast.success('Hesabın başarıyla oluşturuldu!');
      }
      onClose();
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      const msg = err.message || 'Bir hata oluştu.';
      toast.error(msg);
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
    } catch (err: any) {
      console.error(err);
      toast.error('Google girişi başarısız: ' + (err.message || 'Lütfen Firebase ayarlarını kontrol edin.'));
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
      className={`fixed inset-0 z-[3000] flex items-center justify-center sm:p-4 transition-all duration-200 ${
        show ? 'bg-black/60' : 'bg-transparent'
      }`} 
      onClick={onClose}
    >
      
      {/* Container simulating X's rigid strict modal shape */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: dark ? '#000000' : '#ffffff',
          color: dark ? '#e7e9ea' : '#0f172a',
          border: dark ? '1px solid #2f3336' : 'none',
        }}
        className={`relative w-full h-full sm:w-[600px] sm:h-auto sm:min-h-[650px] sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out overflow-y-auto ${
          show ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.98] opacity-0 translate-y-4'
        }`}
      >
        
        {/* Header - Perfect Symmetry */}
        <div 
          style={{
            background: dark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderBottom: `1px solid ${dark ? '#2f3336' : '#f1f5f9'}`
          }}
          className="flex items-center justify-between px-4 py-3 sticky top-0 backdrop-blur-sm z-20"
        >
          <button 
            onClick={onClose} 
            style={{ color: dark ? '#e7e9ea' : '#000000' }}
            className="p-2 rounded-full hover:bg-gray-200/20 transition-colors"
            aria-label="Kapat"
          >
            <CloseIcon size={20} strokeWidth={2}/>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2">
            <div 
              style={{
                background: dark ? '#ffffff' : '#000000',
                color: dark ? '#000000' : '#ffffff'
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-lg select-none"
            >
              M
            </div>
          </div>
          
          <div className="w-9" /> {/* Spacer to preserve absolute center balance */}
        </div>

        {/* Form Body - Constrained Center Block */}
        <div className="flex-1 flex flex-col items-center pt-2 pb-10">
          
          <div className="w-full max-w-[340px] flex flex-col">
            
            <h1 
              style={{ color: dark ? '#e7e9ea' : '#0f172a' }}
              className="text-[31px] font-bold mt-2 mb-6 tracking-[-0.03em] leading-snug"
            >
              {mode === 'signin' ? "Manavplatform'a giriş yap" : "Manavplatform'a katıl"}
            </h1>

            {/* Psychologist Registration Prompt */}
            {mode === 'signup' && (
              <div 
                style={{
                  background: dark ? '#16181c' : undefined,
                  borderColor: dark ? 'rgba(212, 175, 55, 0.35)' : undefined
                }}
                className="mb-6 p-3.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/60 flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div 
                    style={{ color: dark ? '#fbbf24' : '#0f172a' }}
                    className="text-[14px] font-bold flex items-center gap-1.5"
                  >
                    <Award size={15} className="text-amber-500" />
                    <span>Psikolog musunuz?</span>
                  </div>
                  <div 
                    style={{ color: dark ? '#94a3b8' : '#475569' }}
                    className="text-[12px] mt-0.5"
                  >
                    Diploma ile uzman rozetli kayıt olun.
                  </div>
                </div>
                <Link
                  href="/kayit/psikolog"
                  onClick={onClose}
                  className="text-[12px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm transition-colors"
                >
                  Uzman Kaydı →
                </Link>
              </div>
            )}

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  background: dark ? '#16181c' : '#ffffff',
                  borderColor: dark ? '#2f3336' : '#d1d5db',
                  color: dark ? '#e7e9ea' : '#000000'
                }}
                className="w-full h-[40px] flex items-center justify-center gap-2 rounded-full border transition-colors text-[15px] font-semibold outline-none relative"
              >
                <div className="absolute left-4">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span>{mode === 'signin' ? 'Google ile giriş yap' : 'Google ile kaydol'}</span>
              </button>

              <button
                type="button"
                onClick={handleGuest}
                disabled={loading}
                style={{
                  background: dark ? '#16181c' : '#ffffff',
                  borderColor: dark ? '#2f3336' : '#d1d5db',
                  color: dark ? '#e7e9ea' : '#000000'
                }}
                className="w-full h-[40px] flex items-center justify-center rounded-full border transition-colors text-[15px] font-semibold outline-none"
              >
                Misafir olarak göz at
              </button>
            </div>

            <div className="flex items-center gap-2 my-2 mt-4">
              <div style={{ background: dark ? '#2f3336' : '#e5e7eb' }} className="flex-1 h-px" />
              <span style={{ color: dark ? '#71767b' : '#6b7280' }} className="text-[15px] font-normal">veya</span>
              <div style={{ background: dark ? '#2f3336' : '#e5e7eb' }} className="flex-1 h-px" />
            </div>

            {/* Inputs aligned exactly like X floating inputs */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              
              {/* --- USERNAME FIELD --- (Always shown) */}
              <div 
                style={{
                  background: dark ? '#16181c' : '#ffffff',
                  borderColor: dark ? '#2f3336' : '#d1d5db'
                }}
                className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
              >
                <input
                  type="text"
                  id="x_username"
                  style={{ color: dark ? '#e7e9ea' : '#000000' }}
                  className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                  placeholder=" "
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <label
                  htmlFor="x_username"
                  style={{ color: dark ? '#71767b' : '#6b7280' }}
                  className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                >
                  {mode === 'signin' ? 'Kullanıcı Adı veya E-posta' : 'Kullanıcı Adı belirle'}
                </label>
              </div>

              {/* --- EMAIL FIELD --- (Only for signup) */}
              {mode === 'signup' && (
                <div 
                  style={{
                    background: dark ? '#16181c' : '#ffffff',
                    borderColor: dark ? '#2f3336' : '#d1d5db'
                  }}
                  className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
                >
                  <input
                    type="email"
                    id="x_email"
                    style={{ color: dark ? '#e7e9ea' : '#000000' }}
                    className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                    placeholder=" "
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <label
                    htmlFor="x_email"
                    style={{ color: dark ? '#71767b' : '#6b7280' }}
                    className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                  >
                    E-posta bağla
                  </label>
                </div>
              )}
              
              <div 
                style={{
                  background: dark ? '#16181c' : '#ffffff',
                  borderColor: dark ? '#2f3336' : '#d1d5db'
                }}
                className="relative group rounded border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors h-[56px]"
              >
                <input
                  type="password"
                  id="x_password"
                  style={{ color: dark ? '#e7e9ea' : '#000000' }}
                  className="block px-2 pt-6 w-full h-full text-[17px] bg-transparent border-0 appearance-none focus:outline-none focus:ring-0 peer"
                  placeholder=" "
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <label
                  htmlFor="x_password"
                  style={{ color: dark ? '#71767b' : '#6b7280' }}
                  className="absolute text-[16px] transform duration-150 top-4 left-2 z-10 origin-[0] scale-[0.8] -translate-y-3 peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-3 cursor-text pointer-events-none"
                >
                  Şifre gir
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-6">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: dark ? '#ffffff' : '#000000',
                    color: dark ? '#000000' : '#ffffff'
                  }}
                  className="w-full h-[52px] rounded-full disabled:opacity-70 font-bold text-[17px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <Loader size={18} className="animate-spin" />}
                  {mode === 'signin' ? 'İleri' : 'Kaydol'}
                </button>
              </div>
            </form>

            <div style={{ color: dark ? '#71767b' : '#6b7280' }} className="mt-8 text-[15px] font-normal">
              {mode === 'signin' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              {' '}
              <button
                type="button"
                className="text-[#1d9bf0] hover:underline cursor-pointer"
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

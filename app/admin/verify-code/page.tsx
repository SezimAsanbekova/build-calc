'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, Shield, Send } from 'lucide-react';

function AdminVerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push('/admin/login');
      return;
    }
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value.slice(-1)].join('');
      if (fullCode.length === 6) submitCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
    if (pasted.length === 6) submitCode(pasted);
    else inputRefs.current[pasted.length]?.focus();
  };

  const submitCode = async (fullCode: string) => {
    if (fullCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decodeURIComponent(email!), code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Неверный код');
        setLoading(false);
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
        router.refresh();
      }, 1200);
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Повторная отправка кода — нужен пароль, поэтому редиректим на логин
        body: JSON.stringify({ email: decodeURIComponent(email!), password: '__resend__' }),
      });

      // Если пароль неверный — просто говорим вернуться на логин
      if (!response.ok) {
        setError('Для повторной отправки кода вернитесь на страницу входа.');
        setResending(false);
        return;
      }

      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                BuildCalc AI
              </p>
              <p className="text-xl font-bold text-white">Панель администратора</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Подтверждение входа</h1>
          <p className="text-slate-400 text-sm">
            Код отправлен в Telegram на аккаунт администратора
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-700">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Вход выполнен</h2>
              <p className="text-slate-400">Перенаправление в панель управления...</p>
            </div>
          ) : (
            <>
              {/* Telegram hint */}
              <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg flex items-start space-x-3">
                <Send className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300">
                  Откройте Telegram и введите 6-значный код из сообщения бота
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-4 text-center">
                  Введите 6-значный код
                </label>
                <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all outline-none bg-slate-700/50 text-white
                        ${error
                          ? 'border-red-600 bg-red-900/20'
                          : 'border-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                        }`}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => submitCode(code.join(''))}
                disabled={loading || code.join('').length !== 6}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <span>Войти в панель</span>
                )}
              </button>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-2">Не получили код?</p>
                <Link
                  href="/admin/login"
                  className="text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
                >
                  Вернуться и войти заново
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/admin/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Назад к входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AdminVerifyCodeContent />
    </Suspense>
  );
}

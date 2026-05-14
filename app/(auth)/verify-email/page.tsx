'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devCode, setDevCode] = useState(''); // Код для разработки (если email не настроен)
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  useEffect(() => {
    setMounted(true);
    if (!email) {
      router.push('/register');
    }
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [email, router]);

  // Таймер обратного отсчёта для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
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

    // Автоотправка при заполнении последнего поля
    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value.slice(-1)].join('');
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    if (pastedData.length === 6) {
      submitCode(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const submitCode = async (fullCode: string) => {
    if (fullCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decodeURIComponent(email!), code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Неверный код');
        setLoading(false);
        // Очищаем поля при ошибке
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (mounted) {
          router.push('/profile');
          router.refresh();
        }
      }, 1500);
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setDevCode('');

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decodeURIComponent(email!) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при отправке кода');
      } else {
        // Если email не настроен — показываем код прямо на странице
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setCountdown(60); // 60 секунд до следующей отправки
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BuildCalc AI
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Подтверждение email</h1>
          <p className="text-gray-600">
            Мы отправили код на <strong>{decodeURIComponent(email)}</strong>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-100">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Успешно!</h2>
              <p className="text-gray-600">Email подтвержден. Перенаправление...</p>
            </div>
          ) : (
            <>
              {/* Dev code hint */}
              {devCode && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    ⚠️ Email не настроен. Код для разработки:
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 tracking-widest text-center">
                    {devCode}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Code Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
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
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all outline-none
                        ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}
                      `}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => submitCode(code.join(''))}
                disabled={loading || code.join('').length !== 6}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Проверка...</span>
                  </>
                ) : (
                  <span>Подтвердить</span>
                )}
              </button>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Не получили код?</p>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || resending}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center space-x-1"
                >
                  {resending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>
                    {countdown > 0
                      ? `Отправить повторно через ${countdown}с`
                      : 'Отправить повторно'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

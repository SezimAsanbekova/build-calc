'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'ru' | 'kg';

interface LangContextType {
  lang: Lang;
  switchLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextType>({ lang: 'ru', switchLang: () => {} });

function readLangCookie(): Lang {
  if (typeof document === 'undefined') return 'ru';
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/);
  const val = match?.[1];
  return val === 'kg' ? 'kg' : 'ru';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru');

  useEffect(() => {
    setLang(readLangCookie());
  }, []);

  const switchLang = (l: Lang) => {
    document.cookie = `lang=${l};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
    setLang(l);
  };

  return (
    <LangContext.Provider value={{ lang, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

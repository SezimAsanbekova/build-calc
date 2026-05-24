'use client';

import { useLang } from '@/app/i18n/LanguageContext';
import type { Lang } from '@/app/i18n/translations';

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: 'ru', label: 'RU', flag: '🇷🇺' },
  { value: 'kg', label: 'KG', flag: '🇰🇬' },
];

export default function LanguageSwitcher() {
  const { lang, switchLang } = useLang();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.value}
          onClick={() => switchLang(l.value)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
            lang === l.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}

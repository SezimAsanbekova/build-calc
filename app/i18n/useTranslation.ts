'use client';

import { useMemo } from 'react';
import { useLang, type Lang } from '@/app/i18n/LanguageContext';
import type { Namespace, TranslationRecord } from '@/app/i18n/translations';
import { getTranslations } from '@/app/i18n/translations';

function resolvePath(obj: TranslationRecord, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as TranslationRecord)[key];
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : path;
}

export function useTranslation(ns: Namespace) {
  const { lang } = useLang();

  const translations = useMemo(() => getTranslations(lang, ns), [lang, ns]);

  const t = (key: string, params?: Record<string, string>): string => {
    let value = resolvePath(translations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
    }
    return value;
  };

  return { t, lang: lang as Lang };
}

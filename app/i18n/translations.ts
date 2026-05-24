import ruCommon from './locales/ru/common.json';
import ruLanding from './locales/ru/landing.json';
import ruAuth from './locales/ru/auth.json';
import ruDashboard from './locales/ru/dashboard.json';
import ruProfile from './locales/ru/profile.json';
import ruCatalog from './locales/ru/catalog.json';
import ruCalculations from './locales/ru/calculations.json';

import kgCommon from './locales/kg/common.json';
import kgLanding from './locales/kg/landing.json';
import kgAuth from './locales/kg/auth.json';
import kgDashboard from './locales/kg/dashboard.json';
import kgProfile from './locales/kg/profile.json';
import kgCatalog from './locales/kg/catalog.json';
import kgCalculations from './locales/kg/calculations.json';

export type TranslationRecord = { [key: string]: string | TranslationRecord };

export type Namespace =
  | 'common'
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'profile'
  | 'catalog'
  | 'calculations';

export type Lang = 'ru' | 'kg';

type TranslationMap = Record<Namespace, TranslationRecord>;

const ru: TranslationMap = {
  common: ruCommon as TranslationRecord,
  landing: ruLanding as TranslationRecord,
  auth: ruAuth as TranslationRecord,
  dashboard: ruDashboard as TranslationRecord,
  profile: ruProfile as TranslationRecord,
  catalog: ruCatalog as TranslationRecord,
  calculations: ruCalculations as TranslationRecord,
};

const kg: TranslationMap = {
  common: kgCommon as TranslationRecord,
  landing: kgLanding as TranslationRecord,
  auth: kgAuth as TranslationRecord,
  dashboard: kgDashboard as TranslationRecord,
  profile: kgProfile as TranslationRecord,
  catalog: kgCatalog as TranslationRecord,
  calculations: kgCalculations as TranslationRecord,
};

const translations: Record<Lang, TranslationMap> = { ru, kg };

export function getTranslations(lang: Lang, ns: Namespace): TranslationRecord {
  return translations[lang]?.[ns] ?? translations.ru[ns];
}

'use client';

import { Calculator, Wallet, CheckCircle, Lightbulb, FileText, History, Target, Home } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function FeaturesSection() {
  const { t } = useTranslation('landing');
  const features = [
    { icon: Calculator, titleKey: 'features.items.autoCalc.title', descKey: 'features.items.autoCalc.desc' },
    { icon: Wallet,     titleKey: 'features.items.budget.title',   descKey: 'features.items.budget.desc' },
    { icon: CheckCircle,titleKey: 'features.items.compat.title',   descKey: 'features.items.compat.desc' },
    { icon: Lightbulb,  titleKey: 'features.items.alts.title',     descKey: 'features.items.alts.desc' },
    { icon: FileText,   titleKey: 'features.items.estimate.title', descKey: 'features.items.estimate.desc' },
    { icon: History,    titleKey: 'features.items.history.title',  descKey: 'features.items.history.desc' },
    { icon: Target,     titleKey: 'features.items.variants.title', descKey: 'features.items.variants.desc' },
    { icon: Home,       titleKey: 'features.items.rooms.title',    descKey: 'features.items.rooms.desc' },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('features.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

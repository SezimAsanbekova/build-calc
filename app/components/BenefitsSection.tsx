'use client';

import { CheckCircle2, DollarSign, Zap, FileCheck, Target, Search } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function BenefitsSection() {
  const { t } = useTranslation('landing');
  const benefits = [
    { icon: CheckCircle2, color: 'from-green-500 to-emerald-600', key: 'errors' },
    { icon: DollarSign,   color: 'from-blue-500 to-cyan-600',    key: 'budget' },
    { icon: Zap,          color: 'from-yellow-500 to-orange-600',key: 'speed' },
    { icon: FileCheck,    color: 'from-purple-500 to-pink-600',  key: 'spec' },
    { icon: Target,       color: 'from-red-500 to-rose-600',     key: 'waste' },
    { icon: Search,       color: 'from-indigo-500 to-blue-600',  key: 'compat' },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('benefits.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {t('benefits.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${benefit.color} rounded-t-xl`}></div>
                
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${benefit.color} rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {t(`benefits.items.${benefit.key}.title`)}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {t(`benefits.items.${benefit.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

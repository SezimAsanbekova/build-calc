'use client';

import { Ruler, Star, CreditCard, Bot, ClipboardCheck } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function HowItWorksSection() {
  const { t } = useTranslation('landing');
  const steps = [
    { number: '01', stepKey: '1', icon: Ruler },
    { number: '02', stepKey: '2', icon: Star },
    { number: '03', stepKey: '3', icon: CreditCard },
    { number: '04', stepKey: '4', icon: Bot },
    { number: '05', stepKey: '5', icon: ClipboardCheck },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('howItWorks.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>

          <div className="space-y-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className={`flex flex-col lg:flex-row items-center gap-6 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-xs font-semibold text-blue-600 mb-1.5">
                        {t('howItWorks.step')} {step.number}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {t(`howItWorks.steps.${step.stepKey}.title`)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t(`howItWorks.steps.${step.stepKey}.desc`)}
                      </p>
                    </div>
                  </div>

                  {/* Circle indicator */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden lg:block"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

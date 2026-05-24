'use client';

import { useState } from 'react';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Plus } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation('landing');

  const faqs = ['1','2','3','4','5','6','7','8'];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('faq.title')}
          </h2>
          <p className="text-base text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faqKey, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
              >
                <span className="text-sm font-semibold text-gray-900 pr-6">
                  {t(`faq.items.${faqKey}.q`)}
                </span>
                <Plus className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform duration-300 ${
                  openIndex === index ? 'rotate-45' : ''
                }`} />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                  {t(`faq.items.${faqKey}.a`)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

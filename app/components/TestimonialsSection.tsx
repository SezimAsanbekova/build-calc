'use client';

import { User, Palette, HardHat, Laptop, Store, Microscope, Star } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function TestimonialsSection() {
  const { t } = useTranslation('landing');
  const testimonials = [
    { icon: User,       key: '1' },
    { icon: Palette,    key: '2' },
    { icon: HardHat,    key: '3' },
    { icon: Laptop,     key: '4' },
    { icon: Store,      key: '5' },
    { icon: Microscope, key: '6' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('testimonials.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-gray-700 mb-5 italic leading-relaxed">
                  "{t(`testimonials.items.${testimonial.key}.text`)}"
                </p>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {t(`testimonials.items.${testimonial.key}.name`)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t(`testimonials.items.${testimonial.key}.role`)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

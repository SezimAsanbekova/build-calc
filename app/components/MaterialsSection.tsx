'use client';

import Link from 'next/link';
import { Grid3x3, Paintbrush, Layers, Wallpaper, Droplet, Brush } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';

export default function MaterialsSection() {
  const { t } = useTranslation('landing');
  const materials = [
    { icon: Grid3x3,   key: 'tile',     price: 'от 450 с/м²',  popular: true  },
    { icon: Paintbrush, key: 'paint',    price: 'от 320 с/л',   popular: true  },
    { icon: Layers,     key: 'laminate', price: 'от 580 с/м²',  popular: true  },
    { icon: Wallpaper,  key: 'wallpaper',price: 'от 890 с/рул', popular: false },
    { icon: Droplet,    key: 'adhesive', price: 'от 280 с/25кг',popular: false },
    { icon: Brush,      key: 'putty',    price: 'от 350 с/20кг',popular: false },
  ];

  return (
    <section id="materials" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t('materials.title')}
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            {t('materials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {materials.map((material, index) => {
            const Icon = material.icon;
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {material.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                      {t('materials.popular')}
                    </span>
                  </div>
                )}

                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                    {t(`materials.items.${material.key}.category`)}
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t(`materials.items.${material.key}.name`)}
                  </h3>
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {material.price}
                  </div>
                </div>

                <Link href="/register" className="mt-3 w-full py-2 bg-gray-900 text-white text-sm rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-300 block text-center">
                  {t('materials.details')}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block">
            {t('materials.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}

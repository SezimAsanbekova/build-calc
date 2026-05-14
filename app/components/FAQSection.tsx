'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Как работает система расчета материалов?',
      answer: 'Вы вводите параметры помещения (площадь, высоту стен), выбираете тип ремонта и бюджет. Система автоматически рассчитывает необходимое количество материалов с учетом коэффициентов запаса, проверяет их совместимость и формирует детальную смету.'
    },
    {
      question: 'Насколько точны расчеты?',
      answer: 'Точность расчетов составляет 95%. Система использует проверенные формулы и учитывает коэффициенты на обрезку, нахлест и запас (5-10%). Все расчеты основаны на реальных характеристиках материалов от производителей.'
    },
    {
      question: 'Можно ли сохранить результаты расчета?',
      answer: 'Да, все расчеты автоматически сохраняются в вашем личном кабинете. Вы можете в любой момент вернуться к ним, отредактировать или экспортировать в удобном формате (PDF, Excel).'
    },
    {
      question: 'Учитывается ли совместимость материалов?',
      answer: 'Да, система автоматически проверяет технологическую совместимость выбранных материалов. Например, соответствие типа клея и веса плитки, совместимость грунтовки и краски. При обнаружении несовместимости вы получите предупреждение.'
    },
    {
      question: 'Что делать, если я превышаю бюджет?',
      answer: 'Система предупредит вас о превышении бюджета и автоматически предложит альтернативные материалы в нужном ценовом диапазоне. Вы также можете получить несколько вариантов подбора для сравнения.'
    },
    {
      question: 'Какие типы помещений поддерживаются?',
      answer: 'Система поддерживает все типы жилых и коммерческих помещений: квартиры, дома, офисы, магазины и т.д. Для каждого типа учитываются специфические требования к материалам.'
    },
    {
      question: 'Можно ли использовать систему бесплатно?',
      answer: 'Да, базовый функционал доступен бесплатно. Он включает расчет материалов, формирование сметы и сохранение до 3 проектов. Для расширенных возможностей доступны премиум-планы.'
    },
    {
      question: 'Как экспортировать смету?',
      answer: 'После завершения расчета вы можете экспортировать смету в форматах PDF или Excel. Смета включает полный список материалов с артикулами, количеством, ценами и рекомендациями по применению.'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Часто задаваемые вопросы
          </h2>
          <p className="text-base text-gray-600">
            Ответы на популярные вопросы о работе системы
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
              >
                <span className="text-sm font-semibold text-gray-900 pr-6">
                  {faq.question}
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
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

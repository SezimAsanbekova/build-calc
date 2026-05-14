import { Ruler, Star, CreditCard, Bot, ClipboardCheck } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Ввод параметров помещения',
      description: 'Укажите длину, ширину, высоту помещения или просто площадь',
      icon: Ruler
    },
    {
      number: '02',
      title: 'Выбор уровня ремонта',
      description: 'Выберите уровень: эконом, стандарт или премиум',
      icon: Star
    },
    {
      number: '03',
      title: 'Указание бюджета',
      description: 'Установите желаемый бюджет для подбора оптимальных материалов',
      icon: CreditCard
    },
    {
      number: '04',
      title: 'Автоматический подбор',
      description: 'Система рассчитает количество и подберет совместимые материалы',
      icon: Bot
    },
    {
      number: '05',
      title: 'Получение сметы',
      description: 'Получите детальную смету с возможностью экспорта и сохранения',
      icon: ClipboardCheck
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Как это работает
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Простой процесс от параметров до готовой сметы за 5 шагов
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
                        Шаг {step.number}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {step.description}
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

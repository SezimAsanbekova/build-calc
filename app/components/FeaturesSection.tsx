import { Calculator, Wallet, CheckCircle, Lightbulb, FileText, History, Target, Home } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Calculator,
      title: 'Автоматический расчет',
      description: 'Точный расчет количества материалов с учетом коэффициентов запаса и обрезки'
    },
    {
      icon: Wallet,
      title: 'Учет бюджета',
      description: 'Подбор материалов в рамках вашего бюджета с предупреждением о превышении'
    },
    {
      icon: CheckCircle,
      title: 'Проверка совместимости',
      description: 'Автоматическая проверка технологической совместимости выбранных материалов'
    },
    {
      icon: Lightbulb,
      title: 'Рекомендации альтернатив',
      description: 'Умные предложения альтернативных материалов для оптимизации бюджета'
    },
    {
      icon: FileText,
      title: 'Генерация сметы',
      description: 'Формирование профессиональной сметы с артикулами и характеристиками'
    },
    {
      icon: History,
      title: 'История расчетов',
      description: 'Сохранение и доступ к предыдущим расчетам в любое время'
    },
    {
      icon: Target,
      title: 'Несколько вариантов',
      description: 'Получение нескольких вариантов подбора для сравнения и выбора'
    },
    {
      icon: Home,
      title: 'Типы помещений',
      description: 'Поддержка различных типов помещений с учетом их специфики'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Возможности системы
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Все инструменты для точного расчета и подбора материалов в одном месте
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
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

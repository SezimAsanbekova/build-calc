import { CheckCircle2, DollarSign, Zap, FileCheck, Target, Search } from 'lucide-react';

export default function BenefitsSection() {
  const benefits = [
    {
      title: 'Сокращение ошибок',
      description: 'Автоматические расчеты исключают человеческий фактор и гарантируют точность подбора материалов',
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Экономия бюджета',
      description: 'Оптимальный подбор материалов позволяет избежать лишних расходов и переплат',
      icon: DollarSign,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Быстрый расчет',
      description: 'Получите полную спецификацию материалов за несколько минут вместо нескольких часов',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Профессиональная спецификация',
      description: 'Детальная смета с артикулами, характеристиками и рекомендациями по применению',
      icon: FileCheck,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Минимизация остатков',
      description: 'Точный расчет с учетом упаковки материалов минимизирует неиспользованные остатки',
      icon: Target,
      color: 'from-red-500 to-rose-600'
    },
    {
      title: 'Проверка совместимости',
      description: 'Система автоматически проверяет технологическую совместимость выбранных материалов',
      icon: Search,
      color: 'from-indigo-500 to-blue-600'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Преимущества системы
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Почему тысячи пользователей выбирают BuildCalc AI для планирования ремонта
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
                  {benefit.title}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

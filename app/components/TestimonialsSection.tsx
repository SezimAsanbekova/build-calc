import { User, Palette, HardHat, Laptop, Store, Microscope, Star } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Алексей Петров',
      role: 'Частный заказчик',
      icon: User,
      text: 'BuildCalc AI сэкономил мне массу времени и денег. Раньше я тратил дни на расчеты и походы по магазинам, теперь все готово за 10 минут!',
      rating: 5
    },
    {
      name: 'Мария Иванова',
      role: 'Дизайнер интерьеров',
      icon: Palette,
      text: 'Использую систему для всех своих проектов. Клиенты в восторге от точности расчетов и профессиональных смет. Рекомендую!',
      rating: 5
    },
    {
      name: 'Дмитрий Соколов',
      role: 'Прораб',
      icon: HardHat,
      text: 'Отличный инструмент для профессионалов. Проверка совместимости материалов и автоматические рекомендации - это то, что нужно!',
      rating: 5
    },
    {
      name: 'Елена Смирнова',
      role: 'Владелец квартиры',
      icon: Laptop,
      text: 'Делала ремонт впервые и очень боялась ошибиться с материалами. BuildCalc AI помог подобрать все идеально и уложиться в бюджет.',
      rating: 5
    },
    {
      name: 'Игорь Волков',
      role: 'Менеджер магазина',
      icon: Store,
      text: 'Внедрили систему в нашем магазине - продажи выросли на 30%. Клиенты покупают полные комплекты материалов, а не отдельные позиции.',
      rating: 5
    },
    {
      name: 'Ольга Кузнецова',
      role: 'Архитектор',
      icon: Microscope,
      text: 'Профессиональный подход к расчетам. Система учитывает все нюансы и предлагает оптимальные решения. Очень довольна!',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Отзывы пользователей
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Узнайте, что говорят о нас наши клиенты
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
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-gray-700 mb-5 italic leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role}
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

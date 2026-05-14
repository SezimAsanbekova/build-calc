'use client';

import { Rocket, Target, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-20 xl:gap-24 items-center">
          {/* Left content - 5 columns */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-8 lg:space-y-10">
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <Rocket className="w-3.5 h-3.5" />
                Новое поколение расчета
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-bold leading-[1.1] tracking-tight">
                <span className="inline-block pb-1 text-4xl sm:text-5xl lg:text-5xl xl:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Автоматизированный
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mt-2">
                  подбор материалов
                </span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-gray-900 mt-2">
                  для ремонта
                </span>
              </h1>
            </div>

            <p className="text-base lg:text-lg text-gray-600 max-w-xl lg:max-w-md leading-relaxed">
              Система автоматически рассчитывает количество строительных материалов, 
              стоимость ремонта и предлагает оптимальные варианты под ваш бюджет.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 hover:scale-105 text-base">
                Начать расчет
              </button>
              <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 border border-gray-200 text-base">
                Подробнее
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 lg:gap-8 pt-4">
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900">5000+</div>
                <div className="text-xs text-gray-600 mt-1">Расчетов</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900">1000+</div>
                <div className="text-xs text-gray-600 mt-1">Материалов</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold text-gray-900">95%</div>
                <div className="text-xs text-gray-600 mt-1">Точность</div>
              </div>
            </div>
          </div>

          {/* Right content - Dashboard Preview - 7 columns */}
          <div className="lg:col-span-7 relative lg:pl-12 xl:pl-16 lg:-mt-8">
            <div className="relative z-10 glass rounded-2xl p-6 shadow-2xl max-w-md lg:max-w-lg xl:max-w-xl lg:ml-8 xl:ml-12">
              {/* Dashboard mockup */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Расчет материалов</h3>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Активен
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Площадь помещения</span>
                      <span className="text-base font-bold text-gray-900">45 м²</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Бюджет</span>
                      <span className="text-base font-bold text-gray-900">150 000 с</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="text-xs opacity-90 mb-1">Итоговая стоимость</div>
                    <div className="text-2xl font-bold">127 450 с</div>
                    <div className="text-xs opacity-75 mt-1">Экономия: 22 550 с</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl mb-1">🎨</div>
                    <div className="text-xs text-gray-600">Краска</div>
                    <div className="text-sm font-semibold text-gray-900">12 л</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl mb-1">🧱</div>
                    <div className="text-xs text-gray-600">Плитка</div>
                    <div className="text-sm font-semibold text-gray-900">48 м²</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl mb-1">📐</div>
                    <div className="text-xs text-gray-600">Ламинат</div>
                    <div className="text-sm font-semibold text-gray-900">50 м²</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-xs text-gray-600">Обои</div>
                    <div className="text-sm font-semibold text-gray-900">8 рул.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -top-6 -right-6 glass rounded-xl p-3 shadow-xl animate-float hidden lg:block">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 whitespace-nowrap">Совместимость</div>
                  <div className="text-sm font-semibold text-gray-900">Проверена</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-0 glass rounded-xl p-3 shadow-xl animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-600 whitespace-nowrap">Рекомендации</div>
                  <div className="text-sm font-semibold text-gray-900">Готовы</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

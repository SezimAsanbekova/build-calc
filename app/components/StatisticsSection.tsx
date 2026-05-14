'use client';

import { useEffect, useState, useRef } from 'react';
import { BarChart3, Building2, Target, Zap } from 'lucide-react';

export default function StatisticsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      value: 5000,
      suffix: '+',
      label: 'Выполненных расчетов',
      icon: BarChart3
    },
    {
      value: 1000,
      suffix: '+',
      label: 'Материалов в каталоге',
      icon: Building2
    },
    {
      value: 95,
      suffix: '%',
      label: 'Точность расчетов',
      icon: Target
    },
    {
      value: 70,
      suffix: '%',
      label: 'Экономия времени',
      icon: Zap
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Цифры говорят сами за себя
          </h2>
          <p className="text-base text-white/90 max-w-2xl mx-auto">
            Тысячи пользователей уже оценили преимущества автоматизированного подбора материалов
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1.5">
                    {isVisible ? (
                      <CountUp end={stat.value} suffix={stat.suffix} />
                    ) : (
                      '0' + stat.suffix
                    )}
                  </div>
                  <div className="text-white/90 text-sm">
                    {stat.label}
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

function CountUp({ end, suffix }: { end: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [end]);

  return <>{count}{suffix}</>;
}

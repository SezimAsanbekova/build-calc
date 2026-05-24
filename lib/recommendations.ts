// ── Интеллектуальная система рекомендаций ────────────────────────────────────

export type RecommendationType = 'warning' | 'success' | 'info' | 'saving';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface SmartRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
}

export interface RecommendationInput {
  roomType: string;
  surfaceType: string;
  repairLevel: string;
  budget: number;
  totalPrice: number;
  area: number;
  categories: string[];
  materialNames: string[];
  budgetOptimizations: {
    currentMaterial: string;
    alternativeMaterial: string;
    savings: number;
    savingsPercent: number;
  }[];
}

// ── Вспомогательная функция: поиск по ключевым словам ────────────────────────

function includes(list: string[], ...keywords: string[]): boolean {
  return list.some((item) =>
    keywords.some((kw) => item.toLowerCase().includes(kw.toLowerCase())),
  );
}

// ── Построение последовательности работ ──────────────────────────────────────

function buildWorkSequence(categories: string[], surfaceType: string): string[] {
  const seq: string[] = [];

  if (includes(categories, 'грунт')) seq.push('Грунтование поверхности');
  if (includes(categories, 'штукатурк')) seq.push('Штукатурные работы');
  if (includes(categories, 'шпаклёвк', 'шпаклевк')) seq.push('Шпаклевание');
  if (includes(categories, 'плитк', 'керамик')) seq.push('Укладка плитки');
  if (includes(categories, 'краск', 'эмал')) seq.push('Покраска поверхности');
  if (includes(categories, 'обо')) seq.push('Поклейка обоев');
  if (includes(categories, 'ламинат', 'напольн', 'паркет')) seq.push('Укладка напольного покрытия');
  if (includes(categories, 'плинтус', 'молдинг', 'порожк')) seq.push('Установка плинтусов и молдингов');

  if (seq.length === 0) {
    if (surfaceType === 'floor') {
      return ['Подготовка основания', 'Укладка напольного покрытия', 'Установка плинтусов'];
    }
    if (surfaceType === 'ceiling') {
      return ['Подготовка поверхности', 'Грунтование', 'Шпаклевание', 'Покраска потолка'];
    }
    return ['Подготовка поверхности', 'Грунтование', 'Финишная отделка'];
  }

  return seq;
}

// ── Основная функция генерации рекомендаций ───────────────────────────────────

export function generateRecommendations(input: RecommendationInput): SmartRecommendation[] {
  const { roomType, surfaceType, repairLevel, budget, totalPrice, area, categories, materialNames, budgetOptimizations } = input;
  const recs: SmartRecommendation[] = [];

  const catsLower = categories.map((c) => c.toLowerCase());
  const namesLower = materialNames.map((n) => n.toLowerCase());

  const hasCat = (...kw: string[]) => kw.some((k) => catsLower.some((c) => c.includes(k)));
  const hasName = (...kw: string[]) => kw.some((k) => namesLower.some((n) => n.includes(k)));

  // ── 1. Анализ бюджета ─────────────────────────────────────────────────────
  if (budget > 0) {
    const overage = totalPrice - budget;
    const usedPercent = Math.round((totalPrice / budget) * 100);

    if (overage > 0) {
      recs.push({
        type: 'warning',
        title: 'Превышение бюджета',
        description: `Смета превышает бюджет на ${Math.round(overage).toLocaleString('ru-RU')} сом (${usedPercent}% от бюджета). Рекомендуем рассмотреть более доступные аналоги материалов или снизить уровень ремонта до «Стандарт».`,
        priority: 'high',
      });
    } else {
      const remaining = budget - totalPrice;
      const tip = usedPercent <= 70 ? ' Оставшиеся средства можно направить на улучшение качества отдельных материалов или приобретение дополнительных инструментов.' : '';
      recs.push({
        type: 'success',
        title: 'Бюджет соблюдён',
        description: `Смета укладывается в бюджет. Остаток: ${Math.round(remaining).toLocaleString('ru-RU')} сом (${100 - usedPercent}%).${tip}`,
        priority: 'high',
      });
    }
  }

  // ── 2. Рекомендации по экономии ───────────────────────────────────────────
  if (budgetOptimizations.length > 0) {
    const totalSavings = budgetOptimizations.reduce((s, o) => s + o.savings, 0);
    const top = budgetOptimizations[0];
    const extra = budgetOptimizations.length > 1 ? ` Ещё ${budgetOptimizations.length - 1} варианта замены доступны в блоке «Оптимизация бюджета».` : '';
    recs.push({
      type: 'saving',
      title: `Возможная экономия: ${Math.round(totalSavings).toLocaleString('ru-RU')} сом`,
      description: `Можно заменить «${top.currentMaterial}» на более доступный аналог «${top.alternativeMaterial}» и сэкономить ${Math.round(top.savings).toLocaleString('ru-RU')} сом (−${top.savingsPercent}%).${extra}`,
      priority: 'medium',
    });
  }

  // ── 3. Анализ типа помещения ──────────────────────────────────────────────
  if (roomType === 'bathroom') {
    const isWaterproof = hasName('влаго', 'водост', 'ванн') || hasCat('плитк', 'керамик', 'гидро');
    if (!isWaterproof) {
      recs.push({
        type: 'warning',
        title: 'Ванная: влагостойкие материалы',
        description: 'В смете не обнаружены влагостойкие материалы. Для ванной комнаты обязательны покрытия с водозащитой — плитка, влагостойкая краска или гидроизоляция. Обычные материалы быстро придут в негодность.',
        priority: 'high',
      });
    } else {
      recs.push({
        type: 'info',
        title: 'Ванная: дополнительные советы',
        description: 'Для ванной комнаты также рекомендуем обработать швы противогрибковой затиркой и использовать влагостойкий грунт перед укладкой плитки.',
        priority: 'low',
      });
    }
  }

  if (roomType === 'bedroom') {
    recs.push({
      type: 'info',
      title: 'Спальня: экологичность материалов',
      description: 'Для спальни рекомендуются материалы с низким содержанием летучих органических соединений (VOC). Отдавайте предпочтение водоэмульсионным краскам и натуральным покрытиям без резкого запаха.',
      priority: 'medium',
    });
  }

  if (roomType === 'kitchen') {
    const hasKitchenMat = hasName('моющ', 'износ', 'кухн') || hasCat('плитк', 'керамик');
    if (!hasKitchenMat) {
      recs.push({
        type: 'info',
        title: 'Кухня: износостойкие покрытия',
        description: 'Для кухни рекомендуются покрытия с повышенной стойкостью к влаге, жировым загрязнениям и механическому воздействию. Отдавайте предпочтение моющимся краскам класса не ниже «Полуматовая» или керамической плитке.',
        priority: 'medium',
      });
    }
  }

  if (roomType === 'living_room') {
    recs.push({
      type: 'info',
      title: 'Гостиная: декоративные акценты',
      description: 'В гостиной можно использовать декоративные покрытия (фактурная штукатурка, обои под покраску) для создания выразительного интерьера без значительного увеличения бюджета.',
      priority: 'low',
    });
  }

  // ── 4. Анализ уровня ремонта ──────────────────────────────────────────────
  if (repairLevel === 'economy') {
    recs.push({
      type: 'info',
      title: 'Эконом-ремонт: срок службы',
      description: 'Эконом-материалы могут потребовать повторного ремонта через 3–5 лет. Рассмотрите использование материалов среднего сегмента для ключевых поверхностей — это повысит долговечность покрытия.',
      priority: 'low',
    });
  }

  if (repairLevel === 'premium') {
    recs.push({
      type: 'success',
      title: 'Премиум-ремонт: высокое качество',
      description: 'Выбранный уровень ремонта предполагает использование качественных и долговечных материалов. При правильной подготовке поверхности такое покрытие прослужит 15–20 лет.',
      priority: 'low',
    });
  }

  // ── 5. Проверка наличия грунтовки ─────────────────────────────────────────
  const needsPrimer = ['walls', 'full_room', 'ceiling'].includes(surfaceType);
  if (needsPrimer) {
    const hasPrimer = hasCat('грунт') || hasName('грунт');
    if (!hasPrimer) {
      recs.push({
        type: 'warning',
        title: 'Отсутствует грунтовка',
        description: 'В смете не обнаружена грунтовка. Грунтование поверхности улучшает адгезию материалов, снижает расход краски и шпаклёвки, а также предотвращает появление плесени и отслоений.',
        priority: 'high',
      });
    }
  }

  // ── 6. Анализ площади помещения ───────────────────────────────────────────
  if (area > 30) {
    recs.push({
      type: 'info',
      title: 'Большая площадь: оптимизация расхода',
      description: `Площадь помещения ${area.toFixed(1)} м². Обратите внимание на материалы с меньшим расходом на м² — это позволит сократить затраты. Также рассмотрите оптовые закупки для получения скидки у поставщика.`,
      priority: 'low',
    });
  } else if (area < 10) {
    recs.push({
      type: 'info',
      title: 'Небольшая площадь: ставка на качество',
      description: `Площадь помещения ${area.toFixed(1)} м². При небольших объёмах разница в стоимости между эконом и premium незначительна. Рассмотрите более качественные материалы — итоговая цена вырастет незначительно.`,
      priority: 'low',
    });
  }

  // ── 7. Проверка совместимости (дополнительная подсказка) ──────────────────
  const hasShpaklevka = hasCat('шпаклёвк', 'шпаклевк') || hasName('шпаклёвк', 'шпаклевк');
  const hasPaint = hasCat('краск', 'эмал') || hasName('краск', 'эмал');
  if (hasPaint && !hasShpaklevka && surfaceType !== 'floor') {
    recs.push({
      type: 'info',
      title: 'Рекомендуется шпаклевание перед покраской',
      description: 'Перед нанесением краски желательно выполнить шпаклевание поверхности — это обеспечит гладкое покрытие и уменьшит расход краски на 15–20%.',
      priority: 'medium',
    });
  }

  // ── 8. Последовательность выполнения работ ────────────────────────────────
  const workSteps = buildWorkSequence(categories, surfaceType);
  if (workSteps.length > 0) {
    recs.push({
      type: 'info',
      title: 'Рекомендуемая последовательность работ',
      description: workSteps.map((s, i) => `${i + 1}. ${s}`).join('  '),
      priority: 'low',
    });
  }

  // ── Сортировка: high → medium → low ──────────────────────────────────────
  const ORDER: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

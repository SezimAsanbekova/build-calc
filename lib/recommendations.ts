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
  lang?: string;
  budgetOptimizations: {
    currentMaterial: string;
    alternativeMaterial: string;
    savings: number;
    savingsPercent: number;
  }[];
}

function t(ru: string, kg: string, lang: string): string {
  return lang === 'kg' ? kg : ru;
}

// ── Вспомогательная функция: поиск по ключевым словам ────────────────────────

function includes(list: string[], ...keywords: string[]): boolean {
  return list.some((item) =>
    keywords.some((kw) => item.toLowerCase().includes(kw.toLowerCase())),
  );
}

// ── Построение последовательности работ ──────────────────────────────────────

function buildWorkSequence(categories: string[], surfaceType: string, lang: string): string[] {
  const seq: string[] = [];

  if (includes(categories, 'грунт')) seq.push(t('Грунтование поверхности', 'Бетти грунтоо', lang));
  if (includes(categories, 'штукатурк')) seq.push(t('Штукатурные работы', 'Шыбоо иштери', lang));
  if (includes(categories, 'шпаклёвк', 'шпаклевк')) seq.push(t('Шпаклевание', 'Шпаклевание', lang));
  if (includes(categories, 'плитк', 'керамик')) seq.push(t('Укладка плитки', 'Плитка төшөө', lang));
  if (includes(categories, 'краск', 'эмал')) seq.push(t('Покраска поверхности', 'Бетти боёо', lang));
  if (includes(categories, 'обо')) seq.push(t('Поклейка обоев', 'Обой чаптоо', lang));
  if (includes(categories, 'ламинат', 'напольн', 'паркет')) seq.push(t('Укладка напольного покрытия', 'Пол жабуусун төшөө', lang));
  if (includes(categories, 'плинтус', 'молдинг', 'порожк')) seq.push(t('Установка плинтусов и молдингов', 'Плинтус жана молдинг орнотуу', lang));

  if (seq.length === 0) {
    if (surfaceType === 'floor') {
      return [
        t('Подготовка основания', 'Негизди даярдоо', lang),
        t('Укладка напольного покрытия', 'Пол жабуусун төшөө', lang),
        t('Установка плинтусов', 'Плинтус орнотуу', lang),
      ];
    }
    if (surfaceType === 'ceiling') {
      return [
        t('Подготовка поверхности', 'Бетти даярдоо', lang),
        t('Грунтование', 'Грунтоо', lang),
        t('Шпаклевание', 'Шпаклевание', lang),
        t('Покраска потолка', 'Потолокту боёо', lang),
      ];
    }
    return [
      t('Подготовка поверхности', 'Бетти даярдоо', lang),
      t('Грунтование', 'Грунтоо', lang),
      t('Финишная отделка', 'Акыркы иштетүү', lang),
    ];
  }

  return seq;
}

// ── Основная функция генерации рекомендаций ───────────────────────────────────

export function generateRecommendations(input: RecommendationInput): SmartRecommendation[] {
  const { roomType, surfaceType, repairLevel, budget, totalPrice, area, categories, materialNames, budgetOptimizations, lang = 'ru' } = input;
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
        title: t('Превышение бюджета', 'Бюджет ашуу', lang),
        description: t(
          `Смета превышает бюджет на ${Math.round(overage).toLocaleString('ru-RU')} сом (${usedPercent}% от бюджета). Рекомендуем рассмотреть более доступные аналоги материалов или снизить уровень ремонта до «Стандарт».`,
          `Смета бюджеттен ${Math.round(overage).toLocaleString('ru-RU')} сомго (${usedPercent}%) ашат. Материалдардын арзаныраак аналогдорун же «Стандарт» деңгеелин карашыңызды сунуштайбыз.`,
          lang,
        ),
        priority: 'high',
      });
    } else {
      const remaining = budget - totalPrice;
      const tip = usedPercent <= 70
        ? t(
            ' Оставшиеся средства можно направить на улучшение качества отдельных материалов или приобретение дополнительных инструментов.',
            ' Калган каражаттарды айрым материалдардын сапатын жакшыртууга же кошумча куралдар сатып алууга жумшаса болот.',
            lang,
          )
        : '';
      recs.push({
        type: 'success',
        title: t('Бюджет соблюдён', 'Бюджет сакталды', lang),
        description: t(
          `Смета укладывается в бюджет. Остаток: ${Math.round(remaining).toLocaleString('ru-RU')} сом (${100 - usedPercent}%).${tip}`,
          `Смета бюджетке сыяды. Калдык: ${Math.round(remaining).toLocaleString('ru-RU')} сом (${100 - usedPercent}%).${tip}`,
          lang,
        ),
        priority: 'high',
      });
    }
  }

  // ── 2. Рекомендации по экономии ───────────────────────────────────────────
  if (budgetOptimizations.length > 0) {
    const totalSavings = budgetOptimizations.reduce((s, o) => s + o.savings, 0);
    const top = budgetOptimizations[0];
    const extra = budgetOptimizations.length > 1
      ? t(
          ` Ещё ${budgetOptimizations.length - 1} варианта замены доступны в блоке «Оптимизация бюджета».`,
          ` Дагы ${budgetOptimizations.length - 1} алмаштыруу варианты «Бюджетти оптималдаштыруу» бөлүмүндө бар.`,
          lang,
        )
      : '';
    recs.push({
      type: 'saving',
      title: t(
        `Возможная экономия: ${Math.round(totalSavings).toLocaleString('ru-RU')} сом`,
        `Мүмкүн болгон үнөмдөө: ${Math.round(totalSavings).toLocaleString('ru-RU')} сом`,
        lang,
      ),
      description: t(
        `Можно заменить «${top.currentMaterial}» на более доступный аналог «${top.alternativeMaterial}» и сэкономить ${Math.round(top.savings).toLocaleString('ru-RU')} сом (−${top.savingsPercent}%).${extra}`,
        `«${top.currentMaterial}» ордуна арзаныраак «${top.alternativeMaterial}» колдонуп, ${Math.round(top.savings).toLocaleString('ru-RU')} сом (−${top.savingsPercent}%) үнөмдөсө болот.${extra}`,
        lang,
      ),
      priority: 'medium',
    });
  }

  // ── 3. Анализ типа помещения ──────────────────────────────────────────────
  if (roomType === 'bathroom') {
    const isWaterproof = hasName('влаго', 'водост', 'ванн') || hasCat('плитк', 'керамик', 'гидро');
    if (!isWaterproof) {
      recs.push({
        type: 'warning',
        title: t('Ванная: влагостойкие материалы', 'Ванна: суу өткөрбөс материалдар', lang),
        description: t(
          'В смете не обнаружены влагостойкие материалы. Для ванной комнаты обязательны покрытия с водозащитой — плитка, влагостойкая краска или гидроизоляция. Обычные материалы быстро придут в негодность.',
          'Сметада суу өткөрбөс материалдар табылган жок. Ванна бөлмөсү үчүн суу коргоочу жабуулар — плитка, суу өткөрбөс боёк же гидроизоляция — милдеттүү. Жөнөкөй материалдар тез бузулат.',
          lang,
        ),
        priority: 'high',
      });
    } else {
      recs.push({
        type: 'info',
        title: t('Ванная: дополнительные советы', 'Ванна: кошумча кеңештер', lang),
        description: t(
          'Для ванной комнаты также рекомендуем обработать швы противогрибковой затиркой и использовать влагостойкий грунт перед укладкой плитки.',
          'Ванна бөлмөсү үчүн тиктерди козу кор каршы затирка менен иштетүүнү жана плитка төшөөдөн мурун суу өткөрбөс грунт колдонууну да сунуштайбыз.',
          lang,
        ),
        priority: 'low',
      });
    }
  }

  if (roomType === 'bedroom') {
    recs.push({
      type: 'info',
      title: t('Спальня: экологичность материалов', 'Жаткан бөлмө: экологиялык материалдар', lang),
      description: t(
        'Для спальни рекомендуются материалы с низким содержанием летучих органических соединений (VOC). Отдавайте предпочтение водоэмульсионным краскам и натуральным покрытиям без резкого запаха.',
        'Жаткан бөлмө үчүн учуучу органикалык бирикмелери (VOC) аз материалдар сунушталат. Суу-эмульсиялык боёктор менен жыты жок табигый жабууларды тандаңыз.',
        lang,
      ),
      priority: 'medium',
    });
  }

  if (roomType === 'kitchen') {
    const hasKitchenMat = hasName('моющ', 'износ', 'кухн') || hasCat('плитк', 'керамик');
    if (!hasKitchenMat) {
      recs.push({
        type: 'info',
        title: t('Кухня: износостойкие покрытия', 'Ашкана: чыдамдуу жабуулар', lang),
        description: t(
          'Для кухни рекомендуются покрытия с повышенной стойкостью к влаге, жировым загрязнениям и механическому воздействию. Отдавайте предпочтение моющимся краскам класса не ниже «Полуматовая» или керамической плитке.',
          'Ашкана үчүн нымга, майлуу кирге жана механикалык таасирге туруктуу жабуулар сунушталат. «Жарым-жылтыр» классынан төмөн эмес жуулуучу боёктор же керамикалык плитканы тандаңыз.',
          lang,
        ),
        priority: 'medium',
      });
    }
  }

  if (roomType === 'living_room') {
    recs.push({
      type: 'info',
      title: t('Гостиная: декоративные акценты', 'Мейманкана: декоративдик акценттер', lang),
      description: t(
        'В гостиной можно использовать декоративные покрытия (фактурная штукатурка, обои под покраску) для создания выразительного интерьера без значительного увеличения бюджета.',
        'Мейманканада бюджетти кыйла көбөйтпөстөн, көркөм интерьер түзүү үчүн декоративдик жабуулар (текстуралуу шыбоо, боёого арналган обой) колдонсо болот.',
        lang,
      ),
      priority: 'low',
    });
  }

  // ── 4. Анализ уровня ремонта ──────────────────────────────────────────────
  if (repairLevel === 'economy') {
    recs.push({
      type: 'info',
      title: t('Эконом-ремонт: срок службы', 'Эконом-ремонт: кызмат мөөнөтү', lang),
      description: t(
        'Эконом-материалы могут потребовать повторного ремонта через 3–5 лет. Рассмотрите использование материалов среднего сегмента для ключевых поверхностей — это повысит долговечность покрытия.',
        'Эконом-материалдар 3–5 жылдан кийин кайра ремонт талап кылышы мүмкүн. Негизги беттер үчүн орто сегменттеги материалдарды карашыңызды сунуштайбыз — бул жабуунун бекемдигин жогорулатат.',
        lang,
      ),
      priority: 'low',
    });
  }

  if (repairLevel === 'premium') {
    recs.push({
      type: 'success',
      title: t('Премиум-ремонт: высокое качество', 'Премиум-ремонт: жогорку сапат', lang),
      description: t(
        'Выбранный уровень ремонта предполагает использование качественных и долговечных материалов. При правильной подготовке поверхности такое покрытие прослужит 15–20 лет.',
        'Тандалган ремонт деңгээли сапаттуу жана бекем материалдарды колдонууну болжолдойт. Бетти туура даярдаганда мындай жабуу 15–20 жыл кызмат кылат.',
        lang,
      ),
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
        title: t('Отсутствует грунтовка', 'Грунт жок', lang),
        description: t(
          'В смете не обнаружена грунтовка. Грунтование поверхности улучшает адгезию материалов, снижает расход краски и шпаклёвки, а также предотвращает появление плесени и отслоений.',
          'Сметада грунт табылган жок. Бетти грунтоо материалдардын адгезиясын жакшыртат, боёк жана шпаклевканын чыгымын азайтат, ошондой эле калып жана кабыланып кетүүнүн алдын алат.',
          lang,
        ),
        priority: 'high',
      });
    }
  }

  // ── 6. Анализ площади помещения ───────────────────────────────────────────
  if (area > 30) {
    recs.push({
      type: 'info',
      title: t('Большая площадь: оптимизация расхода', 'Чоң аянт: чыгымды оптималдаштыруу', lang),
      description: t(
        `Площадь помещения ${area.toFixed(1)} м². Обратите внимание на материалы с меньшим расходом на м² — это позволит сократить затраты. Также рассмотрите оптовые закупки для получения скидки у поставщика.`,
        `Бөлмөнүн аянты ${area.toFixed(1)} м². М² га чыгымы аз материалдарга көңүл буруңуз — бул чыгымды кыскартат. Ошондой эле жеткирүүчүдөн арзандатуу алуу үчүн көтөрмө сатып алууну карашыңызды сунуштайбыз.`,
        lang,
      ),
      priority: 'low',
    });
  } else if (area < 10) {
    recs.push({
      type: 'info',
      title: t('Небольшая площадь: ставка на качество', 'Кичине аянт: сапатка басым', lang),
      description: t(
        `Площадь помещения ${area.toFixed(1)} м². При небольших объёмах разница в стоимости между эконом и premium незначительна. Рассмотрите более качественные материалы — итоговая цена вырастет незначительно.`,
        `Бөлмөнүн аянты ${area.toFixed(1)} м². Кичине көлөмдөрдө эконом менен премиумдун баасынын айырмасы анча чоң эмес. Сапаттуураак материалдарды карашыңызды сунуштайбыз — жалпы баасы анча жогорулабайт.`,
        lang,
      ),
      priority: 'low',
    });
  }

  // ── 7. Проверка совместимости (дополнительная подсказка) ──────────────────
  const hasShpaklevka = hasCat('шпаклёвк', 'шпаклевк') || hasName('шпаклёвк', 'шпаклевк');
  const hasPaint = hasCat('краск', 'эмал') || hasName('краск', 'эмал');
  if (hasPaint && !hasShpaklevka && surfaceType !== 'floor') {
    recs.push({
      type: 'info',
      title: t('Рекомендуется шпаклевание перед покраской', 'Боёоодон мурун шпаклевание сунушталат', lang),
      description: t(
        'Перед нанесением краски желательно выполнить шпаклевание поверхности — это обеспечит гладкое покрытие и уменьшит расход краски на 15–20%.',
        'Боёок жагуудан мурун бетти шпаклевалоо сунушталат — бул жылмакай жабууну камсыз кылат жана боёктун чыгымын 15–20% га азайтат.',
        lang,
      ),
      priority: 'medium',
    });
  }

  // ── 8. Последовательность выполнения работ ────────────────────────────────
  const workSteps = buildWorkSequence(categories, surfaceType, lang);
  if (workSteps.length > 0) {
    recs.push({
      type: 'info',
      title: t('Рекомендуемая последовательность работ', 'Сунушталган иш аткаруу тартиби', lang),
      description: workSteps.map((s, i) => `${i + 1}. ${s}`).join('  '),
      priority: 'low',
    });
  }

  // ── Сортировка: high → medium → low ──────────────────────────────────────
  const ORDER: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

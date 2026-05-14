# BuildCalc AI

![BuildCalc AI](https://img.shields.io/badge/BuildCalc-AI-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🚀 О проекте

**BuildCalc AI** — современная информационная система автоматизации подбора строительных и отделочных материалов для ремонта помещений.

### ✨ Основные возможности

- 🧮 **Автоматический расчет материалов** — точный расчет с учетом коэффициентов запаса
- 💰 **Учет бюджета** — подбор материалов в рамках заданного бюджета
- 🔍 **Проверка совместимости** — автоматическая проверка технологической совместимости
- 💡 **Рекомендации альтернатив** — умные предложения для оптимизации бюджета
- 📊 **Генерация сметы** — формирование профессиональной сметы
- 📜 **История расчетов** — сохранение и доступ к предыдущим расчетам
- 🎯 **Несколько вариантов** — получение нескольких вариантов подбора
- 🏠 **Типы помещений** — поддержка различных типов помещений

## 🛠 Технологический стек

- **Frontend**: Next.js 16.2, React 19.2, TypeScript 5
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL + Prisma ORM
- **Fonts**: Geist Sans & Geist Mono

## 📦 Установка и запуск

### Требования

- Node.js 20+
- npm или yarn
- PostgreSQL

### Шаги установки

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd build-calc
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте базу данных**

Создайте файл `.env` в корне проекта:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/buildcalc"
```

4. **Примените миграции**
```bash
npx prisma migrate dev
```

5. **Запустите dev сервер**
```bash
npm run dev
```

6. **Откройте браузер**
```
http://localhost:3000
```

## 📁 Структура проекта

```
build-calc/
├── app/
│   ├── components/          # React компоненты
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── MaterialsSection.tsx
│   │   ├── StatisticsSection.tsx
│   │   ├── BenefitsSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── Footer.tsx
│   ├── globals.css          # Глобальные стили
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Главная страница
├── prisma/
│   └── schema.prisma        # Схема базы данных
├── public/                  # Статические файлы
└── package.json
```

## 🎨 Дизайн

Landing page выполнен в современном premium стиле:

- ✅ Minimal UI & Clean Design
- ✅ Premium SaaS Style
- ✅ Glassmorphism эффекты
- ✅ Светлая цветовая схема
- ✅ Мягкие тени и rounded corners
- ✅ Плавные анимации
- ✅ Адаптивность (mobile/tablet/desktop)
- ✅ Стиль уровня Stripe / Linear / Notion / Vercel

## 📄 Секции Landing Page

1. **Hero Section** — главный экран с CTA и dashboard preview
2. **Features Section** — карточки возможностей системы
3. **How It Works** — пошаговый процесс работы (timeline)
4. **Materials Section** — каталог популярных материалов
5. **Statistics Section** — анимированная статистика
6. **Benefits Section** — преимущества системы
7. **Testimonials** — отзывы пользователей
8. **FAQ Section** — часто задаваемые вопросы (accordion)
9. **Footer** — навигация, контакты, social links

## 🚀 Команды

```bash
# Разработка
npm run dev

# Сборка для production
npm run build

# Запуск production сервера
npm start

# Линтинг
npm run lint

# Prisma Studio (GUI для БД)
npx prisma studio
```

## 📊 База данных

Проект использует PostgreSQL с Prisma ORM. Схема включает:

- Users (пользователи)
- Materials (материалы)
- Categories (категории)
- Calculations (расчеты)
- Projects (проекты)

## 🔐 Безопасность

- Аутентификация и авторизация пользователей
- Разграничение прав доступа (пользователь/администратор)
- Защита персональных данных
- Безопасное хранение паролей

## 📈 Производительность

- Время отклика < 2-3 секунд
- Поддержка до 100 одновременных пользователей
- Доступность 99%+
- Оптимизированные изображения и шрифты

## 🤝 Вклад в проект

Проект разработан в рамках выпускной квалификационной работы:

**Выпускник**: Кадыров А.Т., группа ПИ(б)-2-22  
**Руководитель**: ст. преп. Сабаева К.К.  
**Руководитель направления**: профессор, к.т.н. Тен И.Г.

**Учебное заведение**:  
Кыргызский Государственный Технический Университет им. И.Раззакова  
Институт Информационных Технологий  
Кафедра «Программное обеспечение компьютерных систем»

## 📝 Лицензия

© 2026 BuildCalc AI. Все права защищены.

## 📞 Контакты

Для вопросов и предложений:
- Email: support@buildcalc.ai
- Telegram: @buildcalc_support

---

**Сделано с ❤️ в Бишкеке, Кыргызстан**

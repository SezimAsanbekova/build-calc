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
- 🔐 **Аутентификация** — регистрация/вход через email или Google

### 🔑 Система аутентификации

Реализована полная система аутентификации с использованием NextAuth.js v5:

**Возможности:**
- ✅ Регистрация с email и паролем
- ✅ Вход с email и паролем
- ✅ OAuth через Google
- ✅ Автоматическое сохранение сессии в cookies
- ✅ Защищенные маршруты (dashboard, profile, calculations)
- ✅ Middleware для автоматической проверки авторизации
- ✅ Адаптивный Navbar с меню пользователя

**Маршруты:**
- `/login` — страница входа
- `/register` — страница регистрации
- `/dashboard` — панель управления (защищенный маршрут)
- `/api/auth/*` — API endpoints для аутентификации

## 🛠 Технологический стек

- **Frontend**: Next.js 16.2, React 19.2, TypeScript 5
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 (OAuth + Credentials)
- **Security**: bcryptjs, jose (JWT)
- **Icons**: Lucide React
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
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (опционально)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
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

## 🛡 Настройка панели администратора

Панель администратора использует двухфакторную аутентификацию через Telegram.

### Шаги настройки

1. **Создайте Telegram-бота** через [@BotFather](https://t.me/BotFather) и получите токен.

2. **Узнайте свой Telegram User ID** — напишите боту [@userinfobot](https://t.me/userinfobot).

3. **Запустите диалог с вашим ботом** (нажмите /start), иначе бот не сможет отправить сообщение.

4. **Добавьте настройки в таблицу `settings` базы данных:**

```sql
INSERT INTO settings (id, key, value, updated_at) VALUES
  (gen_random_uuid(), 'ADMIN_TELEGRAM_BOT_TOKEN', 'ВАШ_ТОКЕН_БОТА', now()),
  (gen_random_uuid(), 'ADMIN_TELEGRAM_USER_ID',   'ВАШ_TELEGRAM_ID', now());
```

5. **Назначьте пользователя администратором:**

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

6. **Войдите в панель** по адресу `/admin/login`.

### Маршруты администратора

| Маршрут | Описание |
|---------|----------|
| `/admin/login` | Страница входа (email + пароль) |
| `/admin/verify-code` | Ввод Telegram-кода |
| `/admin/dashboard` | Панель управления |
| `/api/admin/login` | API: шаг 1 — проверка credentials |
| `/api/admin/verify-code` | API: шаг 2 — проверка кода |
| `/api/admin/logout` | API: выход |

### Разграничение доступа

- Обычные пользователи **не могут** зайти на `/admin/*`
- Администраторы **не могут** зайти на `/dashboard`, `/profile`
- Авторизованный администратор автоматически перенаправляется с `/admin/login` на `/admin/dashboard`

---

## 📦 Настройка AWS S3 для хранения изображений

Система использует AWS S3 для хранения изображений материалов и аватаров пользователей.

### Шаги настройки

1. **Создайте AWS аккаунт** на [aws.amazon.com](https://aws.amazon.com/)

2. **Создайте S3 bucket:**
   - Откройте [S3 Console](https://s3.console.aws.amazon.com/)
   - Нажмите "Create bucket"
   - Имя: `buildcalc-materials` (или любое уникальное)
   - Region: выберите ближайший регион (например, `us-east-1`)
   - Снимите галочку "Block all public access" (нужен публичный доступ к изображениям)
   - Нажмите "Create bucket"

3. **Настройте CORS для bucket:**
   - Откройте созданный bucket
   - Перейдите в "Permissions" → "CORS"
   - Добавьте конфигурацию:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

4. **Создайте IAM пользователя:**
   - Откройте [IAM Console](https://console.aws.amazon.com/iam/)
   - Users → Add users
   - Имя: `buildcalc-s3-uploader`
   - Access type: "Programmatic access"
   - Permissions: "Attach existing policies directly" → `AmazonS3FullAccess`
   - Сохраните **Access Key ID** и **Secret Access Key**

5. **Добавьте настройки в `.env`:**
   ```env
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="ваш-access-key-id"
   AWS_SECRET_ACCESS_KEY="ваш-secret-access-key"
   AWS_S3_BUCKET_NAME="buildcalc-materials"
   AWS_S3_PUBLIC_URL="https://buildcalc-materials.s3.amazonaws.com"
   ```

6. **Перезапустите сервер:**
   ```bash
   npm run dev
   ```

### Использование

После настройки в админ-панели при добавлении/редактировании материала:
- Нажмите кнопку "Загрузить изображение"
- Выберите файл (JPG, PNG, WEBP, макс 5MB)
- Изображение автоматически загрузится в S3
- URL изображения сохранится в базе данных

---

## 🔐 Настройка Google OAuth

Для включения входа через Google:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Перейдите в "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Настройте OAuth consent screen
6. Добавьте Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (для разработки)
   - `https://yourdomain.com/api/auth/callback/google` (для production)
7. Скопируйте Client ID и Client Secret в `.env`

## 📁 Структура проекта

```
build-calc/
├── app/
│   ├── (auth)/              # Страницы аутентификации
│   │   ├── login/
│   │   │   └── page.tsx     # Страница входа
│   │   └── register/
│   │       └── page.tsx     # Страница регистрации
│   ├── api/
│   │   └── auth/            # API маршруты аутентификации
│   │       ├── [...nextauth]/
│   │       │   └── route.ts # NextAuth handler
│   │       ├── login/
│   │       │   └── route.ts # API входа
│   │       ├── register/
│   │       │   └── route.ts # API регистрации
│   │       ├── logout/
│   │       │   └── route.ts # API выхода
│   │       └── me/
│   │           └── route.ts # Получение текущего пользователя
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
│   ├── dashboard/
│   │   └── page.tsx         # Панель управления
│   ├── globals.css          # Глобальные стили
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Главная страница
│   └── providers.tsx        # NextAuth SessionProvider
├── lib/
│   ├── auth.ts              # Утилиты аутентификации
│   └── prisma.ts            # Prisma клиент
├── prisma/
│   └── schema.prisma        # Схема базы данных
├── types/
│   └── next-auth.d.ts       # TypeScript типы для NextAuth
├── public/                  # Статические файлы
├── auth.ts                  # Конфигурация NextAuth
├── middleware.ts            # Middleware для защиты маршрутов
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

# Генерация Prisma Client
npx prisma generate

# Применение миграций
npx prisma migrate dev
```

## 🎯 Быстрый старт

1. **Установите зависимости**: `npm install`
2. **Настройте `.env`** с DATABASE_URL и NEXTAUTH_SECRET
3. **Примените миграции**: `npx prisma migrate dev`
4. **Запустите dev сервер**: `npm run dev`
5. **Откройте** http://localhost:3000
6. **Зарегистрируйтесь** на `/register` или войдите на `/login`
7. **Перейдите в dashboard** на `/dashboard`

## 📊 База данных

Проект использует PostgreSQL с Prisma ORM. Схема включает:

- Users (пользователи)
- Materials (материалы)
- Categories (категории)
- Calculations (расчеты)
- Projects (проекты)

## 🔐 Безопасность

- ✅ Аутентификация через NextAuth.js v5
- ✅ Поддержка обычной регистрации/входа
- ✅ OAuth через Google
- ✅ JWT токены с httpOnly cookies
- ✅ Хеширование паролей (bcrypt)
- ✅ Middleware для защиты маршрутов
- ✅ Разграничение прав доступа (пользователь/администратор)
- ✅ Защита персональных данных
- ✅ Безопасное хранение паролей

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

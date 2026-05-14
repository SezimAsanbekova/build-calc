#!/bin/bash

echo "🚀 BuildCalc AI - Быстрый старт"
echo "================================"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 20+ с https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"
echo ""

# Проверка .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создайте его на основе .env.example"
    echo "   cp .env.example .env"
    echo ""
fi

# Запуск dev сервера
echo "🚀 Запуск dev сервера..."
echo "   Откройте http://localhost:3000 в браузере"
echo ""
npm run dev

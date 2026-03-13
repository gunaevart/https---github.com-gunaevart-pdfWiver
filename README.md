# PDF Image Injector

Веб-приложение для добавления изображений в PDF файлы прямо в браузере.

## Возможности

- 📤 Загрузка PDF файлов (Drag & Drop)
- 🖼️ Добавление изображений (PNG, JPG)
- 🎯 Перетаскивание и изменение размера изображений
- 📄 Навигация по страницам
- 🗑️ Удаление страниц
- 🔀 Объединение нескольких PDF файлов
- 💾 Сохранение результата с изображениями
- 🔒 Вся обработка происходит в браузере (без загрузки на сервер)

## Технологии

- **React** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборка проекта
- **Tailwind CSS** - Стилизация
- **pdfjs-dist** - Отображение PDF
- **pdf-lib** - Редактирование PDF
- **Zustand** - Управление состоянием
- **Lucide React** - Иконки

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

## Сборка

```bash
npm run build
```

## Деплой на Render.com

1. Загрузите репозиторий на GitHub
2. Подключите репозиторий в Render.com
3. Выберите шаблон "Static Site"
4. Параметры сборки:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

## Структура проекта

```
pdfEditor/
├── public/          # Статические файлы
├── src/
│   ├── components/  # React компоненты
│   ├── store/       # Zustand store
│   ├── App.tsx      # Главный компонент
│   └── main.tsx     # Точка входа
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Лицензия

MIT

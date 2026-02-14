# Telegram Mini App: Трекер привычек

Мини-приложение для ежедневного отслеживания привычек внутри Telegram.
Интерфейс выполнен в стиле Liquid Glass (iOS 26) — стеклянные поверхности, плавные анимации, вертикальный mobile-first макет.

| Компонент | Технологии |
|-----------|-----------|
| `apps/web` | React 18, TypeScript, Vite, Zustand, CSS (Liquid Glass) |
| `apps/bot` | grammY, Node.js, TypeScript |
| Деплой | Render (Static Site + Background Worker) |

## Структура проекта

```
.
├── apps/
│   ├── web/                  # Фронтенд (Telegram Mini App)
│   │   ├── src/
│   │   │   ├── components/   # UI-компоненты
│   │   │   ├── routes/       # Страницы (TrackerPage, ManageHabitsPage)
│   │   │   ├── lib/          # Утилиты, стор, типы, Telegram API
│   │   │   ├── styles.css    # Liquid Glass дизайн-система
│   │   │   ├── App.tsx       # Роутер
│   │   │   └── main.tsx      # Точка входа
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── bot/                  # Telegram-бот
│       ├── src/index.ts      # Команды /start, /app, /help
│       └── package.json
├── render.yaml               # Render Blueprint (авто-деплой)
├── pnpm-workspace.yaml
├── .env.example
├── task_description.md       # Полное ТЗ
└── README.md
```

## Требования

- **Node.js** 20+
- **pnpm** 9+ (включается через `corepack`)

## Переменные окружения

Создайте файл `.env` в корне проекта по образцу `.env.example`:

```env
# Фронтенд
VITE_APP_VERSION=1.0.0

# Бот
BOT_TOKEN=<токен от BotFather>
WEB_APP_URL=<публичный HTTPS-адрес фронтенда>
```

| Переменная | Где используется | Описание |
|------------|-----------------|----------|
| `VITE_APP_VERSION` | `apps/web` | Версия, отображаемая в «О приложении» |
| `BOT_TOKEN` | `apps/bot` | Токен Telegram-бота (получить через BotFather) |
| `WEB_APP_URL` | `apps/bot` | Публичный HTTPS URL фронтенда |

## Локальный запуск

### 1. Установка зависимостей

```bash
corepack enable
corepack prepare pnpm@9.15.2 --activate
pnpm install
```

### 2. Запуск фронтенда

```bash
pnpm dev:web
```

Vite поднимет dev-сервер на `http://localhost:5173`.

### 3. Запуск бота

```bash
pnpm dev:bot
```

Бот запустится в режиме long-polling и будет слушать команды.

### 4. HTTPS-туннель для Telegram

Telegram Mini App требует HTTPS. Для локальной разработки используйте туннель:

```bash
# cloudflared
cloudflared tunnel --url http://localhost:5173

# или ngrok
ngrok http 5173
```

Полученный HTTPS URL укажите в переменной `WEB_APP_URL` и перезапустите бота.

### 5. Запуск всего одной командой

```bash
pnpm dev
```

Запускает и фронтенд, и бота параллельно.

### Все доступные команды

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Фронтенд + бот параллельно |
| `pnpm dev:web` | Только фронтенд (Vite, порт 5173) |
| `pnpm dev:bot` | Только бот (tsx watch) |
| `pnpm build` | Сборка обоих проектов |
| `pnpm typecheck` | Проверка типов TypeScript |

## Деплой на Render

### Вариант 1: Blueprint (рекомендуется)

Файл `render.yaml` описывает оба сервиса и позволяет развернуть их автоматически.

1. Запушьте репозиторий на GitHub.

2. В [Render Dashboard](https://dashboard.render.com) нажмите **New +** → **Blueprint**.

3. Выберите репозиторий — Render создаст два сервиса:

   | Сервис | Тип | Что делает |
   |--------|-----|-----------|
   | `habit-tracker-web` | Static Site | Фронтенд Mini App |
   | `habit-tracker-bot` | Background Worker | Telegram-бот |

4. Задайте переменные окружения в воркере `habit-tracker-bot`:

   - `BOT_TOKEN` — токен Telegram-бота
   - `WEB_APP_URL` — URL статического сайта из Render (вида `https://habit-tracker-web.onrender.com`)

5. Дождитесь завершения деплоя обоих сервисов.

### Вариант 2: ручная настройка

#### Фронтенд (Static Site)

1. В Render: **New +** → **Static Site**.
2. Укажите репозиторий и ветку.
3. Параметры:

   | Поле | Значение |
   |------|----------|
   | Root Directory | `.` (корень) |
   | Build Command | `corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm install --no-frozen-lockfile && pnpm --filter web build` |
   | Publish Directory | `apps/web/dist` |

4. Добавьте rewrite-правило: `/*` → `/index.html` (для SPA-роутинга).
5. Добавьте переменную окружения `VITE_APP_VERSION=1.0.0`.

#### Бот (Background Worker)

1. В Render: **New +** → **Background Worker**.
2. Укажите тот же репозиторий и ветку.
3. Параметры:

   | Поле | Значение |
   |------|----------|
   | Root Directory | `.` (корень) |
   | Environment | Node |
   | Build Command | `corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm install --no-frozen-lockfile && pnpm --filter bot build` |
   | Start Command | `pnpm --filter bot start` |

4. Добавьте переменные окружения:
   - `BOT_TOKEN` — токен бота
   - `WEB_APP_URL` — URL фронтенда из предыдущего шага

## Настройка Telegram-бота

### Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. Отправьте `/newbot`, следуйте инструкциям.
3. Скопируйте полученный токен в `BOT_TOKEN`.

### Настройка Menu Button

Чтобы Mini App открывалось по кнопке в чате:

1. Откройте BotFather.
2. Отправьте `/setmenubutton`.
3. Выберите бота.
4. Укажите HTTPS URL фронтенда.
5. Задайте подпись: `Открыть трекер`.

### Проверка

- `/start` — бот отправляет сообщение с inline-кнопкой `Открыть трекер`, которая открывает Mini App.
- `/app` — повторно отправляет кнопку.
- `/help` — список команд.

## Чеклист после деплоя

- [ ] Mini App открывается из `/start` и через Menu Button
- [ ] Корректная тема и высота WebView в iOS и Android Telegram
- [ ] Добавление, переименование, архивирование и удаление привычек работает
- [ ] Чекбоксы обновляют график
- [ ] Данные сохраняются между запусками (CloudStorage)
- [ ] При недоступном CloudStorage отображается fallback-баннер
- [ ] Шрифт Inter загружается (CSP разрешает `fonts.googleapis.com` и `fonts.gstatic.com`)

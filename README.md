# Telegram Mini App: Трекер привычек

Полная реализация MVP из `task_description.md`:
- `apps/web` — Telegram Mini App (React + TypeScript + Vite)
- `apps/bot` — Telegram бот (grammY), который открывает Web App кнопкой
- `render.yaml` — автодеплой фронтенда и бота на Render

## Что реализовано

- Главный экран:
- Список привычек с чекбоксами для выбранного дня
- График прогресса по неделе (7 точек, интерактивный)
- Нижняя навигация по дням недели
- Drawer-меню: управление, переключение недель, сброс дня, справка, о приложении

- Управление привычками (`/manage`):
- Добавление
- Переименование
- Архив / разархив
- Удаление (с подтверждением)
- Reorder активных привычек через drag&drop

- Данные и устойчивость:
- Хранение в `Telegram.WebApp.CloudStorage`
- Fallback в `localStorage`, если CloudStorage недоступен
- Ретраи + таймауты при сохранении
- Валидация схемы через Zod
- Поддержка `schema_version`
- Read-only режим при невозможной миграции

- Telegram интеграция:
- `Telegram.WebApp.ready()` + `expand()`
- Реакция на `themeChanged`
- Поддержка `MainButton` и `BackButton`

## Production URL

- Mini App URL (после деплоя на Render): `https://<your-render-static-site>.onrender.com`

## Структура проекта

```text
.
├─ apps/
│  ├─ web/
│  └─ bot/
├─ render.yaml
├─ .env.example
└─ README.md
```

## Локальный запуск

Требования:
- Node.js 20+
- pnpm 9+

1. Установить зависимости:

```bash
corepack enable
corepack prepare pnpm@9.15.2 --activate
pnpm install
```

2. Создать `.env` в корне по примеру `.env.example`:

```env
VITE_APP_VERSION=1.0.0
BOT_TOKEN=...
WEB_APP_URL=https://<your-domain>
```

3. Запустить фронтенд:

```bash
pnpm dev:web
```

4. Запустить бота:

```bash
pnpm dev:bot
```

5. Для Telegram нужен HTTPS URL фронтенда. Локально используйте туннель:

```bash
# пример с cloudflared
cloudflared tunnel --url http://localhost:5173
```

Полученный URL укажите в `WEB_APP_URL` для бота.

## Деплой на Render

### Вариант 1: через Blueprint (`render.yaml`)

1. Запушьте репозиторий в GitHub.
2. В Render: `New +` -> `Blueprint`.
3. Выберите репозиторий — Render поднимет:
- `habit-tracker-web` (static site)
- `habit-tracker-bot` (worker)
4. В worker задайте env:
- `BOT_TOKEN`
- `WEB_APP_URL` = URL статического сайта Render
5. Дождитесь деплоя.

### Вариант 2: руками

1. Создайте `Static Site` для `apps/web`.
2. Build command:

```bash
corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm install --no-frozen-lockfile && pnpm --filter web build
```

3. Publish dir: `apps/web/dist`.
4. Добавьте rewrite `/* -> /index.html`.
5. Создайте `Background Worker` для `apps/bot`.
6. Build command:

```bash
corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm install --no-frozen-lockfile && pnpm --filter bot build
```

7. Start command:

```bash
pnpm --filter bot start
```

8. Добавьте env:
- `BOT_TOKEN`
- `WEB_APP_URL` (URL вашего сайта из шага 1)

## Подключение к Telegram-боту

1. Создайте бота в BotFather:
- команда `/newbot`
- получите токен

2. Запишите токен в `BOT_TOKEN` (локально/на Render).

3. Настройте menu button:
- BotFather -> `/setmenubutton`
- выберите бота
- укажите URL вашего фронтенда (`https://...`)
- подпись кнопки: `Открыть трекер`

4. Проверьте `/start`:
- бот отправляет сообщение `Откройте трекер привычек`
- inline кнопка `web_app` открывает мини-приложение

5. Опционально: deep link запуска mini app:
- `https://t.me/<bot_username>?startapp=tracker`

## Команды

```bash
pnpm dev
pnpm dev:web
pnpm dev:bot
pnpm build
pnpm typecheck
```

## Переменные окружения

- `VITE_APP_VERSION` — версия UI
- `BOT_TOKEN` — Telegram bot token
- `WEB_APP_URL` — публичный HTTPS URL mini app

## Post-deploy checklist

- Мини-приложение открывается из `/start` и через menu button
- В iOS/Android Telegram корректная тема и высота WebView
- Добавление/переименование/архив/удаление привычек работает
- Чекбоксы обновляют график
- Данные сохраняются после перезапуска
- При недоступном CloudStorage есть fallback-баннер

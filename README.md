# AURA Wellness Studio — Telegram-бот (Cloudflare Workers)

Демонстрационный Telegram-бот студии **AURA Wellness Studio**: услуги, специалисты,
акции, отзывы, FAQ, многошаговая запись с уведомлением администратора.

Стек: **TypeScript + Cloudflare Workers + Telegram Bot API (fetch)**, webhook `/webhook`,
состояние пользователей в **Cloudflare KV** (`BOT_STATE`).

## 0. Что понадобится

- Аккаунт Cloudflare, установленный Node.js 18+.
- Telegram-бот (токен от [@BotFather](https://t.me/BotFather)).
- Приватная группа администраторов (бот должен быть её участником с правом писать сообщения).

## 1. Установка зависимостей

```bash
cd aura-wellness-bot
npm install
```

## 2. Вход в Cloudflare (Wrangler)

```bash
npx wrangler login
```

Браузер попросит подтвердить доступ Wrangler к вашему аккаунту Cloudflare.

## 3. Создать KV namespace

```bash
npx wrangler kv namespace create BOT_STATE
npx wrangler kv namespace create BOT_STATE --preview
```

Wrangler выведет два `id`. Вставьте их в `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  { "binding": "BOT_STATE", "id": "<id>", "preview_id": "<preview-id>" }
]
```

## 4. Привязать KV

Привязка уже описана в `wrangler.jsonc` (binding `BOT_STATE`) — после шага 3
достаточно подставить `id`. Отдельных действий не требуется.

## 5. Добавить BOT_TOKEN

```bash
npx wrangler secret put BOT_TOKEN
```

Вставьте токен бота (выдаёт BotFather). Значение хранится в секретах воркера
и никогда не попадает в код.

## 6. Добавить ADMIN_CHAT_ID

Сначала узнайте ID группы администраторов:

1. Добавьте бота в приватную группу администраторов.
2. Задеплойте воркер (шаг 8) и установите webhook (шаг 10).
3. Отправьте боту команду `/chatid` — он ответит текущим `chat.id`.
4. Для группы отправьте `/chatid` прямо в группе (бот увидит команду, т.к. команды
   боту доставляются даже при включённом privacy mode; читать обычные сообщения
   группы ему не нужно).

Затем сохраните значение:

```bash
npx wrangler secret put ADMIN_CHAT_ID
```

## 7. Добавить WEBHOOK_SECRET

Придумайте длинную случайную строку (минимум 16 символов):

```bash
npx wrangler secret put WEBHOOK_SECRET
```

Тот же секрет используется при установке webhook (шаг 10) — Telegram будет
присылать его в заголовке `X-Telegram-Bot-Api-Secret-Token`.

## 8. Deploy Worker

```bash
npm run deploy
```

Wrangler выведет URL вида `https://aura-wellness-bot.<ваш-аккаунт>.workers.dev`.
Сохраните его как `WORKER_URL`.

## 9. Получить workers.dev URL

URL показывается в выводе `npm run deploy` и в дашборде
Cloudflare → Workers & Pages → `aura-wellness-bot`.

## 10. Установить Telegram webhook

Заполните `.dev.vars` по образцу `.dev.vars.example`
(`BOT_TOKEN`, `WEBHOOK_SECRET`, `WORKER_URL`), затем:

```bash
npm run webhook:set
```

Эквивалент вручную — вызов Bot API `setWebhook`:

- `url`: `https://<worker-domain>/webhook`
- `secret_token`: ваш `WEBHOOK_SECRET`
- `allowed_updates`: `["message", "callback_query"]`

Проверить установку:

```bash
npm run webhook:info
```

Удалить webhook (если нужно вернуться к polling или сменить домен):

```bash
npm run webhook:delete
```

## 11. Проверить /start

1. Откройте бота в Telegram.
2. Отправьте `/start` — должно прийти приветствие AURA и главное меню.
3. Проверьте запись: Записаться → услуга → специалист → дата → время → имя → телефон → подтвердить.
4. В группу администраторов должно прийти уведомление «🔔 Новая запись».
5. Проверьте остальные разделы: услуги, специалисты, акции, отзывы, FAQ, связь с администратором.

## Локальная разработка

```bash
# заполнить .dev.vars по образцу, затем:
npm run dev
```

Для локального `wrangler dev` webhook не нужен — тестируйте через `curl`,
отправляя fake-update на `http://localhost:8787/webhook` с заголовком
`X-Telegram-Bot-Api-Secret-Token`.

## Удаление временной команды /chatid

После настройки `ADMIN_CHAT_ID` удалите блок между маркерами
`BEGIN /chatid (TEMP)` и `END /chatid (TEMP)` в `src/handlers.ts`,
затем `npm run typecheck && npm run deploy`.

## Структура проекта

```
src/index.ts      — routes GET / и POST /webhook, проверка секрета
src/handlers.ts   — /start, меню, услуги, FAQ, отзывы, связь с админом, /chatid
src/booking.ts    — даты (ближайшие 5 дней), слоты времени
src/keyboards.ts  — все inline-клавиатуры
src/data.ts       — услуги, специалисты, FAQ, акции, отзывы, цены
src/telegram.ts   — helper: sendMessage / editMessageText / answerCallbackQuery
src/state.ts      — KV-доступ к состоянию (TTL 24 ч)
src/types.ts      — Env, UserState, типы Telegram update
scripts/webhook.mjs — set / info / delete webhook
```

## Безопасность

- Секреты (`BOT_TOKEN`, `ADMIN_CHAT_ID`, `WEBHOOK_SECRET`) — только через
  `wrangler secret put` / `.dev.vars`, никогда в коде и git.
- `/webhook` сверяет заголовок `X-Telegram-Bot-Api-Secret-Token`, иначе — 403.
- Состояние записи хранится в KV с TTL 24 часа.

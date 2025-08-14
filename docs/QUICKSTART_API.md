# Быстрый старт подключения к Agno API

## Для быстрого подключения к реальному Agno API:

### 1. Получите API-ключ

- Зайдите на [app.agno.com](https://app.agno.com)
- Создайте API-ключ в настройках

### 2. Настройте endpoint

- Откройте любой чат агента
- В левом сайдбаре нажмите на поле "Endpoint"
- Введите: `https://api.agno.com` (или ваш URL)
- Нажмите Enter

### 3. Добавьте API-ключ

Создайте файл `.env.local`:

```bash
AGNO_API_KEY=your-api-key-here
```

### 4. Обновите код

В файле `src/hooks/useAIStreamHandler.tsx` добавьте заголовки аутентификации:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.AGNO_API_KEY}`,
}
```

### 5. Готово!

Теперь ваш чат будет работать с реальным Agno API.

---

**Нужна помощь?** Подробные инструкции в файле `AGNO_API_SETUP.md`

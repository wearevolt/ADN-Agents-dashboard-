# Подключение к реальному Agno API

## Шаги для подключения к реальному Agno API

### 1. Получение API-ключа

1. Зайдите на [https://app.agno.com](https://app.agno.com)
2. Зарегистрируйтесь или войдите в систему
3. Перейдите в раздел API Settings
4. Создайте новый API-ключ
5. Скопируйте ключ и сохраните его в безопасном месте

### 2. Настройка endpoint в приложении

1. Откройте чат (кнопка с любого агента)
2. В левом сайдбаре найдите секцию "Endpoint"
3. Нажмите на поле endpoint для редактирования
4. Введите URL вашего Agno API сервера, например:
   ```
   https://api.agno.com
   ```
5. Нажмите Enter или кнопку сохранения

### 3. Обновление конфигурации API

Обновите файл `src/lib/constructEndpointUrl.ts` для работы с реальным API:

```typescript
export const constructEndpointUrl = (endpoint: string, path: string): string => {
  const baseUrl = endpoint.replace(/\/$/, "");
  return `${baseUrl}${path}`;
};

// Добавьте заголовки аутентификации
export const getApiHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${apiKey}`,
  "X-API-Key": apiKey,
});
```

### 4. Обновление хука для работы с API

Обновите `src/hooks/useAIStreamHandler.tsx` для работы с реальным API:

```typescript
const handleStreamResponse = async (message: string) => {
  try {
    const response = await fetch(constructEndpointUrl(selectedEndpoint, "/v1/chat/completions"), {
      method: "POST",
      headers: getApiHeaders(apiKey), // Используйте API-ключ из настроек
      body: JSON.stringify({
        model: selectedModel,
        messages: [...messages, { role: "user", content: message }],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Обработка потокового ответа
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    // Обработка чанков потока
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Парсинг и обработка чанка
      const chunk = new TextDecoder().decode(value);
      // Обработка chunk данных...
    }
  } catch (error) {
    console.error("Error in stream handler:", error);
    // Обработка ошибки...
  }
};
```

### 5. Добавление хранения API-ключа

Создайте компонент для настройки API-ключа:

```typescript
// src/components/ApiKeyModal.tsx
const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('')

  const handleSave = () => {
    localStorage.setItem('agno_api_key', apiKey)
    onSave(apiKey)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Key Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Введите ваш Agno API ключ"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. Тестирование соединения

1. После настройки endpoint и API-ключа
2. Нажмите кнопку обновления рядом с endpoint
3. Проверьте, что статус соединения стал зеленым
4. Попробуйте отправить сообщение в чат

### 7. Возможные проблемы и решения

**Проблема: CORS ошибки**

- Убедитесь, что Agno API сервер настроен для работы с вашим доменом
- Добавьте необходимые CORS заголовки на сервере

**Проблема: Ошибки аутентификации**

- Проверьте правильность API-ключа
- Убедитесь, что ключ имеет необходимые разрешения

**Проблема: Таймауты**

- Увеличьте timeout для длительных запросов
- Настройте retry логику для обработки временных сбоев

### 8. Переменные окружения

Создайте файл `.env.local`:

```bash
NEXT_PUBLIC_AGNO_API_URL=https://api.agno.com
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4
AGNO_API_KEY=your-api-key-here
```

И используйте их в коде:

```typescript
const defaultEndpoint = process.env.NEXT_PUBLIC_AGNO_API_URL || "http://localhost:7777";
const defaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL || "gpt-3.5-turbo";
```

## Дополнительные настройки

### Обработка ошибок

- Добавьте обработку различных типов ошибок API
- Реализуйте retry логику для временных сбоев
- Добавьте пользовательские сообщения об ошибках

### Кэширование

- Настройте кэширование ответов для улучшения производительности
- Используйте local storage для сохранения настроек

### Безопасность

- Никогда не сохраняйте API-ключи в коде
- Используйте переменные окружения для конфиденциальных данных
- Реализуйте валидацию на стороне клиента

После выполнения всех этих шагов ваше приложение будет готово к работе с реальным Agno API!

# Аутентификация и управление пользователями

## Текущее состояние (Demo)

### Экран логина

- Создан компонент `LoginScreen` для демонстрации интерфейса входа
- Поддерживает только один режим входа:
  - Демо-вход с фиксированными данными пользователя "Alex" (alex.doe@example.com)
- Анимированный фон с частицами для улучшения UX
- Кнопка "Sign In" выполняет мгновенный вход без валидации

### Состояние пользователя

- Интерфейс `User` с полями `name` и `email` (определен в `src/app/page.tsx`)
- Локальное состояние пользователя в `src/app/page.tsx` с использованием `useState`
- Простое приветствие на основе имени пользователя в Dashboard
- Функция logout для сброса состояния пользователя в `null`

### Текущая структура User

```typescript
interface User {
  name: string;
  email: string;
}
```

## Планы развития

### 1. Интеграция с Auth0

```typescript
// Будущая реализация
import { Auth0Provider, useAuth0 } from '@auth0/nextjs-auth0/client'

// В _app.tsx
<Auth0Provider>
  <Component {...pageProps} />
</Auth0Provider>

// В компонентах
const { user, isLoading, error, loginWithRedirect, logout } = useAuth0()
```

### 2. Схема базы данных

#### Таблица Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Таблица Agents

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false, -- приватный агент (только для создателя)
  status VARCHAR(50) DEFAULT 'active', -- 'active' | 'error' | 'inactive'
  config JSONB, -- API keys, webhook URLs, etc.
  display_order INTEGER DEFAULT 0,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Логика отображения агентов

- **My agents**: все агенты пользователя (приватные + публичные созданные им)
- **Library**: только публичные агенты всех пользователей (is_private = false)
- **Приватность**: контролируется полем `is_private` в базе данных

#### Таблица Teams

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  PRIMARY KEY (team_id, user_id)
);
```

### 3. API Endpoints

#### Текущие API endpoints (AGNO API)

- `GET /agents` - получить доступных агентов
- `POST /chat` - отправить сообщение агенту
- `GET /status` - проверить статус API
- `GET /sessions/{agentId}` - получить сессии агента
- `GET /sessions/{agentId}/{sessionId}` - получить конкретную сессию
- `DELETE /sessions/{agentId}/{sessionId}` - удалить сессию

#### Планируемые API endpoints для аутентификации

- `GET /api/auth/me` - получить текущего пользователя
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход из системы

#### Планируемые API endpoints для управления агентами

- `GET /api/agents` - получить агентов пользователя (My agents)
- `GET /api/agents/library` - получить публичные агенты всех пользователей (Library)
- `POST /api/agents` - создать нового агента
- `PUT /api/agents/:id` - обновить агента
- `DELETE /api/agents/:id` - удалить агента
- `PUT /api/agents/reorder` - изменить порядок агентов
- `PUT /api/agents/:id/privacy` - изменить приватность агента (private/public)

### 4. Структура кода

#### Текущее состояние хранилища

```typescript
// src/store.ts - PlaygroundStore (существует)
interface PlaygroundStore {
  agents: Agent[];
  messages: PlaygroundChatMessage[];
  selectedEndpoint: string;
  selectedModel: string;
  sessionsData: SessionEntry[] | null;
  // другие поля для playground функциональности
}
```

#### Текущие типы агентов

```typescript
// src/types/playground.ts - для AGNO API
interface Agent {
  agent_id: string;
  name: string;
  description: string;
  model: Model;
  storage?: boolean;
}

// src/components/Dashboard.tsx - для UI
interface Agent {
  id: string;
  name: string;
  type: "personal" | "team";
  description?: string;
  status: "active" | "error";
  errorMessage?: string;
  // дополнительные поля для UI
}
```

#### Планируемые hooks для аутентификации

```typescript
// src/hooks/useAuth.ts (планируется)
export const useAuth = () => {
  const { user, isLoading, error } = useAuth0();

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: () => loginWithRedirect(),
    logout: () => logout(),
  };
};
```

#### Планируемое хранилище пользователей

```typescript
// src/store/userStore.ts (планируется)
interface UserState {
  user: User | null;
  teams: Team[];
  agents: Agent[];
  setUser: (user: User | null) => void;
  loadUserData: () => Promise<void>;
}
```

### 5. Защищенные маршруты

```typescript
// src/components/ProtectedRoute.tsx
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <LoginScreen />

  return <>{children}</>
}
```

## Миграция с демо-версии

### Шаг 1: Установка зависимостей

```bash
npm install @auth0/nextjs-auth0
```

### Шаг 2: Настройка переменных окружения

```env
AUTH0_SECRET=your-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### Шаг 3: Обновление компонентов

1. Обновить `LoginScreen` компонент для интеграции с Auth0 (не удалять - использовать как fallback)
2. Модифицировать `src/app/page.tsx` для использования Auth0 hooks
3. Добавить API routes для аутентификации в `src/app/api/auth/`
4. Создать middleware для защиты маршрутов
5. Создать separate user store (`src/store/userStore.ts`)

### Шаг 4: Интеграция управления агентами

1. Создать API endpoints для CRUD операций с агентами
2. Объединить интерфейсы Agent из `types/playground.ts` и `Dashboard.tsx`
3. Добавить персистентное хранение агентов пользователя
4. Реализовать синхронизацию с AGNO API

## Безопасность

### Текущие меры (Demo версия)

- Демо-авторизация без реальных токенов
- Локальное хранение состояния пользователя в React state
- Нет валидации или проверки прав доступа
- AGNO API ключи хранятся в конфигурации клиента
- Все данные агентов получаются из внешнего AGNO API

### Будущие меры безопасности

- JWT токены от Auth0
- Защищенные API routes с middleware валидацией
- Серверная валидация прав доступа к агентам
- Безопасное хранение API ключей на сервере
- Audit logging для действий пользователей
- Rate limiting для API endpoints
- CSRF protection
- Шифрование чувствительных данных

## Тестирование

### Текущие компоненты для тестирования

- Компонент `LoginScreen` (демо-функциональность)
- Управление состоянием пользователя в `src/app/page.tsx`
- Функции login/logout
- Интеграция с AGNO API (`src/api/playground.ts`)
- PlaygroundStore (`src/store.ts`)

### Планируемые тесты

- Unit тесты для компонентов аутентификации
- Интеграционные тесты с Auth0
- Тесты защищенных маршрутов
- Тесты API endpoints для управления пользователями и агентами
- E2E тесты полного flow аутентификации
- Тесты безопасности и валидации прав доступа

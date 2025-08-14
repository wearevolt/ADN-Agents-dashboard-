# 📁 Структура проекта

## 🏗 Общая архитектура

```
src/
├── app/                          # Next.js App Router
│   ├── globals.css              # Глобальные стили от agno-agi
│   ├── layout.tsx               # Корневой лейаут
│   └── page.tsx                 # Главная страница с аутентификацией и Dashboard
├── components/                   # Компоненты
│   ├── Dashboard.tsx            # Главный dashboard с агентами (НОВЫЙ)
│   ├── LoginScreen.tsx          # Экран авторизации с анимацией (НОВЫЙ)
│   ├── AddAgentModal.tsx        # Модальное окно создания агента (НОВЫЙ)
│   ├── AgentInfoModal.tsx       # Модальное окно информации об агенте (НОВЫЙ)
│   ├── AgentContextMenu.tsx     # Контекстное меню агента (НОВЫЙ)
│   ├── ChatModal.tsx            # Модальное окно чата (НОВЫЙ)
│   ├── ChatModalArea.tsx        # Область чата в модальном окне (НОВЫЙ)
│   ├── ChatModalInput.tsx       # Поле ввода в чат модале (НОВЫЙ)
│   ├── MessageModalArea.tsx     # Область сообщений в модале (НОВЫЙ)
│   ├── ConfirmationModal.tsx    # Модальное окно подтверждения (НОВЫЙ)
│   ├── TestAgnoConnection.tsx   # Тестирование подключения к AGNO (НОВЫЙ)
│   ├── playground/              # Компоненты от agno-agi (СУЩЕСТВУЮЩИЕ)
│   │   ├── ChatArea/           # Область чата
│   │   │   ├── ChatArea.tsx    # Главный компонент области чата
│   │   │   ├── ChatInput/      # Поле ввода сообщений
│   │   │   ├── Messages/       # Отображение сообщений
│   │   │   ├── MessageArea.tsx # Контейнер сообщений
│   │   │   └── ScrollToBottom.tsx # Кнопка прокрутки
│   │   └── Sidebar/            # Боковая панель
│   │       ├── Sidebar.tsx     # Главный компонент sidebar
│   │       ├── AgentSelector.tsx # Выбор агента
│   │       ├── NewChatButton.tsx # Кнопка нового чата
│   │       └── Sessions/       # Управление сессиями
│   └── ui/                     # UI компоненты от agno-agi
│       ├── button.tsx          # Кнопки
│       ├── card.tsx            # Карточки (НОВЫЙ)
│       ├── dialog.tsx          # Диалоги
│       ├── input.tsx           # Поля ввода (НОВЫЙ)
│       ├── select.tsx          # Селекты
│       ├── skeleton.tsx        # Скелетоны загрузки
│       ├── sonner.tsx          # Уведомления
│       ├── textarea.tsx        # Текстовые области
│       ├── badge.tsx           # Бейджи (НОВЫЙ)
│       ├── TagsList.tsx        # Список тегов (НОВЫЙ)
│       ├── icon/               # Иконки
│       ├── tooltip/            # Подсказки
│       └── typography/         # Типографика
├── hooks/                      # React хуки от agno-agi
│   ├── useAIResponseStream.tsx # Обработка потока ответов
│   ├── useAIStreamHandler.tsx  # Обработчик потока
│   ├── useChatActions.ts       # Действия в чате
│   └── useSessionLoader.tsx    # Загрузка сессий
├── lib/                        # Утилиты
│   ├── audio.ts               # Работа с аудио
│   ├── config.ts              # Конфигурация AGNO API (НОВЫЙ)
│   ├── constructEndpointUrl.ts # Построение URL
│   ├── modelProvider.ts       # Провайдеры моделей
│   └── utils.ts               # Общие утилиты
├── types/                      # TypeScript типы
│   └── playground.ts          # Типы для playground
├── api/                        # API endpoints
│   ├── playground.ts          # API для playground
│   └── routes.ts              # Маршруты API
└── store.ts                    # Zustand store (PlaygroundStore)
```

## 🎨 Текущая структура интерфейса

### Архитектура приложения

```
Страница входа: [LoginScreen] (при user === null)
                      ↓ (вход выполнен)
Главная страница: [Sidebar | Dashboard]
                           ↓ (клик на "Open Chat")
Модальный чат: [Overlay с ChatModal]
```

## 🔄 Структура главной страницы (page.tsx)

### Текущая реализация

```typescript
// src/app/page.tsx
export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar initialCollapsed={true} />
      <Dashboard onOpenChat={handleOpenChat} user={user} onLogout={handleLogout} />
      <ChatModal isOpen={showChatModal} onClose={handleCloseChat} />
    </div>
  )
}
```

## 🎯 Компоненты по функциональности

### 🔧 Управляющие компоненты

- `Sidebar.tsx` - Основная навигация
- `AgentSelector.tsx` - Выбор AI модели
- `NewChatButton.tsx` - Создание нового чата

### 💬 Чат компоненты

- `ChatArea.tsx` - Контейнер области чата
- `MessageArea.tsx` - Область отображения сообщений
- `ChatInput.tsx` - Поле ввода и отправки

### 📱 UI компоненты

- `Button` - Универсальные кнопки
- `Dialog` - Модальные окна
- `Tooltip` - Всплывающие подсказки
- `Icon` - Система иконок

### 🔄 Состояние и логика

- `store.ts` - Глобальное состояние (Zustand)
- `hooks/` - Переиспользуемая логика
- `types/` - TypeScript определения

## 📦 Файлы конфигурации

### Core Next.js

- `next.config.ts` - Конфигурация Next.js
- `tailwind.config.ts` - Настройки Tailwind CSS
- `tsconfig.json` - TypeScript конфигурация
- `components.json` - Настройки shadcn/ui

### Package Management

- `package.json` - Зависимости и скрипты
- `package-lock.json` - Заблокированные версии

### Styling

- `postcss.config.js` - PostCSS настройки
- `globals.css` - Глобальные CSS стили

## 🚀 Точки входа

### Основные маршруты

- `/` - Главная страница с sidebar и приветствием
- API endpoints (в разработке)

### Основные компоненты

1. **App Layout** (`layout.tsx`) - Корневая обертка
2. **Home Page** (`page.tsx`) - Главная логика
3. **Sidebar** - Навигация и управление
4. **ChatArea** - Область общения

## 🎨 Стилизация

### Система дизайна

- **Цвета**: CSS переменные от agno-agi
- **Шрифты**: Geist Sans + DM Mono
- **Компоненты**: Radix UI + Tailwind CSS
- **Анимации**: Framer Motion + tailwindcss-animate

### Responsive подход

- Mobile-first дизайн
- Адаптивные сетки
- Гибкие компоненты

---

**Структура оптимизирована для удобства разработки и интуитивного пользовательского опыта! 🎉**

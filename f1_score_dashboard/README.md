# Tool Performance Comparison Dashboard

Универсальная интерактивная панель для сравнения производительности различных инструментов с базовым эталоном.

## 🎯 Возможности

- 📊 **Интерактивные графики** - сравнение метрик (F1-score, Precision, Recall, Accuracy)
- 📈 **Двойной анализ** - абсолютные значения и разность с базовым инструментом
- 📤 **Простая загрузка** - drag-and-drop или file picker для CSV файлов
- 📋 **Детальная таблица** - статистика по всем инструментам
- 🔍 **Анализ отдельных образцов** - детальный просмотр результатов по каждому Tolid
- 🎯 **Ключевые инсайты** - автоматический анализ производительности
- 🎨 **Цветовое кодирование** - зеленый для улучшений, красный для снижений
- � **Экспорт данных** - возможность экспорта результатов образца в CSV
- �🔄 **Универсальность** - работает с любыми инструментами, названия отображаются как есть

## 🚀 Быстрый старт

1. **Установите зависимости:**
```bash
npm install
```

2. **Запустите приложение:**
```bash
npm run dev
```

3. **Откройте браузер:** http://localhost:3000

## 📊 Как использовать

### Загрузка данных
- При первом запуске автоматически загружается файл `f1_results.csv` из папки `public`
- Можно загрузить свой CSV файл через drag-and-drop или кнопку "Choose File"
- Файл должен содержать колонки: ID, Tolid, Tool, F1-score, Precision, Recall, Accuracy

### Общий анализ данных
1. **Выберите метрику** - F1-score, Precision, Recall или Accuracy
2. **Выберите тип сравнения:**
   - **Absolute Values** - показывает фактические значения метрик
   - **Difference from Baseline** - показывает разность с базовым методом
3. **Анализируйте графики:**
   - Левый график - сравнение выбранной метрики
   - Правый график - процент побед над базовым инструментом
4. **Изучайте таблицу** - детальная статистика по каждому инструменту

### Анализ отдельных образцов (NEW!)
1. **Выберите образец** из выпадающего списка в разделе "Sample Details"
2. **Используйте поиск** для быстрого нахождения нужного Tolid
3. **Навигация** - используйте кнопки "Previous/Next" для перемещения между образцами
4. **Сравнение с базовой линией** - колонка "vs Baseline" показывает разность с FCS+TIARA
5. **Экспорт результатов** - кнопка "Export CSV" для сохранения данных образца

### Особенности анализа образцов
- **Автоматическая сортировка** по F1-score (лучшие результаты сверху)
- **Цветовое кодирование**:
  - Синий фон - базовая линия (FCS+TIARA)
  - Зеленый - высокие показатели (F1 > 0.7)
  - Желтый - средние показатели (F1 > 0.5)
  - Красный - низкие показатели (F1 ≤ 0.5)
- **Детальная статистика**:
  - Лучший F1-score и инструмент, который его показал
  - Количество протестированных инструментов
  - Количество инструментов, превосходящих базовую линию

## 📋 Требования к данным

CSV файл должен содержать следующие колонки:
- `ID` - идентификатор набора данных
- `Tolid` - идентификатор образца  
- `Tool` - название инструмента (должно включать базовый инструмент для сравнения, например 'FCS+TIARA')
- `F1-score` - F1 метрика (число от 0 до 1)
- `Precision` - точность (число от 0 до 1)
- `Recall` - полнота (число от 0 до 1)
- `Accuracy` - аккуратность (число от 0 до 1)

**Пример:**
```csv
ID,Tolid,Tool,F1-score,Precision,Recall,Accuracy
RC-2013,daFilPyra1,FCS+TIARA,0.3179,0.1890,1.0,0.8884
RC-2013,daFilPyra1,custom_tool_v1,0.1395,0.0756,0.9114,0.7077
RC-2013,daFilPyra1,custom_tool_v2,0.2541,0.1523,0.8932,0.8123
```

## 🛠️ Технологии

- **React 18** - современный UI фреймворк
- **Vite** - быстрый инструмент сборки
- **Recharts** - мощная библиотека графиков
- **Tailwind CSS** - утилитарный CSS фреймворк
- **Papa Parse** - надежный парсер CSV
- **Lodash** - утилиты для обработки данных

## 📁 Структура проекта

```
├── public/
│   └── f1_results.csv          # Данные по умолчанию
├── src/
│   ├── components/
│   │   ├── ComparisonDashboard.jsx     # Основной компонент
│   │   └── SimpleComparisonDashboard.jsx # Упрощенная версия
│   ├── App.jsx                 # Корневой компонент
│   ├── main.jsx               # Точка входа
│   └── index.css              # Глобальные стили
├── package.json               # Зависимости и скрипты
├── vite.config.js            # Конфигурация Vite
└── tailwind.config.js        # Конфигурация Tailwind
```

## 📋 Команды

```bash
# Разработка
npm run dev          # Запуск dev сервера на порту 3000

# Продакшен
npm run build        # Создание оптимизированной сборки
npm run preview      # Предварительный просмотр сборки

# Управление
npm install          # Установка зависимостей
npm audit fix        # Исправление уязвимостей
```

## 🔧 Настройка

### Изменение порта
В `vite.config.js`:
```js
export default defineConfig({
  server: {
    port: 3001  // Ваш порт
  }
})
```

### Добавление новых метрик
В `ComparisonDashboard.jsx` обновите:
1. Селектор метрик в JSX
2. Функцию `getMetricKey()`
3. Обработку данных в `processedData`

## 🐛 Решение проблем

### Данные не загружаются
- Убедитесь, что CSV файл имеет правильную структуру
- Проверьте консоль браузера на ошибки
- Убедитесь, что есть строка с базовым инструментом (например, `Tool = "FCS+TIARA"`)

### Графики пустые
- Проверьте, что числовые поля содержат валидные числа
- Убедитесь, что есть данные для сравнения с базовым инструментом
- Проверьте отладочную информацию под заголовком

### Ошибки зависимостей
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📈 Интерпретация результатов

### Цветовое кодирование
- 🟢 **Зеленый** - Инструмент превосходит базовый эталон
- 🔴 **Красный** - Базовый эталон работает лучше
- 🔵 **Синий** - нейтральные абсолютные значения

### Ключевые метрики
- **Win Rate** - процент случаев, когда инструмент превосходит базовый эталон
- **Avg F1 Diff** - средняя разность F1-score с базовым эталоном
- **Count** - количество сравнений для каждого инструмента

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Убедитесь в корректности формата данных
3. Попробуйте перезагрузить страницу
4. Проверьте, что сервер запущен (`npm run dev`)

---

✅ **Приложение готово к использованию!** Откройте http://localhost:3000 и начните анализ ваших данных.

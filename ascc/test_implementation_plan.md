# План добавления nf-test тестов для Sourmash интеграции

**Дата**: 23 октября 2025  
**Задача**: Добавить nf-test тесты для нового субворкфлоу RUN_SOURMASH и связанных модулей

## Изменения в project_description.md

### 1. Добавлена новая Фаза 2.5: Написание nf-test тестов

Вставлена между Фазой 2 (Интеграция RUN_SOURMASH) и Фазой 3 (Интеграция с Autofilter)

#### Задачи фазы 2.5:

**2.5.1: Создание тестов для модуля SOURMASH_MULTISEARCH**
- Локация: `modules/local/sourmash/multisearch/tests/main.nf.test`
- Минимум 2 теста: базовый + stub
- Использование тестовых данных из `assets/sourmash_testing/`
- Проверка: success, выходные файлы, версии
- Теги: `sourmash`, `sourmash/multisearch`, `modules`, `modules_local`

**2.5.2: Создание тестов для модуля PARSE_SOURMASH**
- Локация: `modules/local/parse/sourmash/tests/main.nf.test`
- Тесты: базовый, с разными target_taxa, stub
- Проверка корректности парсинга и фильтрации
- Выходы: `summary_csv`, `nontarget_csv`
- Теги: `parse`, `parse/sourmash`, `modules`, `modules_local`

**2.5.3: Создание тестов для субворкфлоу RUN_SOURMASH**
- Локация: `subworkflows/local/run_sourmash/tests/main.nf.test`
- Использование `nextflow_workflow` блока
- Тесты:
  1. Полный тест с одной базой данных
  2. Множественные базы (2-3 базы с разными k)
  3. Проверка skip режима
- Конфигурационный файл `tests/nextflow.config`
- Проверка всех выходных каналов и версий
- Теги: `subworkflows`, `subworkflows_local`, `run_sourmash`

**2.5.4: Подготовка тестовых данных**
- Локация: `assets/sourmash_testing/` или `tests/sourmash_testdata/`
- Необходимые данные:
  - Тестовый геном (маленький FASTA)
  - Минимальная sourmash база данных
  - `assembly_taxa_db.csv` файл
  - Пример результата multisearch
- Создание minimal test dataset если данных нет
- Документация в `tests/README.md`

**2.5.5: Запуск и валидация тестов**
- Команды для запуска:
  ```bash
  nf-test test modules/local/sourmash/multisearch/tests/main.nf.test
  nf-test test modules/local/parse/sourmash/tests/main.nf.test
  nf-test test subworkflows/local/run_sourmash/tests/main.nf.test
  nf-test test --tag sourmash  # все тесты
  ```
- Проверка coverage
- Создание snapshot файлов
- Проверка в CI/CD
- Документация процесса запуска

#### Критерии успеха фазы 2.5:
- ✅ 3 набора тестов созданы (2 модуля + 1 субворкфлоу)
- ✅ Минимум 2 теста на модуль (базовый + stub)
- ✅ Минимум 2 сценария для субворкфлоу
- ✅ Все тесты проходят локально
- ✅ Snapshot файлы валидны
- ✅ Соответствие паттернам nf-core

### 2. Обновлена нумерация последующих фаз

- Фаза 3: Интеграция с Autofilter (без изменений в содержании)
- **Фаза 3.5**: Интеграция с Merge Tables (было Фаза 4)
  - Задачи 3.5.1 и 3.5.2
- **Фаза 4**: Интеграционное тестирование и документация (было Фаза 5)
  - Задачи 4.1, 4.2, 4.3, 4.4

### 3. Обновлена секция "Зависимости между задачами"

Добавлены новые связи:
```
2.3 → 2.5 (Написание nf-test тестов для модулей и субворкфлоу)
2.5.4 (Подготовка тестовых данных) - параллельно с 2.1-2.3
2.5 → 2.5.5 (Запуск и валидация unit-тестов)
2.3 → 3.5.1, 3.5.2 (обновлена нумерация)
Все → 4.3 (обновлена нумерация)
4.2 (обновлена нумерация)
```

## Обоснование изменений

### Почему тесты добавлены после разработки модулей?

1. **Логическая последовательность**: Сначала создаются и отлаживаются модули, затем для них пишутся формальные тесты
2. **Изоляция unit-тестов**: Тесты для отдельных модулей и субворкфлоу (unit/integration tests) выполняются до интеграции в основной пайплайн
3. **Паттерн nf-core**: Стандартная практика - каждый модуль и субворкфлоу должен иметь свои nf-test тесты

### Почему тесты размещены перед autofilter?

1. **Раннее тестирование**: Проверка корректности работы Sourmash компонентов до интеграции с другими частями пайплайна
2. **Изоляция проблем**: Если что-то не работает - проще понять, проблема в Sourmash или в интеграции
3. **Независимая разработка**: Тесты можно писать параллельно с интеграцией в autofilter

## Структура nf-test в проекте

### Существующие тесты:

**nf-core модули** (имеют тесты):
- `modules/nf-core/tiara/tiara/tests/main.nf.test`
- `modules/nf-core/sourmash/sketch/tests/main.nf.test`
- `modules/nf-core/fcsgx/rungx/tests/main.nf.test`
- и др. (всего 56 тестов)

**local модули** (НЕ имеют тестов):
- `modules/local/sourmash/multisearch/` - **нужен тест**
- `modules/local/parse/sourmash/` - **нужен тест**
- `modules/local/autofilter/autofilter/` - нет теста (не в рамках этой задачи)
- и др.

**local субворкфлоу** (НЕ имеют тестов):
- `subworkflows/local/run_sourmash/` - **нужен тест**
- `subworkflows/local/run_fcsgx/` - нет теста
- `subworkflows/local/run_nt_kraken/` - нет теста
- и др.

**Основной пайплайн**:
- `tests/default.nf.test` - интеграционный тест всего пайплайна

### Паттерн nf-test в проекте:

1. **Для процессов (модулей)**:
   ```groovy
   nextflow_process {
       name "Test Process MODULE_NAME"
       script "../main.nf"
       process "MODULE_NAME"
       tag "module_group"
       // ... тесты
   }
   ```

2. **Для субворкфлоу**:
   ```groovy
   nextflow_workflow {
       name "Test Subworkflow WORKFLOW_NAME"
       script "../main.nf"
       workflow "WORKFLOW_NAME"
       tag "subworkflows"
       // ... тесты
   }
   ```

3. **Для пайплайна**:
   ```groovy
   nextflow_pipeline {
       name "Test pipeline"
       script "../main.nf"
       tag "pipeline"
       // ... тесты с setup для загрузки баз данных
   }
   ```

## Практические шаги выполнения

### Шаг 1: Проверка существующих тестовых данных
```bash
cd /Users/dz11/github/ascc
ls -la assets/sourmash_testing/
```

### Шаг 2: Создание структуры директорий для тестов
```bash
mkdir -p modules/local/sourmash/multisearch/tests
mkdir -p modules/local/parse/sourmash/tests
mkdir -p subworkflows/local/run_sourmash/tests
```

### Шаг 3: Написание тестов (по очереди)
1. Начать с `SOURMASH_MULTISEARCH` (самый простой)
2. Затем `PARSE_SOURMASH` (использует выходы multisearch)
3. В конце `RUN_SOURMASH` (тестирует весь субворкфлоу)

### Шаг 4: Запуск тестов
```bash
# Отдельные тесты
nf-test test modules/local/sourmash/multisearch/tests/main.nf.test
nf-test test modules/local/parse/sourmash/tests/main.nf.test
nf-test test subworkflows/local/run_sourmash/tests/main.nf.test

# Все sourmash тесты
nf-test test --tag sourmash

# Все local тесты
nf-test test --tag modules_local
```

### Шаг 5: Генерация snapshots
```bash
nf-test test <test_file> --update-snapshot
```

## Ожидаемые результаты

После выполнения Фазы 2.5 должны появиться следующие файлы:

```
modules/local/sourmash/multisearch/
├── tests/
│   ├── main.nf.test
│   └── main.nf.test.snap

modules/local/parse/sourmash/
├── tests/
│   ├── main.nf.test
│   └── main.nf.test.snap

subworkflows/local/run_sourmash/
├── tests/
│   ├── main.nf.test
│   ├── main.nf.test.snap
│   └── nextflow.config

tests/sourmash_testdata/  (или assets/sourmash_testing/)
├── test_genome.fa
├── test_database.zip
├── assembly_taxa_db.csv
└── example_multisearch_result.csv
```

## Связь с остальным планом

Фаза 2.5 является **критической точкой валидации** перед интеграцией:
- **До**: Модули и субворкфлоу разработаны (Фаза 2.1-2.3)
- **Во время**: Проверяется корректность работы в изоляции
- **После**: Интеграция с autofilter и merge tables (Фаза 3, 3.5)
- **Финал**: Полное интеграционное тестирование пайплайна (Фаза 4.3)

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Отсутствие подходящих тестовых данных | Средняя | Создать minimal dataset из sarscov2 |
| Snapshot файлы слишком большие | Низкая | Использовать только необходимые выходы в snapshot |
| Тесты падают из-за путей | Средняя | Использовать относительные пути и params |
| CI/CD не настроен для новых тестов | Низкая | Использовать существующие теги (modules_local) |

## Следующие шаги

1. **Немедленно**: Проверить наличие тестовых данных в `assets/sourmash_testing/`
2. **Сегодня**: Создать тест для `SOURMASH_MULTISEARCH`
3. **Завтра**: Создать тест для `PARSE_SOURMASH`
4. **Послезавтра**: Создать тест для `RUN_SOURMASH` субворкфлоу
5. **Затем**: Запустить все тесты и зафиксировать snapshots

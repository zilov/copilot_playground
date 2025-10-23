# План задач проекта: Интеграция Sourmash в ASCC Pipeline

## 📋 Навигация

- **[project_description.md](project_description.md)** - Основное описание проекта
- **[project_tasks.md](project_tasks.md)** ← ВЫ ЗДЕСЬ - Детальный план задач
- **[project_changelog.md](project_changelog.md)** - История изменений

---

## 📊 Общий прогресс

| Фаза | Статус | Задач выполнено | Описание |
|------|--------|-----------------|----------|
| **Фаза 1** | ✅ Завершена | 4/4 | Подготовка инфраструктуры |
| **Фаза 2** | 🔄 В процессе | 0/4 | Интеграция RUN_SOURMASH |
| **Фаза 2.5** | ⏳ Запланирована | 0/5 | Написание nf-test тестов |
| **Фаза 3** | ⏳ Запланирована | 0/5 | Интеграция с Autofilter |
| **Фаза 4** | ⏳ Запланирована | 0/4 | Интеграционное тестирование |
| **Фаза 5** | ⏳ Запланирована | 0/10 | Подготовка к Pull Request |

---

## 🔗 Диаграмма зависимостей

```
Фаза 1 - Подготовка инфраструктуры:
1.1 (Конфиг) → 1.2 (Парсинг баз)
1.1 (Конфиг) → 1.3 (Обновление nextflow_schema.json)
1.4 (target_taxa) - независимая задача

Фаза 2 - Интеграция RUN_SOURMASH:
1.2, 1.4 → 2.1 (Подготовка входов)
2.1 → 2.2 (Запуск RUN_SOURMASH)
2.2 → 2.3 (Модификация субворкфлоу)
2.3 → 2.4 (Модификация SOURMASH_MULTISEARCH)

Фаза 2.5 - Написание nf-test тестов:
2.3, 2.4 → 2.5.1, 2.5.2, 2.5.3 (Создание тестов)
2.5.4 (Подготовка тестовых данных) - параллельно с 2.1-2.4
2.5.1, 2.5.2, 2.5.3, 2.5.4 → 2.5.5 (Запуск и валидация)

Фаза 3 - Интеграция с Autofilter и Merge Tables:
2.3 → 3.1, 3.2, 3.3 (Autofilter интеграция)
2.3 → 3.5.1, 3.5.2 (Merge tables интеграция)

Фаза 4 - Интеграционное тестирование:
3.1, 3.2, 3.3, 3.5.1, 3.5.2 → 4.1 (Подготовка окружения)
4.2 (Облако) - параллельно с разработкой
4.1 → 4.3 (Интеграционное тестирование)
4.3 → 4.4 (Документация)

Фаза 5 - Подготовка к Pull Request:
4.4 → 5.1 (Проверка contribution guidelines)
Все предыдущие → 5.2 (nf-core lint)
2.5.5, 4.3 → 5.3 (Test suite)
5.3 → 5.4 (Debug mode)
4.4 → 5.5 (usage.md)
4.4 → 5.6 (output.md)
4.4 → 5.7 (CHANGELOG.md)
4.4 → 5.8 (README.md)
5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8 → 5.9 (PR description)
5.1 through 5.9 → 5.10 (Финальная проверка)
```

---

## Фаза 1: Подготовка инфраструктуры ✅

### Задача 1.1: Конфигурация параметров ✅
**Файлы**: `nextflow.config`, `conf/modules.config`, `conf/production.config`

**Действия**:
- Добавить параметр `params.sourmash_databases = []`
- Добавить параметр `params.sourmash_db_config = null`
- Добавить параметр `params.sourmash_taxonomy_level = 'order'`
- Добавить условный параметр `params.run_sourmash = 'off'` (значения: `off`, `genomic`, `both`)
- Настроить динамическую генерацию `task.ext.args` для `SOURMASH_SKETCH`

**Тестовый конфиг**: `assets/sourmash_testing/test.config`

---

### Задача 1.2: Парсинг конфигурации баз данных ✅
**Локация**: `workflows/ascc_genomic.nf`, `lib/SourmashDatabaseConfig.groovy`

**Действия**:
- Создать класс `SourmashDatabaseConfig.groovy` для парсинга конфигурации
- Чтение CSV файла (если указан `params.sourmash_db_config`)
- Или использовать `params.sourmash_databases` напрямую
- Валидация: проверить существование файлов баз данных
- Сформировать channel: `[[name, path, k_available, k_for_search, s, assembly_taxa_db], ...]`
- Собрать все уникальные `k_for_search` для передачи в sketch

**Реализованные функции**:
- `collectUniqueK()` - сбор всех уникальных k_for_search
- `getMinimumScaled()` - минимальный scaled
- `generateSketchParams()` - генерация параметров для SOURMASH_SKETCH
- `logDatabaseSummary()` - логирование информации о базах

---

### Задача 1.3: Обновление nextflow_schema.json ✅
**Файл**: `nextflow_schema.json`

**Действия**:
- Добавить `sourmash_databases` (type: array, описание структуры)
- Добавить `sourmash_db_config` (type: string, format: file-path, pattern: CSV)
- Добавить `sourmash_taxonomy_level` (type: string, enum: [class, family, order, genus, phylum, species])
- Указать зависимости и validation rules
- Добавить help_text с примерами

---

### Задача 1.4: Извлечение target_taxa из taxid ✅
**Новый модуль**: `modules/local/get/target_taxa/main.nf`

**Вход**:
- `taxid` (из meta)
- `ncbi_ranked_lineage_path`
- `taxonomy_level` (параметр)

**Выход**: 
- `target_taxa` строка в формате `level:taxa_name`

**Обработка ошибок**: 
- Taxid не найден → `TAXID_NOT_FOUND`
- Уровень пустой → `LEVEL_EMPTY`
- Graceful degradation (exit 0, не прерывает pipeline)

---

## Фаза 2: Интеграция RUN_SOURMASH 🔄

### Задача 2.1: Подготовка входных каналов
**Локация**: `workflows/ascc_genomic.nf`

**Действия**:
- Подготовить `genome_fasta` из `reference_tuple_from_GG`
- Создать channel `ch_sourmash_databases` из распарсенной конфигурации
- Вычислить уникальные `k_for_search` и `min(s)` для `SOURMASH_SKETCH`
- Получить `target_taxa` для каждого sample через `GET_TARGET_TAXA`
- Подготовить channel для multisearch (комбинировать signature с каждой базой)
- Добавить в meta: `db_name`, `k_for_search`, `s`
- Подготовить `assembly_taxa_db`: если несколько путей → merge через `CAT_CAT`

---

### Задача 2.2: Вызов RUN_SOURMASH
**Локация**: `ascc_genomic.nf`

**Условие запуска**:
```groovy
if ( params.run_sourmash == "both" || params.run_sourmash == "genomic" ) {
    // Проверка наличия баз данных
    // Проверка наличия taxid
    RUN_SOURMASH (...)
    ch_sourmash_nontarget = RUN_SOURMASH.out.sourmash_non_target
} else {
    ch_sourmash_nontarget = Channel.of([[id: "NA"], []])
}
```

**Важно**: Раскомментировать outputs в main.nf

---

### Задача 2.3: Модификация субворкфлоу
**Файл**: `subworkflows/local/run_sourmash/main.nf`

**Изменения**:
1. Обновить логику `combine`: добавить `db_name`, `k_for_search`, `s` в meta
2. Передать `k_for_search` в `SOURMASH_MULTISEARCH` для каждой базы
3. Раскомментировать emit для `sourmash_non_target` и `sourmash_summary`
4. Добавить логику проверки дубликатов в `assembly_taxa_db` (warning если есть)
5. Добавить `.view()` для отладки

---

### Задача 2.4: Модификация модуля SOURMASH_MULTISEARCH
**Файл**: `modules/local/sourmash/multisearch/main.nf`

**Изменения**:
- Принимать `k_for_search` как входной параметр
- Использовать db-specific k в команде: `--ksize ${k_for_search}`
- Добавить `db_name` в имя выходного файла для идентификации

---

## Фаза 2.5: Написание nf-test тестов ⏳

### Задача 2.5.1: Тесты для SOURMASH_MULTISEARCH
**Файл**: `modules/local/sourmash/multisearch/tests/main.nf.test`

**Тесты**:
1. Базовый тест с реальными данными (genome + database)
2. Stub тест (с опцией `-stub`)

**Проверки**:
- `process.success`
- Наличие выходных файлов
- Версии

---

### Задача 2.5.2: Тесты для PARSE_SOURMASH
**Файл**: `modules/local/parse/sourmash/tests/main.nf.test`

**Тесты**:
1. Базовый тест с результатами multisearch
2. Тест с различными target_taxa
3. Stub тест

**Проверки**:
- Корректность парсинга
- Формат выходных файлов
- Правильность фильтрации по target_taxa

---

### Задача 2.5.3: Тесты для субворкфлоу RUN_SOURMASH
**Файл**: `subworkflows/local/run_sourmash/tests/main.nf.test`

**Тесты**:
1. Полный тест: Геном + одна база + target_taxa
2. Множественные базы: Геном + 2-3 базы (разные k)
3. Проверка skip: Некорректные данные

**Проверки**:
- Успешное выполнение субворкфлоу
- Корректность выходных каналов
- Версии всех модулей

---

### Задача 2.5.4: Подготовка тестовых данных
**Локация**: `assets/sourmash_testing/` или `tests/sourmash_testdata/`

**Действия**:
- Проверить наличие минимальных тестовых данных
- Если данных нет - создать minimal test dataset
- Задокументировать структуру в `tests/README.md`

**Требуемые данные**:
- Тестовый геном (маленький FASTA, ~100-500 контигов)
- Минимальная sourmash база (ZIP или RocksDB)
- `assembly_taxa_db.csv` файл
- Пример результата multisearch

---

### Задача 2.5.5: Запуск и валидация тестов
**Команды**:
```bash
nf-test test modules/local/sourmash/multisearch/tests/main.nf.test
nf-test test modules/local/parse/sourmash/tests/main.nf.test
nf-test test subworkflows/local/run_sourmash/tests/main.nf.test
nf-test test --tag sourmash
```

**Критерии успеха**:
- ✅ Все 3 набора тестов созданы
- ✅ Каждый модуль имеет минимум 2 теста
- ✅ Субворкфлоу имеет минимум 2 сценария
- ✅ Все тесты проходят локально
- ✅ Snapshot файлы созданы и валидны

---

## Фаза 3: Интеграция с Autofilter ⏳

### Задача 3.1: Модификация AUTOFILTER_AND_CHECK_ASSEMBLY
**Файл**: `modules/local/autofilter_and_check_assembly/main.nf`

**Действия**:
- Добавить входной параметр: `path(sourmash_nontarget)`
- Передать файл в скрипт: `--sourmash $sourmash_nontarget`
- Обработать optional input (если Sourmash не запускался)

---

### Задача 3.2: Модификация autofilter.py
**Файл**: `bin/autofilter.py`

**Действия**:
- Добавить аргумент `--sourmash`
- Парсинг `nontarget_csv` от Sourmash
- Интеграция в логику фильтрации (комбинирование с FCS-GX и Tiara)
- **Уточнить логику**: OR (любой нашел) или взвешенное решение?

---

### Задача 3.3: Обновление вызова в workflow
**Файл**: `workflows/ascc_genomic.nf`

**Изменения**:
```groovy
AUTOFILTER_AND_CHECK_ASSEMBLY (
    reference_tuple_from_GG,
    ch_fcsgx,
    ch_tiara,
    ch_sourmash_nontarget  // <- добавить
)
```

---

### Задача 3.5.1: Добавление в ASCC_MERGE_TABLES
**Файл**: `workflows/ascc_genomic.nf`

**Действия**:
- Определить, нужен ли `nontarget_csv` в итоговой таблице
- Добавить channel `ch_sourmash_nontarget` в inputs
- Отформатировать meta: `.map { it -> [[id: it[0].id, process: "SOURMASH"], it[1]] }`

---

### Задача 3.5.2: Модификация ASCC_MERGE_TABLES
**Файл**: `modules/local/ascc_merge_tables/main.nf`

**Действия**:
- Добавить optional input для Sourmash
- Обработать случай когда Sourmash не запускался

---

## Фаза 4: Интеграционное тестирование ⏳

### Задача 4.1: Подготовка тестового окружения
**Действия**:
- Проверить наличие всех файлов в `sourmash_testing`
- Создать `samplesheet.csv` если отсутствует
- Создать `databases.csv` с описанием тестовых баз
- Обновить `test.config` со всеми параметрами

---

### Задача 4.2: Загрузка баз данных в облако
**Отдельная задача** (параллельно):
- Загрузить тестовые базы в облачное хранилище
- Обновить пути в тестовом конфиге
- Задокументировать URL для CI/CD

---

### Задача 4.3: Интеграционное тестирование
**Сценарии**:
1. **Базовый тест**: Запуск с одной базой
2. **Множественные базы**: Запуск с 2+ базами
3. **Skip тест**: Sourmash отключен
4. **Error handling**: Отсутствующая база
5. **Autofilter**: Проверка фильтрации контигов

---

### Задача 4.4: Документация (базовая)
**Файлы**:
- README.md: Описание Sourmash модуля
- usage.md: Параметры конфигурации
- output.md: Описание выходных файлов
- CHANGELOG.md: Запись о функциональности

---

## Фаза 5: Подготовка к Pull Request ⏳

### Задача 5.1: Проверка contribution guidelines
**Файл**: `.github/CONTRIBUTING.md`

**Действия**:
- Прочитать contribution guidelines
- Проверить структуру модулей (modules/local/, subworkflows/local/)
- Проверить формат main.nf файлов
- Проверить naming conventions
- Убедиться что параметры задокументированы

---

### Задача 5.2: Запуск nf-core pipelines lint
**Команда**: `nf-core pipelines lint`

**Действия**:
- Выполнить полный lint check
- Исправить все errors и warnings
- Проверка nextflow_schema.json
- Проверка meta.yml файлов
- Документирование known issues

---

### Задача 5.3: Запуск test suite
**Команда**: `nextflow run . -profile test,docker --outdir <OUTDIR>`

**Действия**:
- Подготовить тестовое окружение
- Запустить полный test profile с Sourmash
- Проверить выходные файлы
- Задокументировать время выполнения

---

### Задача 5.4: Debug mode тестирование
**Команда**: `nextflow run . -profile debug,test,docker --outdir <OUTDIR>`

**Действия**:
- Запустить в debug режиме
- Проверить логи на unexpected warnings
- Проверить graceful skip сценарии
- Задокументировать warnings

---

### Задача 5.5: Обновление docs/usage.md
**Файл**: `docs/usage.md`

**Содержание**:
- Секция "Sourmash Contamination Detection"
- Описание параметров: sourmash_databases, sourmash_db_config, sourmash_taxonomy_level
- Примеры использования (config и CSV)
- Требования к базам данных
- Troubleshooting секция

---

### Задача 5.6: Обновление docs/output.md
**Файл**: `docs/output.md`

**Содержание**:
- Секция "Sourmash Output Files"
- Описание sourmash_summary.csv (структура, интерпретация)
- Описание sourmash_nontarget.csv (формат, использование)
- Примеры визуализации
- Интеграция с MultiQC (если применимо)

---

### Задача 5.7: Обновление CHANGELOG.md
**Файл**: `CHANGELOG.md`

**Содержание**:
```markdown
### Added
- Sourmash integration for contamination detection
- Support for multiple k-mer databases
- Automatic target taxa extraction from NCBI taxonomy
- New parameters: sourmash_databases, sourmash_db_config, sourmash_taxonomy_level
- New module: GET_TARGET_TAXA
- New subworkflow: RUN_SOURMASH
- Integration with AUTOFILTER_AND_CHECK_ASSEMBLY
```

---

### Задача 5.8: Обновление README.md
**Файл**: `README.md`

**Содержание**:
- Добавить Sourmash в список инструментов
- Citation для Sourmash:
  ```
  Titus Brown and Luiz Irber (2016). sourmash: a library for MinHash sketching of DNA.
  Journal of Open Source Software, 1(5), 27. https://doi.org/10.21105/joss.00027
  ```
- Обновить workflow diagram
- Обновить contributors list
- Обновить "Quick Start"

---

### Задача 5.9: Создание PR description
**Структура**:
- **Motivation**: Почему нужен Sourmash
- **Implementation**: Архитектура решения
- **Key Features**: Основные возможности
- **Testing**: Описание тестирования
- **Documentation**: Список обновленной документации
- Примеры использования (code snippets)
- Screenshots/примеры выходных файлов

---

### Задача 5.10: Финальная проверка PR checklist
**PR Checklist**:
- [x] Description с описанием изменений
- [x] Тесты добавлены
- [x] Следование pipeline conventions
- [x] nf-core pipelines lint проходит
- [x] Test suite проходит
- [x] Debug mode проверен
- [x] docs/usage.md обновлен
- [x] docs/output.md обновлен
- [x] CHANGELOG.md обновлен
- [x] README.md обновлен

**Действия**:
- Пройтись по каждому пункту
- Убедиться что все требования выполнены
- Создать PR на GitHub
- Запросить review у maintainers

---

## 📝 Примечания

- Задачи Фазы 1 завершены ✅
- Задачи Фазы 2 - текущий фокус 🔄
- Фазы 3-5 будут выполняться последовательно
- Некоторые задачи могут выполняться параллельно (см. диаграмму зависимостей)

**Обновлено**: 23 октября 2025

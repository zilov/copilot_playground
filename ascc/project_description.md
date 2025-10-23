GitHub Copilot: # Проект: Интеграция Sourmash в ASCC Pipeline

## Цель проекта
Интегрировать субворкфлоу `RUN_SOURMASH` в основной геномный пайплайн для детекции контаминации в геномных сборках. Sourmash будет работать параллельно с FCS-GX и Tiara, результаты всех трех инструментов будут комбинироваться для принятия финального решения о фильтрации контигов-контаминантов.

## Контекст
- **Субворкфлоу**: main.nf (уже создан, но не интегрирован)
- **Основной workflow**: ascc_genomic.nf
- **Принцип работы**: Поиск контигов без k-меров целевого таксона (target taxa) указывает на контаминацию
- **Тестовые данные**: sourmash_testing (геном, 2 базы данных, assembly_taxa_db, конфиг)


## Как работаем над прооектом
- Папка проекта - `~/github/ascc`
- Логи разработки (описание проекта ,промпты, заметки, результаты) - `~/github/copilot_playground/ascc/`
- После каждого шага - md файл с логом выполнения в папку лога разработки - используй идентификаторы и имена файлов для удобства поиска и возвращения и в конец описания проекта список изменений с датами и временем и путями до файлов. старые файлы можешь переименовывать и изменять если необходимо.
- Если есть структурное, архитектурное или идейное изменение проекта - внести изменения в `~/github/copilot_playground/ascc/project_description.md`
- Если изменения в логах разработки - после каждого шага коммит с описанием. Никогда не коммить сам в папке проекта, это на мне. 

---

---

## Краткое описание решения

**Ключевые принципы:**
1. Каждая база данных содержит несколько k-меров, но для поиска используется только один оптимальный k
2. Sketch создается один раз со всеми k, которые будут использоваться во всех базах
3. Multisearch для каждой базы запускается со своим специфичным k (из `k_for_search`)
4. Результаты всех баз объединяются и передаются в autofilter для комбинации с FCS-GX и Tiara

**Поток данных:**
```
Конфигурация баз → Сбор уникальных k_for_search → 
SKETCH (k=[21,31,51], s=min) → 
MULTISEARCH per база (каждая со своим k) → 
Объединение → PARSE → Autofilter + Merge Tables
```

---

## Архитектура решения

### 1. Конфигурация баз данных

**Структура конфигурации базы:**
- `name` - Уникальное имя базы
- `path` - Путь к .zip или .rocksdb файлу
- `k_available` - Список всех k-меров в базе (для документации)
- `k_for_search` - Одно значение k для multisearch (используется в поиске)
- `s` - Scaled параметр базы
- `assembly_taxa_db` - Путь к таксономической базе

**Два способа указания баз:**

**A. Через Nextflow config** (для production, `conf/production.config`):
```groovy
params.sourmash_databases = [
    [name: 'vertebrate_k51', path: '/prod/vertebrate.zip', k_available: [31, 51], k_for_search: 51, s: 200, assembly_taxa_db: '/prod/assembly_taxa_vertebrate.csv'],
    [name: 'invertebrate_k31', path: '/prod/invertebrate.zip', k_available: [31, 51], k_for_search: 31, s: 200, assembly_taxa_db: '/prod/assembly_taxa_invertebrate.csv'],
    [name: 'virus_k21', path: '/prod/virus.zip', k_available: [21, 31], k_for_search: 21, s: 1000, assembly_taxa_db: '/prod/assembly_taxa_virus.csv']
]
```

**B. Через CSV файл** (для гибкости, параметр `params.sourmash_db_config`):
```csv
name,path,k_available,k_for_search,s,assembly_taxa_db
vertebrate_k51,/prod/vertebrate.zip,"[31,51]",51,200,/prod/assembly_taxa_vertebrate.csv
invertebrate_k31,/prod/invertebrate.zip,"[31,51]",31,200,/prod/assembly_taxa_invertebrate.csv
virus_k21,/prod/virus.zip,"[21,31]",21,1000,/prod/assembly_taxa_virus.csv
```

**Приоритет**: Если указан `params.sourmash_db_config` → читать CSV, иначе → использовать `params.sourmash_databases`

### 2. Получение target_taxa

**Источник данных**: 
- `meta.taxid` (уже используется в `AUTOFILTER_AND_CHECK_ASSEMBLY`)
- NCBI taxonomy файлы: `ncbi_taxonomy_path`, `ncbi_ranked_lineage_path`

**Новый параметр**:
```groovy
params.sourmash_taxonomy_level = 'order'  // class, family, order, genus, phylum
```

**Формат выхода**: `level:taxa_name` (например, `order:Artiodactyla`)

**Отдельная задача**: Создать модуль/функцию для извлечения таксономической информации из taxid на заданном уровне

### 3. Параметры sketch (k и s)

**Логика построения sketch:**
1. Собрать все уникальные значения `k_for_search` из всех баз данных
2. Взять минимальное значение `s` из всех баз
3. Сформировать param-string для `SOURMASH_SKETCH` со всеми необходимыми k

**Пример:**
- База1: k_for_search=51, s=200
- База2: k_for_search=31, s=200
- База3: k_for_search=21, s=1000
→ Sketch параметры: `scaled=200,k=21,k=31,k=51`

**Важно:** Sketch создается ОДИН раз со всеми k, которые будут использоваться в multisearch

**Реализация:** Парсинг конфигурации баз → сбор уникальных `k_for_search` → генерация `task.ext.args` через `modules.config`

### 4. Обработка множественных баз данных

**Поток данных**:
```
1. Парсинг конфигурации → сбор всех k_for_search
2. SOURMASH_SKETCH (один sketch со всеми уникальными k)
3. SOURMASH_MULTISEARCH (N параллельных поисков):
   - Каждая база использует свой k_for_search
   - Добавление db_name и k_for_search в meta
4. CAT_CAT (объединение результатов от всех баз)
5. Проверка на дубликаты assembly_taxa_db (warning)
6. MERGE assembly_taxa_db files (если несколько уникальных путей)
7. PARSE_SOURMASH (финальная обработка)
```

**Важно:** 
- Для каждой базы в multisearch используется только ОДИН k (из `k_for_search`)
- Имя базы и используемый k добавляются в meta для трекинга
- Sketch содержит все k для всех баз (один раз генерируется)

---

---

## Зависимости между задачами

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

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Несовместимость форматов Sourmash с autofilter | Средняя | Задача 3.2: адаптация скрипта под формат |
| Проблемы с памятью при больших базах | Низкая | Используем resource labels из спецификации |
| Отсутствие taxid в некоторых samples | Высокая | Graceful skip с warning |
| Дубликаты в assembly_taxa_db | Средняя | Проверка + warning, не fail |

---

## Примечания для разработчиков

1. **Не забыть раскомментировать** outputs в main.nf
2. **Добавить `.view()` для отладки** на критичных этапах (можно удалить после тестирования)
3. **Использовать existing patterns**: посмотреть на `RUN_NT_KRAKEN`, `RUN_FCSGX` как reference
4. **Optional inputs**: использовать `Channel.of([[id: "NA"], []])` для skip mode

# Обновление: Обработка k-параметров в Sourmash

**Дата:** 22 октября 2025  
**Изменение:** Добавлена поддержка множественных k-меров в базах данных

---

## Проблема

Базы данных Sourmash могут содержать несколько значений k (например, k=21,31,51), но для поиска в каждой базе нужно использовать только одно оптимальное значение k.

---

## Решение

### Новая структура конфигурации базы:

```groovy
[
    name: 'vertebrate_k51',
    path: '/prod/vertebrate.zip',
    k_available: [31, 51],        // Какие k есть в базе (документация)
    k_for_search: 51,              // Какой k использовать для поиска (ОДИН)
    s: 200,
    assembly_taxa_db: '/prod/assembly_taxa_vertebrate.csv'
]
```

### Алгоритм работы:

1. **Парсинг конфигурации**
   - Читаем все базы данных
   - Собираем все `k_for_search` из всех баз → `[21, 31, 51]`
   - Находим `min(s)` → `200`

2. **SOURMASH_SKETCH (один раз)**
   - Создаем sketch со ВСЕМИ k, которые будут использоваться
   - Параметры: `scaled=200,k=21,k=31,k=51,abund`
   - Результат: один файл `.sig` со всеми k

3. **SOURMASH_MULTISEARCH (N раз, параллельно)**
   - База1 (k_for_search=51) → `sourmash multisearch --ksize 51`
   - База2 (k_for_search=31) → `sourmash multisearch --ksize 31`
   - База3 (k_for_search=21) → `sourmash multisearch --ksize 21`

4. **Объединение и парсинг**
   - CAT_CAT → объединяем результаты
   - PARSE_SOURMASH → финальная обработка

---

## Пример конфигурации

### Production (Nextflow config):

```groovy
params.sourmash_databases = [
    // Позвоночные: оптимально k=51
    [
        name: 'vertebrate_k51',
        path: '/prod/sourmash/vertebrate.zip',
        k_available: [31, 51],
        k_for_search: 51,
        s: 200,
        assembly_taxa_db: '/prod/sourmash/assembly_taxa_vertebrate.csv'
    ],
    
    // Беспозвоночные: оптимально k=31
    [
        name: 'invertebrate_k31',
        path: '/prod/sourmash/invertebrate.zip',
        k_available: [31, 51],
        k_for_search: 31,
        s: 200,
        assembly_taxa_db: '/prod/sourmash/assembly_taxa_invertebrate.csv'
    ],
    
    // Вирусы: только k=21
    [
        name: 'virus_k21',
        path: '/prod/sourmash/virus.zip',
        k_available: [21, 31],
        k_for_search: 21,
        s: 1000,
        assembly_taxa_db: '/prod/sourmash/assembly_taxa_virus.csv'
    ],
    
    // Бактерии (GTDB): k=31
    [
        name: 'gtdb_bacteria_k31',
        path: '/prod/sourmash/gtdb_bacteria.rocksdb',
        k_available: [31],
        k_for_search: 31,
        s: 1000,
        assembly_taxa_db: '/prod/sourmash/assembly_taxa_gtdb.csv'
    ]
]
```

### CSV формат:

```csv
name,path,k_available,k_for_search,s,assembly_taxa_db
vertebrate_k51,/prod/sourmash/vertebrate.zip,"[31,51]",51,200,/prod/sourmash/assembly_taxa_vertebrate.csv
invertebrate_k31,/prod/sourmash/invertebrate.zip,"[31,51]",31,200,/prod/sourmash/assembly_taxa_invertebrate.csv
virus_k21,/prod/sourmash/virus.zip,"[21,31]",21,1000,/prod/sourmash/assembly_taxa_virus.csv
gtdb_bacteria_k31,/prod/sourmash/gtdb_bacteria.rocksdb,[31],31,1000,/prod/sourmash/assembly_taxa_gtdb.csv
```

---

## Изменения в коде

### 1. Workflow (ascc_genomic.nf)

```groovy
// Парсинг конфигурации
ch_sourmash_dbs = parse_sourmash_databases()

// Сбор уникальных k для sketch
all_k = ch_sourmash_dbs.map { it.k_for_search }.flatten().unique().sort()
min_s = ch_sourmash_dbs.map { it.s }.min()

// Генерация параметров для sketch
sketch_params = "dna --param-string 'scaled=${min_s},k=${all_k.join(',k=')},abund'"

// SOURMASH_SKETCH с динамическими параметрами
SOURMASH_SKETCH (genome_fasta)

// Комбинируем с базами, добавляем meta
ch_multisearch_input = SOURMASH_SKETCH.out.signatures
    .combine(ch_sourmash_dbs)
    .map { meta, sig, db ->
        def new_meta = meta + [db_name: db.name, k: db.k_for_search, s: db.s]
        [new_meta, sig, db.path, db.k_for_search, db.s]
    }

// SOURMASH_MULTISEARCH с db-specific k
SOURMASH_MULTISEARCH (ch_multisearch_input)
```

### 2. Модуль SOURMASH_MULTISEARCH

```groovy
process SOURMASH_MULTISEARCH {
    input:
    tuple val(meta), path(signature), path(database), val(k_for_search), val(s)
    
    script:
    """
    sourmash multisearch \\
        ${signature} \\
        ${database} \\
        --ksize ${k_for_search} \\
        --scaled ${s} \\
        -o ${meta.id}_${meta.db_name}_k${k_for_search}_multisearch.csv
    """
}
```

---

## Преимущества подхода

✅ **Эффективность**: Один sketch на все базы (не дублирование)  
✅ **Гибкость**: Каждая база использует оптимальный k  
✅ **Производительность**: Оптимизация под специфику каждой базы (вирусы k=21, эукариоты k=51)  
✅ **Прозрачность**: Явное указание какие k доступны и какой используется  
✅ **Отслеживание**: db_name и k добавляются в meta для debugging

---

## Обновленные задачи

### Задача 1.1: Конфигурация параметров
- Добавить структуру с `k_available` и `k_for_search`
- Динамическая генерация `task.ext.args` для sketch

### Задача 1.2: Парсинг конфигурации
- Сбор всех `k_for_search` для sketch
- Валидация структуры конфигурации

### Задача 2.1: Подготовка каналов
- Обогащение meta информацией о базе и k
- Формирование input для multisearch с db-specific k

### Задача 2.4: Модификация SOURMASH_MULTISEARCH (новая)
- Принимать `k_for_search` как параметр
- Использовать в команде `--ksize ${k_for_search}`

---

## Вопросы для проверки

- [x] Можно ли использовать только один k в multisearch? → **Да**
- [x] Как указывать k_available в CSV? → **JSON array: "[31,51]"**
- [x] Нужно ли поле k_available? → **Да, для документации и валидации**
- [x] Формат k_for_search? → **Одно число (не список)**

---

## Следующие шаги

1. Обновить структуру баз данных в тестовом конфиге
2. Реализовать парсинг с поддержкой новых полей
3. Модифицировать SOURMASH_MULTISEARCH для приема k_for_search
4. Протестировать на тестовых данных

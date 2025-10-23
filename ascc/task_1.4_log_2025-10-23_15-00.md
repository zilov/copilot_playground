# Лог выполнения задачи 1.4: Извлечение target_taxa из taxid

**Дата**: 23 октября 2025  
**Время начала**: 14:56  
**Время окончания**: 15:00  
**Статус**: ✅ Выполнено

## Описание задачи

Создать модуль/функцию для извлечения `target_taxa` из `taxid` с использованием NCBI rankedlineage.dmp файла.

### Требования:
- **Вход**: taxid (из meta), ncbi_ranked_lineage_path, taxonomy_level (параметр)
- **Выход**: target_taxa строка в формате `level:taxa_name` (например, `order:Artiodactyla`)
- **Обработка ошибок**: Warning + skip Sourmash если taxid не найден или уровень отсутствует

## Выполненные шаги

### 1. Изучение формата NCBI ranked lineage файла ✅

**Анализированные файлы**:
- `/Users/dz11/github/ascc/bin/parse_fcsgx_result.py` (функция `get_lineages_by_taxid`)
- `/Users/dz11/github/ascc/bin/get_lineage_for_top.py` (функция `parse_taxdump`)

**Формат rankedlineage.dmp**:
```
taxid | name | species | genus | family | order | class | phylum | kingdom | domain
```
- Разделитель: `|`
- Индексы колонок:
  - 0: taxid
  - 1: name
  - 2: species
  - 3: genus
  - 4: family
  - 5: order
  - 6: class
  - 7: phylum
  - 8: kingdom
  - 9: domain

### 2. Создание Python скрипта ✅

**Файл**: `/Users/dz11/github/ascc/bin/get_target_taxa_from_taxid.py`

**Функциональность**:
- Парсинг rankedlineage.dmp файла
- Поиск записи по taxid
- Извлечение таксона на указанном уровне (species, genus, family, order, class, phylum, kingdom, domain)
- Форматирование в строку `level:taxa_name`
- Обработка ошибок:
  - Если taxid не найден → записывает "TAXID_NOT_FOUND" в выходной файл + warning в stderr
  - Если уровень пустой → записывает "LEVEL_EMPTY" в выходной файл + warning в stderr
  - Процесс завершается с exit code 0 (не блокирует pipeline)

**Параметры командной строки**:
```bash
--taxid <taxid>              # Target taxid для поиска
--rankedlineage <path>       # Путь к NCBI rankedlineage.dmp
--level <level>              # Уровень таксономии (order, class, family, etc.)
--output <output_file>       # Выходной файл для target_taxa
--version                    # Версия скрипта
```

**Версия**: 1.0.0

### 3. Создание Nextflow модуля ✅

**Файл**: `/Users/dz11/github/ascc/modules/local/get/target_taxa/main.nf`

**Структура процесса**:
```groovy
process GET_TARGET_TAXA {
    tag "${meta.id}"
    label 'process_low'
    
    input:
    tuple val(meta), val(taxid)
    path( rankedlineage )
    val( taxonomy_level )
    
    output:
    tuple val(meta), path( "*.txt" ) , emit: target_taxa
    path "versions.yml"              , emit: versions
```

**Особенности**:
- Использует Python 3.9 контейнер/conda environment
- Проверяет результат выполнения скрипта (grep для TAXID_NOT_FOUND или LEVEL_EMPTY)
- Выводит warning в случае ошибки, но не прерывает pipeline
- Включает stub-версию для тестирования
- Генерирует versions.yml с информацией о версиях

**Дополнительные файлы**:
- `/Users/dz11/github/ascc/modules/local/get/target_taxa/environment.yml` - conda окружение (Python 3.9)

### 4. Обработка ошибок ✅

**Реализованные механизмы**:

1. **В Python скрипте**:
   - Проверка существования rankedlineage.dmp файла
   - Поиск taxid в файле
   - Проверка наличия данных на запрашиваемом уровне таксономии
   - Вывод информативных сообщений в stderr
   - Запись специальных маркеров в выходной файл для последующей обработки

2. **В Nextflow модуле**:
   - Проверка содержимого выходного файла на наличие маркеров ошибок
   - Вывод warning в stderr при обнаружении ошибок
   - Продолжение работы pipeline (не блокирует выполнение)

**Механизм skip Sourmash**:
- Выходной файл содержит маркер ошибки (TAXID_NOT_FOUND или LEVEL_EMPTY)
- Последующие процессы могут проверять содержимое файла и пропускать обработку
- Будет реализовано в workflow при интеграции модуля

## Созданные файлы

1. **Python скрипт**:
   - `/Users/dz11/github/ascc/bin/get_target_taxa_from_taxid.py` (исполняемый)

2. **Nextflow модуль**:
   - `/Users/dz11/github/ascc/modules/local/get/target_taxa/main.nf`
   - `/Users/dz11/github/ascc/modules/local/get/target_taxa/environment.yml`

3. **Документация**:
   - `/Users/dz11/github/copilot_playground/ascc/task_1.4_log_2025-10-23_15-00.md` (этот файл)

## Примеры использования

### Python скрипт:
```bash
get_target_taxa_from_taxid.py \
    --taxid 9913 \
    --rankedlineage /path/to/rankedlineage.dmp \
    --level order \
    --output target_taxa.txt
```

**Выход** (успешный):
```
order:Artiodactyla
```

**Выход** (ошибка - taxid не найден):
```
TAXID_NOT_FOUND
```

### Nextflow модуль:
```groovy
GET_TARGET_TAXA (
    sample_with_taxid,           // tuple val(meta), val(taxid)
    ncbi_ranked_lineage_path,    // path
    params.sourmash_taxonomy_level  // val
)
```

## Следующие шаги

1. ✅ Задача 1.4 выполнена полностью
2. ⏭️ Переход к следующей задаче (Фаза 2: Интеграция RUN_SOURMASH)
3. 📝 Модуль готов к использованию в workflow при интеграции Sourmash

## Технические детали

### Производительность:
- **Label**: `process_low` (низкие требования к ресурсам)
- **Обработка**: Однопроходное чтение rankedlineage.dmp (не загружается полностью в память)
- **Скорость**: Быстрая (поиск останавливается при нахождении taxid)

### Совместимость:
- Python 3.9+
- Nextflow DSL2
- Совместимо с conda и singularity/docker контейнерами

### Валидация:
- Скрипт проверяет формат входных данных
- Nextflow модуль включает stub для тестирования
- Готов к написанию nf-test тестов (будет выполнено позже в задаче 2.5)

## Заметки для интеграции

При интеграции в workflow (`ascc_genomic.nf`):

1. Вызвать модуль перед RUN_SOURMASH:
```groovy
GET_TARGET_TAXA (
    ch_samples_with_taxid,
    ncbi_ranked_lineage_path,
    params.sourmash_taxonomy_level
)
```

2. Проверить результат и отфильтровать failed samples:
```groovy
ch_valid_target_taxa = GET_TARGET_TAXA.out.target_taxa
    .map { meta, file ->
        def content = file.text.trim()
        if (content == "TAXID_NOT_FOUND" || content == "LEVEL_EMPTY") {
            log.warn "Skipping Sourmash for sample ${meta.id}: ${content}"
            return null
        }
        return [meta, content]
    }
    .filter { it != null }
```

3. Передать в RUN_SOURMASH только валидные образцы

---

**Время выполнения**: ~4 минуты  
**Статус**: ✅ Успешно завершено

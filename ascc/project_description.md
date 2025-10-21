zilov-martini: улучши промпт для составления плана дальнейшей разработки, ниже мой черновик:

"""check main pipeline, main pipeline parameters and configs and new sourmash subworkflow, understand the stucture of the project.
new subworkflow was introduced but not setted up properly to integrate in main pipeline, find out what need to be added and how and create a plan to add everything that missed"""

GitHub Copilot: Here's an improved prompt for creating a development plan:

```markdown
# Development Plan: Sourmash Subworkflow Integration

## Context
A new Sourmash subworkflow has been created at `subworkflows/local/run_sourmash/main.nf` but is not fully integrated into the main ASCC genomic pipeline.

## Analysis Required

### 1. Code Structure Review
- Examine the main pipeline architecture in `workflows/ascc_genomic.nf`
- Understand the pattern used by existing subworkflows (e.g., `GET_KMERS_PROFILE`, `EXTRACT_TIARA_HITS`, `RUN_NT_KRAKEN`)
- Review how other subworkflows handle:
  - Input channel preparation
  - Parameter passing
  - Output channel mapping
  - Version tracking
  - Conditional execution based on `params.run_*` flags

### 2. Sourmash Subworkflow Assessment
Review `RUN_SOURMASH` subworkflow and identify:
- Required input channels (currently: genome_fasta, sourmash_database, assembly_taxa_db, target_taxa, k, s)
- Expected output channels (currently only `versions` is emitted)
- Missing output emissions (commented out: sourmash_summary, sourmash_non_target)
- Database requirements and setup

### 3. Integration Gaps Analysis
Identify missing components:
- **Parameters**: Check if `params.run_sourmash`, `params.sourmash_*` exist in config
- **Input preparation**: How to create/format the `ch_dbs` channel
- **Database paths**: Define sourmash database locations in params
- **Output handling**: 
  - Uncomment and map output channels
  - Add process metadata (similar to `.map { it -> [[id: it[0].id, process: "SOURMASH"], it[1]] }`)
  - Include in merge operations if needed
- **Conditional execution**: Add proper run flags like other subworkflows

### 4. Deliverable Plan
Create a structured implementation plan including:
- [ ] Required parameter additions to `nextflow.config`
- [ ] Database setup instructions
- [ ] Input channel preparation steps
- [ ] Output channel mapping and metadata formatting
- [ ] Integration with merge operations (CREATE_BTK_DATASET, ASCC_MERGE_TABLES)
- [ ] Testing strategy
- [ ] Documentation updates

## Expected Outcome
A detailed, step-by-step implementation plan that follows the existing pipeline conventions and enables full Sourmash integration.
```

This improved prompt:
- Provides clear context
- Breaks down analysis into logical sections
- References specific existing patterns to follow
- Identifies concrete gaps to address
- Requests a structured, actionable deliverable

zilov-martini: задай мне вопросы для уточния плана чтобы я тебе более подробно все объяснил

GitHub Copilot: # Уточняющие вопросы для детализации плана интеграции Sourmash

## 1. Назначение и приоритет
- **Какова основная цель интеграции Sourmash?** (таксономическая классификация, поиск контаминации, что-то другое?)
- **Какой приоритет у этой задачи?** (критично для релиза, экспериментальная функция, опциональная?)
- **Должен ли Sourmash работать параллельно с другими инструментами** (например, Kraken, BLAST) или заменять какой-то из них?

## 2. Входные данные и базы данных

### Базы данных
- **Где должны храниться базы данных Sourmash?** (локально, удаленно, как параметр?)
- **Сколько баз данных предполагается использовать одновременно?** (судя по коду - несколько, это правильно?)
- **Какие конкретно базы планируется использовать?** (GTDB? GenBank? RefSeq? custom?)
- **Как должна передаваться `assembly_taxa_db`?** (это отдельный файл? часть основной базы?)

### Параметр `target_taxa`
- **Что такое `target_taxa`?** (целевой организм? список таксонов для фильтрации?)
- **Как пользователь должен его указывать?** (параметр командной строки? из samplesheet?)
- **Связан ли он с существующими `taxid` или `scientific_name`?**

### Параметры k и s
- **Должны ли `k` (ksize) и `s` (scaled) быть глобальными параметрами** или можно использовать значения по умолчанию из модулей?
- **Нужно ли поддерживать множественные значения k?** (например, k=21,31,51?)

## 3. Выходные данные

### Закомментированные outputs
```groovy
// sourmash_summary            = PARSE_SOURMASH.out.summary_csv
// sourmash_non_target         = PARSE_SOURMASH.out.nontarget_csv
```
- **Почему эти выходы закомментированы?** (не готовы? временно? не нужны в pipeline?)
- **Должны ли они интегрироваться в:**
  - `CREATE_BTK_DATASET`?
  - `ASCC_MERGE_TABLES`?
  - Оба?
  - Свой отдельный отчет?

### Формат данных
- **В каком формате должны быть `summary_csv` и `nontarget_csv`?** (похожи на другие outputs типа `ch_tiara`, `ch_kraken`?)
- **Нужно ли добавлять метаданные процесса** (`.map { it -> [[id: it[0].id, process: "SOURMASH"], it[1]] }`)?

## 4. Условия запуска

### Параметры конфигурации
Посмотрев на паттерн в main workflow:
```groovy
if ( params.run_sourmash == "both" || params.run_sourmash == "genomic" )
```
- **Должен ли Sourmash поддерживать режимы "genomic"/"transcript"/"both"** как другие инструменты?
- **Или достаточно простого boolean флага?**

### Зависимости
- **Зависит ли Sourmash от других шагов pipeline?** (например, должен ли сначала отработать `ESSENTIAL_JOBS`?)
- **Может ли он запускаться независимо** или нужны результаты других процессов?

## 5. Технические детали

### Текущий код
```groovy
ch_dbs = Channel.empty()
RUN_SOURMASH (
    sourmash_reference,
    ch_dbs
)
```
- **Почему `ch_dbs` пустой?** (placeholder? не готово? должно заполняться динамически?)
- **Откуда должны браться пути к базам данных?** (params? config файл? samplesheet?)

### PARSE_SOURMASH
- **Модуль `PARSE_SOURMASH` - это ваша разработка** или адаптация существующего?
- **Он стабилен** или еще в процессе разработки?
- **Планируется ли его submit в nf-core** или останется в local?

## 6. Тестирование
- **Есть ли тестовые данные для Sourmash?**
- **Какой размер типичного входного генома?** (это влияет на resource requirements)
- **Как долго обычно работает Sourmash на вашем типичном датасете?**

## 7. Документация и стратегия разработки
- **Хотите сначала доработать в ASCC**, а потом submit в nf-core?
- **Или сначала довести модули до nf-core стандартов**, а потом интегрировать?
- **Нужна ли backward compatibility** с предыдущими версиями pipeline?

---

**Пожалуйста, ответьте на те вопросы, которые считаете наиболее важными для составления плана. Можно группами или выборочно.**

zilov-martini: 1. поиск контигов-контаминантов в геномных сборках, контаминация определяеться по отсутствию target-taxa kmers в contig. критична, отдельная от кракена и бласта. используется совместно с fcs-gx и tiara, результаты всех тулов комбинируются и выносится решение. пока реализовано только для fcs-gx и tiara, нужно добавить sourmash как третий тул. 
2. базы данных. как параметр. у нас в проде на сервере, пути будут указаны дефолтные в conf/production.config. для теста база данных на данный момент в папке assets/sourmash_testing/db, потом положу в облако как лежат остальные тестовые базы - эту задачку напиши для меня отдельно в план я ее сделаю. больше 5 баз, но параметрами можно указать и одну. кастомная база, сами делали под эту задачу.  assembly_taxa_db - часть основной базы или нескольких баз сразу. база может быть .zip и .rocksdb, значение k и s у базы уникально. в метаданные процесса можно добавить название базы данных с которой он работает. видимо тут нужен файл который пойдет на вход со списком баз данных например - name, path, k, s, assembly_db что-то такое. если один и тот же путь до assembly_db то его и использовать, если несколько то перед запуском parse_sourmash смерджить с помощью cat. 
3. target_taxa. таксон целевого организма, доставаться должен через taxid из ncbi taxonomy (он где-то используется в пайплайне наверняка), из интернета или из локальных файлов неважно, вероятно вся база таксономии пайплайном загружается перед запуском но я в этом не уверен. target_taxa из себя предствляет строку, например order:Artiodactyla. если сейчасм пользователь taxid не указывает или он не цепляется атоматически, то нужен параметр. в параметры нужно добавить уровень - один из [class, family, order, genus, phylum]. 
4. k и s можно для sketch можно указывать в зависимости от значений в базах данных. условно в базах используется k=21,51 и s=200,1000. тогда для sketch параметре k=21,51, s=200. s=1000 можно не указывать так как 200*5=1000, sourmash справится с анализом, у него логика прописана. 
5. про выходные файлы. забыл раскомментить, в идеале интегрироваться и в btk и в merge_tables где результаты fcs и tiara мерджатся (может быть другое название). минимально и изначально делать для части с fcs и tiara. summary и non-target генерятся скриптом, формат уже утвержден, скрипт в bin/sourmash_taxonomy_parser.py
6. про запуск. можно both если несложно, но основное использование планируется в genomic. по зависимостям может сразу запускаться, нужен геном и список баз данных.
7. детали. пока не готово. params или конфиг подробности выше. parse_sourmash - моя разработка для этого проекта. потом может быть в nf-core, пока неактуально.
8. тестирование. тестовые данные в assets/sourmash_testing. там один геном две базы и один assembly_taxa_db. геномы разные от сотни мегабаз до десятков гигабаз. меньше часа на базу данных. размер баз данных тут (DB	K=31, S=200	K=51, S=200	K=51, S=1000
Vertebrate	Time: 35 m, RAM: 85 Gb	Time: 45m, RAM: 91 Gb	Time: 16m, RAM: 29 Gb
Invertebrate	Time: 26m, RAM: 62 Gb	Time: 37m, RAM: 70 Gb	Time: 12m,RAM: 21 Gb
Plants Fungi Protozoa	Time: 17m, RAM: 39 Gb	Time: 25m,RAM: 49 Gb	Time: 8m,RAM: 18 Gb
Large genomes	Same as Plants		
GTDB (Bacteria + Archea)	8Gb Max		
Viruses (k=21)	1Gb Max		)
9. мы пока параллельно с nf-core разрабатываем из-за политики компании, пока неактуально. 

GitHub Copilot: Отлично, теперь картина намного яснее! Вот уточняющие вопросы для финализации плана:

## Критические технические вопросы

### 1. Структура конфигурации баз данных

Вы упомянули файл со списком баз. Какой формат предпочтительнее?

**Вариант A: CSV/TSV файл**
```csv
name,path,k,s,assembly_taxa_db
vertebrate_k31_s200,/path/to/vertebrate_k31_s200.zip,31,200,/path/to/assembly_taxa_vertebrate.csv
vertebrate_k51_s200,/path/to/vertebrate_k51_s200.zip,51,200,/path/to/assembly_taxa_vertebrate.csv
invertebrate_k31_s200,/path/to/invertebrate_k31_s200.rocksdb,31,200,/path/to/assembly_taxa_invertebrate.csv
```

**Вариант B: Nextflow config параметры**
```groovy
params {
    sourmash_databases = [
        [name: 'vertebrate_k31_s200', path: '/path/to/db.zip', k: 31, s: 200, assembly_taxa_db: '/path/to/taxa.csv'],
        [name: 'vertebrate_k51_s200', path: '/path/to/db.zip', k: 51, s: 200, assembly_taxa_db: '/path/to/taxa.csv']
    ]
}
```

**Вариант C: YAML sidecar**
```yaml
databases:
  - name: vertebrate_k31_s200
    path: /path/to/vertebrate.zip
    k: 31
    s: 200
    assembly_taxa_db: /path/to/assembly_taxa_vertebrate.csv
```

**Какой вариант предпочтительнее?** (или другой формат?)

---

### 2. Получение target_taxa из taxid

Есть ли в пайплайне уже готовая логика получения таксономической информации из taxid?

**Вопросы:**
- **Какой модуль/функция сейчас работает с NCBI taxonomy?** (может есть `GET_TAXONOMY` или подобное?)
- **Где хранятся файлы taxonomy?** (видел `ncbi_taxonomy_path`, `ncbi_ranked_lineage_path` в параметрах main workflow)
- **Формат target_taxa строго `level:name`?** (например, всегда `order:Artiodactyla`, никогда просто `Artiodactyla`?)

**Предлагаемый параметр:**
```groovy
params {
    sourmash_taxonomy_level = 'order'  // class, family, order, genus, phylum
    // или автоматически из taxid?
}
```

**Нужен ли fallback**, если taxid не указан? (например, skip Sourmash или ошибка?)

---

### 3. Интеграция с autofilter

Вы сказали: *"используется совместно с fcs-gx и tiara, результаты всех тулов комбинируются"*

Посмотрев на код:
```groovy
AUTOFILTER_AND_CHECK_ASSEMBLY (
    reference_tuple_from_GG,
    ch_fcsgx,           // FCS-GX results
    ch_tiara,           // Tiara results
    ch_sourmash ???     // <-- сюда нужно добавить?
)
```

**Вопросы:**
- **Модуль `AUTOFILTER_AND_CHECK_ASSEMBLY` уже готов принимать третий input?** (или нужно модифицировать?)
- **Формат выходных данных Sourmash должен совпадать с форматом Tiara/FCS-GX?** (структура CSV, колонки и т.д.)
- **Логика комбинирования** - это OR (любой из трех инструментов нашел контаминацию) или AND (все три согласны)?

---

### 4. Merge в ASCC_MERGE_TABLES

```groovy
ASCC_MERGE_TABLES (
    reference_tuple_from_GG,
    // ... другие inputs
    ch_sourmash_summary,     // <-- добавить?
    ch_sourmash_nontarget    // <-- или оба?
)
```

**Вопросы:**
- **Какой из файлов нужен в merge: `summary_csv`, `nontarget_csv`, или оба?**
- **Должен ли Sourmash быть обязательным для merge**, или optional (как некоторые другие инструменты)?

---

### 5. Обработка множественных баз данных

Сейчас в коде:
```groovy
multisearch_input = SOURMASH_SKETCH.out.signatures.combine(sourmash_database)
```

Это создаст **N jobs** (по одному на каждую базу). Потом результаты объединяются через `CAT_CAT`.

**Вопросы:**
- **Это правильное поведение?** (N параллельных поисков → объединение результатов)
- **При мердже нескольких `assembly_taxa_db`** - нужно ли удалять дубликаты? (если одна и та же таксономическая информация в двух базах)
- **Как должны именоваться промежуточные файлы?** (добавлять имя базы в meta?)

Предлагаемая логика:
```groovy
// Добавить имя базы в meta для отслеживания
multisearch_input = SOURMASH_SKETCH.out.signatures
    .combine(sourmash_database)
    .map { meta, sig, db_info -> 
        [meta + [db_name: db_info.name, k: db_info.k, s: db_info.s], sig, db_info.path]
    }
```

**Согласны с таким подходом?**

---

### 6. Параметры k и s для SOURMASH_SKETCH

Вы сказали: *"k и s можно для sketch указывать в зависимости от значений в базах данных"*

**Логика:**
1. Парсим все базы, собираем уникальные k и s
2. Для sketch используем: `k = unique_k`, `s = min(unique_s)`

**Пример:**
- База1: k=31, s=200
- База2: k=51, s=200
- База3: k=51, s=1000

→ `SOURMASH_SKETCH` запускается с `k=31,51` и `s=200`

**Вопросы:**
- **Это правильная интерпретация?**
- **Sketch нужен один для всех баз** или отдельный для каждой комбинации k/s?
- **Как передавать список k?** (строка `"31,51"` или список `[31, 51]`?)

---

### 7. Условия запуска и skip логика

```groovy
if ( params.run_sourmash == "both" || params.run_sourmash == "genomic" ) {
    RUN_SOURMASH (...)
    ch_sourmash_summary = RUN_SOURMASH.out.sourmash_summary
} else {
    ch_sourmash_summary = Channel.of( [[],[]] )
}
```

**Вопросы:**
- **Нужна ли проверка наличия баз данных** перед запуском? (как с FCS-GX)
- **Что делать если `taxid` не указан и не может быть определен?** 
  - Skip Sourmash?
  - Выдать warning и продолжить?
  - Fail pipeline?

---

### 8. Приоритетность задач

**Что делаем в первую очередь:**

A. **Минимальная интеграция** (только запуск Sourmash, без autofilter/merge)
B. **Интеграция с autofilter** (добавление в логику фильтрации)
C. **Интеграция с merge_tables** (добавление в итоговый отчет)
D. **Полная интеграция** (все сразу + BTK)

**Какой порядок предпочтительнее?**

---

### 9. Тестирование

Для тестового запуска нужно:
```groovy
// nextflow.config или test.config
params {
    input = 'assets/sourmash_testing/samplesheet.csv'  // <-- есть такой?
    sourmash_database_config = 'assets/sourmash_testing/databases.csv'
    taxid = '9903'  // например, для коровы (Bos taurus)
    sourmash_taxonomy_level = 'order'
}
```

**Вопросы:**
- **Есть ли готовый `samplesheet.csv` в sourmash_testing?**
- **Какой taxid использовать для теста?** (и какой таксон он должен дать?)
- **Ожидаемый результат теста** - найти контаминацию или не найти?

---

## Дополнительные мелочи

### 10. Naming conventions
**Как именовать параметры?**
- `params.sourmash_db_config` или `params.sourmash_databases`?
- `params.sourmash_taxonomy_level` или `params.target_taxonomy_level`?

### 11. Error handling
**Что делать при ошибках:**
- База данных не найдена → fail или skip?
- `assembly_taxa_db` отсутствует → fail или skip?
- Все базы дали 0 результатов → warning или fail?

---

**Пожалуйста, ответьте на вопросы из блоков 1-9, особенно 1, 2, 3, 5, 6 и 8 - они критичны для составления детального плана!**

zilov-martini: 1. думаю вариант A. B тоже нравится, но боюсь юзеру будет тяжело, если можно и то и другое то давай в production использовать B и возможность указать через параметр табличкой. 
2. я не уверен, давай отдельную задачку этому посвятим, не успеваю посмотреть. формат да level:taxa_name. параметр ок. смотрю на AUTOFILTER_AND_CHECK_ASSEMBLY и вижу что там вот такие параметры (autofilter.py \\
        $reference \\
        --taxid $meta.taxid \\
        --tiara $tiara_txt \\
        --fcsgx_sum $fcs_csv \\
        --out_prefix $prefix \\
        --ncbi_rankedlineage_path $ncbi_rankedlineage \\
        ${args} \\), так что все должно быть доступно уже. 
3. модуль не готов, я думаю там что-то может быть еще перед этим но не точно. получается нужно будет исправить модуль и autofilter.py. формат не совпадает. логику можно посмотреть в скрипте, я не уверен. 
4. да можно добавить. файл non-target подойдет. можно опционально.
5. да это правльное поведение, дубликатов быть не должно, если есть то можно ворнинг. да имя базы добавить в meta.
6. один для всех баз чтобы не генерить много файлов. сейчас передается вот так def args = task.ext.args ?: "dna --param-string 'scaled=1000,k=21,k=31,k=51,abund'". 
7. да проверить что есть нужно. taxid должен быть скорее всего всегда.
8. давай для всего задачи кроме btk
9. все можешь посмотреть в конфиге в assets/sourmash_testing.
10. params.sourmash_databases, params.sourmash_taxonomy_level
11. skip и warning для всех.


напиши итоговое описание проекта и план без кучи кода для агентов которые будут его выполнять

GitHub Copilot: # Проект: Интеграция Sourmash в ASCC Pipeline

## Цель проекта
Интегрировать субворкфлоу `RUN_SOURMASH` в основной геномный пайплайн для детекции контаминации в геномных сборках. Sourmash будет работать параллельно с FCS-GX и Tiara, результаты всех трех инструментов будут комбинироваться для принятия финального решения о фильтрации контигов-контаминантов.

## Контекст
- **Субворкфлоу**: main.nf (уже создан, но не интегрирован)
- **Основной workflow**: ascc_genomic.nf
- **Принцип работы**: Поиск контигов без k-меров целевого таксона (target taxa) указывает на контаминацию
- **Тестовые данные**: sourmash_testing (геном, 2 базы данных, assembly_taxa_db, конфиг)

---

## Архитектура решения

### 1. Конфигурация баз данных

**Два способа указания баз:**

**A. Через Nextflow config** (для production, production.config):
```groovy
params.sourmash_databases = [
    [name: 'vertebrate_k31_s200', path: '/prod/path/vertebrate_k31_s200.zip', k: 31, s: 200, assembly_taxa_db: '/prod/path/assembly_taxa_vertebrate.csv'],
    [name: 'vertebrate_k51_s200', path: '/prod/path/vertebrate_k51_s200.zip', k: 51, s: 200, assembly_taxa_db: '/prod/path/assembly_taxa_vertebrate.csv']
]
```

**B. Через CSV файл** (для гибкости, параметр `params.sourmash_db_config`):
```
name,path,k,s,assembly_taxa_db
vertebrate_k31_s200,/path/to/db.zip,31,200,/path/to/assembly_taxa.csv
invertebrate_k31_s200,/path/to/db.rocksdb,31,200,/path/to/assembly_taxa.csv
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

**Логика**:
1. Собрать уникальные значения `k` из всех баз данных
2. Взять минимальное значение `s` из всех баз
3. Сформировать param-string для `SOURMASH_SKETCH`

**Пример**:
- База1: k=31, s=200
- База2: k=51, s=1000
→ Sketch параметры: `scaled=200,k=31,k=51,abund`

**Реализация**: Парсинг конфигурации баз → генерация `task.ext.args` через `modules.config`

### 4. Обработка множественных баз данных

**Поток данных**:
```
SOURMASH_SKETCH (один sketch для всех баз)
    ↓
SOURMASH_MULTISEARCH (N параллельных поисков, по одному на базу)
    ↓ (добавить имя базы в meta)
CAT_CAT (объединение результатов)
    ↓ (проверка на дубликаты assembly_taxa_db)
MERGE assembly_taxa_db files (если несколько уникальных путей)
    ↓
PARSE_SOURMASH (финальная обработка)
```

**Важно**: Добавить имя базы данных в meta для отслеживания

---

## План реализации

### Фаза 1: Подготовка инфраструктуры

#### Задача 1.1: Конфигурация параметров
**Файлы**: nextflow.config, modules.config, production.config

**Действия**:
- Добавить параметр `params.sourmash_databases = []`
- Добавить параметр `params.sourmash_db_config = null`
- Добавить параметр `params.sourmash_taxonomy_level = 'order'`
- Добавить условный параметр `params.run_sourmash = 'off'` (поддержка значений: `off`, `genomic`, `both`)
- Настроить `task.ext.args` для `SOURMASH_SKETCH` с динамической генерацией k и s

**Тестовый конфиг**: `assets/sourmash_testing/test.config` (проверить наличие всех необходимых параметров)

#### Задача 1.2: Парсинг конфигурации баз данных
**Локация**: ascc_genomic.nf (в начале workflow)

**Действия**:
- Создать логику чтения CSV файла (если указан `params.sourmash_db_config`)
- Или использовать `params.sourmash_databases` напрямую
- Сформировать channel: `[[name, path, k, s, assembly_taxa_db], ...]`
- Валидация: проверить существование файлов баз данных
- Если базы не найдены → warning + skip Sourmash

#### Задача 1.3: Извлечение target_taxa из taxid
**Новый модуль**: main.nf (или функция в lib/)

**Вход**:
- `taxid` (из meta)
- `ncbi_ranked_lineage_path`
- `taxonomy_level` (параметр)

**Выход**: 
- `target_taxa` строка в формате `level:taxa_name`

**Логика**:
- Парсинг NCBI ranked lineage файла
- Поиск записи по taxid
- Извлечение таксона на указанном уровне
- Форматирование в строку `level:taxa_name`

**Обработка ошибок**: Если taxid не найден или отсутствует → warning + skip Sourmash для данного sample

---

### Фаза 2: Интеграция RUN_SOURMASH

#### Задача 2.1: Подготовка входных каналов
**Локация**: ascc_genomic.nf (в секции Sourmash)

**Действия**:
- Подготовить `genome_fasta` из `reference_tuple_from_GG`
- Создать channel `ch_sourmash_databases` из распарсенной конфигурации
- Вычислить уникальные k и min(s) для `SOURMASH_SKETCH`
- Получить `target_taxa` для каждого sample через новый модуль/функцию
- Подготовить `assembly_taxa_db`: если несколько уникальных путей → merge через `CAT_CAT`

#### Задача 2.2: Вызов RUN_SOURMASH
**Локация**: ascc_genomic.nf

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

#### Задача 2.3: Модификация субворкфлоу
**Файл**: main.nf

**Изменения**:
1. Добавить имя базы в meta при `combine` с базами данных
2. Раскомментировать emit для `sourmash_non_target`
3. Добавить логику проверки дубликатов в `assembly_taxa_db` (warning если есть)
4. Добавить `.view()` для отладки на критичных этапах

---

### Фаза 3: Интеграция с Autofilter

#### Задача 3.1: Модификация модуля AUTOFILTER_AND_CHECK_ASSEMBLY
**Файл**: main.nf

**Действия**:
- Добавить входной параметр: `path(sourmash_nontarget)`
- Передать файл в скрипт: `--sourmash $sourmash_nontarget`
- Обработать optional input (если Sourmash не запускался)

#### Задача 3.2: Модификация скрипта autofilter.py
**Файл**: autofilter.py (предположительно)

**Действия**:
- Добавить аргумент командной строки `--sourmash`
- Парсинг файла `nontarget_csv` от Sourmash
- Интеграция результатов Sourmash в логику фильтрации (комбинирование с FCS-GX и Tiara)
- **Уточнить логику**: OR (любой нашел) или взвешенное решение?

#### Задача 3.3: Обновление вызова в workflow
**Файл**: ascc_genomic.nf

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

### Фаза 4: Интеграция с Merge Tables

#### Задача 4.1: Добавление в ASCC_MERGE_TABLES
**Файл**: ascc_genomic.nf

**Действия**:
- Определить, нужен ли `nontarget_csv` в итоговой таблице (опционально)
- Добавить channel `ch_sourmash_nontarget` в inputs `ASCC_MERGE_TABLES`
- Отформатировать meta: `.map { it -> [[id: it[0].id, process: "SOURMASH"], it[1]] }`

#### Задача 4.2: Модификация модуля ASCC_MERGE_TABLES
**Файл**: main.nf

**Действия**:
- Добавить optional input для Sourmash
- Обработать случай, когда Sourmash не запускался

---

### Фаза 5: Тестирование и документация

#### Задача 5.1: Подготовка тестового окружения
**Действия**:
- Проверить наличие всех файлов в sourmash_testing
- Создать `samplesheet.csv` если отсутствует
- Создать `databases.csv` с описанием тестовых баз
- Обновить `test.config` со всеми необходимыми параметрами

#### Задача 5.2: Загрузка баз данных в облако
**Отдельная задача** (выполняется параллельно):
- Загрузить тестовые базы из db в облачное хранилище
- Обновить пути в тестовом конфиге
- Задокументировать URL для CI/CD

#### Задача 5.3: Интеграционное тестирование
**Сценарии**:
1. **Базовый тест**: Запуск с одной базой данных
2. **Множественные базы**: Запуск с 2+ базами (проверка merge assembly_taxa_db)
3. **Skip тест**: Sourmash отключен (`params.run_sourmash = 'off'`)
4. **Error handling**: Отсутствующая база данных (должен skip с warning)
5. **Autofilter**: Проверка корректности фильтрации контигов

#### Задача 5.4: Документация
**Файлы для обновления**:
- README.md: Описание Sourmash модуля
- usage.md: Параметры конфигурации баз данных
- output.md: Описание выходных файлов Sourmash
- CHANGELOG.md: Запись о новой функциональности

---

## Критерии успеха

### Функциональные требования
- ✅ Sourmash запускается параллельно с FCS-GX и Tiara
- ✅ Поддержка множественных баз данных (5+ баз одновременно)
- ✅ Автоматическое извлечение target_taxa из taxid
- ✅ Корректная обработка различных комбинаций k и s
- ✅ Интеграция результатов в autofilter
- ✅ Опциональное добавление в merge tables
- ✅ Graceful skip при отсутствии баз или taxid

### Производительность
- ✅ Параллельное выполнение поиска по базам
- ✅ Один sketch на все базы (не дублирование)
- ✅ Ожидаемое время: <1 часа на базу (согласно спецификации)
- ✅ RAM requirements: согласно размерам баз (до 91 GB для vertebrate)

### Качество кода
- ✅ Следование паттернам существующих субворкфлоу (TIARA, FCS-GX, KRAKEN)
- ✅ Корректная обработка пустых channels (skip mode)
- ✅ Версионирование всех модулей
- ✅ Error handling с warning вместо fail

---

## Зависимости между задачами

```
1.1 (Конфиг) → 1.2 (Парсинг баз)
1.3 (target_taxa) → 2.1 (Подготовка входов)
2.1 → 2.2 (Запуск RUN_SOURMASH) → 2.3 (Модификация субворкфлоу)
2.2 → 3.1, 3.2, 3.3 (Autofilter интеграция)
2.2 → 4.1, 4.2 (Merge tables интеграция)
Все → 5.3 (Тестирование)
5.2 (Облако) - параллельно
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
5. **Meta enrichment**: добавлять процесс и имя базы в meta для BTK/reporting
6. **BTK интеграция**: отложена на будущее, пока не требуется
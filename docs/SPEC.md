# ТЕХНИЧЕСКОЕ ЗАДАНИЕ

## Telegram Mini App — Retro Arcade

Нужно с нуля разработать полностью рабочий игровой проект внутри Telegram Mini Apps.

Это должна быть не демонстрация, не набор статичных экранов и не три отдельных мини-игры, а единая игровая платформа с собственной retro-вселенной, общим аккаунтом, прогрессией, несколькими игровыми режимами, процедурной генерацией, секретами, скинами, коллекционированием, Loot Boxes, рейтингами, достижениями и административной системой.

После завершения проект должен быть готов к реальному запуску.

---

# 1. ОСНОВНАЯ ИДЕЯ

Создать Telegram Mini App в стиле старых аркадных игр.

Игрок открывает Telegram-бота:

/start

→ 🎮 PLAY

→ открывается Arcade Hub.

В первой полноценной версии должны присутствовать три режима:

1. Snake
2. Maze
3. Platformer

При этом архитектура изначально должна позволять добавлять новые игры без переработки всей системы.

Например, в дальнейшем:

- Brick Breaker;
- Space Shooter;
- Runner;
- Puzzle;
- 2048-like;
- Tetris-like;
- racing;
- дополнительные экспериментальные режимы.

Все игры используют единый профиль пользователя и общие системы прогрессии.

---

# 2. ПЛАТФОРМЫ

Проект НЕ должен разрабатываться только для смартфонов.

Обязательно поддержать:

- iPhone;
- Android;
- планшеты;
- Telegram Desktop;
- Telegram Web;
- desktop browser для разработки и тестирования.

Интерфейс должен адаптироваться под размер экрана.

Desktop-версия должна использовать доступное пространство, а не просто показывать растянутый мобильный интерфейс.

---

# 3. УПРАВЛЕНИЕ

Автоматически определять доступный способ управления.

## Desktop

Использовать:

- WASD;
- стрелки;
- Space;
- дополнительные клавиши действий;
- мышь, если она необходима конкретному режиму.

## Mobile

Использовать:

- swipe;
- virtual joystick;
- экранные кнопки;
- multitouch.

У каждой игры должно быть управление, подходящее именно ей.

Во время игры свайпы не должны прокручивать страницу Mini App.

---

# 4. ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ

Весь проект должен выглядеть как качественная игра старой эпохи, созданная современными технологиями.

Главная формула:

**RETRO 2D + PIXEL ART + НОРМАЛЬНЫЕ ТЕКСТУРЫ + НЕМНОГО 2.5D/3D + СОВРЕМЕННЫЕ ЭФФЕКТЫ**

Не делать обычный современный mobile-game UI с наложенным pixel-фильтром.

Основа:

- pixel art;
- sprite animation;
- tile-based environments;
- retro textures;
- arcade UI;
- характерные старые игровые меню;
- пиксельные эффекты;
- ограниченные цветовые палитры;
- качественная работа с окружением.

Графика должна выглядеть ретро, но не дешёво.

---

# 5. 2.5D / 3D

Допускается умеренное использование 3D.

Использовать его преимущественно для:

- глубины локаций;
- стен;
- пола;
- перспективы;
- освещения;
- теней;
- окружения;
- дверей;
- сундуков;
- декораций;
- воды;
- тумана;
- parallax;
- частиц.

Основные персонажи должны сохранять sprite/pixel-art характер.

Не превращать проект в полноценную современную 3D-игру.

---

# 6. ТЕКСТУРЫ И ЛОКАЦИИ

Не использовать одноцветные примитивные блоки вместо готового окружения.

Локации должны иметь полноценные textures/tilesets.

Maze может содержать различные темы:

- подземелье;
- кирпичные коридоры;
- лаборатория;
- канализация;
- заброшенный комплекс;
- древние руины;
- техническая зона;
- неизвестные секретные зоны.

Platformer должен иметь несколько визуально разных миров.

Каждый мир отличается:

- tileset;
- окружением;
- фоном;
- музыкой;
- освещением;
- противниками;
- ловушками;
- механиками.

---

# 7. RETRO EFFECTS

Предусмотреть:

- CRT;
- scanlines;
- pixel transitions;
- screen shake;
- hit flash;
- лёгкий bloom;
- VHS/glitch в специальных сценах;
- частицы;
- retro boot animations.

Эффекты должны быть настраиваемыми.

GRAPHICS:

LOW

MEDIUM

HIGH

Отдельные настройки:

CRT EFFECT

SCREEN SHAKE

PARTICLES

LIGHTING.

---

# 8. TELEGRAM BOT

Создать Telegram-бота.

Основной сценарий:

/start

→ приветствие

→ кнопка 🎮 PLAY

→ запуск Mini App.

Telegram используется как аккаунт пользователя.

Не требовать:

- email;
- пароль;
- отдельную регистрацию.

---

# 9. TELEGRAM AUTH

Использовать Telegram Mini Apps API.

Backend обязан проверять Telegram initData.

Нельзя доверять:

- user_id;
- username;
- score;
- XP;
- inventory;

которые frontend самостоятельно заявляет без серверной проверки.

---

# 10. ПРОФИЛЬ

Для пользователя хранить:

- Telegram ID;
- username;
- имя;
- avatar;
- registration date;
- last activity;
- account level;
- XP;
- streak;
- game statistics;
- records;
- achievements;
- secrets;
- skins;
- inventory;
- Loot Boxes;
- Platformer progress;
- Maze statistics.

---

# 11. ARCADE HUB

Главный экран должен ощущаться как игровое меню, а не сайт.

Показывать:

- аватар;
- nickname;
- level;
- XP;
- streak;
- последние достижения;
- игровые карточки.

Карточка игры:

название;

анимированное preview;

лучший результат;

прогресс;

выбранный skin;

PLAY.

---

# 12. НАВИГАЦИЯ

Основные разделы:

🎮 GAMES

🏆 LEADERBOARD

🎯 CHALLENGES

🎒 COLLECTION

👤 PROFILE

Дополнительные разделы добавлять при необходимости.

---

# 13. SNAKE

Создать полноценную современную интерпретацию Snake.

Основная механика:

- постоянное движение;
- еда;
- увеличение длины;
- score;
- постепенное увеличение скорости;
- collision;
- Game Over.

Позже в одной сессии появляются:

- препятствия;
- движущиеся препятствия;
- редкая еда;
- временные бонусы;
- score multiplier;
- специальные объекты.

Desktop:

WASD / arrows.

Mobile:

swipe или подходящий touch-controller.

Запретить мгновенный поворот на 180°.

---

# 14. SNAKE — ПРОГРЕСС СЛОЖНОСТИ

Первые минуты должны быть понятными.

Далее игра постепенно становится сложнее.

Не создавать хаос сразу после запуска.

Скорость и количество дополнительных механик увеличиваются постепенно.

---

# 15. MAZE — КЛЮЧЕВОЙ РЕЖИМ

Maze должен быть значительно глубже классической игры с лабиринтом.

Это arcade/roguelite режим с процедурно генерируемыми картами.

Каждый новый run создаёт новый лабиринт.

Игрок должен:

- исследовать;
- собирать предметы;
- избегать врагов;
- сражаться;
- искать ключи;
- открывать двери;
- находить секретные зоны;
- искать пасхалки;
- принимать небольшие решения по маршруту.

---

# 16. PROCEDURAL MAZE GENERATION

Каждый Maze Run получает собственный seed.

Генератор должен создавать разные, но гарантированно проходимые карты.

Поддержать:

- corridors;
- normal rooms;
- large rooms;
- enemy rooms;
- treasure rooms;
- challenge rooms;
- trap rooms;
- locked rooms;
- secret rooms;
- rare rooms;
- special event rooms.

Генерация не должна выглядеть как случайный бессмысленный набор клеток.

Лабиринт должен иметь логическую структуру.

---

# 17. MAZE VALIDATION

После генерации автоматически проверять:

- существует ли путь к обязательным целям;
- можно ли получить необходимые ключи;
- доступны ли обязательные двери;
- возможно ли завершить уровень;
- не появился ли необходимый объект в недоступной зоне.

Создать automated tests, которые прогоняют большое количество seeds.

Не считать генератор готовым, пока он периодически создаёт soft-lock или непроходимые карты.

---

# 18. MAZE — КЛЮЧИ

Добавить locked doors.

Ключ может:

- лежать на карте;
- находиться в chest;
- выпадать из врага;
- выпадать из mini-boss;
- выдаваться после challenge;
- находиться в secret room.

Например:

игрок обнаружил закрытую дверь;

→ исследует карту;

→ встречает Guard;

→ побеждает его;

→ получает KEY;

→ возвращается;

→ открывает новую область.

Не делать одинаковую последовательность в каждом run.

---

# 19. MAZE — ВРАГИ

Создать врагов с действительно разным AI.

Например:

CHASER — преследует.

PATROL — патрулирует.

AMBUSHER — пытается перехватить.

GUARD — защищает объект.

HUNTER — активируется при определённом условии.

RANGED — атакует с расстояния.

MINI BOSS — редкий сильный противник.

Не создавать одного врага с разными картинками.

---

# 20. MAZE — COMBAT

Предусмотреть систему взаимодействия с врагами.

Можно использовать:

- временное оружие;
- abilities;
- power-ups;
- ловушки;
- специальные предметы.

Игрок не обязан постоянно иметь возможность уничтожить любого врага.

Часть противников необходимо избегать.

Некоторых требуется победить для:

- ключа;
- secret;
- Loot Box;
- achievement;
- прохождения.

---

# 21. MAZE — СЕКРЕТЫ

Добавить скрытые механики.

Например:

- fake wall;
- secret passage;
- скрытая кнопка;
- необычный символ;
- невидимый проход;
- странный NPC;
- секретная последовательность действий;
- альтернативный маршрут;
- предмет без очевидного назначения;
- редкая комната.

Не обозначать все секреты стрелкой или знаком вопроса.

Игрок должен исследовать мир самостоятельно.

---

# 22. EASTER EGGS

Добавить систему пасхалок.

Пасхалки могут появляться:

- в Maze;
- Platformer;
- меню;
- Collection;
- после необычного действия;
- на определённом seed;
- с определённым skin;
- после серии событий.

Награда:

- achievement;
- secret skin;
- collectible;
- XP;
- Loot Box;
- новый secret.

Использовать оригинальные элементы и аккуратные культурные отсылки, не копируя напрямую чужих персонажей, логотипы, карты, музыку или ассеты.

---

# 23. RARE EVENTS

Maze generator должен поддерживать редкие события.

Например:

SECRET ROOM

RARE ENEMY

MYSTERY NPC

SPECIAL CHEST

UNKNOWN ROOM

ULTRA RARE EVENT.

Вероятности должны находиться в конфигурации.

Не показывать пользователю реальные проценты непосредственно в игре.

---

# 24. DAILY MAZE

Каждый день сервер создаёт Daily Maze seed.

Все игроки проходят одну и ту же карту.

Создать отдельный Daily Maze Leaderboard.

Следующий день:

→ новый seed

→ новый leaderboard.

---

# 25. PLATFORMER

Создать полноценную campaign.

Не endless-runner.

Структура:

WORLD 1

→ LEVELS

→ WORLD 2

→ LEVELS

→ ...

→ FINAL WORLD

→ FINAL LEVEL

→ BOSS / FINALE.

---

# 26. PLATFORMER — LEVEL DESIGN

Уровни должны быть полноценными и разными.

Использовать:

- обычные платформы;
- moving platforms;
- vertical sections;
- пропасти;
- альтернативные маршруты;
- checkpoints;
- collectibles;
- enemies;
- traps;
- secret areas.

Каждый уровень должен иметь начало, развитие и завершение.

---

# 27. PLATFORMER — УПРАВЛЕНИЕ

Desktop:

A/D или arrows — движение;

Space — jump;

дополнительная клавиша — ability/action при необходимости.

Mobile:

слева — movement;

справа — jump/action.

Обязательно поддержать multitouch:

игрок должен одновременно двигаться и прыгать.

---

# 28. PLATFORMER — ВРАГИ

Использовать несколько классов:

- ground patrol;
- flying;
- ranged;
- jumping;
- armored;
- fast;
- mini-boss;
- boss.

У каждого своё поведение.

---

# 29. PLATFORMER — TRAPS

Добавить:

- spikes;
- falling platforms;
- disappearing platforms;
- fire;
- lasers;
- crushers;
- moving obstacles;
- pendulums;
- environmental hazards.

Ловушки должны становиться сложнее постепенно.

---

# 30. PLATFORMER — SECRETS

В уровнях должны существовать необязательные секретные области.

Например:

игрок замечает необычную стену;

→ находит скрытый проход;

→ проходит сложную дополнительную секцию;

→ получает collectible / achievement / Loot Box / secret skin.

Некоторые секреты должны быть действительно сложными.

---

# 31. PLATFORMER — ФИНАЛ

Campaign обязана иметь настоящий финал.

Финальный уровень:

- уникальная локация;
- комбинация изученных механик;
- новые препятствия;
- особое испытание;
- boss или другая уникальная механика.

После прохождения:

→ финальная сцена;

→ achievement;

→ reward;

→ открытие дополнительного endgame-контента.

После финала пользователь может:

- перепроходить уровни;
- искать secrets;
- улучшать время;
- проходить повышенную сложность;
- искать collectibles;
- выполнять achievements.

---

# 32. SKINS

Создать общую cosmetic system.

Скины не дают gameplay-преимуществ.

## Snake

- head;
- body;
- tail;
- trail;
- food effect;
- death effect.

## Maze

- character;
- outfit;
- trail;
- ability effect;
- death effect.

## Platformer

- character;
- outfit;
- jump effect;
- landing effect;
- trail;
- death animation.

---

# 33. RARITY

Использовать:

COMMON

RARE

EPIC

LEGENDARY

SECRET.

Редкость влияет на:

- внешний вид;
- коллекционность;
- эффекты;
- вероятность получения.

Но не на силу персонажа.

---

# 34. UNKNOWN SKINS

Не показывать пользователю весь контент заранее.

Некоторые предметы отображать:

???

силуэт

UNKNOWN.

После первого получения предмет полностью раскрывается.

Особенно:

LEGENDARY;

SECRET;

EASTER EGG;

EVENT ITEMS.

Игрок должен иметь возможность увидеть у другого игрока предмет и не сразу понимать, откуда он его получил.

---

# 35. COLLECTION

Создать отдельную коллекцию.

Категории:

ALL

OWNED

LOCKED

COMMON

RARE

EPIC

LEGENDARY

SECRET.

Для Secret Items не обязательно показывать общее количество.

Например:

DISCOVERED

37 / ???

Это позволяет сохранять тайну.

---

# 36. LOOT BOXES

Создать систему игровых Loot Boxes.

Типы, например:

ARCADE BOX

RARE BOX

EPIC BOX

LEGENDARY BOX

UNKNOWN BOX

EVENT BOX.

Названия могут быть изменены под общий lore.

Внутри:

- skins;
- trails;
- effects;
- animations;
- profile cosmetics;
- collectibles.

---

# 37. RETRO-ФОРМА LOOT BOXES

Не обязательно показывать коробку буквально как сундук.

Разные Loot Boxes могут выглядеть как:

- старый игровой cartridge;
- floppy disk;
- arcade token;
- mysterious chest;
- VHS;
- неизвестный игровой модуль.

Они должны соответствовать общей retro-вселенной.

---

# 38. LOOT BOX OPENING

Открытие должно иметь короткую красивую animation sequence.

OPEN

↓

retro animation

↓

rarity effect

↓

reveal

↓

NEW ITEM

или

DUPLICATE.

Анимацию можно пропустить.

Результат определяется сервером ДО начала анимации.

---

# 39. DUPLICATES

Loot Box может выдать уже имеющийся предмет.

В том числе skin, который пользователь:

- ранее выбил;
- получил за achievement;
- получил за secret;
- получил за event;
- ранее купил.

Повторный предмет не добавляется второй раз.

Он превращается в:

PIXEL SHARDS.

Количество зависит от rarity.

Все значения должны быть конфигурируемыми.

---

# 40. PIXEL SHARDS

Pixel Shards являются косметическим ресурсом.

Получение преимущественно:

- duplicates;
- challenges;
- специальные игровые события.

Использование:

- определённые skins;
- специальные Loot Boxes;
- cosmetic items;
- коллекционные механики.

Не давать gameplay advantage.

---

# 41. LOOT TABLES

Результат Loot Box определяет исключительно backend.

Процесс:

user owns box

→ OPEN request

→ backend validation

→ server roll

→ box atomically removed

→ reward atomically saved

→ result returned

→ frontend plays animation.

Перезагрузка страницы не должна позволять reroll.

---

# 42. PITY SYSTEM

Архитектурно предусмотреть bad-luck protection.

Backend может учитывать количество открытий без high-rarity drop.

Параметры системы вынести в config/admin.

---

# 43. ИСТОРИЯ LOOT

Хранить:

- user;
- box;
- timestamp;
- reward;
- rarity;
- duplicate;
- Pixel Shards compensation;
- технические audit-данные roll.

---

# 44. ПОЛУЧЕНИЕ LOOT BOXES

Loot Boxes можно получать за:

- account level;
- achievements;
- Daily Challenge;
- Weekly Challenge;
- Platformer World completion;
- boss;
- Daily Maze;
- secret room;
- Easter Egg;
- streak;
- event.

---

# 45. СКРЫТЫЕ LOOT BOXES

Часть Loot Boxes можно найти непосредственно во время игры.

Например:

secret Platformer room

→ сложная дополнительная секция

→ UNKNOWN CARTRIDGE

→ после завершения уровня он добавляется в Inventory.

---

# 46. CROSS-GAME SECRETS

Добавить секреты, связывающие разные режимы.

Пример:

Platformer содержит странную последовательность символов.

↓

игрок её обнаруживает.

↓

в Maze при определённых условиях появляется особая комната.

↓

игрок проходит испытание.

↓

получает UNKNOWN BOX.

↓

открывает SECRET Snake Skin.

Такие цепочки должны быть необязательными и достаточно редкими.

---

# 47. XP И LEVEL

Создать общий Account Level.

XP начисляется за:

- игровые сессии;
- рекорды;
- Platformer levels;
- bosses;
- Daily Maze;
- challenges;
- achievements;
- secrets;
- некоторые collectibles.

Формулы хранить в конфигурации.

---

# 48. DAILY / WEEKLY CHALLENGES

Примеры:

Play Snake 3 times.

Complete Daily Maze.

Find 1 Secret.

Complete Platformer level.

Beat your record.

Defeat X enemies.

Weekly Challenges должны быть сложнее Daily.

Награды:

- XP;
- Pixel Shards;
- Loot Boxes;
- cosmetics.

---

# 49. ACHIEVEMENTS

Создать обычные и секретные достижения.

Обычные:

FIRST GAME

100 GAMES

NEW RECORD

7 DAY STREAK.

Секретные:

???

После выполнения раскрывается:

название;

описание;

reward.

Некоторые achievements должны связывать разные игры.

---

# 50. STREAK

Добавить daily login streak.

Расчёт производится backend.

Нельзя доверять локальному времени устройства.

За milestones выдавать:

- XP;
- Loot Box;
- achievement;
- cosmetic reward.

---

# 51. LEADERBOARDS

Создать:

GLOBAL

SNAKE

MAZE

DAILY MAZE

PLATFORMER

PLATFORMER SPEEDRUN.

Периоды:

TODAY

WEEK

ALL TIME.

Показывать:

position;

avatar;

nickname;

score/time.

Текущий пользователь должен видеть свою позицию даже вне TOP.

---

# 52. GAME OVER / RESULTS

После сессии:

GAME OVER / LEVEL COMPLETE

Score

Best Score

XP earned

Secrets Found

Items Found

Loot Box Found

New Achievement

New Record.

Кнопки:

PLAY AGAIN

MENU

NEXT LEVEL — где применимо.

---

# 53. SOUND

Создать полноценную звуковую атмосферу:

- retro music;
- menu sounds;
- pickup sounds;
- combat;
- secret discovery;
- Loot Box opening;
- boss;
- Game Over;
- victory.

Не использовать защищённые аудиоматериалы из существующих игр.

Настройки:

MUSIC

SFX

MASTER VOLUME.

---

# 54. BACKEND

Backend отвечает за:

- Telegram authentication;
- users;
- game sessions;
- score;
- XP;
- levels;
- inventory;
- skins;
- Loot Boxes;
- Pixel Shards;
- achievements;
- challenges;
- streak;
- leaderboard;
- Daily Maze;
- seeds;
- Platformer progression;
- anti-cheat;
- admin.

Критические данные не хранить только в localStorage.

---

# 55. DATABASE

Использовать PostgreSQL.

Предусмотреть сущности:

users

games

game_sessions

scores

user_game_stats

platformer_worlds

platformer_levels

user_platformer_progress

maze_runs

daily_mazes

skins

user_skins

equipped_skins

loot_boxes

user_loot_boxes

loot_tables

loot_drops

achievements

user_achievements

challenges

user_challenges

secrets

user_secrets

streaks

inventory

currencies.

Структуру можно улучшить и нормализовать.

Использовать migrations и indexes.

---

# 56. ANTI-CHEAT

Нельзя принимать от frontend:

score = 99999999

и считать его настоящим.

Каждая игра создаёт server session.

Проверять:

- session ID;
- session duration;
- maximum possible score;
- score velocity;
- duplicate submission;
- impossible movement/results;
- progression;
- suspicious request rate.

Daily Maze seed хранится сервером.

Platformer проверяет:

- unlocked level;
- completion;
- plausible completion time;
- progression order.

Подозрительный результат не попадает автоматически в leaderboard.

---

# 57. API

Создать чистый API.

Примерно:

POST /auth/telegram

GET /me

GET /games

POST /game/session/start

POST /game/session/finish

GET /leaderboard

GET /challenges

POST /challenges/claim

GET /collection

POST /skin/equip

GET /inventory

POST /loot/open

GET /achievements

GET /daily-maze.

Конкретную архитектуру улучшить при необходимости.

Использовать:

validation;

rate limiting;

logging;

consistent error handling.

---

# 58. ADMIN PANEL

Создать защищённую полноценную web admin-панель.

Разделы:

DASHBOARD

USERS

GAMES

MAZE

DAILY MAZE

PLATFORMER

SKINS

LOOT BOXES

LOOT TABLES

PIXEL SHARDS

ACHIEVEMENTS

SECRETS

CHALLENGES

LEADERBOARDS

SUSPICIOUS SCORES

SETTINGS.

---

# 59. ADMIN — ВОЗМОЖНОСТИ

Администратор может:

- enable/disable games;
- управлять игровыми конфигурациями;
- менять XP;
- создавать skins;
- менять rarity;
- создавать Loot Boxes;
- редактировать Loot Tables;
- менять duplicate compensation;
- создавать achievements;
- создавать hidden achievements;
- создавать challenges;
- просматривать игроков;
- просматривать inventories;
- просматривать loot history;
- просматривать suspicious scores;
- исключать score из leaderboard;
- управлять Daily Maze;
- менять вероятности rare events.

---

# 60. ANALYTICS

Dashboard должен показывать:

- total users;
- DAU;
- WAU;
- new users;
- game sessions;
- sessions per user;
- average session duration;
- most popular games;
- Platformer progression;
- Daily Maze participation;
- Loot Boxes opened;
- rarity distribution;
- duplicate rate;
- Pixel Shards economy;
- challenges completion;
- retention при наличии достаточных данных.

---

# 61. GAME ARCHITECTURE

Не создавать три независимых приложения.

Создать единый Game Core.

Каждый режим подключается через общий interface.

Например:

gameId

init()

load()

start()

pause()

resume()

restart()

destroy()

getState()

getScore()

finish().

Общие системы должны переиспользоваться.

---

# 62. DATA-DRIVEN CONTENT

По возможности не хардкодить контент в game engine.

Отдельно хранить/configure:

- enemies;
- skins;
- rarity;
- Loot Boxes;
- loot tables;
- achievements;
- challenges;
- secrets;
- worlds;
- levels;
- Maze room templates;
- traps;
- rare-event probability;
- XP values.

Это необходимо для дальнейшего расширения проекта.

---

# 63. СОХРАНЕНИЕ

Постоянный прогресс сохранять автоматически.

Обработать:

- закрытие Telegram;
- refresh;
- потерю интернета;
- background;
- crash;
- повторный запуск.

Не допускать повреждения постоянного прогресса.

Для подходящих режимов предусмотреть recovery незавершённой сессии.

---

# 64. OFFLINE / NETWORK ERRORS

Обработать:

- backend unavailable;
- slow network;
- connection loss;
- duplicate request;
- expired auth;
- invalid session;
- interrupted Loot Box opening.

Пользователь не должен видеть stack trace.

При прерванном Loot Box opening награда не должна теряться или reroll'иться.

---

# 65. PERFORMANCE

Использовать lazy loading.

Не загружать ассеты всех игр при старте.

После загрузки Arcade Hub можно background-prefetch наиболее вероятного следующего контента.

Оптимизировать:

- textures;
- sprites;
- audio;
- animations;
- bundles;
- particle systems.

Поддерживать стабильный FPS.

---

# 66. ASSET SYSTEM

Создать понятную структуру игровых ассетов.

Разделить:

/games/snake

/games/maze

/games/platformer

/shared

/skins

/audio

/effects

/tilesets

/ui.

Не хранить всё в одной директории.

---

# 67. COPYRIGHT / ORIGINAL CONTENT

Не использовать напрямую:

- Mario;
- Pac-Man;
- оригинальных Ghosts;
- оригинальные карты;
- оригинальные sprites;
- оригинальную музыку;
- чужие логотипы;
- защищённые игровые assets.

Механики классических жанров можно использовать как вдохновение.

Персонажи, визуал, карты, музыка, lore и названия должны быть собственными.

---

# 68. ТЕСТИРОВАНИЕ

Перед завершением самостоятельно пройти полный сценарий.

Telegram:

BOT

→ PLAY

→ AUTH

→ HUB.

Проверить:

SNAKE

→ controls

→ score

→ Game Over

→ record.

MAZE

→ generation

→ enemies

→ combat

→ key

→ door

→ secret

→ completion.

PLATFORMER

→ movement

→ jump

→ multitouch

→ levels

→ checkpoints

→ enemies

→ traps

→ secrets

→ bosses

→ finale.

Также:

SKINS

LOOT BOXES

DUPLICATES

PIXEL SHARDS

COLLECTION

ACHIEVEMENTS

CHALLENGES

LEADERBOARDS

DAILY MAZE

SAVE/RESTORE

ADMIN.

---

# 69. PROCEDURAL TESTING

Maze generator автоматически прогнать на большом количестве seeds.

Для каждого проверить:

- map valid;
- required paths reachable;
- required keys obtainable;
- doors solvable;
- exit reachable;
- no soft-lock.

Ошибочный seed должен логироваться для воспроизведения.

---

# 70. DEPLOYMENT

Проект подготовить для production.

Все secrets:

TELEGRAM_BOT_TOKEN

DATABASE_URL

ADMIN_SECRET

APP_URL

и остальные

хранить через environment variables.

Создать:

.env.example

README

migrations

production build

deployment instructions

Telegram Mini App setup instructions.

Подготовить проект к Railway deployment.

---

# 71. КАЧЕСТВО КОДА

Не создавать один огромный файл.

Разделить:

frontend

game-core

games

backend

bot

admin

database

shared

configs

assets.

Удалить перед production:

- temporary code;
- unused components;
- debug output;
- mock implementations;
- duplicated logic.

Использовать строгую типизацию там, где выбранный стек её поддерживает.

---

# 72. ПОРЯДОК РАЗРАБОТКИ

Работать последовательно.

### PHASE 1

Архитектура проекта, Telegram auth, БД, Arcade Hub, общий Game Core.

### PHASE 2

Полностью рабочий Snake.

### PHASE 3

Maze generator + validation.

### PHASE 4

Maze gameplay + enemies + keys + combat + secrets.

### PHASE 5

Platformer engine + controls + physics.

### PHASE 6

Platformer worlds + levels + enemies + traps + finale.

### PHASE 7

Skins + Collection.

### PHASE 8

Loot Boxes + Loot Tables + Duplicates + Pixel Shards.

### PHASE 9

XP + Challenges + Achievements + Streak.

### PHASE 10

Leaderboards + Daily Maze.

### PHASE 11

Admin Panel + Analytics.

### PHASE 12

Graphics polish + audio + 2.5D effects + optimization.

### PHASE 13

Full testing + bug fixing + production deployment.

Не переходить к красивой полировке следующей системы, пока базовая логика предыдущей не работает.

---

# 73. КРИТЕРИИ ГОТОВНОСТИ

Проект НЕ считать законченным только потому, что:

- страницы открываются;
- меню выглядит красиво;
- игры отображаются;
- база подключена.

Готовый проект означает, что реально работают:

✓ Telegram Bot

✓ Telegram authentication

✓ Arcade Hub

✓ Desktop

✓ Mobile

✓ Snake

✓ Maze procedural generation

✓ Maze validation

✓ разные Maze enemies

✓ combat

✓ keys

✓ locked doors

✓ secret rooms

✓ Easter Eggs

✓ rare events

✓ Daily Maze

✓ Platformer Campaign

✓ разные levels

✓ worlds

✓ enemies

✓ traps

✓ checkpoints

✓ bosses/finale

✓ Skins

✓ Unknown Skins

✓ Collection

✓ Loot Boxes

✓ server-side Loot Rolls

✓ Duplicates

✓ Pixel Shards

✓ XP

✓ Account Levels

✓ Achievements

✓ Hidden Achievements

✓ Daily/Weekly Challenges

✓ Streak

✓ Leaderboards

✓ Cross-game Secrets

✓ Backend

✓ PostgreSQL

✓ Anti-cheat

✓ Admin Panel

✓ Analytics

✓ Save/Restore

✓ Retro graphics

✓ Textures

✓ Audio

✓ 2.5D effects

✓ Production deployment.

---

# 74. ГЛАВНЫЙ ПРИНЦИП

Не заменять сложную функциональность визуальными заглушками.

Если система заявлена как работающая, она должна реально работать.

Если возникает ошибка:

1. определить причину;
2. исправить причину;
3. протестировать исправление;
4. проверить связанные системы;
5. только после этого продолжать разработку.

Не отключать функциональность только ради успешного build.

После завершения самостоятельно пройти основные пользовательские сценарии и исправить найденные критические ошибки.

Проект должен быть фундаментом для дальнейшего развития: новые игры, миры, уровни, боссы, противники, Maze-механики, скины, Loot Boxes, события, достижения и секреты.

Главное ощущение для игрока:

**«Я открыл какую-то старую неизвестную игру, начал играть — и постепенно понял, что внутри гораздо больше, чем казалось сначала».**

Именно исследование, секреты, неожиданные механики и желание понять устройство мира должны отличать проект от обычного сборника мини-игр.
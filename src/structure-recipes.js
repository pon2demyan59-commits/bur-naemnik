// All building recipes are initial balance; defense and weapon recipes preserve the canon.
import { WEAPON_CATALOG, WEAPON_COMPONENTS } from './weapon-catalog.js';
export const STRUCTURE_CATEGORIES=['Здания','Преграды','Препятствия','Ловушки','Башни','Оружие для бура'];
export const STRUCTURE_RECIPES=[
 {
  "id": "hq",
  "name": "Штаб",
  "category": "Здания",
  "size": "9×8",
  "leader": "Демьян П.",
  "role": "Начальник штаба",
  "purpose": "Главный центр сюжетных заданий; руководитель Демьян П. Самое величественное здание базы, восемь подвижных вооружённых часовых в чёрных беретах по периметру. Тело 7 × 6, южный вход 7 × 1, остальное — периметр. Построенный штаб можно переносить. Управление людьми и ограничение уровня зданий уровнем штаба остаются планом.",
  "availability": "build",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 100
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 60
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "architect",
  "name": "Дом архитектора",
  "category": "Здания",
  "size": "4×4",
  "leader": "Павел М.",
  "role": "Строительный мастер",
  "purpose": "Появляется после возвращения строительного мастера с 4-го этажа. Заменяет стол с чертежами. Корпус 4 × 3, южный вход 4 × 1; корпус блокирует бур. Здесь доступно строительство штаба. Здание можно переносить. Чертежи и улучшения будущих зданий — утверждённое направление.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 180
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 120
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 30
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "housing",
  "name": "Жилой комплекс",
  "category": "Здания",
  "size": "5×5",
  "leader": "Нина С.",
  "role": "Комендант",
  "purpose": "Размещение спасённых людей. Первый уровень — 10 жителей.",
  "availability": "build",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 200
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 80
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 20
   }
  ]
 },
 {
  "id": "power",
  "name": "Электростанция",
  "category": "Здания",
  "size": "4×4",
  "leader": "Денис Г.",
  "role": "Электрик",
  "purpose": "Снабжение работающих производств электричеством. Можно построить несколько станций; у каждой отдельный руководитель.",
  "availability": "build",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 120
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 30
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "warehouse",
  "name": "Склад",
  "category": "Здания",
  "size": "3×3",
  "leader": "Николай П.",
  "role": "Кладовщик",
  "purpose": "Первый склад появляется готовым и бесплатно после возвращения строительного мастера. Хранит отдельно от груза по 100 каждого материала на первом уровне; каждый уровень добавляет 100 каждому виду. Перенос сохраняет запасы и уровень; складской запас не теряется при гибели. Временный баланс улучшений: 200 кредитов за первое, затем рост цены ×1,25, максимум 100 уровней.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 80
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 20
   }
  ]
 },
 {
  "id": "porodnik",
  "name": "Породник",
  "category": "Здания",
  "size": "5×5",
  "leader": "Валерий Д.",
  "role": "Оператор Породника",
  "purpose": "Переработка и продажа выбранной породы за кредиты. Размер закреплён как территория с площадкой.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 80
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 160
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 40
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "workshop",
  "name": "Мастерская",
  "category": "Здания",
  "size": "5×5",
  "leader": "Константин Б.",
  "role": "Механик",
  "purpose": "Модернизация мощности бура и установка насадок. Усиленная земляная насадка: 5000 кредитов, земля разрушается почти мгновенно. Обычные улучшения продолжают действовать на камень и все руды. Помещение и вход можно переносить вместе.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 100
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 100
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 40
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "armory",
  "name": "Оружейная",
  "category": "Здания",
  "size": "5×5",
  "leader": "Виктор Р.",
  "role": "Оружейник",
  "purpose": "Уже предусмотренный сюжетом спасаемый оружейник. Установка и модернизация оружия бура.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 100
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 100
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 50
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 20
   }
  ]
 },
 {
  "id": "repair",
  "name": "Ремонтный цех",
  "category": "Здания",
  "size": "5×5",
  "leader": "Илья К.",
  "role": "Ремонтник",
  "purpose": "Восстановление прочности бура.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 100
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 80
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 40
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 20
   }
  ]
 },
 {
  "id": "smelter",
  "name": "Плавильня",
  "category": "Здания",
  "size": "5×5",
  "leader": "Борис Л.",
  "role": "Металлург",
  "purpose": "Переплавка руды в слитки.",
  "availability": "planned",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 250
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 80
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 30
   }
  ]
 },
 {
  "id": "alloy",
  "name": "Цех сплавов",
  "category": "Здания",
  "size": "5×5",
  "leader": "Аркадий Н.",
  "role": "Специалист по сплавам",
  "purpose": "Производство сплавов по известным рецептам.",
  "availability": "planned",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 280
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 100
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 40
   },
   {
    "id": "nickel",
    "name": "Никелевая руда",
    "count": 10
   }
  ]
 },
 {
  "id": "assembly",
  "name": "Сборочный цех",
  "category": "Здания",
  "size": "5×5",
  "leader": "Роман Е.",
  "role": "Мастер-сборщик",
  "purpose": "Создание башен, ловушек, препятствий и преград.",
  "availability": "planned",
  "balance": "starter",
  "ingredients": [
   {
    "id": "earth",
    "name": "Земля",
    "count": 200
   },
   {
    "id": "stone",
    "name": "Камень",
    "count": 200
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 120
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 60
   },
   {
    "id": "bauxite",
    "name": "Алюминиевая руда (боксит)",
    "count": 20
   }
  ]
 },
 {
  "id": "lab",
  "name": "Лаборатория",
  "category": "Здания",
  "size": "4×4",
  "leader": "Вера А.",
  "role": "Исследователь",
  "purpose": "Эксперименты для открытия рецептов с расходованием ингредиентов.",
  "availability": "planned",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 160
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 40
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 60
   },
   {
    "id": "gold",
    "name": "Золотосодержащая руда",
    "count": 5
   }
  ]
 },
 {
  "id": "fame",
  "name": "Зал славы",
  "category": "Здания",
  "size": "5×4",
  "leader": "Григорий Ф.",
  "role": "Хранитель трофеев",
  "purpose": "Размещение редких трофеев монстров и активация их бафов.",
  "availability": "planned",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 200
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 60
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 10
   }
  ]
 },
 {
  "id": "lift",
  "name": "Лифт",
  "category": "Здания",
  "size": "7×7",
  "leader": "Серёга Т.",
  "role": "Строитель, смотритель лифта",
  "purpose": "Перемещение между базой и этажами по ключ-картам. Сохраняется исходная роль строителя.",
  "availability": "story",
  "balance": "starter",
  "ingredients": [
   {
    "id": "stone",
    "name": "Камень",
    "count": 180
   },
   {
    "id": "iron",
    "name": "Железная руда",
    "count": 60
   },
   {
    "id": "copper",
    "name": "Медная руда",
    "count": 20
   }
  ]
 },
 {
  "id": "defense-01",
  "name": "Сетчатый забор",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Проводящая сталь",
    "count": 3
   },
   {
    "name": "паучье волокно",
    "count": 2
   }
  ]
 },
 {
  "id": "defense-02",
  "name": "Листовой забор",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Лёгкая сталь",
    "count": 5
   },
   {
    "name": "хитиновая пластина",
    "count": 2
   }
  ]
 },
 {
  "id": "defense-03",
  "name": "Каменная стена",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Бункерный бетон",
    "count": 8
   },
   {
    "name": "клейкая слизь",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-04",
  "name": "Оборонительный блок",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Фундаментный композит",
    "count": 10
   },
   {
    "name": "толстая хитиновая пластина",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-05",
  "name": "Армированная стена",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Армокамень",
    "count": 10
   },
   {
    "name": "никелевая сталь",
    "count": 4
   },
   {
    "name": "боевой хитин",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-06",
  "name": "Бронированная стена",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Хромовый бронесплав",
    "count": 8
   },
   {
    "name": "плотная костяная броня",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-07",
  "name": "Решётчатые ворота",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Каркасный сплав",
    "count": 6
   },
   {
    "name": "механическая бронза",
    "count": 3
   },
   {
    "name": "суставной хрящ",
    "count": 2
   }
  ]
 },
 {
  "id": "defense-08",
  "name": "Бронированные ворота",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Титановый бронекомпозит",
    "count": 8
   },
   {
    "name": "приводной сплав",
    "count": 4
   },
   {
    "name": "гвардейская бронепластина",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-09",
  "name": "Выдвижная перегородка",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Облегчённый приводной сплав",
    "count": 6
   },
   {
    "name": "пружинный титаносплав",
    "count": 4
   },
   {
    "name": "сверхпрочный суставной узел",
    "count": 2
   }
  ]
 },
 {
  "id": "defense-10",
  "name": "Ксенобастион",
  "category": "Преграды",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Ксеносталь",
    "count": 8
   },
   {
    "name": "плазменный бронесплав",
    "count": 4
   },
   {
    "name": "многослойный минеральный панцирь",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-13",
  "name": "Колючая проволока",
  "category": "Препятствия",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Проводящая сталь",
    "count": 3
   },
   {
    "name": "прочное паучье волокно",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-18",
  "name": "Электрическая преграда",
  "category": "Препятствия",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Обмоточный сплав",
    "count": 6
   },
   {
    "name": "точный проводник",
    "count": 3
   },
   {
    "name": "эластичная мембрана",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-19",
  "name": "Вращающееся лезвие",
  "category": "Препятствия",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Стойкий режущий сплав",
    "count": 6
   },
   {
    "name": "приводной сплав",
    "count": 4
   },
   {
    "name": "режущая лапа",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-23",
  "name": "Шипы",
  "category": "Ловушки",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Ударостойкая сталь",
    "count": 5
   },
   {
    "name": "пружинный титаносплав",
    "count": 2
   },
   {
    "name": "усиленный коготь",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-24",
  "name": "Мины",
  "category": "Ловушки",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Корпусной сплав",
    "count": 3
   },
   {
    "name": "желчный концентрат",
    "count": 3
   },
   {
    "name": "едкий фермент",
    "count": 2
   }
  ]
 },
 {
  "id": "defense-28",
  "name": "Капкан",
  "category": "Ловушки",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Нагревательный сплав",
    "count": 4
   },
   {
    "name": "схемный сплав",
    "count": 3
   },
   {
    "name": "цепкая присоска",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-31",
  "name": "Пулемётная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Бункерный бетон",
    "count": 8
   },
   {
    "name": "ствольная сталь",
    "count": 5
   },
   {
    "name": "плотное сухожилие",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-32",
  "name": "Скорострельная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Каркасный сплав",
    "count": 8
   },
   {
    "name": "механическая бронза",
    "count": 5
   },
   {
    "name": "усиленный сустав клешни",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-33",
  "name": "Снайперская башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Орудийная сталь",
    "count": 8
   },
   {
    "name": "приборный припой",
    "count": 3
   },
   {
    "name": "силовое мышечное волокно",
    "count": 3
   }
  ]
 },
 {
  "id": "defense-34",
  "name": "Пушечная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Армокамень",
    "count": 10
   },
   {
    "name": "вольфрамовая сталь",
    "count": 8
   },
   {
    "name": "таранная хитиновая пластина",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-35",
  "name": "Огнемётная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Жаростойкий композит",
    "count": 8
   },
   {
    "name": "теплостойкий проводник",
    "count": 5
   },
   {
    "name": "органическая смола",
    "count": 5
   }
  ]
 },
 {
  "id": "defense-36",
  "name": "Электрическая башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Силовой титанопроводник",
    "count": 8
   },
   {
    "name": "схемный сплав",
    "count": 5
   },
   {
    "name": "паразитическая железа",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-37",
  "name": "Замедляющая башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Титановый приборный сплав",
    "count": 6
   },
   {
    "name": "герметичный припой",
    "count": 4
   },
   {
    "name": "слизевой защитный гель",
    "count": 5
   }
  ]
 },
 {
  "id": "defense-38",
  "name": "Кислотная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Стойкий корпусной сплав",
    "count": 8
   },
   {
    "name": "барьерный сплав",
    "count": 5
   },
   {
    "name": "глубинный кислотный концентрат",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-39",
  "name": "Ракетная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Осадный бронесплав",
    "count": 8
   },
   {
    "name": "энергетический сплав",
    "count": 5
   },
   {
    "name": "алый биоконцентрат",
    "count": 4
   }
  ]
 },
 {
  "id": "defense-40",
  "name": "Плазменная башня",
  "category": "Башни",
  "availability": "planned",
  "balance": "canon",
  "ingredients": [
   {
    "name": "Плазменный бронесплав",
    "count": 8
   },
   {
    "name": "ядро глубин",
    "count": 3
   },
   {
    "name": "древняя ткань колосса",
    "count": 2
   }
  ]
 }
];
for(const w of WEAPON_CATALOG)STRUCTURE_RECIPES.push({id:'weapon-'+w.id,name:w.name,category:'Оружие для бура',availability:'weapon',balance:'canon',ingredients:Object.entries(w.recipe).map(([id,count])=>({name:WEAPON_COMPONENTS.find(c=>c.id===id).name,count}))});
export function structureRecipe(id){return STRUCTURE_RECIPES.find(r=>r.id===id);}
export function formatStructureRecipe(recipe){return recipe.ingredients.map(p=>p.name+' ×'+p.count).join(' + ');}
export function filterStructureRecipes(category,query=''){const term=String(query).trim().toLocaleLowerCase('ru');return STRUCTURE_RECIPES.filter(r=>r.category===category&&(!term||(r.name+' '+formatStructureRecipe(r)).toLocaleLowerCase('ru').includes(term)));}

// Canonical weapon recipes; combat and supplier prices are initial balance.
export const WEAPON_COMPONENTS=[
 {
  "id": "part01",
  "name": "Лёгкая сталь",
  "price": 40
 },
 {
  "id": "part02",
  "name": "бункерная бронза",
  "price": 60
 },
 {
  "id": "part03",
  "name": "хитиновая пластина",
  "price": 80
 },
 {
  "id": "part04",
  "name": "Ствольная сталь",
  "price": 100
 },
 {
  "id": "part05",
  "name": "механическая бронза",
  "price": 120
 },
 {
  "id": "part06",
  "name": "суставной хрящ",
  "price": 140
 },
 {
  "id": "part07",
  "name": "Ударостойкая сталь",
  "price": 160
 },
 {
  "id": "part08",
  "name": "защитная латунь",
  "price": 180
 },
 {
  "id": "part09",
  "name": "дробящий зуб",
  "price": 200
 },
 {
  "id": "part10",
  "name": "Орудийная сталь",
  "price": 220
 },
 {
  "id": "part11",
  "name": "вольфрамовая сталь",
  "price": 240
 },
 {
  "id": "part12",
  "name": "массивная скелетная кость",
  "price": 260
 },
 {
  "id": "part13",
  "name": "Жаростойкий сплав",
  "price": 280
 },
 {
  "id": "part14",
  "name": "герметичный припой",
  "price": 300
 },
 {
  "id": "part15",
  "name": "органическая смола",
  "price": 320
 },
 {
  "id": "part16",
  "name": "Обмоточный сплав",
  "price": 340
 },
 {
  "id": "part17",
  "name": "золотой контактный сплав",
  "price": 360
 },
 {
  "id": "part18",
  "name": "бронированная паразитическая железа",
  "price": 380
 },
 {
  "id": "part19",
  "name": "Барьерный сплав",
  "price": 400
 },
 {
  "id": "part20",
  "name": "уплотнительная сталь",
  "price": 420
 },
 {
  "id": "part21",
  "name": "кислотная железа",
  "price": 440
 },
 {
  "id": "part22",
  "name": "Тяжёлый бронесплав",
  "price": 460
 },
 {
  "id": "part23",
  "name": "стойкий сигнальный сплав",
  "price": 480
 },
 {
  "id": "part24",
  "name": "алый биоконцентрат",
  "price": 500
 },
 {
  "id": "part25",
  "name": "Сверхтвёрдый режущий сплав",
  "price": 520
 },
 {
  "id": "part26",
  "name": "высокочистый контактный сплав",
  "price": 540
 },
 {
  "id": "part27",
  "name": "металлизированный сегмент",
  "price": 560
 },
 {
  "id": "part28",
  "name": "Ксенотитан",
  "price": 580
 },
 {
  "id": "part29",
  "name": "ксенозолотой проводник",
  "price": 600
 },
 {
  "id": "part30",
  "name": "древняя ткань колосса",
  "price": 620
 }
];
export const WEAPON_CATALOG=[
 {
  "id": "basic",
  "name": "Базовая пушка",
  "damage": 1,
  "interval": 1000,
  "range": 2,
  "blueprintPrice": 0,
  "recipe": {
   "part01": 4,
   "part02": 2,
   "part03": 2
  }
 },
 {
  "id": "machinegun",
  "name": "Пулемёт",
  "damage": 0.55,
  "interval": 350,
  "range": 2.5,
  "blueprintPrice": 500,
  "recipe": {
   "part04": 5,
   "part05": 3,
   "part06": 3
  }
 },
 {
  "id": "shotgun",
  "name": "Дробовик",
  "damage": 2.2,
  "interval": 1400,
  "range": 1.5,
  "blueprintPrice": 2000,
  "recipe": {
   "part07": 5,
   "part08": 3,
   "part09": 3
  }
 },
 {
  "id": "heavy",
  "name": "Тяжёлая пушка",
  "damage": 3.5,
  "interval": 2200,
  "range": 3,
  "blueprintPrice": 4500,
  "recipe": {
   "part10": 7,
   "part11": 4,
   "part12": 3
  }
 },
 {
  "id": "flame",
  "name": "Огнемёт",
  "damage": 0.4,
  "interval": 200,
  "range": 1.25,
  "blueprintPrice": 8000,
  "recipe": {
   "part13": 5,
   "part14": 3,
   "part15": 4
  }
 },
 {
  "id": "electric",
  "name": "Электроразрядник",
  "damage": 1.8,
  "interval": 800,
  "range": 2,
  "blueprintPrice": 12500,
  "recipe": {
   "part16": 5,
   "part17": 3,
   "part18": 3
  }
 },
 {
  "id": "acid",
  "name": "Кислотомёт",
  "damage": 0.8,
  "interval": 500,
  "range": 2.5,
  "blueprintPrice": 18000,
  "recipe": {
   "part19": 5,
   "part20": 3,
   "part21": 4
  }
 },
 {
  "id": "rocket",
  "name": "Ракетница",
  "damage": 4,
  "interval": 2500,
  "range": 3.5,
  "blueprintPrice": 24500,
  "recipe": {
   "part22": 6,
   "part23": 3,
   "part24": 3
  }
 },
 {
  "id": "rail",
  "name": "Рельсотрон",
  "damage": 5,
  "interval": 2800,
  "range": 4,
  "blueprintPrice": 32000,
  "recipe": {
   "part25": 7,
   "part26": 4,
   "part27": 3
  }
 },
 {
  "id": "plasma",
  "name": "Плазмомёт",
  "damage": 3,
  "interval": 1100,
  "range": 3,
  "blueprintPrice": 40500,
  "recipe": {
   "part28": 6,
   "part29": 4,
   "part30": 2
  }
 }
];
export function weaponDefinition(id){return WEAPON_CATALOG.find(w=>w.id===id)||WEAPON_CATALOG[0];}
export function weaponStats(q,buff=0){const w=weaponDefinition(q.equippedWeapon);return {...w,damage:w.damage*(1+(q.weaponLevel||0)*.02+buff),range:w.range*64};}

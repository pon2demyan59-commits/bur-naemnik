# Военный штаб и здания — 08.10.2026

Дом архитектора: прежний ассет, площадь 4×4, тело 4×3 и въезд 4×1.
Штаб: 9×8 (72 клетки), тело 7×6, южный въезд 7×1, оставшаяся площадь — свободный периметр для восьми вооружённых часовых в чёрных беретах. Часовые визуальные, не блокируют бур, не добавляют боевых бонусов. Демьян на карте также носит военную форму.
Склад: новый промышленный спрайт, прежняя площадь 3×3, вместимость и улучшения сохранены.
Демьян П.: строгий военный портрет в диалогах и меню штаба.

Старые координаты штаба у края карты ограничиваются новой площадью. Если расширенный штаб пересекает другую постройку, он переносится на ближайшее свободное место с предпочтением расчищенных клеток. Построенная или строящаяся площадка очищается. Уровень склада, запасы и таймер стройки сохраняются.

Новые растровые ассеты созданы встроенным ImageGen с запросом прозрачного фона. После генерации выполнены обрезка прозрачных полей, уменьшение и WebP-конвертация:
- `public/assets/ui/demyan-portrait.webp`: stern serious senior military commander, black beret, olive officer uniform, radio, no smile, transparent bust portrait.
- `public/assets/game/warehouse-house.webp`: compact teal industrial warehouse, loading shutter, ore crates, amber lamps, sign СКЛАД, transparent frontal sprite.
- `public/assets/game/headquarters.webp`: monumental military headquarters with command tower, shield emblem, armored wings, antennae, sign ШТАБ, transparent frontal sprite; architect asset used as style reference.
- `public/assets/game/military-guard.webp`: full body armed sentry, black beret, olive tactical uniform, rifle, transparent sprite.

Проверка: 150 автоматических тестов, сборка, браузер на 1440×900 / 390×844 / 844×390; восемь часовых за пределами тела здания, работающий вход, загрузка портрета, сохранность складских запасов и уровня.

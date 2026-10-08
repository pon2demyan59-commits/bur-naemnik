# Здания строго сверху — 08.10.2026

Три игровых спрайта заменены вариантами с ортографической камерой над крышей. Палитры, эмблемы и отличия зданий сохранены. Новые файлы загружаются под прежними ключами Phaser; координаты, размеры, коллизии, въезды, охрана, складские запасы и сюжетные флаги не меняются. Использован встроенный ImageGen, не CLI. Исходные PNG сохранены в generated_images; подготовка игровых файлов — обрезка прозрачных полей, уменьшение и WebP с alpha. Старые фронтальные ассеты оставлены для истории, игра использует файлы -top.webp.

## Штаб

Файл: public/assets/game/headquarters-top.webp

Финальный промпт:

```text
Edit this sprite with one crucial correction: CAMERA EXACTLY VERTICALLY ABOVE at 90 degrees, true ORTHOGRAPHIC PLAN VIEW. Current reference still shows front walls and elevations. Remove ALL visible vertical wall faces. Replace red front windows with narrow horizontal flat red glass roof skylights. Control tower must be seen as an OCTAGONAL ROOF ONLY, no tower side or facade showing. Antennas seen directly above become circular bases and small tips, not tall vertical rods. Radar dish viewed directly above circle, supports overhead. Entrance is a shallow ground-level apron at south edge; only overhead roof canopy above it, NO front sign/facade gate drawn upright. Paint ШТАБ horizontally flat on main roof instead of sign on wall. Preserve weathered grey concrete, olive armor, command-building roof-layout identity and cartoon game style. Axis aligned rectangle, roof covers upper 6/7 and apron lower 1/7. Absolutely no isometric, no oblique angle, no front elevation, no tall walls. Think drone satellite photo from directly overhead of a flat-roof bunker. Genuine transparent background. Almost edge to edge. Important: a mechanically consistent overhead map sprite, not architectural perspective.
```

## Дом архитектора

Файл: public/assets/game/architect-house-top.webp

Финальный промпт:

```text
Edit this game sprite with one crucial correction: CAMERA EXACTLY VERTICALLY ABOVE at 90 degrees, true ORTHOGRAPHIC PLAN VIEW. Current reference still suggests tall facade with upright windows and a front doorway. Remove ALL vertical window faces and ALL tall facade parts, no visible front/side walls. Make the main central volume and side wings LOW FLAT ROOFS made from teal metal panels and golden braces. The amber shapes must be small FLAT rectangular ROOF SKYLIGHTS, not tall standing windows. No visible furniture behind windows. Round compass+scroll emblem painted flat on central roof, ДОМ АРХИТЕКТОРА stenciled horizontally flat on roof. Antennas become small round bases and tips viewed from overhead, no tall rods. The south entrance apron is a simple ground-level rectangular overhead landing, upper edge attaches to flat roof canopy; NO visible tall door or upright signage. Preserve unique teal/yellow architect-house colors, symmetrical roof wings, rich cartoon post-apocalyptic metal detailing. Near square axis-aligned plan footprint; roof covers top 3/4 and landing lower 1/4. NO isometric, NO oblique angle, NO front elevation, NO walls. Think building photographed by satellite directly above. Genuine transparent background, no ground plane, no people, no vehicle.
```

## Склад

Файл: public/assets/game/warehouse-house-top.webp

Финальный промпт:

```text
Use case: precise-object-edit. Edit target: reference warehouse. Convert to STRICT STRAIGHT DOWN ORTHOGRAPHIC 90 DEGREE OVERHEAD CAMERA game sprite. We must look vertically down at the entire roof; NO vertical facade, NO front elevation, NO isometric tilt, NO visible big shutter wall, NO side walls, no perspective convergence. Retain compact worn teal industrial warehouse identity, corrugated rectangular roof, grey metal roof straps and vent, amber lamps on roof edges. Two small cylindrical tanks viewed as circular caps from overhead on roof sides, a few small overhead crate lids near south entry. Roof text exactly СКЛАД painted flat on roof. Square footprint with rectangular roof covering upper TWO THIRDS and small open southern vehicle loading apron on lower ONE THIRD, from straight above. The apron is level with ground, no stair, no ramp pedestal, no broad foundation. Detailed cartoon post-apocalypse sprite matching reference palette. Occupy square canvas edge to edge with 3% transparent margin, transparent outside alpha, no ground/background, no people, no vehicle. Change viewpoint, preserve design.
```



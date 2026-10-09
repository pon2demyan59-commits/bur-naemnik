# Construction menu and missing building art — 09.10.2026

The architect blueprint shop now uses the full dialog width, with two columns on wider screens and one below 680px. Each card has a fixed illustration stage and a separate full-width text/action area. Buttons use scalable CSS styling; the old service sidebar and nested fixed 210px art column no longer squeeze text into a narrow strip. Built housing/power projects show a completed state. Purchase, story access, recipes and costs are preserved.

All 15 building recipes now use actual bitmap building portraits. Seven new top-down transparent sprites are shared by blueprint cards, the recipe book and discovery banners. Housing and power also use their sprites on the base; existing footprints, entrances and collisions remain unchanged. Future facilities remain marked as planned.

## Assets and prompts

Mode: built-in Imagegen. Style-only reference: `public/assets/game/warehouse-house-top.webp`. Output converted to 512px WebP with alpha preserved. No CLI/API generation.

Shared prompt: one polished production sprite, hand-painted cartoon post-apocalyptic industry; chunky riveted weathered teal/olive steel, grey concrete, warm amber lights and bold contours. Strict vertical 90-degree orthographic plan view, axis aligned roofs; no front/side walls or isometric perspective. Transparent margin about 5%, genuinely transparent background. No people, vehicles, surrounding ground, UI, letters, numbers or captions. Empty flat southern entrance apron.

- `public/assets/game/housing-top.webp`: Residential shelter roof: two joined low bunkhouse wings, teal reinforced roof panels, warm amber skylights, ventilation and water tanks, central southern entrance apron. Welcoming inhabited shelter, not a tower block. Square 5 by 5 footprint, roof covers upper four fifths and clear entrance apron lower fifth.
- `public/assets/game/power-top.webp`: Compact power station roof: three chunky diesel generator housings, large circular fans seen directly above, copper cable conduits, insulated transformers, amber warning lamps, olive metal panels. Square 4 by 4 footprint, roof covers upper three quarters and clear southern maintenance apron lower quarter.
- `public/assets/game/smelter-top.webp`: Smelting foundry: reinforced rust orange and charcoal roof, two circular furnace openings glowing amber from above, cooling pipes, flat vents, stacked ingot molds along edges. Square 5 by 5 footprint, roof covers upper four fifths and clear southern entrance apron lower fifth.
- `public/assets/game/alloy-top.webp`: Alloy fabrication plant: violet grey and olive roof panels, two round mixing reactors with blue and amber glowing capped centers, short copper pipes and roof ventilation, metal ingot trays at edges. Square 5 by 5 footprint, roof covers upper four fifths and clear southern entrance apron lower fifth.
- `public/assets/game/assembly-top.webp`: Assembly workshop: weathered teal steel roof, broad central segmented roof skylight showing a restrained glimpse of a conveyor, tool racks, geometric gear emblem painted flat on roof, yellow clamps and amber lamps. Square 5 by 5 footprint, roof covers upper four fifths and clear southern entrance apron lower fifth.
- `public/assets/game/lab-top.webp`: Research laboratory: compact pale grey reinforced roof with turquoise glass skylight, two circular sealed analysis vessels seen from above, teal conduits, antenna circular base, warm amber lamps, small radiation symbol painted flat on roof. Square 4 by 4 footprint, roof covers upper three quarters and clear southern entrance apron lower quarter.
- `public/assets/game/fame-top.webp`: Trophy hall: dignified weathered olive bronze reinforced roof, centered shield and laurel emblem painted flat on roof, symmetrical display skylights with a hint of trophy cabinets, warm amber lighting and metal braces. Rectangular 5 by 4 footprint, roof covers upper three quarters and clear southern entrance apron lower quarter.

## Validation

226 existing tests passed. Browser layout checks at 320×640, 390×844, 768×650, 1366×768 and 844×390 found no horizontal overflow in the dialog or buttons. Verified blueprint purchase deducts its price exactly once and the recipe book opens all 15 building cards. Final bitmap loading, gameplay sprites and production build checked after integration.

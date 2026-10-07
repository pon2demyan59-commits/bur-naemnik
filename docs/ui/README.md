# Painted menu artwork

The in-game controls use illustrated textures, not screenshots with baked-in text. Russian labels, prices, quantities, portraits, progress and actions remain live HTML. The title splash is unchanged. The main menu now uses the shared painted enclosure and the workshop backdrop.

Created using the built-in image generation tool with the approved menu concept as a style reference. The drill image was supplied as an identity reference for the room atlas. Atlas slicing and WebP compression preserve alpha; `border-image` preserves corners and rivets when controls resize.

## Assets

All production assets are in `public/assets/ui/`:

- `painted-frame.webp`: teal enclosure with pipes, brass fasteners, warm lamp and transparent interior.
- `painted-amber.webp`, `painted-green.webp`: blank button textures.
- `painted-nameplate.webp`: blank header plate.
- `painted-screen.webp`: recessed information screen.
- `menu-workshop-scene.webp`: the canonical orange and teal drill in the underground workshop; also used by the repair console and main menu backdrop.
- `menu-armory-scene.webp`: mounted cannon on the armory workbench.
- `menu-lift-scene.webp`: freight lift in the underground shaft.

Portraits reuse the canonical existing character assets. Interface examples `workshop-menu.webp` and `main-menu.webp` were rendered in Chromium from the real HTML/CSS menu code against an illustrative background. They are layout previews, not complete Phaser gameplay screenshots.

## Generation prompts

Frame: Match the approved detailed hand-painted rusty teal industrial enclosure, brass slotted bolts, thick bevels, chipped orange rust, dark lower edge and warm highlights. One frontal wide rectangular outer frame, aspect 3:2. Border about 7% left/right, 12% top, 10% bottom. Genuinely transparent interior and exterior. Four large brass corner bolts, smaller rivets, pipes and cables around sides. Small glowing amber caged lamp on the upper-left rim. No title plate, text, buttons, character or scenery.

Control atlas: Square canvas divided into four equal horizontal strips with transparent spacing. Exactly four wide frontal rectangles: blank amber beveled metal button; blank moss green button with brass trim; blank dark teal header nameplate with slotted brass bolts; blank recessed dark green information screen. Detailed hand-painted rusty teal outlines and warm industrial lighting, wear mainly along edges. No labels, symbols or scenery; live Russian text is placed on top.

Interior atlas: Exactly three equal rectangular illustrations side by side, aspect 3:1, same warm illustrated underground industrial style. Left: canonical massive orange and teal tracked drill, steel conical head, windows and pipes, three-quarter side view, drill pointing right, on a service platform in a workshop with chains, lamps and pipes. Center: compact single-barrel roof cannon on the armory workbench, teal and brass pivot, tools, drawers and warm lamps. Right: teal freight lift cabin with orange hazard edges in a rocky shaft with rails, cables, chains and lamps. No people, text, frames or buttons. Keep each subject in its third for slicing.

## Verification

88 automated tests pass, including pause/resume, submenu navigation, canonical portraits, repeat upgrades and combat tracking. Chromium checked main menu, workshop, armory, repair, lift, Porodnik, pause and inventory at 1440×900, 390×844 and 844×390; no visible image failures, horizontal overflow or page errors. DOM checks also cover settings, reset, lift selection, repair meter, weapon installation and cargo quantity buttons.

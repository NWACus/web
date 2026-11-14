# PROTOTYPE — danger map variants for #1312 (NWAC homepage map concerns)

**Question:** How should the NWAC home-page danger map keep the focus on NWAC's own zones — so wide screens don't show half the Northwest, and readers don't think NWAC forecasts other centers' zones?

**Run:** `pnpm dev`, then open `http://nwac.localhost:$PORT/?variant=current` and flip with ← / → or the floating bar. Dev builds and the `nwac` tenant only, on the native-map path (nwac's dangerMap flag is on in the seeded dev DB). Everything lives in this folder plus `src/components/PrototypeSwitcher.client.tsx` and one `if` in `HomeDangerMap.tsx`.

| `?variant=` | Idea                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `current`   | Baseline: today's native map, NWAC's dashboard viewport, flat                                                                                         |
| `tilt`      | Idea 1: pitched camera (55°) with fog so the tall NWAC area foreshortens into a wide frame                                                            |
| `terrain`   | Idea 2: tilt + 3D terrain (3× exaggeration)                                                                                                           |
| `guide`     | Idea 3: terrain map + overlay listing each zone, its rating, and the places it covers; hover a row to highlight, click to fly                         |
| `centers`   | Idea 4: all centers in their real danger colors; NWAC zones get a bold halo, others get dashed outlines and a "Not an NWAC forecast" label per center |
| `skinny`    | Old nwac.org approach: narrow portrait map sized to the zones, with the zone list beside it                                                           |

**Knobs:** `?ratings=live` turns off the fake mid-winter ratings (everything is off-season in September). `?others=on|off` overrides whether other centers' zones are drawn.

**Caveats:** no search box in the prototype map. The zone → area lists in `nwacAreas.ts` are a first draft and forecasters should correct them.

## Observations while building

- Tilt alone doesn't fix the wide-screen problem much. The map is ~2.4:1, so a pitched view still shows Idaho and Oregon at the sides; it mainly adds drama.
- At regional zoom (~6), 3D terrain barely reads even at 3× exaggeration. The basemap's hillshade already does most of that work.
- `centers` answers the "people think we forecast other zones" concern without touching danger colors. The per-center labels clutter the east edge at this zoom.
- `skinny` + list answers both concerns at once (Kellen's pick, 2026-09-18) and adds the zone list (with the places each zone covers), which is also the accessible, text-first version of the map.

## Verdict

_TBD — fill in after Dennis/Dallas review, then delete this folder, the switcher, and the `if` in HomeDangerMap._

## Skinny with legacy widgets (for centers not yet on native pages)

- It works. The map widget in a tall half-width column frames NWAC well from NWAC's dashboard viewport, and `ZoneLinkHijacker` rewrites the forecast widget's zone links to `/forecasts/avalanche/<zone>`.
- The all-zones forecast widget is a full-page layout, not a compact list: about 2,500px off-season (issued/author/"More information" per zone). In season it adds the danger graphic and bottom line per zone, so expect it to be at least that tall. Hence the scroll box.
- It rewrites the home-page URL to `#/all` (WidgetRouterHandler).
- The map widget draws its own danger scale, so shipping this means dropping `<DangerScale />` under it.
- `ZoneLinkHijacker` observes the _first_ `#widget-container` on the page, so the forecast widget must come first in the DOM (CSS `order` puts the map back on the left).
- Prototype-only gotcha: the native map's `@mapbox/search-js-web` and the legacy map widget register the same custom elements, so they can't share a page ("Illegal constructor"). That's why this variant loads without any Mapbox code and the switcher does a full page load per variant.

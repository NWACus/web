# Displaying NAC Data in Native Pages

This document captures conventions and known discrepancies for rendering NAC API data (forecasts, warnings, danger ratings) in native Next.js pages rather than the embedded Vue widget.

## Danger Scale Colors

The canonical danger colors are consistent across the avy app, afp-public-widgets, and our native implementation:

| Level | Name | Hex | Source agreement |
|-------|------|-----|------------------|
| 5 | Extreme | `#231f20` | All sources agree |
| 4 | High | `#ed1c24` | All sources agree |
| 3 | Considerable | `#f7941e` | All sources agree |
| 2 | Moderate | `#fff200` | All sources agree |
| 1 | Low | `#50b848` | All sources agree |

### "No Rating" / Level 0 — Discrepancy

Level 0 (None) uses different colors in different contexts within afp-public-widgets:

| Context | Hex | Description |
|---------|-----|-------------|
| `DangerElevation.vue` | `#939598` | Gray, used in elevation band graphics |
| `forecasts.js` constant | `#909092` | Slightly different gray |
| SCSS `$no-rating` | `#6ea4db` | Blue, used in maps and charts |
| `.danger-bg-0` utility | `#ccc` | Light gray, used in generic backgrounds |

Our native implementation uses `#939598` (matching the elevation display component) for `None` and `#6ea4db` for `GeneralInformation` (-1). This aligns with the avy app's `colorFor()` function.

**TODO:** Align all implementations on a single "no rating" color per context (elevation graphics vs. maps vs. generic backgrounds), or document the intentional differences.

### Text Color on Danger Backgrounds

The afp-public-widgets only apply white text to **Extreme** (level 5). All other levels use dark text, including High (red). Our native implementation follows this convention:

- Extreme (`#231f20` background) → white text
- All other levels → dark text (`#1a1a1a`)

The avy app does not have explicit text color logic — it relies on the `color` npm package for contrast calculations, which may produce different results than the widget CSS.

## Danger Icons

Self-hosted PNGs at `/images/danger-icons/{0-5}.png`, copied from `avy/assets/danger-icons/`. These are the standard NAC danger scale icons used across all implementations.

## Problem Type Icons

Self-hosted PNGs at `/images/problem-icons/{ProblemName}.png`, copied from `avy/assets/problem-icons/`. Available types: CorniceFall, DeepPersistentSlab, DryLoose, Glide, PersistentSlab, StormSlab, WetLoose, WetSlab, WindSlab.

## Reference: Source Implementations

When investigating display behavior, these are the authoritative sources:

- **afp-public-widgets** — The Vue 3 widget we're replacing. Colors in `src/constants/forecasts.js` and `src/css/_variables.scss`. Components in `src/components/forecasts/`.
- **avy** (React Native app) — The mobile app. Danger colors in `components/AvalancheDangerTriangle.tsx` (`colorFor`). Names in `components/helpers/dangerText.ts`.
- **web native** — Our implementation. Utilities in `src/services/nac/dangerScale.ts`.

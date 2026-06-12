# Golf-swing Lottie candidates (research 2026-06-12, task #61/#50)

Downloaded to evaluate a replacement/recolor for `public/lottie/golf-swing.json`
(MJ Mograph swing, orange shirt `#FFA842`, knee flicker in the svg renderer).

All assets: **LottieFiles Lottie Simple License** — free, commercial use OK,
attribution not required (encouraged). Recolors are derivatives and stay under
the same license.

| File | LottieFiles ID | Look / palette | Notes |
|---|---|---|---|
| `golfer-92907.json` | 92907 "Golfer" | SAME rig, **dark-green shirt `#03510A`** + grey trousers + red cap accent | On-brand already; identical knee z-fight (same rig) |
| `golf-swing-1520235.json` | 1520235 "Golf Swing" | SAME rig, dark-green shirt + white/grey trousers | Identical rig + flicker |
| `custom-colours.json` | 62097 "Golf Swing Custom Colours" | SAME rig, **red shirt `#E72126`** | Recolor sibling of current; identical flicker |
| `golf-hole.json` | 140764 "Golf Hole" | Scenic putting green + flag, greens `#247200/#2A8A00/#B4C958` | NO golfer; flat scene, **cannot z-fight**; clean |
| `swinging-close-65614.json` | 65614 | 2 abstract black paths, 131x131 | Not a golfer — reject |
| `junior-golf-1518287.json` | 1518287 | 2.0 MB, embedded PNG raster, yellow-dominant | Too heavy + raster — reject |

## Key finding
Every golfer-SWING animation on LottieFiles is the **same MJ Mograph rig**,
recolored — identical 30-layer structure (head/torso/right leg/left leg/golf
stick/ballfly/tee), 1920x1920, 96f@24fps. There is no alternate-artist clean
swing. The knee flicker is structural: in draw order `right leg` sits ABOVE
`torso` which sits ABOVE `left leg`, so the torso is wedged between the two
coplanar leg fills; the svg renderer's sub-pixel AA jitters at the knee seam
each frame. A swap to a sibling does NOT fix it.

## Recommendation
Keep the current rig and (a) recolor the shirt to brass/felt-green and (b) kill
the flicker with the renderer/seam fix. The dark-green `golfer-92907.json`
already ships the on-brand shirt — drop-in swap removes the orange clash for
free, then apply the flicker fix. See the structured findings for exact edits.

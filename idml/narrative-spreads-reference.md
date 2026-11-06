# FY25 narrative spreads — build reference

Geometry read from `uploads/RV ANNUAL REPORT 2025_FINAL.idml`. All values are
page-relative points on a 1190.55 × 841.89pt spread (verso x 0–595.276, recto
x 595.276–1190.55). Copy for each section is in `copy/<slug>.js`.

## Standing rules from the user

- Headshots always sit in the same spot — fixed position, image-slot placeholder.
- Signatures float up/down with the volume of copy.
- Supporting imagery flexes with surrounding copy: lots of copy → smaller image;
  less copy → larger image to fill the space.
- Hidden layers `u117` (Navigation) and `u353` (Top Section Type) must NOT be built.

## Shared furniture (every spread)

| element | geometry |
|---|---|
| Ground | Black tint 4 → `#F6F6F6`, full bleed |
| Foot band | left −3, top 821.7, 1197.8 × 24.6, `linear-gradient(90deg,#EC008C,#005FA1)` |
| Verso folio / foot | 55.68 / 74.14, top 798.85 |
| Recto foot / folio | 963.22 / 1117.99, top 798.85 |
| Dotted circles | 3pt `Canned Dotted` white; positions vary per spread |
| Body type | Gotham Book 9pt / 12pt leading, `#6D6E71`, spec tracking −0.01em |
| Subhead | `A4 V:Subhead Small` — Gotham Bold 9/13, `#6D6E71`, tracking −0.01em |
| Heading | `A4 V:Heading Large` — Gotham Book 37/40, tracking −0.01em, RV Grad fill |

Headings must be built as SVG `<text>` with per-character `fill` steps. A
`url(#gradient)` paint server does NOT survive Chrome's print re-render inside
the shadow DOM — the text prints as invisible.

## pp. 6–7 CEO's Report — BUILT (`CEO's Report.dc.html`)

Columns: (55.7, 414, 235.78 × 371) · (302.84, 184.9, 235.78 × 600) ·
(652, 59.3, 235.28 × 725.5) · (898.64, 59.3, 235.28 × 620).
Column 0 starts below the portrait + caption, which the print wraps text around.
Portrait oval 57 / 182.9, 177.3² (`Aaron Morrison - CEO.JPG`).
Caption 56.7 / 372.5, w 178.7, centred, name bold.
Signature `Aaron Morrison Signature (002).psd` 895.8 / 701.6, 117.8 × 54.8 — floats.
Signature caption 898.9 / 758.5, w 111.5.
Dotted circles: 130.1 / −149.3 (581.8²) · 985.3 / −15.2 (824.3²) · 1047 / −458.6 (581.8²).
Fits at tracking −0.018em, step 3 of 6.

## pp. 10–11 Racing & Programming — add 54.4 to every y below

The spread has no 4% ground rect, so the raw read was offset; the foot band's
true top (821.7) gives the correction.

| item | geometry (corrected) |
|---|---|
| Heading `Racing & Programming` | 53.7 / 79.6, w 423.9 |
| Body col A | 56.7 / 170.6, 481.9 × 603 → 2 columns of 235.28 |
| RV Blue oval (decorative) | 64.3 / 310.2, 419.6 × 417.3 — solid RV Blue with a radial gradient feather, 100% opacity at 4.6% of the radius fading to 0% at 93%; text wrap None |
| Image `Ben Melham All Star Mile.JPG` | oval −65.3 / 140.6, 357.2² — crops off the outer edge of p.10; BoundingBoxTextWrap, so col A copy starts below y 497.8 |
| RV Cool Gray backing disc | 590.6 / 640.3, 365.6 × 368.6 — solid, sits behind the Nadal Meteorite photo offset up-left |
| RV Magenta glow | centre 935.2 / 368.9, ramp 199.8 — clipped to the Pride Of Jenni bbox |
| Body col B | 652 / 173.6, 234.0 × 495 |
| Body col C | 900 / 368.9, 234.0 × 353.8 |
| Image `Nadal Meteorite 1.JPG` | oval 596.2 / 645.9, 357.2² |
| Image `Pride Of Jenni Feehan 2.jpg` | oval 855 / 18.6, 318.5² |
| RV Magenta panel + caption | 767.6 / 201.7, 335.4 × 333.5 (story u1024b) |
| Dotted circles | 862.2 / 63.2 (824.3²) · 1015.1 / −421.7 (581.8²) |

Copy: 13 paragraphs — one `New Initiatives` subhead, one `Additional Program
Updates` subhead, the rest bullets. Story `u1dc8`, flowing u1dc5 → u11338 → u1137e.

Styles (from `Styles.xml`, not inferred): `A4 V:Bullets Body` — RV Cool Gray
(0/0/0/70), 9pt, space before 2.835 / after 11.339. `A4 V:Subhead Large` — RV
Blue, Gotham Book, 13pt on 18pt leading.

Spread XML extracted to `idml/Spread_RacingProgramming.xml`, story to
`idml/Story_RacingProgramming.xml`. Spread coordinates convert to page
coordinates with x + 595.28, y + 420.6.

## pp. 14–15 Owners & Breeders + Infrastructure & Projects

Two sections, two independent stories, one spread. Read from
`idml/Spread_OwnersInfra.xml` (`Spreads/Spread_u11823.xml`).

| item | geometry |
|---|---|
| Ground | Black at `FillTint="4"` → #F6F6F6, −8.5 / −8.8, 1207.6 × 858.9 |
| Heading `Owners & Breeders` | 53.7 / 79.6, w 360.2 — 37/40, Gradient/RV Grad |
| O&B col A | 56.7 / 161.7, 235.3 × 360 (story u11875) |
| O&B col B | 303.3 / 160.0, 248.9 × 739.7 — runs past the sheet; capped at 613.6 |
| RV Magenta glow | centre 280.5 / 503.3, ramp 175.1 — clipped to the McGaw bbox |
| RV Blue glow | −243.7 / 268.6, 361.7 × 359.7 — does not print (off-page); omitted |
| Image `McGaw VOBIS Owners Bonus-ext.psd` | oval −35 / 541.7, 348.9² — crops off the outer and foot edges |
| Heading `Infrastructure & Projects` | 651.5 / 79.6, w 500.5 |
| I&P col A | 651.8 / 161.7, 212.2 × 252 (story u118b7) |
| I&P col B | 898.6 / 161.7, 235.3 × 261 |
| Image `Pakenham Lights.jpg` | oval 691.9 / 398, 513.3² — crops off the outer and foot edges |
| RV Magenta glow | centre 1174.7 / 399.3, ramp 239 — clipped to the Pakenham bbox. Its core sits at that bbox's top-right corner, outside the photo circle, so the last lines of I&P col B do print over magenta at roughly 0.7 alpha — that is the published page, not a defect |
| Dotted circles | 605.1 / 181.8 (819.2²) · 933.1 / 392.8 (581.8²) |

Parked on the pasteboard, not printed: `McGaw.jpg` oval (−351 / 136.6, 307.9²),
the VOBRD panel (story u118d9, −270 / 485.7) and an empty 581.8² frame.
A Polygon at 229.6 / 566.7 (85.4 × 297) carries a contour wrap that shaves
~11pt off col B's left edge below y 566.7 — not reproduced.

Copy: `owners-breeders.js` (17 paras, 4 subheads, awards list) and
`infrastructure-projects.js` (10 paras, 5 bullets). Both fill sequentially.

## Shared style facts

| style | spec |
|---|---|
| `A4 V:Body` | RV Cool Gray, 9/12, tracking −10, space 5.669 before / 2.835 after |
| `A4 V:Bullets Body` | as Body, space 2.835 before / 11.339 after |
| `A4 V:Subhead Large` | RV Blue, Gotham Book, 13/18 |
| `A4 V:Heading Large` | Gradient/RV Grad (RV Blue → RV Magenta), Book, 37/40, tracking −10 |
| Glow ovals | solid swatch + radial gradient feather, 100% at 4.605% of `Length` → 0% at 93.07%, midpoint 45.2 (near-linear). **`Length` is in the item's LOCAL units — multiply by the item transform's scale**; scaled, it equals the oval's radius in almost every case. **Every glow is clipped to its photograph's bounding box in the printed PDF** — they are halos behind the circular photos, not washes across the page. Verify against the DPS PDF's paint operators (`getOperatorList`, look for the `clip` preceding each `SMask`/`shadingFill` pair) before placing one |
| Colours | RV Blue 100/30/0/25 · RV Magenta 0/100/0/0 · RV Cool Gray 0/0/0/70 · ground Black 4%. In the published PDF these rasterise to rgb(0,109,166), rgb(236,0,140), rgb(109,110,113) and rgb(243,244,244); the builds use the brand hexes #005FA1 / #EC008C / #6D6E71 / #F6F6F6 |

### Reading the published PDF

`uploads/RV ANNUAL REPORT 2025_FINAL_DPS.pdf` — spread pp.10–11 is PDF page 6,
pp.14–15 is page 8. Rasterising a page hangs (300dpi photos inside transparency
groups), but `page.getOperatorList()` and `page.getTextContent()` via pdfjs-dist
in `run_script` are fast and are the ground truth for clips, blend modes,
opacity and printed text positions.

Spread coordinates convert to page coordinates with x + 595.28, y + 420.6.

## pp. 16–17 Workforce Development

| item | geometry |
|---|---|
| Heading | 53.7 / 80.0, w 468.3 (frame h 154 → wraps to 2+ lines) |
| Body col A | 56.7 / 171.5, 481.9 × 620.5 → 2 columns |
| Body col B | 652 / 171.5, 481.9 × 588.2 → 2 columns |
| RV Blue oval | 42.5 / 335.7, 449.7 × 447.2 |
| RV Magenta panel + caption | 724.8 / 183.6, 426.3 × 423.9 (story ub132) |
| Image `Apprentices.psd` | oval 819 / 595, 459² |
| Image `Mr Brightside Strapper.jpg` | oval 887.2 / −46.1, 352.3² |
| Dotted circles | 862.2 / 63.6 (824.3²) · 998.8 / −462.5 (581.8²) |

Copy: 30 paragraphs, 6 subheads, 8 bullets — the densest section.

## pp. 18–19 Integrity Services — add 191.1 to every y below

| item | geometry (corrected) |
|---|---|
| Heading | 53.7 / 79.6, w 320.5 |
| Body col A | 56.7 / 169.8, 481.9 × 621.9 → 2 columns |
| Body col B | 652 / 170.7, 481.9 × 621 → 2 columns |
| RV Magenta oval | 629.3 / 167.5, 384.1 × 382 |
| Image `Integrity Services.jpg` | oval 783 / −126.3, 464.2² |
| Pull-out panel | 900 / 341.7, 252 × 87.4 |
| Dotted circles | 130.1 / −149.2 (581.8²) · 862.2 / 199.9 (824.3²) · 998.8 / −462.8 (581.8²) |

Copy: 28 paragraphs, 9 subheads — heavily sectioned.

## pp. 20–21 Equine Welfare — add 262.4 to every y below

| item | geometry (corrected) |
|---|---|
| Heading | 53.7 / 79.6, w 286.5 |
| Body col A | 56.7 / 170.5, 481.9 × 610.5 → 2 columns |
| Welfare spend table | 303.3 / 170.4, 235.3 × 135.3 (story ud613) |
| Body col B | 652 / 171.2, 481.9 × 611.5 → 2 columns |
| Image `Jen Duffy - Rehomer Launch.png` | oval −18 / 132.7, 309.6² |
| Image `Equine Welfare Off The Track.jpg` | oval 839.7 / −12.1, 461.8² |
| Pull-out panels | 892.9 / 262.2 (310.4 × 110.6) · 900 / 298.7 (252 × 142) |
| Dotted circles | 962.5 / 271.2 (824.3²) · 998.8 / −462.8 (581.8²) |

Copy: 20 paragraphs, 6 subheads. The welfare spend table already renders from
`kpi-data.js`-style raw values — send dollars per category, not percentages.

## Flow engine notes (carried from the Chair's and CEO spreads)

- Paragraph spacing is carried entirely as space-AFTER (8.504pt) so the first
  line of every column sits on its frame top and columns align across the spread.
- Columns are filled by measuring the rendered text and breaking mid-paragraph,
  matching InDesign's continuous flow. Per-paragraph packing wastes up to a
  paragraph per column and these spreads have no slack.
- `text-wrap: pretty` must NOT be used — it costs lines and desynchronises the
  measuring probe from the render.
- Fonts must be explicitly loaded (`document.fonts.load('400 9pt "Gotham"')`)
  before measuring; `document.fonts.ready` alone resolves too early.
- Tracking escalates from spec only as far as the copy demands, and any copy
  that still will not fit renders in a magenta overflow bar rather than being
  dropped.

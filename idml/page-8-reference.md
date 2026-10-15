# RV Annual Report FY25 — page 8 (KPI) build reference

Extracted from `uploads/RV ANNUAL REPORT 2025_FINAL.idml`. Page size 595.276 × 841.89pt
(A4 portrait). Page 8 is the **verso**; margins 56.693pt but the KPI tables are pulled
wide of them.

## Layers (designmap.xml)

| id | name | visible | printable |
|---|---|---|---|
| ucb | Text | **true** | true |
| u117 | Navigation | **false** | true |
| u353 | Top Section Type | **false** | true |
| u3a2 | Pg Numbers | **true** | true |
| u12c8c | Back Cover Logos | **true** | true |

Anything on `u117` or `u353` is switched off in the FY25 document and must not be built.

## Master spread u51f — what page 8 actually inherits

Page 8 sets `AppliedMaster="u51f"`, `OverrideList="u535 n"`.

**Built (visible layers):**

- `ua404` rect, layer ucb — whole-spread ground, `Color/Black` **tint 4** → `#F6F6F6`.
  Not white. Unfilled table cells show it through, so table banding is
  ground / RV Blue 10%, and the 0.5pt white column rules read against both.
- `ua406` rect, layer ucb — foot band, py 822.0–850.4 (bleeds off the page).
  Fill `Gradient/ua3c3` = RV Magenta @0 → RV Blue @100.
  `GradientFillAngle="0"`, `GradientFillStart="-303.784 2386.692"`,
  `GradientFillLength="1199.758"`, `ItemTransform` tx −295.471.
  → gradient starts at page-relative x −3.98pt and runs 1199.76pt across **both** pages,
  so page 8 shows t = 0.33% → 49.95%. Magenta on the left. Recto shows the blue half.
- `u701` / story u704, layer u3a2 — folio, page-rel 55.7/798.9, 16.4 × 10.9pt.
  Gotham Book 7pt, RV Blue, tracking +40, `<?ACE 18?>` auto page number.
- `u989f` / story u98a3, layer u3a2 — running foot, page-rel 74.1/798.9, 154.8 × 10.9pt.
  Para style `H3 Sub Heading LC Financials` (RV Blue, Bold) via empty char style
  `Paragraph Heading`; "RACING VICTORIA" overridden to Book 6pt +70, " ANNUAL REPORT 2025"
  Bold 6pt +70.

**Not built, and why:**

- Section thumb tabs — 14 rects (`u581`–`u58f`, page-rel x −4.7 to 22.7, seven 120.3pt
  bands per page) plus 14 rotated labels ("1. Section"…"7. Section", white Gotham Book
  9pt +40). All on layer **u117 (hidden)**.
- `u6d2` / story u6d6 — centred running head "category", Gotham Book 9pt RV Blue +40
  AllCaps, page-rel 56.7–538.6 / 33.6–44.5. Layer **u353 (hidden)**.
- `u535` / story u538 — master body-text frame, page-rel 56.7–538.6 / 195.6–748.3,
  threaded to `u564` on the recto, carrying placeholder integrity-section copy.
  Layer ucb (visible) **but** page 8's `OverrideList="u535 n"` detaches it; the page-8
  spread contains no frame with story u538. Not a phantom.

Page 8's spread frames are exactly five: uf6fb (heading), uf712 (subhead), uf88d (main
table), ufa5d (participation table), u119fa (footnotes).

## Page 8 content

| element | story | left | top | width | height |
|---|---|---|---|---|---|
| Heading "Key Performance Indicators" | uf6fb | 23.9 | 72 | 409.4 | 69.6 |
| Subhead "FY25 (July 2024 to June 2025)" | uf712 | 23.9 | 168 | 200.1 | 15 |
| Main KPI table | uf88d | 22.7 | 194.2 | 544.3 | 403.9 |
| Footnotes (overlaid in table spacer row 14) | u119fa | 23.0 | 449.2 | 544.0 | 22.2 |
| Participation table | ufa5d | 23.6 | 602.6 | 544.3 | 161 |

Heading: para style `A4 V:Heading Large` — Gotham **Book 37pt**, leading 40, tracking −10,
filled `Gradient/RV Grad` (RV Blue @0 → RV Magenta @100). The CharacterStyleRange sets
**no** GradientFillAngle/Start/Length, so it takes the default angle 0 fitted across the
frame — blue at the left edge, magenta at the right, shared across both wrapped lines.

Subhead: para style `H2 Sub Heading` (RV Blue, AllCaps); "FY25" Gotham Medium 12pt,
" (July 2024 to June 2025)" Gotham Light 12pt.

## Main table (one table, not three)

`BodyRowCount="21"`, `ColumnCount="10"`. Col 0 = 136.06pt (25%); cols 1–9 = 45.35pt
(8.3333% each). Total 544.25pt. Cell insets 4pt.

Row map — section title rows carry a `RowSpan="2"` label cell; group headers span
2/2/2/3 columns:

| rows | content | height |
|---|---|---|
| 0–1 | Racing Statistics + group headers | 16 / 33.6 |
| 2–7 | 6 racing rows | 14.4 |
| 8 | full-width spacer (colspan 10, Gotham Light) | ~16 |
| 9–10 | Prizemoney Statistics + headers | 16 / 33.6 |
| 11–13 | 3 prizemoney rows (row 12 wraps) | 14.4 / 24 / 14.4 |
| 14 | full-width spacer — **the footnotes sit here** | 31.34 |
| 15–16 | Wagering Statistics + headers | 16 / 33.6 |
| 17–20 | 4 wagering rows | 14.4 ×3 / 24 |

- Section title cell: `Color/RV Blue` solid, white Gotham **Bold 8pt**, left, v-centred.
- Group + column header cells: RV Blue **tint 70**, white Bold 8pt, **centred**.
- Body cells: Gotham **Book 8pt**, Black, **centred** (label column left).
- Banding: even row index unfilled (ground), odd index RV Blue **tint 10**.
- Rules: `Color/Paper` 0.5pt vertical, between numeric columns only — none between the
  label column and column 1. White 0.5pt also between group header blocks and under row 0.
- **No bold on Total rows** — "Total ($M)" and "Total Turnover ($M)" are Book like the rest.
- Null cells print `N/A` (VOBIS picnic).

## Participation table

`BodyRowCount="11"`, `ColumnCount="4"`. Cols 238.11 / 102.05 × 3 (43.75% / 18.75% × 3).
One header row: title cell RV Blue solid + FY25 / FY24 / Annual variance (%) at tint 70.
Same banding and 8pt Book body as the main table.

## Colours (CMYK → sRGB, process-ink multiply model)

| swatch | CMYK | hex |
|---|---|---|
| RV Blue | 100 30 0 25 | `#005FA1` |
| RV Blue @70% | — | `#4C8FBD` |
| RV Blue @10% | — | `#E6EFF6` |
| RV Blue Dark | 100 30 0 58 | `#004B6B` |
| RV Magenta | 0 100 0 0 | `#EC008C` |
| RV Secondary Blue | 100 13 1 2 | — |
| RV Cool Gray | 0 0 0 70 | `#6D6E71` |
| Black | 0 0 0 100 | `#231F20` |
| Black @4% (page ground) | — | `#F6F6F6` |
| Darker Gold | 29 55 93 13 | `#9E6410` |
| Lighter Gold | 1 7 45 0 | `#FCED8C` |

## Fonts

Gotham Light / Book / Medium / Bold cover this page (in `fonts/`). The wider report also
uses Gotham Black, the Book/Bold/Medium italics, and **Ringo** (para style
`H1 Chapter Heading`, 27pt caps +40) — still needed for later pages.

## Data notes

- FY25 participation values were missing from the workbook extract (wrong column
  mapping) and were taken from this printed page. Re-point the extraction before FY26.
- Two printed FY25 figures are sums of *rounded* components rather than rounded sums:
  Prizemoney Total metro (print $177.4, true $177.3) and total (print $288.6, true
  $288.5). The FY24 total in the same row used the other convention. The build shows the
  true values.
- Parimutuel picnic variance prints `0.00%` where every other cell uses one decimal.

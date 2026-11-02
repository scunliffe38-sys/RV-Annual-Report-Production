# Project rules

## Annual report builds

- **Section headings use the RV Grad (RV Blue `#005FA1` → RV Magenta `#EC008C`)**
  as FY25 does, built as per-character fills (a `url(#gradient)` paint server
  prints invisible). Applies to every section heading (37pt).
- Body copy: Gotham Book 9/12, RV Cool Gray `#6D6E71`. Subheads: Gotham Book
  13/18, RV Blue.
- Ground is `#F6F6F6` (Black 4%). Foot band is the magenta → blue gradient bar.
- Copy supplied by the user (docx, spreadsheets, Finance files) is set verbatim.
- **Text after a table gets breathing room.** Any paragraph that directly
  follows a table sits at least 8.504pt (3mm) below it, even where the source
  artwork has less. Legibility over fidelity to the InDesign spacing.
- **No folio under spilling copy.** On any page where body copy runs down into
  the folio row, drop that page's whole folio row — page number and the
  "RACING VICTORIA ANNUAL REPORT" running footer — rather than clip the copy.
  The check must use the same spacing the layout uses (including the gap after
  tables), so a spacing change can't reintroduce an overlap.

- **Finance note tables follow the FY25 PDF** (measured off
  `RV ANNUAL REPORT 2025_FINAL_DPS.pdf`): bold and italic as Word sets them,
  bold in RV Blue; 0.709pt rule over a total's figures; single rule under a
  subtotal, double under the total closing a group, a run of subtotals or the
  table; three-column tables indent everything under the title 14.17pt except
  bold-italic/lettered group heads and the opening sentence; in every note
  table "Total…" and "Balance at (the) end…" rows are RV Blue, label and
  figures; wide tables
  (PP&E, intangibles) are not indented and get a 181.4pt label column. Bold
  run-in heads (H3) are RV Blue, centred one 12pt line above and below.
  Footnotes stay on their table's page, in two columns if needed.
- **FY25 conventions applied over Word's formatting** (Test 8 comments):
  balance sheet heads bold blue, lines indented, totals bold italic blue,
  Net Assets/Total Equity double rule; in note tables "Current:"/"Non-Current:"
  and the label under them bold blue, plain group labels over figures blue
  underlined, "- " lines indented, labelled totals blue; note titles span
  the full width; every figures note opens under the date/$'000 bars;
  a note that fits a page starts on a fresh one, a long note starts fresh
  unless half the page is left, a short note goes over with the next when
  they share bars and the page is over half full; CEDS columns centred.
- **Test 9/10 rules:** Directors' Report headings never sit at a column foot
  with under ~4 lines below (spill spread takes overflow instead); signature
  place/date 8pt below the title; cash-flow lines indented between head and
  total, double rule under the last figures row; note double rules 2.25pt
  (Chrome draws thinner doubles as one solid rule); italic subhead → copy gap
  8.504pt; inside lettered policies run-in heads grey Medium and copy indented
  22.68pt; a lettered part moves over when it won't fit and <30% of the page is
  left; a note's last ≤3 lines may use the full frame; text under a table's
  footnote (lead-in, bullets, follow-on) is set as footnote; untitled tables
  opening on a label are flush left with a bold blue head; blank line before a
  group label that follows a total.
- **Test 11 (Tim McCann):** a note total closes on a double rule when its figures
  tie back to the four statements (adapter marks `row.tie`; wide tables tie on the
  Total column), otherwise a single rule. Exceptions: a subtotal directly above a total
  stays single, and a total closing a run of subtotals keeps its double. "… at the end
  of the period" totals are blue, label and figures. Note tables never have two blank
  rows in a row. Note 19 keeps its totals row. Bullets under a B2 paragraph are spaced
  the same as the gap above the first bullet.
- **Fonts are TrueType (`fonts/Gotham-*.ttf`) with fsType 0.** OTF (CFF) or
  TTFs with restricted/no-subsetting flags make Chrome save Gotham as Type 3
  (soft in Acrobat). Check File › Properties › Fonts shows "TrueType (CID)".

- **Director headshots follow FY25** (p.15 of the FY25 PDF): face centred
  horizontally, eye line 41% down the circle, crown-to-chin
  head height ~58% of the diameter, checked side by side so every head reads
  the same size (face width varies with hair and ears, so it is not used).
  **Framing in the Console (FY26 on):** every supplied headshot/photo gets a
  saved crop (`rec.crop` {l,t,w,src} in IndexedDB), set when the file is
  added and reset when it is replaced. Photos default to centred; headshots
  to the FY25 rule from the MediaPipe face finder (jsDelivr, needs internet;
  eye-to-chin = 1.27 × eye-to-mouth), or the FACES landmarks when the finder
  confirms it is the same photo. The producer adjusts in the Frame editor
  (eye/chin guides, all-headshots strip, live ppi). The run cuts each crop out
  at print resolution; under `prefer-src` image-slot ignores sidecar crops, so
  FY25 crops never carry over. Each photo is normalised to a square master to that rule (background
  edge-extended where the source runs out), then placed at zoom 1 with no offset.
  Originals kept in the sidecar as `dir-n-src`. In a production run the
  producer's full-size file is framed the same way (`FACES` landmarks in
  `production-images.js`, 1200 px master) and wins over the sidecar preview
  (`prefer-src` on image-slot). A photo whose shape differs from the framed
  one is placed unframed and logged; new photos need landmarks adding.

## How the project works (handoff)

Browser tool (Chrome/Edge, no install). A producer picks a folder of the year's
files in `Production Console.dc.html`, ticks sections and presses Produce. That
opens `Production Run.dc.html`, which lays out the chosen sections; the producer
waits for "Ready" and saves as PDF (Margins None, Background graphics on).
Serve the folder with `python serve.py` (caching off; plain `python -m http.server` lets Chrome keep stale scripts) and open `index.html`;
`file://` does not work because sections load content as modules.

- `Production Console.dc.html` – UI. `production-manifest.js` lists the 16
  sections and the file each expects. `production-inputs.js` reads the folder
  (docx, xlsx, pdf), checks it and builds the payload. `production-bridge.js`
  hands the payload to sections (`RVProduction.load(id, fallback)`).
  `production-images.js` maps headshots/signatures. Without a run, sections fall
  back to the FY25 files in `copy/`.
- Section pages are `*.dc.html`. Shared: `ReportBlock.dc.html`, `doc-page.js`,
  `image-slot.js`.
- Finance: `docx-finance.js` (Word reader) -> `finance-adapter.js` (builds
  Directors' Report, four statements, notes) -> `Financial Report.dc.html`.
  Note numbers and titles come from the document; `finance-notes.js` is only a
  register used to flag differences. The board comes from "Current Directors";
  director cards spread over two pages for any count, and the Directors' Report
  adds an extra spread if the copy outgrows pp. 30-37. The expenditure diagram
  is the picture in the Word doc. The signed auditor PDF is placed by `auditor-pages.js` the way FY25
  placed it: KPMG body type scaled to 9.48pt, text block aligned to the FY25
  positions, KPMG's footer/page numbers cropped (our 5pt grey footer on p.38),
  white made transparent, drawn at 300 dpi with an invisible text layer. The
  Console keeps the PDF in IndexedDB for the run; the FY26 preview reads
  `data/fy26-auditor.pdf` (payload `kpmg.pdf`; re-add it after rebuilding
  the payload from the docx). pdf.js from jsDelivr, needs internet. p.1
  independence declaration, pp.2-3 audit report; p.4 (Directors' Declaration)
  is not placed.
- Preview without the console: `Financial Report FY26.dc.html` reads
  `data/fy26-payload.json` (rebuild it from `data/fy26-finance.docx` with the
  adapter after any change).
- Adaptive layout: Integrity Services, Equine Welfare, Media, Workforce Development
  and Owners & Breeders / Infrastructure size photos to the copy (`?trim=0.8` previews 80% of the copy).
  Owners & Breeders / Infrastructure runs each story on its own (gaps 97/94%, photo
  down to 50 mm, then dropped). Console menu: auto/both/obOnly/ipOnly/none.
  FY26 preview `Owners & Breeders FY26.dc.html` (copy in `copy/fy26/`).
  Other sections are still fixed.
- Photo-layout rule (Workforce first, to roll out): Auto takes the layout with the
  most photos that fits (three → two, one per page → one top right → one bottom
  right → none). Within a layout: ease gaps to 97/94%, then shrink photos to a
  50 mm minimum, then drop to the next layout. The Console's per-section "Photos"
  menu overrides Auto (`run.layouts` → `photo-layout` prop). Photos come from the
  images folder by filename.

- Logos accept SVG/PNG/JPG/WebP plus AI (PDF-compatible), EPS, PDF and PSD
  (flattened composite). EPS goes through Ghostscript WASM (@jspawn/ghostscript-wasm,
  ~15 MB on first use) to a vector PDF. These are converted in `production-images.js` to a trimmed
  transparent PNG at 600 ppi of the largest placement (pdf.js / ag-psd from CDN,
  needs internet); a solid background is flagged.

## Open items
- Production Run tools: "Adjust images" (`run-image-editor.js`) opens a framing
  editor on any Console-managed slot (move/zoom/Auto/Replace); Save writes
  `rec.crop` via `RVImages.setCrop` and `RVImages.refresh(id)` re-cuts it on the
  page. "Proof version" (`?proof`, `window.RV_PROOF`) cuts photos at 150 ppi
  JPEG 80% and KPMG pages at 150 dpi for a shareable PDF.
- Pagination (built Nov 2026): the Production Run counts the pages each section
  lays out (`data-sec` wrappers; finance from `window.RV_FIN_LAYOUT`), feeds the
  counts to `report-structure.js` `withRun`, and passes folio-left/right to each
  section, folio-start to Financial Report, page-counts/year to Contents.
  Supplied page references stay verbatim; the run bar flags the Directors'
  Declaration "set out on pages X to Y" (expected: statements first to CED last)
  and "page N of the financial report" (FY25 convention: indep. page minus FR
  start), plus any "page(s) N" in other sections. `Production Run.dc.html?fy26`
  previews the whole FY26 report without a Console run.
- Roll adaptive photo/column layout out to the other sections (rules to be
  defined as we test).
- Wagering is one file: `FY26 Annual Report - Wagering.docx` supplies copy,
  charts and Top 5 (last six years in the two bar charts).
- The old Data Inputs workbook is split in two: `Annual Report - Industry
  Snapshot.xlsx` (snapshot tiles) and `Annual Report - Awards and Feature Race
  Winners.docx` (three headed lists: award winners, premiership winners,
  feature races as "Race (Horse)" + "Caption: …"; read by `awardsDocx`).
  Templates in `exports/FY26 Input Templates/`. FY26 preview `Wagering FY26.dc.html`.
  The Manikato circle keeps its centre x and bottom edge and shrinks so its
  top clears the top-right column's copy by 14.17pt (FY26: 132 mm vs 144 mm).
  The centre column wraps around it with a 22.68pt (8 mm) gap.
- KPI tables, footers and year labels on other sections are
  still hardcoded to FY25. Directors' Report page-range text is verbatim.
- Financial Report lays out slowly (5-30 s) with FY26 notes.
- Workforce FY26 (1,049 words) parked: fits two pages only with no photos
  (`photoLayout` none/single/corner/three; preview `Workforce Development FY26.dc.html`).
  Undecided: photo size vs. cutting copy vs. third page. Subhead spacing now FY25
  (35pt above, 20.5pt below, baseline to baseline) and list items tight. Neither
  change is applied to the other sections yet.
- Not yet checked visually: FY26 notes pages, extra Directors' Report spread.

# Project rules

## Annual report builds

- **Section headings are solid RV Blue (`#005FA1`).** Never the RV Blue → RV
  Magenta gradient, even where the InDesign artwork applies `Gradient/RV Grad`.
  Applies to narrative spreads, the financial report and anything else built in
  this project.
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

- **Fonts are TrueType (`fonts/Gotham-*.ttf`) with fsType 0.** OTF (CFF) or
  TTFs with restricted/no-subsetting flags make Chrome save Gotham as Type 3
  (soft in Acrobat). Check File › Properties › Fonts shows "TrueType (CID)".

## How the project works (handoff)

Browser tool (Chrome/Edge, no install). A producer picks a folder of the year's
files in `Production Console.dc.html`, ticks sections and presses Produce. That
opens `Production Run.dc.html`, which lays out the chosen sections; the producer
waits for "Ready" and saves as PDF (Margins None, Background graphics on).
Serve the folder over http (`python -m http.server`) and open `index.html`;
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
  is the picture in the Word doc. The signed auditor PDF is drawn page by page
  (pdf.js from jsDelivr, needs internet): p.1 independence declaration, pp.2-3
  audit report; p.4 (Directors' Declaration) is not placed.
- Preview without the console: `Financial Report FY26.dc.html` reads
  `data/fy26-payload.json` (rebuild it from `data/fy26-finance.docx` with the
  adapter after any change).
- Adaptive layout: Integrity Services, Equine Welfare, Media and Workforce
  Development size photos to the copy (`?trim=0.8` previews 80% of the copy).
  Other sections are still fixed.

## Open items
- Roll adaptive photo/column layout out to the other sections (rules to be
  defined as we test).
- KPI tables, Wagering charts, footers and year labels on other sections are
  still hardcoded to FY25. Directors' Report page-range text is verbatim.
- Financial Report lays out slowly (5-30 s) with FY26 notes.
- Not yet checked visually: FY26 notes pages, extra Directors' Report spread.

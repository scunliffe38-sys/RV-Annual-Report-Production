# RV Annual Report production console

Browser tool (Chrome or Edge) that reads an input folder and produces a print-ready PDF.

## Run it
- Hosted: turn on GitHub Pages for this repo (Settings > Pages > Deploy from branch `main`, folder `/ (root)`), then open the Pages address. `index.html` opens the console.
- Locally: serve the folder (for example `python -m http.server`) and open `index.html`. Opening files directly from disk will not work because the sections load their content as modules.

## Use it
1. Put the year's files in one folder, named `FY26 Annual Report - ...` (the console lists the exact names).
2. Open the console, choose the folder, tick the sections, press Produce.
3. On the Production Run page wait for "Ready", then Save as PDF (Margins: None, Background graphics: on).

Notes: reading the signed auditor PDF loads pdf.js from jsDelivr, so that step needs internet.

## Fonts
Every section uses Gotham, loaded from `fonts/` with `@font-face` (family name `Gotham`):

| File | Weight | Used for |
|---|---|---|
| `Gotham-Light.ttf` | 300 | Light display text |
| `Gotham-Book.ttf` | 400 | Body copy (9/12), subheads (13/18), director bios (7/9.6) |
| `Gotham-BookItalic.ttf` | 400 italic | Italic text, e.g. key goals, note subheads |
| `Gotham-Medium.ttf` | 500 | Medium text |
| `Gotham-MediumItalic.ttf` | 500 italic | Medium italic |
| `Gotham-Bold.ttf` | 700 | Headings, names, bold table rows |
| `Gotham-Black.ttf` | 900 | Heavy display text |

Rules:
- Use TrueType (`.ttf`) files with fsType 0 (no embedding restrictions). OTF (CFF) files, or TTFs that restrict subsetting, make Chrome save Gotham as Type 3, which looks soft in Acrobat.
- To check a PDF, open File › Properties › Fonts in Acrobat. Gotham should show as "TrueType (CID)".
- To replace a font, keep the same file name in `fonts/`. The sections need no changes.
- The current files hold about 340 characters and have no hinting. ≤, ½, → and ′ are missing and print in a fallback font. A full desktop set from the Hoefler&Co licence would fill those gaps.
- After changing fonts, hard refresh (Ctrl+F5) before saving the PDF.

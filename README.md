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

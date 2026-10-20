repo: scunliffe38-sys/RV-Annual-Report-Production
branch: main

## Last sync
date: 2026-10-20T00:00:00Z

### Updated in this project
- KPMG auditor pages (pp. 38–40) placed as in FY25: 300 dpi, transparent ground, KPMG footer cropped, body scaled to 9.48pt, hidden text layer (new auditor-pages.js).
- Production Console stores the auditor PDF in IndexedDB; production-inputs.js checks scale and fit.
- data/fy26-auditor.pdf added; data/fy26-payload.json points to it; CLAUDE.md updated.

## Sync history
- 2026-10-16T06:15:16Z: Finance tables, notes copy styles and FY26 payload restyled to FY25.
- 2026-10-15T02:01:00Z: Repo switched to RV-Annual-Report-Production; project files (317) pushed by the user.

## Screen map
| Screen | Repo files |
|---|---|
| Production Console | Production Console.dc.html, production-*.js, auditor-pages.js |
| Financial Report | Financial Report.dc.html, NoteBlock.dc.html, StatementTable.dc.html, docx-finance.js, finance-adapter.js, data/fy26-payload.json, auditor-pages.js, data/fy26-auditor.pdf |

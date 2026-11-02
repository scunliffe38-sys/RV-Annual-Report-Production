/* Production manifest — the fixed contract between the input folder and the report.
 *
 * `inputs` lists every file the producer's folder should contain. File names are
 * fixed: the report year is prefixed (e.g. "FY26 Annual Report - Media.docx") and
 * anything else in the folder is flagged. Change a name here and in the templates
 * together, never one without the other.
 *
 * `sections` lists what can be produced, in report order. `content` says how much
 * of the section is driven by this year's inputs today:
 *   live     all printed content comes from the inputs
 *   partial  some content comes from the inputs; `note` says what doesn't yet
 *   fixed    no inputs needed (cover, contents, back) or not wired yet (`note`)
 * `spine` ties the section to report-structure.js for page numbers.
 */
(function (root) {
  "use strict";

  var inputs = [
    { id: "chair",            tail: "Annual Report - Chair's Report.docx",               kind: "docx", from: "Department" },
    { id: "ceo",              tail: "Annual Report - CEO's Report.docx",                 kind: "docx", from: "Department" },
    { id: "kpiRacing",        tail: "Racing_Prizemoney_Wagering KPIs.xlsx",              kind: "xlsx", from: "Finance" },
    { id: "kpiParticipation", tail: "Participation KPIs.xlsx",                           kind: "xlsx", from: "Finance" },
    { id: "snapshotData",     tail: "Annual Report - Industry Snapshot.xlsx",            kind: "xlsx", from: "Template" },
    { id: "awardsData",       tail: "Annual Report - Awards and Feature Race Winners.xlsx", kind: "xlsx", from: "Template" },
    { id: "racing",           tail: "Annual Report - Racing & Programming.docx",         kind: "docx", from: "Department" },
    { id: "owners",           tail: "Annual Report - Owners & Breeders.docx",            kind: "docx", from: "Department" },
    { id: "infrastructure",   tail: "Annual Report - Infrastructure & Projects.docx",    kind: "docx", from: "Department" },
    { id: "workforce",        tail: "Annual Report - Workforce Development.docx",        kind: "docx", from: "Department" },
    { id: "integrity",        tail: "Annual Report - Integrity Services.docx",           kind: "docx", from: "Department" },
    { id: "welfare",          tail: "Annual Report - Equine Welfare.docx",               kind: "docx", from: "Department" },
    { id: "wagering",         tail: "Annual Report - Wagering.docx",                     kind: "docx", from: "Template" },
    { id: "media",            tail: "Annual Report - Media.docx",                        kind: "docx", from: "Template" },
    { id: "industry",         tail: "Annual Report - Industry and Community Support.docx", kind: "docx", from: "Template" },
    { id: "finance",          tail: "Annual Report - Finance Section.docx",              kind: "docx", from: "Finance" },
    { id: "auditor",          tail: "Annual Report - Independent Auditor.pdf",           kind: "pdf", pages: 4, from: "Finance", detail: "signed, 4 pages" },
  ];

  // Narrative Word documents: which bridge payload they feed, and how their
  // headings map onto the section's paragraph kinds.
  var narrative = {
    chair:          { payload: "chair-report-data",       strings: true },
    ceo:            { payload: "ceo-report" },
    racing:         { payload: "racing-programming" },
    owners:         { payload: "owners-breeders" },
    infrastructure: { payload: "infrastructure-projects" },
    workforce:      { payload: "workforce-development" },
    integrity:      { payload: "integrity-services" },
    welfare:        { payload: "equine-welfare" },
    wagering:       { payload: "wagering", kinds: { subhead: "h2", h1: "h2" } },
    media:          { payload: "media" },
    industry:       { payload: "industry-community" },
  };

  var sections = [
    { id: "cover",     title: "Cover",                            dc: "Cover",                             spine: ["cover"],     inputs: [], content: "fixed" },
    { id: "contents",  title: "Contents",                         dc: "Contents",                          spine: ["contents"],  inputs: [], content: "fixed" },
    { id: "chair",     title: "Chair\u2019s Report",              dc: "Chair's Report",                    spine: ["chair"],     inputs: ["chair"], content: "live" },
    { id: "ceo",       title: "CEO\u2019s Report",                dc: "CEO's Report",                      spine: ["ceo"],       inputs: ["ceo"], content: "live" },
    { id: "kpi",       title: "KPIs & Industry Snapshot",         dc: "KPI & Industry Snapshot",           spine: ["kpi", "snapshot"], inputs: ["kpiRacing", "kpiParticipation", "snapshotData"], content: "partial",
      sheets: { snapshotData: "Industry Snapshot sheet" },
      note: "KPI tables come from the two KPI workbooks and snapshot tiles from the Industry Snapshot workbook. The prizemoney footnotes are not in the workbook and are left off." },
    { id: "racing",    title: "Racing & Programming",             dc: "Racing & Programming",              spine: ["racing"],    inputs: ["racing"], content: "live" },
    { id: "awards",    title: "Victorian Racing Awards & Feature Race Winners", dc: "Racing Awards & Feature Winners", spine: ["awards", "feature-winners"], inputs: ["awardsData"], content: "partial",
      sheets: { awardsData: "VR Awards, Premierships and Feature Race Winners sheets" },
      note: "Winners, premierships and captions come from the Awards and Feature Race Winners workbook. The \u201c2024-25\u201d heading is still set by hand." },
    { id: "owners",    title: "Owners & Breeders / Infrastructure", dc: "Owners & Breeders + Infrastructure", spine: ["owners", "infrastructure"], inputs: ["owners", "infrastructure"], content: "live",
      photoLayouts: [
        { key: "auto", label: "Auto (shrink, then drop each photo)" }, { key: "both", label: "Both photos" },
        { key: "obOnly", label: "Owners & Breeders photo only" }, { key: "ipOnly", label: "Infrastructure photo only" },
        { key: "none", label: "No photos" }] },
    { id: "workforce", title: "Workforce Development",            dc: "Workforce Development",             spine: ["workforce"], inputs: ["workforce"], content: "live",
      photoLayouts: [
        { key: "auto", label: "Auto (most photos that fit)" }, { key: "three", label: "Three photos (FY25)" },
        { key: "corner", label: "Two photos, one per page" }, { key: "topright", label: "One photo, top right" },
        { key: "single", label: "One photo, bottom right" }, { key: "none", label: "No photos" }] },
    { id: "integrity", title: "Integrity Services",               dc: "Integrity Services",                spine: ["integrity"], inputs: ["integrity"], content: "live" },
    { id: "welfare",   title: "Equine Welfare",                   dc: "Equine Welfare",                    spine: ["welfare"],   inputs: ["welfare"], content: "live" },
    { id: "wagering",  title: "Wagering",                         dc: "Wagering",                          spine: ["wagering"],  inputs: ["wagering"], content: "live",
      note: "Copy, the three charts and Top 5 all come from the Wagering Word document." },
    { id: "media",     title: "Content, Media & Marketing",       dc: "Media",                             spine: ["media"],     inputs: ["media"], content: "live" },
    { id: "industry",  title: "Industry & Community Support",     dc: "Industry & Community Support",      spine: ["industry"],  inputs: ["industry"], content: "live" },
    { id: "finance",   title: "Financial Report",                 dc: "Financial Report",
      spine: ["directors-report", "auditor-indep", "auditor-report", "directors-decl", "stmt-surplus", "stmt-position", "stmt-cashflows", "stmt-equity", "notes", "ced"],
      inputs: ["finance", "auditor"], content: "partial",
      note: "Directors’ Report, the four statements and the notes are built from the Finance document; the auditor pages are placed from the signed PDF. Page references inside the copy (e.g. “pages 47 to 82”) print as written." },
    { id: "back",      title: "Back cover",                       dc: "Back Matter",                       spine: ["back"],      inputs: [], content: "fixed" },
  ];

  root.RV_PRODUCTION_MANIFEST = {
    years: ["FY26", "FY27", "FY28"],
    inputs: inputs,
    narrative: narrative,
    sections: sections,
    fileName: function (input, year) { return year + " " + input.tail; },
  };
})(window);

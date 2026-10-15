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
    { id: "dataInputs",       tail: "Annual Report - Data Inputs.xlsx",                  kind: "xlsx", from: "Template" },
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
    { id: "kpi",       title: "KPIs & Industry Snapshot",         dc: "KPI & Industry Snapshot",           spine: ["kpi", "snapshot"], inputs: ["kpiRacing", "kpiParticipation", "dataInputs"], content: "partial",
      sheets: { dataInputs: "Industry Snapshot sheet" },
      note: "Snapshot tiles come from Data Inputs. KPI tables still show FY25 figures until the KPI workbook reader is connected." },
    { id: "racing",    title: "Racing & Programming",             dc: "Racing & Programming",              spine: ["racing"],    inputs: ["racing"], content: "live" },
    { id: "awards",    title: "Victorian Racing Awards & Feature Race Winners", dc: "Racing Awards & Feature Winners", spine: ["awards", "feature-winners"], inputs: ["dataInputs"], content: "partial",
      sheets: { dataInputs: "VR Awards, Premierships and Feature Race Winners sheets" },
      note: "Winners, premierships and captions come from Data Inputs. The \u201c2024-25\u201d heading is still set by hand." },
    { id: "owners",    title: "Owners & Breeders / Infrastructure", dc: "Owners & Breeders + Infrastructure", spine: ["owners", "infrastructure"], inputs: ["owners", "infrastructure"], content: "live" },
    { id: "workforce", title: "Workforce Development",            dc: "Workforce Development",             spine: ["workforce"], inputs: ["workforce"], content: "live" },
    { id: "integrity", title: "Integrity Services",               dc: "Integrity Services",                spine: ["integrity"], inputs: ["integrity"], content: "live" },
    { id: "welfare",   title: "Equine Welfare",                   dc: "Equine Welfare",                    spine: ["welfare"],   inputs: ["welfare"], content: "live" },
    { id: "wagering",  title: "Wagering",                         dc: "Wagering",                          spine: ["wagering"],  inputs: ["wagering", "dataInputs"], content: "partial",
      sheets: { dataInputs: "Wagering Charts and Wagering Top Five sheets" },
      note: "Copy and Top Five come from the inputs. The three charts still draw FY25 values." },
    { id: "media",     title: "Media",                            dc: "Media",                             spine: ["media"],     inputs: ["media"], content: "live" },
    { id: "industry",  title: "Industry & Community Support",     dc: "Industry & Community Support",      spine: ["industry"],  inputs: ["industry"], content: "live" },
    { id: "finance",   title: "Financial Report",                 dc: "Financial Report",
      spine: ["directors-report", "auditor-indep", "auditor-report", "directors-decl", "stmt-surplus", "stmt-position", "stmt-cashflows", "stmt-equity", "notes", "ced"],
      inputs: ["finance", "auditor"], content: "fixed",
      note: "The Directors’ Report and the four statements are built from the Finance document. The notes still print FY25 content until they are connected. The auditor pages are placed from the signed PDF." },
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

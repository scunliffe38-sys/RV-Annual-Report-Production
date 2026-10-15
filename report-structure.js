// Pagination spine for the RV Annual Report.
//
// This is the single source of truth for how many pages each section occupies.
// The Contents page derives every page number by accumulating `pages` down this
// list, so pushing Racing & Programming to three pages is a one-number edit here
// and everything after it renumbers.
//
// `contents: false` marks a section that occupies pages but is not listed on the
// contents page (cover, the contents spread itself, the back cover).

(function (root) {

const SECTIONS = [
  { id: "cover",            title: "Cover",                                        pages: 1,  contents: false },
  { id: "contents",         title: "Contents",                                     pages: 2,  contents: false },
  { id: "chair",            title: "Chair\u2019s Report",                          pages: 2 },
  { id: "ceo",              title: "CEO\u2019s Report",                            pages: 2 },
  { id: "kpi",              title: "Key Performance Indicators",                   pages: 1 },
  { id: "snapshot",         title: "FY25 Industry Snapshot",                       pages: 1 },
  { id: "racing",           title: "Racing & Programming",                         pages: 2 },
  { id: "awards",           title: "Victorian Racing Awards",                      pages: 1 },
  { id: "feature-winners",  title: "2024-25 Feature Race Winners",                 pages: 1 },
  { id: "owners",           title: "Owners & Breeders",                            pages: 1 },
  { id: "infrastructure",   title: "Infrastructure & Projects",                    pages: 1 },
  { id: "workforce",        title: "Workforce Development",                        pages: 2 },
  { id: "integrity",        title: "Integrity Services",                           pages: 2 },
  { id: "welfare",          title: "Equine Welfare",                               pages: 2 },
  { id: "wagering",         title: "Wagering",                                     pages: 2 },
  { id: "media",            title: "Media",                                        pages: 2 },
  { id: "industry",         title: "Industry & Community Support",                 pages: 2 },
  { id: "directors-report", title: "Directors\u2019 Report",                       pages: 10 },
  { id: "auditor-indep",    title: "Lead Auditor\u2019s Independence Declaration", pages: 1 },
  { id: "auditor-report",   title: "Independent Auditor\u2019s Report",            pages: 2 },
  { id: "directors-decl",   title: "Directors\u2019 Declaration",                  pages: 2 },
  { id: "stmt-surplus",     title: "Consolidated Statement of Surplus or Deficit & Other Comprehensive Income", pages: 1 },
  { id: "stmt-position",    title: "Consolidated Statement of Financial Position", pages: 1 },
  { id: "stmt-cashflows",   title: "Consolidated Statement of Cash Flows",         pages: 1 },
  { id: "stmt-equity",      title: "Consolidated Statement of Changes in Equity",  pages: 1 },
  { id: "notes",            title: "Notes to the Financial Statements",            pages: 36 },
  { id: "ced",              title: "Consolidated Entity Disclosure Statement",     pages: 1 },
  { id: "back",             title: "Back cover",                                   pages: 1,  contents: false },
];

// Walks the spine and stamps each section with its first and last page.
function paginate(sections = SECTIONS) {
  let page = 1;
  return sections.map((s) => {
    const first = page;
    page += s.pages;
    return { ...s, first, last: page - 1 };
  });
}

// Sections that print on the contents page, with their starting page number.
function contentsEntries(sections = SECTIONS) {
  return paginate(sections)
    .filter((s) => s.contents !== false)
    .map((s) => ({ id: s.id, title: s.title, page: String(s.first) }));
}

// Spread-based sections should open on a verso (even) page. Returns the ones
// that no longer do, so a page-count change that breaks the imposition is loud
// rather than silent.
function impositionWarnings(sections = SECTIONS) {
  return paginate(sections)
    .filter((s) => s.pages === 2 && s.first % 2 !== 0)
    .map((s) => `${s.title} starts on p.${s.first} (odd) \u2014 spread will split across a turn`);
}

root.RV_REPORT_STRUCTURE = { SECTIONS, paginate, contentsEntries, impositionWarnings };

})(window);

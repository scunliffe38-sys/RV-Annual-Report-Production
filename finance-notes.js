/* Note register for the Finance section converter.
 *
 * The Finance docx carries no reliable heading style on its note titles —
 * they are ordinary bold paragraphs, so the converter cannot infer note
 * boundaries from Word alone. This list is the register it matches against.
 *
 * Matching ignores the leading number, case, and punctuation, so notes can be
 * renumbered in Word without breaking any table key. Rename a note here when
 * Finance renames it; add or remove entries when notes are added or dropped.
 * Anything in this list the converter cannot find in the document is reported
 * as an error rather than passing silently.
 *
 * An entry can also be an array — ["Published title", "wording used in Word"] —
 * for notes whose table in Word heads itself differently from the printed
 * title. The first item is always the name used in the output.
 */
(function (root) {
  "use strict";

  root.RV_FINANCE_NOTES = [
    "Summary of Material Accounting Policies",
    "Surplus / (Deficit) from Operations",
    "Current Trade and Other Receivables",
    "Other Financial Assets",
    "Property, Plant and Equipment",
    "Intangible Assets",
    "Right of Use Assets",
    "Investments accounted for using the Equity Method",
    "Current Trade and Other Payables",
    "Unearned Revenue",
    "Provisions",
    "Other Financial Liabilities",
    "Issued Capital",
    "Retained Earnings",
    "Commitments for Expenditure",
    "Superannuation Commitments",
    "Key Management Personnel Remuneration",
    "Remuneration of Auditors",
    "Parent Entity Financial Information",
    "Related Party Disclosures",
    "Notes to the Statement of Cash Flows",
    "Contingent Liabilities",
    "Subsequent Events",
    "Material Accounting Policies",
    "Additional Consolidated Entity Information",
  ];
})(window);

// Wagering FY26 — copy and chart figures read from "2026 Annual Report - Wagering.docx".
// Paragraphs verbatim; kind 'h2' = H2 Sub Heading Financials. Charts show the last six years.
export const copy = {
  slug: 'wagering',
  year: 2026,
  photo: './images/fy26/wagering-crowd.jpg',
  paragraphs: [
    { text: 'Wagering turnover on Victorian Thoroughbred Racing (VTR) fell (-2.8%) year-on-year (YoY), driven partially by a reduced racing program, with approximately 160 fewer races conducted across the year due to programming changes and abandonments.' },
    { text: 'Challenging macroeconomic conditions and ongoing uncertainty surrounding the Federal Government’s regulatory reforms weighed on VTR turnover, materialising in lower Wagering Service Provider (WSP) customer generosity spend (FBT -8.4%) and restrained marketing. Wagering on sport continues to grow in popularity among customers, reducing racing’s share of overall customer wallet while also expanding the addressable market.' },
    { text: 'On an underlying basis, average turnover per race increased by 0.7%, indicating that the Victorian Thoroughbred Racing product remained resilient despite ongoing macroeconomic, regulatory and wagering market pressures.' },
    { text: 'TURNOVER TRENDS', kind: 'h2' },
    { text: 'Turnover was stable in the first half of the year (+1.0%), before deteriorating in the second half of the year (-7.9%).' },
    { text: 'H1', kind: 'h2' },
    { text: 'H1 FY26 delivered a comparatively resilient wagering result, with turnover increasing by 1.0% YoY to approximately $4.3 billion.' },
    { text: 'The Spring Racing Carnival once again demonstrated its popularity, with 19 of the top 20 turnover races run in Victoria between Turnbull Stakes Day (October 4) and Champions Day (8 November).' },
    { text: 'Across all meetings during the Spring Carnival period, total domestic turnover grew to $2.84 billion representing a +3.2% YoY increase, underscored by a successful Melbourne Cup Carnival at Flemington (+8.9% YoY). Turnover on the Melbourne Cup reached a record $247m, more than four times higher than any other race in the nation.' },
    { text: 'Caulfield Cup Carnival wagering improved +3.9% vs. 2024, highlighted by a +7.7% increase in Caulfield Cup Day turnover, which benefitted from the addition of the Thousand Guineas to the program. Turnover for the revamped Orr Stakes meeting at Caulfield was comparable to 2024, despite featuring one less G1 race (Thousand Guineas and Sir Rupert Clarke Stakes on the 2024 program).' },
    { text: 'Cox Plate Carnival turnover was just below 2024 (-2.4%), impacted by softer field sizes for the Cox Plate meeting. The Cox Plate itself performed well given the small field (8 starters), and sits comfortably as the third biggest wagering race for the year in Victoria:' },
    { text: 'H2', kind: 'h2' },
    { text: 'Wagering conditions became more challenging during H2 FY26, with turnover declining (-7.9%) year-on-year to approximately $3.1 billion. The weaker result reflected a combination of fewer races, wet tracks, unfavourable customer results, the transfer of meetings away from The Valley during its renovation and broader macroeconomic headwinds.' },
    { text: 'Turnover on the Festival of Racing was marginally down year-on-year (-1.2%), however the prior year was artificially inflated by abandoned racing at Rosehill and Doomben on Australia Cup Day. Excluding Australia Cup Day, turnover on the Festival of Racing was up +3.5% YoY.' },
    { text: 'Bendigo Golden Mile Day was shifted to early May in 2026, replaced in early April by the Anniversary Vase meeting at Caulfield to ensure metropolitan racing was run alongside Day 2 of The Championships at Randwick. Turnover across the two meetings was up +9.1% YoY.' },
    { text: 'Twilight racing was popular with customers, delivering turnover of +17.5% on comparable day meetings in the second half of the year, supporting the view that wagering improves when the audience is more likely to engage with VTR.' },
    { text: 'INCOME TRENDS', kind: 'h2' },
    { text: 'Race fields income increased to approximately $228.8 million, up 2.2% on the prior year, despite the decline in total turnover and similar WSP margins. This outcome was supported by the full-year impact of race fields model changes introduced in FY25 and the continued shift of wagering activity toward digital and fixed-odds channels, which remain the key drivers of product fee income.' },
    { text: 'Point of Consumption Tax distributions increased to approximately $129.8 million, due to one-off auditing by the Department of Treasury and Finance. State Government funding provided an additional source of long-term funding certainty under the new industry distribution arrangements.' },
  ],
  // [year, turnover label, turnover YoY %, free bet turnover label, FBT YoY %]
  annual: [
    { fy: 'FY20', turnover: '$7.10', turnoverYoY: null, fbt: '$243.7', fbtYoY: null },
    { fy: 'FY21', turnover: '$8.70', turnoverYoY: 22.5, fbt: '$365.8', fbtYoY: 50.1 },
    { fy: 'FY22', turnover: '$9.16', turnoverYoY: 5.3, fbt: '$444.2', fbtYoY: 21.4 },
    { fy: 'FY23', turnover: '$8.82', turnoverYoY: -3.7, fbt: '$493.8', fbtYoY: 11.2 },
    { fy: 'FY24', turnover: '$7.92', turnoverYoY: -10.2, fbt: '$393.0', fbtYoY: -20.4 },
    { fy: 'FY25', turnover: '$7.61', turnoverYoY: -3.9, fbt: '$369.1', fbtYoY: -6.1 },
    { fy: 'FY26', turnover: '$7.40', turnoverYoY: -2.8, fbt: '$338.2', fbtYoY: -8.4 },
  ],
  quarterly: {
    prior: 'FY25', current: 'FY26',
    rows: [
      { q: 'Q1', prior: '$1.6', current: '$1.7', yoy: 2.5 },
      { q: 'Q2', prior: '$2.6', current: '$2.6', yoy: 0.0 },
      { q: 'Q3', prior: '$1.8', current: '$1.7', yoy: -6.2 },
      { q: 'Q4', prior: '$1.6', current: '$1.4', yoy: -9.9 },
    ],
  },
  topFiveTitle: 'Top 5 Turnover Races in FY26',
  topFive: ['Lexus Melbourne Cup', 'Caulfield Cup', 'Cox Plate', 'Victoria Derby', 'Coolmore Stud Stakes'],
};

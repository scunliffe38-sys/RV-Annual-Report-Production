// FY26 INDUSTRY SNAPSHOT — INPUT FILE
//
// This is the one file to update each year for the Industry Snapshot page.
// Edit the `value` numbers only. Everything printed on the page — rounding,
// currency prefixes, the "bn"/"m" suffixes, thousands separators, percentages —
// is derived from these raw values at build time.
//
// HOW TO UPDATE FOR FY26
//   1. Set meta.period / meta.footYear / meta.folio.
//   2. Replace each `value` with the FY26 raw number. Full units, no rounding:
//      write 7610000000, not 7.61 or "$7.61bn".
//   3. Leave `value: null` for anything not yet available — it prints as an
//      em dash so the gap is visible on the proof.
//   4. Do not change the `id` keys. They are what the page positions by.
//
// FORMATS (how a raw value is rendered)
//   money-bn2   7610000000 -> "$7.61" + "BN"      two decimals, split suffix
//   money-m1     288600000 -> "$288.6m"           one decimal
//   money-m2       5940000 -> "$5.94m"            two decimals
//   count-m2       1160415 -> "1.16m"             two decimals, no currency
//   count-m1       5500000 -> "5.5m"              one decimal, no currency
//   count            64706 -> "64,706"            thousands separated
//   pct2            0.9995 -> "99.95%"            two decimals
//
// DERIVED STATS: three figures also appear in the KPI tables on the facing page
// (total turnover, total attendance, prizemoney and bonuses). Those carry a
// `derive` descriptor instead of a `value` and are read straight out of
// kpi-data.js at build time. Do not give them a value — that reintroduces the
// chance of the same number printing twice with two answers.

export const snapshot = {
  meta: {
    period: 'FY25',
    heading: 'FY25 Industry Snapshot',
    footYear: 2025,
    folio: 9,
  },

  stats: {
    totalTurnover: {
      // DERIVED from the KPI tables on the facing page — never transcribed, so
      // the two printings of this figure cannot drift apart.
      derive: { table: 'Wagering Statistics', row: 'Total Turnover ($M)', group: 'total', scale: 1e6 },
      format: 'money-bn2',
      source: 'Racing_Prizemoney_Wagering KPIs — total turnover',
    },

    springCarnivalBenefit: {
      value: 785100000,
      format: 'money-m1',
      source: 'Spring Racing Carnival economic impact study',
    },

    totalAttendance: {
      // DERIVED from the Participation table on the facing page.
      derive: { participation: true, row: 'Total attendances' },
      format: 'count-m2',
      source: 'Participation KPIs — total attendances FY25',
    },

    prizemoneyAndBonuses: {
      // DERIVED from the Prizemoney table on the facing page. Hard-coding this
      // put $288.6m here against the table's $288.5m on the same spread: the
      // print figure was a sum of ROUNDED components, the table's is the true
      // total. Two printings of one number now have one source.
      derive: { table: 'Prizemoney Statistics', row: 'Total ($M)', group: 'total', scale: 1e6 },
      format: 'money-m1',
      source: 'Racing_Prizemoney_Wagering KPIs — prizemoney + bonuses total',
    },

    owners: {
      value: 64706,
      format: 'count',
      source: 'FY25 Owners & Breeders section — people who owned a racehorse',
    },

    racesRun: {
      value: 4333,
      format: 'count',
      source: 'Racing KPIs — races run',
    },

    horseSafetyRecord: {
      value: 0.9995,
      format: 'pct2',
      // Stored as a proportion, not 99.95, so the percentage is derived once.
      source: 'Equine welfare reporting — horse safety record',
    },

    equineWelfareInvestment: {
      value: 5940000,
      format: 'money-m2',
      source: 'Equine welfare programs investment',
    },

    opexReduction: {
      value: 6620000,
      format: 'money-m2',
      source: 'Reduction in gross operational expenditure vs prior year',
    },

    cupWeekViewers: {
      value: 5500000,
      format: 'count-m1',
      // The FY25 artwork had "5.5m" drawn into the TV screen as vector paths.
      // Those four subpaths have been removed (icons/snapshot-viewers-blank.svg)
      // and this value now prints as live text inside the screen, so FY26 needs
      // no redraw. icons/snapshot-viewers.svg keeps the original if ever needed.
      source: '9Network audience data, Melbourne Cup week',
    },
  },
};

// Resolve the stats against the KPI workbook data: anything carrying a
// `derive` descriptor is read from kpi-data.js, everything else passes through.
function lookup(kpi, d) {
  if (!kpi) return null;
  if (d.participation) {
    const row = kpi.participation.rows.find(r => r.label === d.row);
    return row ? row.values[0] : null;
  }
  const table = kpi.tables.find(t => t.title === d.table);
  const row = table && table.rows.find(r => r.label === d.row);
  const pair = row && row.values[d.group];
  return pair ? pair[0] : null;
}

export function resolveSnapshot(kpi) {
  const out = {};
  Object.keys(snapshot.stats).forEach(id => {
    const stat = snapshot.stats[id];
    if (!stat.derive) { out[id] = stat; return; }
    const raw = lookup(kpi, stat.derive);
    out[id] = Object.assign({}, stat, {
      value: (raw === null || raw === undefined) ? null : raw * (stat.derive.scale || 1),
    });
  });
  return out;
}

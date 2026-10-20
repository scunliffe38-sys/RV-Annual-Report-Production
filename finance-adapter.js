/* RV Annual Report — Finance adapter.
 *
 * Turns the output of RVFinanceConverter.parse() (the Finance docx) into the
 * content shapes the Financial Report page already reads, so the layout code
 * is untouched and each year's report builds from the document alone.
 *
 *   RVFinanceAdapter.build(parsed, prev) -> { year, copy, statements, issues }
 *     prev = { copy, statements }  last year's modules; they supply styling
 *     templates (row heights, rules, column widths), never content.
 *
 * Anything it cannot place is returned in `issues` as { level, text }.
 */
(function (root) {
  "use strict";
  var GREY = "#6D6E71", BAND = "#E4ECF5";

  function T(c) { return c == null ? "" : (typeof c === "string" ? c : c.t || ""); }
  function B(c) { return !!(c && typeof c === "object" && c.b); }
  function I(c) { return !!(c && typeof c === "object" && c.it); }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function ws(s) { return s.replace(/\s+/g, " ").trim(); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function curly(s) { return s.replace(/'/g, "\u2019"); }

  /* ------------------------------------------------------- directors -- */
  function readDirectors(blocks, issues) {
    var from = blocks.findIndex(function (b) { return b.k === "sectionHeading" && /current directors/i.test(b.text || ""); });
    var out = [], seen = {}, after = [];
    if (from < 0) { issues.push({ level: "error", text: "No Current Directors heading found." }); return { list: out, ceased: after }; }
    for (var i = from + 1; i < blocks.length && blocks[i].k !== "sectionHeading"; i++) {
      var b = blocks[i];
      if (b.k !== "textbox") { if (out.length) after.push(b); continue; }
      var P = b.paras, lines = P[0].text.split("\n"), appointed = "", rest;
      if (lines.length > 1) { appointed = ws(lines.slice(1).join(" ")); rest = P.slice(1); }
      else if (P[1] && /^Appointed/i.test(P[1].text)) { appointed = ws(P[1].text); rest = P.slice(2); }
      else rest = P.slice(1);
      var m = /^(.+?)\s*(?:\(([^)]+)\))?\s*$/.exec(ws(lines[0]));
      var name = m ? m[1].trim() : ws(lines[0]), role = m && m[2] ? m[2].trim() : "";
      if (/chief executive/i.test(role)) role = "CEO";
      if (seen[name]) continue;
      seen[name] = 1;
      var d = { id: slug(name), name: name, appointed: appointed, paras: joinRuns(rest.map(function (p) { return ws(p.text); }).filter(Boolean)) };
      if (role) d.role = role;
      out.push(d);
    }
    return { list: out, ceased: after };
  }

  /* -------------------------------------------------------- KPI tables -- */
  // Word marks a header row by bold; where it does not, the first row is it.
  function headOf(t) {
    return t.head ? { head: t.head.map(T), rows: t.rows } : { head: (t.rows[0] || []).map(T), rows: t.rows.slice(1) };
  }
  function kpiTable(t, id, first, prevGrid) {
    var src = headOf(t);
    var head = src.head.map(function (h) { return h.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^(\d{4})\s*\$/, "$1\n$").trim(); });
    var n = head.length;
    var grid = n === 4 || n === 3 ? prevGrid : "310.9pt " + r2(170.8 / (n - 1)) + "pt";
    if (n !== 4 && n !== 3) grid = "310.9pt " + Array(n - 1).fill(r2(170.8 / (n - 1)) + "pt").join(" ");
    var pad = n === 3 ? 1 : 0;
    function nums(a) { var o = a.slice(1); for (var k = 0; k < pad; k++) o.unshift(""); return o; }
    var rows = [{ kind: "head", label: head[0], nums: nums(head), gridCols: grid, isHead: true, isRow: false }];
    src.rows.forEach(function (r, i) {
      var cells = r.map(T), last = i === src.rows.length - 1;
      // FY25: every row alternates tint from the first; bold rows in Word
      // (and the closing total) set bold.
      // FY25 also sets the reported, normalised and revised lines bold even
      // where Word does not.
      var bold = B(r[0]) || /^(RVG )?(Reported|Normalised|Revised)\b|^Total$/i.test(cells[0].trim()) || (last && !/Year-on-Year/i.test(cells[0]));
      while (cells.length < head.length) cells.push("");
      rows.push({ kind: bold ? "total" : "plain", label: cells[0], nums: nums(cells), gridCols: grid,
        isHead: false, isRow: true, bold: bold, fw: bold ? "700" : "400", bg: i % 2 === 0 ? BAND : "transparent" });
    });
    return { kind: "table", id: id, gridCols: grid, tableRows: rows, text: "" };
  }

  function attendance(t, prev) {
    var head = t.head || [], G = head.length - 1;
    var colW = r2((481.89 - 151.89) / (2 * G));
    var cols = [151.89].concat(Array(2 * G).fill(colW));
    var grid = cols.map(function (c) { return c + "pt"; }).join(" ");
    // Column labels come from the document's own header rows ("Meetings" over
    // "Held" / "Attended"); values are set as the document has them.
    var r0 = [], r1 = (t.rows[1] || []).map(T).slice(1, 1 + 2 * G);
    (t.rows[0] || []).slice(1).forEach(function (c) { for (var s = 0; s < ((c && c.span) || 1); s++) r0.push(T(c)); });
    var hn = []; for (var g = 0; g < 2 * G; g++) hn.push([r0[g] || "", r1[g] || (g % 2 ? "Attended" : "Held")].filter(Boolean).join("\n"));
    var rows = t.rows.slice(2).map(function (r) {
      var c = r.map(T);
      return [c[0]].concat(c.slice(1, 1 + 2 * G));
    });
    return {
      kind: "attendance",
      groups: [{ label: "", span: 1 }].concat(head.slice(1).map(function (l) { return { label: l, span: 2 }; })),
      head: [T((t.rows[0] || [])[0]) || "Directors"].concat(hn), cols: cols, gridCols: grid,
      groupCols: [151.89].concat(Array(G).fill(r2(2 * colW))).map(function (c) { return c + "pt"; }).join(" "),
      headRow: { label: "Directors", nums: hn, gridCols: grid },
      rows: rows,
      bodyRows: rows.map(function (r, i) { return { label: r[0], nums: r.slice(1), gridCols: grid, band: i % 2 === 0, plain: i % 2 === 1 }; })
    };
  }

  /* -------------------------------------------------------- statements -- */
  var HEAD_FIX = { "ISSUEDCAPITAL": "Issued Capital", "RETAINED EARNINGS": "Retained Earnings", "TOTAL": "Total", "NOTE": "Note" };

  function statement(t, prev, Y, issues, name) {
    var grid = t.rows.map(function (r) { var o = []; r.forEach(function (c) { o.push(c); for (var k = 1; k < (c && c.span || 1); k++) o.push(""); }); return o; });
    var head = (t.head || []).map(T);
    var width = Math.max.apply(null, grid.map(function (r) { return r.length; }).concat(head.length));
    var keep = [];
    for (var j = 0; j < width; j++) {
      var any = !!(head[j] && head[j].trim()) || grid.some(function (r) { return T(r[j]).trim() !== ""; });
      if (any) keep.push(j);
    }
    var ptpl = prev.rows, pHeads = ptpl.filter(function (r) { return r.head1; })[0], pHead2 = ptpl.filter(function (r) { return r.head2; })[0];
    var pBody = ptpl.filter(function (r) { return r.body; });
    if (keep.length !== prev.cols.length) {
      issues.push({ level: "warning", text: name + ": " + keep.length + " columns found, last year had " + prev.cols.length + ". Column widths are shared evenly." });
    }
    var cols = keep.length === prev.cols.length ? prev.cols.slice() : keep.map(function () { return r2(481.89 / keep.length); });
    var gridCols = cols.map(function (c) { return c + "pt"; }).join(" ");
    function cellsOf(r) { return keep.map(function (j) { return r[j]; }); }
    function mk(tpl, texts, bolds) {
      var row = clone(tpl);
      row.gridCols = gridCols;
      row.cells = keep.map(function (_, i) {
        var base = tpl.cells[Math.min(i, tpl.cells.length - 1)];
        return Object.assign({}, base, { t: curly(texts[i] || ""), w: bolds && bolds[i] ? "700" : (base.w === "700" && !bolds ? "700" : "400") });
      });
      return row;
    }
    var rows = [];
    var h1 = mk(pHeads, cellsOf(head.map(function (x) { return HEAD_FIX[x.trim()] || x; })).map(function (x) { return x || ""; }), null);
    h1.cells.forEach(function (c, i) { c.w = "400"; });
    rows.push(h1);

    var body = grid.slice(), i0 = 0;
    while (i0 < body.length && body[i0].every(function (c) { return T(c).trim() === ""; })) i0++;
    var head2Done = false;
    if (i0 < body.length && body[i0].some(function (c) { return /^note$/i.test(T(c).trim()); })) {
      var tx = cellsOf(body[i0]).map(function (c) { var s = T(c).trim(); return HEAD_FIX[s.toUpperCase()] || s; });
      var h2 = mk(pHead2, tx, null); h2.cells.forEach(function (c) { c.w = "400"; });
      rows.push(h2); head2Done = true; i0++;
    }
    if (!head2Done) rows.push(clone(pHead2));
    body = body.slice(i0);

    var hs = pBody.filter(function (r) { return r.cells[0].w !== "700"; }).map(function (r) { return r.h; });
    var cnt = {}; hs.forEach(function (h) { cnt[h] = (cnt[h] || 0) + 1; });
    var baseH = +Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || 19.84;
    var usesBand = ptpl.some(function (r) { return r.band; });
    var tpl = pBody.filter(function (r) { return !r.band; })[0] || pBody[0];
    var blankH = (ptpl.filter(function (r) { return r.body && r.cells.every(function (c) { return !c.t; }); })[0] || {}).h || 9;
    var parity = 0;
    body.forEach(function (r, bi) {
      var cs = cellsOf(r), tx = cs.map(T), bd = cs.map(B), itl = cs.map(I);
      var label = tx[0].trim(), vals = tx.slice(1).filter(function (x, k) { return k > 0 && x.trim() !== ""; });
      var blank = tx.every(function (x) { return x.trim() === ""; });
      var isHeading = !!label && bd[0] && vals.length === 0 && !tx.slice(1).some(function (x) { return x.trim(); });
      var isTotal = (!!label && bd[0] && vals.length > 0) || (!label && vals.length > 0);
      var row = mk(tpl, tx, null);
      row.cells.forEach(function (c, i) { c.w = (i === 0 ? bd[0] : (i > 1 && (bd[i] || isTotal && !label))) ? "700" : "400"; c.i = !!(i === 0 ? itl[0] : itl[0] && itl[i]); });
      row.lineAbove = isTotal && !/^Balance at 1 /i.test(label);
      row.lineBelow = bi === body.length - 1 && isTotal;
      row.h = blank ? blankH : isHeading ? r2(baseH * 1.18) : label.length > 62 ? r2(baseH * 1.4) : baseH;
      if (isHeading || blank) parity = 0;
      var band = usesBand && !isHeading && !blank && parity % 2 === 0;
      if (usesBand && !isHeading && !blank) parity++;
      row.band = band; row.bg = band ? BAND : "transparent";
      rows.push(row);
    });
    return { heading: prev.heading, dateline: prev.dateline.replace(/20\d\d/, String(Y)), cols: cols, gridCols: gridCols, rows: rows };
  }

  /* ------------------------------------------------------------- notes -- */
  var NUM = /^[\(\-\u2013]?[\d,.]+\)?%?$|^[-\u2013]$/;
  function noteTable(t, titleRowDropped) {
    var rows = (!titleRowDropped && t.headCells ? [t.headCells] : []).concat(t.rows);
    var rh = (!titleRowDropped && t.headCells ? [t.rowH[0] || 0] : []).concat(titleRowDropped ? t.rowH : t.rowH);
    var src = t.headCells && titleRowDropped ? t.rowH : t.rowH;
    var cols = (t.cols && t.cols.length ? t.cols.slice() : null);
    var n = Math.max.apply(null, rows.map(function (r) { return r.reduce(function (a, c) { return a + (c && c.span || 1); }, 0); }));
    if (!cols || cols.length !== n) cols = Array(n).fill(481.89 / n);
    var sum = cols.reduce(function (a, c) { return a + c; }, 0);
    if (sum > 481.89) cols = cols.map(function (c) { return r2(c * 481.89 / sum); });
    var out = rows.map(function (r, ri) {
      var texts = r.map(T);
      var hdr1 = ri < 3 && texts.some(function (x) { return /\b30\s+JUNE\b|\bJUNE\s+20\d\d\b/i.test(x); });
      var hdr2 = !hdr1 && ri < 3 && texts.some(function (x) { return /^\$.?000$/.test(x.trim()); }) && !texts.some(function (x) { return NUM.test(x.trim()) && /\d{3}/.test(x); });
      var used = 0, cells = r.map(function (c, ci) {
        var o = typeof c === "string" ? { t: c } : c, span = o.span || 1;
        used += span;
        var st;
        if (hdr1) return { t: o.t, s: "Table:Table Header", f: null, bg: "#005FA1", tw: 0, bw: 0, n: span };
        if (hdr2) return { t: o.t, s: "Table:Table Header 2", f: null, bg: "#99BFD9", tw: 0, bw: 0, n: span };
        if (o.sh && /^#(00[0-9A-F]{4}|[0-4][0-9A-F]{5})$/.test(o.sh) && o.sh !== "#99BFD9") st = "Table:Table Header";
        else if (o.sh && o.sh !== "#FFFFFF" && ri < 3 && /^#[89A-F]/.test(o.sh) && /\$|NOTE|JUNE/i.test(o.t)) st = "Table:Table Header 2";
        else if (o.b) st = ci > 0 && (o.al === "r" || NUM.test(o.t)) ? "Table:Table Body Bold" : "Table:Table Body Bold";
        else if (o.al === "r" || NUM.test(o.t.trim())) st = "Table:Table Body Digits";
        else st = "Table:Table Body";
        // Italic and bold as Word sets them (FY25 sets the group heads bold italic).
        var f = o.it ? (o.b ? "Bold Italic" : "Book Italic") : null;
        return { t: o.t, s: st, f: f, bg: o.sh && /^#[D-F][0-9A-F]{5}$/.test(o.sh) ? o.sh : null, tw: o.bt ? 0.5 : 0, bw: o.bb ? 0.5 : 0, n: span };
      });
      while (used < cols.length) { cells.push({ t: "", s: "Table:Table Body", f: null, bg: null, tw: 0, bw: 0, n: 1 }); used++; }
      return { h: 0, min: rh[ri] || 0, c: cells };
    });
    return fy25Table({ k: "t", cols: cols, rows: out, auto: true });
  }

  // Word lays the notes tables out on its own grid: a narrow column for the
  // note marker ("2.", "(d)"), a label column, and empty spacer columns between
  // the figures. FY25 sets the same tables as one label column and the figure
  // columns, the marker run into the label, the note title as a subhead, and
  // tighter rows. Text and figures are not changed.
  var MARK = /^(\(?[a-z]{1,4}\)|\d{1,2}\.?|\([ivx]+\))$/i;
  function fy25Table(tb) {
    var n = tb.cols.length;
    var grid = tb.rows.map(function (r) {
      var slots = [];
      r.c.forEach(function (c) { for (var s = 0; s < (c.n || 1); s++) slots.push(c); });
      return slots;
    });
    // A column is kept only where some cell with text starts in it. A merged
    // cell keeps its first column, so a label or figure merged across Word's
    // spacer columns collapses onto one column, as FY25 sets them.
    var drop = tb.cols.map(function (_, j) {
      return grid.every(function (sl) { var c = sl[j]; if (!c) return true; if (j > 0 && sl[j - 1] === c) return true; return !String(c.t || "").trim(); });
    });
    // Marker column: column 0 holds nothing but markers, column 1 the labels.
    // A column of merged names with no marker anywhere in it
    // ("VicRacing Pty Ltd" across Word's narrow first column) is the label
    // column, not a marker column.
    var col0 = grid.map(function (sl) { return sl[0]; }).filter(Boolean);
    var hasMark = col0.some(function (c) { return (c.n || 1) === 1 && MARK.test(String(c.t || "").trim()); });
    var mergedNames = col0.some(function (c) { var tt = String(c.t || "").trim(); return (c.n || 1) > 1 && /[a-z]{3}/i.test(tt) && !/^\d{1,2}\.\s/.test(tt) && !/^Table:Table Header/.test(c.s || "") && tt.length <= 60 && !/[:.]$/.test(tt); });
    var markerCol = n > 2 && !drop[0] && (hasMark || !mergedNames) && grid.every(function (sl) { var c = sl[0]; return !c || (c.n || 1) > 1 || !String(c.t || "").trim() || MARK.test(String(c.t).trim()); });
    if (markerCol) drop[0] = true;
    var keep = []; for (var j = 0; j < n; j++) if (!drop[j]) keep.push(j);
    if (keep.length < 2) return tb;
    var rows = tb.rows.map(function (r, ri) {
      var sl = grid[ri], cells = [], seen = [];
      keep.forEach(function (j) {
        var c = sl[j];
        if (!c) return;
        var k = seen.indexOf(c);
        if (k > -1) { cells[k].n += 1; return; }
        seen.push(c); cells.push(Object.assign({}, c, { n: 1 }));
      });
      var mk = markerCol && sl[0] && (sl[0].n || 1) === 1 ? String(sl[0].t || "").trim() : "";
      if (mk && cells[0]) cells[0] = Object.assign({}, cells[0], { t: mk + " " + String(cells[0].t || "").trim(), s: sl[0].s === "Table:Table Body Bold" ? "Table:Table Body Bold" : cells[0].s });
      var head = cells.some(function (c) { return /^Table:Table Header/.test(c.s); });
      var title = !head && cells[0] && /^\d{1,2}\.\s/.test(cells[0].t || "") && cells.slice(1).every(function (c) { return !String(c.t || "").trim(); });
      if (title) cells = cells.map(function (c) { return Object.assign({}, c, { s: "A4 V:Subhead Large", tw: 0, bw: 0 }); });
      var min = head ? (cells[0].s === "Table:Table Header 2" ? 14.504 : 17.008) : title ? 21.738 : 15.704;
      return { h: 0, min: min, c: cells };
    });
    var vals = keep.length - 1, W = 481.89, cols;
    var labelled = rows.some(function (r) { var c = r.c[0]; return c && !/^Table:Table Header/.test(c.s) && /[A-Za-z]{3}/.test(c.t || "") && (c.n || 1) === 1 && r.c.slice(1).some(function (x) { return /\d/.test(x.t || ""); }); });
    if (labelled && vals <= 3) cols = [r2(W - vals * 76.535)].concat(Array(vals).fill(76.535));
    else if (labelled) {
      // FY25 wide tables (PP&E, intangibles): 181.4pt label column, figures
      // share the rest in Word's proportions.
      var fs = keep.slice(1).map(function (j) { return tb.cols[j]; }), ft = fs.reduce(function (a, c) { return a + c; }, 0);
      cols = [181.417].concat(fs.map(function (c) { return r2(c * (W - 181.417) / ft); }));
    } else {
      var src = keep.map(function (j) { return tb.cols[j]; }), tot = src.reduce(function (a, c) { return a + c; }, 0);
      cols = src.map(function (c) { return r2(c * W / tot); });
    }
    // FY25 column widths for the equity-accounted investments table.
    if (keep.length === 7 && rows[0] && /^name of entity$/i.test(String((rows[0].c[0] || {}).t || "").trim())) cols = [121, 98.5, 72, 46.5, 46.5, 48.7, 48.69];
    // An empty closing row in Word (often carrying a stray rule) is not printed.
    while (rows.length > 1 && rows[rows.length - 1].c.every(function (c) { return !String((c && c.t) || "").trim(); }) && !rows[rows.length - 1].c.some(function (c) { return c && /^Table:Table Header/.test(c.s); })) rows.pop();
    return { k: "t", cols: cols, rows: promoteHeads(rows), auto: true };
  }
  // A bio paragraph ending in ; or : (or with no closing stop) runs on into
  // the next, as in FY25 (e.g. "...subsidiaries; Racing.com Media...").
  function joinRuns(paras) {
    var out = [];
    paras.forEach(function (p) {
      var prev = out[out.length - 1];
      if (prev !== undefined && !/[.!?)\u201D"]$/.test(prev)) out[out.length - 1] = prev + " " + p;
      else out.push(p);
    });
    return out;
  }
  // Column labels Word sets as plain bold text above the $'000 row are the
  // table's blue header bar in FY25.
  function promoteHeads(rows) {
    var hi = rows.findIndex(function (r) { return r.c.some(function (c) { return c && /^Table:Table Header/.test(c.s); }); });
    if (hi < 1) return rows;
    var pre = rows.slice(0, hi);
    var ok = pre.every(function (r) { var tx = r.c.map(function (c) { return String((c && c.t) || ""); }).join(" "); return tx.trim() && !/\d/.test(tx.replace(/\b(19|20)\d{2}\b/g, "")); });
    if (!ok) return rows;
    // Heads over text columns (entity, activity, date) range left, as in FY25.
    var body = rows.slice(hi + 1);
    var textCol = function (k) { for (var q = 0; q < body.length; q++) { var c = body[q].c[k], tt = String((c && c.t) || "").trim(); if (tt) return !NUM.test(tt); } return false; };
    pre.forEach(function (r) {
      r.min = Math.max(r.min || 0, 17.008);
      var col = 0;
      r.c = r.c.map(function (c) {
        if (!c) return c;
        var o = Object.assign({}, c, { s: "Table:Table Header", bg: "#005FA1", tc: null });
        if ((c.n || 1) === 1 && textCol(col)) o.al = "left";
        col += c.n || 1;
        return o;
      });
    });
    return rows;
  }
  function buildNotes(parsed, issues) {
    var blocks = parsed.blocks, tables = parsed.tables, out = [], start = blocks.findIndex(function (b) { return b.k === "noteTitle"; });
    if (start < 0) { issues.push({ level: "error", text: "No notes found in the document." }); return []; }
    var last = 0, titles = {}, indent = false, pointBody = false;
    function heading(s) { return s.length < 90 && !/[.;:,]$/.test(s) && /^[A-Z0-9]/.test(s); }
    for (var i = start; i < blocks.length; i++) {
      var b = blocks[i], text = b.text ? b.text.replace(/\t+/g, " ").replace(/ +/g, " ").trim() : "";
      if (b.k === "noteTitle") {
        last = b.number ? +b.number : last + 1;
        titles[b.slug] = 1;
        out.push({ k: "p", s: "A4 V:Subhead Large", t: last + ". " + b.text });
        indent = false;
      } else if (b.k === "table") {
        var t = tables[b.key], hc = t.headCells, drop = false;
        if (hc && t.note) {
          var first = hc.map(T).filter(function (x) { return x.trim() && !/^\d{1,2}\.?$/.test(x.trim()); })[0] || "";
          drop = first.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().indexOf(t.note.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 12)) === 0;
        }
        if (/^front-/.test(b.key)) continue;
        out.push(noteTable(t, drop));
      } else if (b.k === "subhead") { indent = false; out.push({ k: "p", s: "H3 Sub Heading LC Financials", t: text }); }
      else if (b.k === "bullet" && b.marker) {
        // A numbered paragraph that reads as a title, e.g. "(i) Establishment
        // of Operations", is an italic sub-heading with the copy under it
        // indented, as FY25 sets it; otherwise it is a numbered point.
        // Straight after a table it is a footnote however it reads (FY25 note 10).
        var pv0 = out[out.length - 1];
        if (heading(text) && !(pv0 && (pv0.k === "t" || pv0.s === "Footnotes") && /^\(?[ivx]+\)$/i.test(b.marker || ""))) { out.push({ k: "p", s: "H4 Sub Heading Italic", t: text, mk: b.marker }); indent = true; }
        else {
          // Numbered notes straight after a table are its footnotes (FY25
          // sets them in the 6.5pt Footnotes style).
          var pv = out[out.length - 1], foot = pv && (pv.k === "t" || pv.s === "Footnotes");
          // Points under a bullet ("In making grants ... to:" then (i), (ii)) sit
          // one step in, marker under the bullet text (FY25).
          var sub = !foot && pv && (pv.s === "B7 Bullet double Indent" || pv.s === "B5 Sub Point");
          // Inside a lettered policy, (i), (ii) points sit in from the copy (FY25 GST).
          out.push({ k: "p", s: foot ? "Footnotes" : sub ? "B5 Sub Point" : indent ? "B5 Sub Point Indent" : "B5 Bullet Body Indent Alpha", t: text, mk: b.marker });
        }
      }
      else if (b.k === "bullet") {
        // Inside a lettered policy, a bullet that is a title ("Impairment of
        // Indefinite Life Intangible Assets") heads the paragraph after it:
        // FY25 sets the title in Medium and the copy under it at the bullet
        // text indent.
        var nb = blocks[i + 1];
        if (indent && heading(text) && !/\d/.test(text) && nb && nb.k === "body" && !nb.bold && !nb.italic) { out.push({ k: "p", s: "B7 Bullet Medium", t: text }); pointBody = true; }
        else out.push({ k: "p", s: "B7 Bullet double Indent", t: text });
      }
      else if (b.k === "body") {
        var mm = /^\(([a-z]{1,4})\)\s+(.+)$/.exec(text);
        if (b.bold && text.length < 90) { indent = false; out.push({ k: "p", s: "H3 Sub Heading LC Financials", t: text }); }
        // A bold sentence ("All other material accounting policies ...") is
        // body copy set bold, flush left (FY25).
        else if (b.bold) { indent = false; out.push({ k: "p", s: "A4 V:Body", t: text, b: 1 }); }
        else if (b.italic && text.length < 100 && !/[.:]$/.test(text)) {
          if (mm) { out.push({ k: "p", s: "H4 Sub Heading Italic", t: mm[2], mk: "(" + mm[1] + ")" }); indent = true; }
          // An italic heading inside a lettered policy is FY25's grey italic
          // underlined sub-heading, at the policy's indent.
          else if (indent) out.push({ k: "p", s: "H5 Sub heading Gray Underline Italics", t: text });
          else { indent = false; out.push({ k: "p", s: "H4 Sub Heading Italic", t: text }); }
        }
        else if (pointBody) { pointBody = false; out.push({ k: "p", s: "B9 Bullet Body", t: text.replace(/\s*\n\s*/g, " ") }); }
        else {
          // Word line breaks: a single break starts a new line with no space
          // after the one before (an address); a blank line is a new paragraph.
          var base = indent ? "B2 Body Indent" : "A4 V:Body", parts = text.split("\n");
          for (var q = 0; q < parts.length; q++) {
            var line = parts[q].replace(/ +/g, " ").trim();
            if (!line) continue;
            var more = q < parts.length - 1 && parts[q + 1].trim();
            out.push({ k: "p", s: more ? base + " Tight" : base, t: line });
          }
        }
      }
    }
    // A paragraph with no words or figures (a stray "." Word leaves under a
    // table) is not copy.
    out = out.filter(function (x) { return x.k !== "p" || /[A-Za-z0-9]/.test(String(x.t || "")); });
    return pageHeads(dedupeTitles(bandHeads(fy25Subheads(out))));
  }
  var HEADS = { "Table:Table Header": 1, "Table:Table Header 2": 1 };
  function headCount(t) { var n = 0; while (n < t.rows.length && t.rows[n].c.some(function (c) { return c && HEADS[c.s]; })) n++; return n; }
  // FY25 opens every figures note under the date and $'000 bars. Where Word
  // gives a note's table none (14 Retained Earnings, 16 Key Management
  // Personnel), it takes the bars of the nearest three-column note table. A
  // units row Word sets in the body ("$  $" under 17's dates) is the light bar.
  function bandHeads(out) {
    var three = function (b) { return b && b.k === "t" && b.auto && b.cols.length === 3; };
    var bars = function (b) { var n = headCount(b); return n >= 2 && b.rows[n - 1].c.some(function (c) { return c && c.s === "Table:Table Header 2"; }) ? b.rows.slice(0, n) : null; };
    var clone = function (rows) { return rows.map(function (r) { return { h: r.h, min: r.min, c: r.c.map(function (c) { return Object.assign({}, c); }) }; }); };
    out.forEach(function (t, i) {
      if (!three(t)) return;
      var nh = headCount(t);
      if (nh === 1) {
        var ui = t.rows.findIndex(function (r, k) { return k >= nh && r.c.length === 3 && !String(r.c[0].t || "").trim() && r.c.slice(1).every(function (c) { return /^\$(\s?[\u2019']000)?$/.test(String(c.t || "").trim()); }); });
        if (ui > 0 && t.rows.slice(nh, ui).every(function (r) { return r.c.every(function (c) { return c && c.s === "A4 V:Subhead Large"; }); })) {
          var u = t.rows.splice(ui, 1)[0];
          u.min = 14.504; u.c = u.c.map(function (c) { return Object.assign({}, c, { s: "Table:Table Header 2", bg: "#99BFD9", tc: null, f: null }); });
          t.rows.splice(nh, 0, u);
        }
        return;
      }
      if (nh) return;
      var h = out[i - 1];
      if (!h || h.k !== "p" || h.s !== "A4 V:Subhead Large" || !/^\d{1,2}\.\s/.test(h.t || "")) return;
      if (!t.rows.some(function (r) { return r.c.slice(1).some(function (c) { return /\d/.test(String((c && c.t) || "")); }); })) return;
      var src = null;
      for (var d = 1; !src && d < out.length; d++) { src = (three(out[i + d]) && bars(out[i + d])) || (three(out[i - d]) && bars(out[i - d])) || null; }
      if (src) t.rows = clone(src).concat(t.rows);
    });
    return out;
  }
  // FY25 sets a grey italic sub-heading as the bold run-in head when the
  // policy it sits in also has one ("Classification and measurement of
  // financial assets" beside "Impairment of financial assets").
  function fy25Subheads(out) {
    var H4 = "H4 Sub Heading Italic", H5 = "H5 Sub heading Gray Underline Italics", H3 = "H3 Sub Heading LC Financials";
    var end = function (b) { return b.k === "p" && (b.s === H4 || b.s === "A4 V:Subhead Large"); };
    for (var i = 0; i < out.length; i++) {
      if (!(out[i].k === "p" && out[i].s === H4)) continue;
      var j = i + 1; while (j < out.length && !end(out[j])) j++;
      var sec = out.slice(i + 1, j);
      if (sec.some(function (b) { return b.s === H3; })) sec.forEach(function (b) { if (b.s === H5) b.s = H3; });
    }
    return out;
  }
  // A "For the year ended" line inside the notes is the dateline of a shape on
  // the next page, not copy. Before the entity table it marks the
  // Consolidated Entity Disclosure Statement, which FY25 starts on its own
  // page under its own display heading; elsewhere it is dropped.

  // FY25 sets the entity table in 8pt under a four-line blue header bar and a
  // light date bar, columns as published.
  function cedsTable(t) {
    var txt = function (r) { return r.c.map(function (c) { return String((c && c.t) || "").trim(); }); };
    t.rows = t.rows.filter(function (r) { return txt(r).some(Boolean); });
    var hi = t.rows.findIndex(function (r) { return txt(r)[0] === "Entity Name"; });
    t.rows.forEach(function (r, ri) {
      var dates = ri === hi + 1 && txt(r).some(function (s) { return /\d{4}$/.test(s); });
      // FY25 centres every column but the entity name, heads and values.
      var ci = 0;
      r.c = r.c.map(function (c) {
        if (!c) return c;
        var at = ci; ci += c.n || 1;
        c = Object.assign({}, c, { al: at > 0 ? "center" : "left" });
        if (ri === hi) return Object.assign({}, c, { s: "Table:Table Header", bg: "#005FA1", sz: 8.5 });
        if (dates) return Object.assign({}, c, { s: "Table:Table Header 2", bg: "#99BFD9", sz: 8.5, t: String(c.t || "").toUpperCase() });
        return ri > hi ? Object.assign({}, c, { sz: 8 }) : c;
      });
      if (ri === hi) r.min = 50;
      else if (dates) r.min = 17.5;
      else r.min = 16;
    });
    if (t.cols.length === 6) t.cols = [118.11, 78, 70.2, 72, 77.1, 66.48];
    return t;
  }
  function pageHeads(out) {
    var DL = /^(f ?o ?r ?t ?h ?e ?y ?e ?a ?r ?e ?n ?d ?e ?d\b|for the year ended\b)/i;
    for (var i = out.length - 1; i >= 0; i--) {
      var b = out[i];
      if (b.k !== "p" || !DL.test(String(b.t || "").trim()) || String(b.t).length > 60) continue;
      var nx = out[i + 1], ceds = nx && nx.k === "t" && JSON.stringify(nx.rows.slice(0, 4)).indexOf("Entity Name") > -1;
      if (ceds) { out.splice(i, 1, { k: "pagehead", t: "Consolidated Entity Disclosure Statement" }); cedsTable(nx); }
      else out.splice(i, 1);
    }
    return out;
  }

  // A note heading straight before a table goes inside the table, under its
  // header bars, as FY25 sets it ("7. Right of Use Assets" once, not twice).
  // A title the table already repeats - in a row or as a header cell - is
  // dropped in favour of the heading's wording.
  function dedupeTitles(out) {
    var key = function (s) { return String(s || "").toLowerCase().replace(/^\s*\d{1,2}\.\s*/, "").replace(/[^a-z0-9]+/g, ""); };
    var HEAD = { "Table:Table Header": 1, "Table:Table Header 2": 1 };
    for (var i = out.length - 1; i > 0; i--) {
      var t = out[i], h = out[i - 1];
      if (t.k !== "t" || !t.auto || h.k !== "p" || h.s !== "A4 V:Subhead Large" || !/^\d{1,2}\.\s/.test(h.t || "")) continue;
      var rows = t.rows || [], nh = 0;
      while (nh < rows.length && rows[nh].c.some(function (c) { return c && HEAD[c.s]; })) nh++;
      if (!nh) continue;
      // Column heads that label the first column too ("Name of Entity") sit
      // under the title, as FY25 sets note 8.
      if (String((rows[0].c[0] && rows[0].c[0].t) || "").trim()) continue;
      var k = key(h.t);
      rows.slice(0, nh).forEach(function (r) { r.c.forEach(function (c, ci) { if (c && key(c.t) === k) r.c[ci] = Object.assign({}, c, { t: "" }); }); });
      var ti = rows.findIndex(function (r) { return r.c.length && r.c.every(function (c) { return c && c.s === "A4 V:Subhead Large"; }) && key(r.c[0].t) === k; });
      if (ti > -1) rows.splice(ti, 1);
      var n = rows[0].c.reduce(function (a, c) { return a + ((c && c.n) || 1); }, 0), cells = [];
      for (var j = 0; j < n; j++) cells.push({ t: j ? "" : h.t, s: "A4 V:Subhead Large", f: null, bg: null, tw: 0, bw: 0, n: 1 });
      rows.splice(nh, 0, { h: 0, min: 21.738, c: cells });
      out.splice(i - 1, 1);
    }
    return out;
  }


  /* ------------------------------------------------------------- build -- */
  function build(parsed, prev) {
    var issues = [], blocks = parsed.blocks, tables = parsed.tables;
    var pc = prev.copy, ps = prev.statements;
    var ym = /financial year ended\s+\d+\s+June\s+(\d{4})/i.exec((blocks[0] && blocks[0].text) || "");
    var Y = ym ? +ym[1] : null;
    if (!Y) { Y = (+/\d{4}/.exec(ps.surplus.dateline)[0]) + 1; issues.push({ level: "warning", text: "Could not read the financial year from the first paragraph, assuming " + Y + "." }); }

    var dirs = readDirectors(blocks, issues);
    var copy = { year: Y, intro: [], directors: dirs.list, narrative: [], diagram: pc.diagram, signatories: [], declaration: {}, kpmg: pc.kpmg };
    var hasPic = blocks.some(function (b) { return b.k === "picture"; });
    if (hasPic) copy.diagram = null;
    else if (pc.diagram) issues.push({ level: "warning", text: "No diagram picture found in the document, so last year\u2019s expenditure diagram would print. Check before use." });

    var iHead = blocks.findIndex(function (b) { return b.k === "sectionHeading" && /current directors/i.test(b.text || ""); });
    copy.intro = blocks.slice(0, iHead).filter(function (b) { return b.k === "body"; }).map(function (b) { return ws(b.text); });

    var iStart = blocks.findIndex(function (b, i) { return i > iHead && b.k !== "textbox" && b.k !== "sectionHeading"; });
    var iEnd = blocks.findIndex(function (b) { return b.k === "body" && /^On behalf of the directors/i.test(b.text || ""); });
    var kpiFirst = true, kpiN = 0, kpiGrid = (pc.narrative.filter(function (b) { return b.kind === "table"; })[0] || {}).gridCols || "310.9pt 55.3pt 60.2pt 55.3pt";
    var nar = [];
    for (var i = iStart; i <= iEnd && i >= 0; i++) {
      var b = blocks[i], text = b.text ? b.text.replace(/\t+/g, " ").replace(/[ ]+/g, " ").trim() : "";
      if (b.k === "textbox") continue;
      if (b.k === "picture") { nar.push({ kind: "diagram", rid: b.rid, w: b.w, h: b.h }); continue; }
      if (b.k === "sectionHeading") nar.push({ kind: "subhead", text: text });
      else if (b.k === "subhead") nar.push({ kind: "minihead", text: text });
      else if (b.k === "bullet") nar.push({ kind: "bullet", text: text, tick: !!b.tick, level: b.level || 0, marker: b.marker || "" });
      else if (b.k === "table") {
        var t = tables[b.key];
        if (/^Directors/i.test((t.rows[0] && T(t.rows[0][0])) || "") && (t.head || []).length > 2 && (t.rows[1] && /held/i.test(T(t.rows[1][1])))) nar.push(attendance(t, pc));
        else if (/\$\s*million|Reporting|Gross/i.test(headOf(t).head.join(" "))) { kpiN++; nar.push(kpiTable(t, "t" + kpiN, kpiFirst, kpiGrid)); kpiFirst = false; }
        else if (/^[A-Z ]+[A-Z][a-z]/.test(T(t.rows[0] && t.rows[0][0]) || "")) continue;
        else issues.push({ level: "warning", text: "Table " + b.key + " in the Directors\u2019 Report was not recognised and is left out." });
      }
      else if (b.k === "body") {
        var prevB = nar[nar.length - 1];
        if ((prevB && prevB.kind === "subhead" && /^OFFICERS/i.test(prevB.text)) || /\t/.test(b.text)) {
          // Name, tab, role: the name sets bold, as in the published report.
          var parts = b.text.split(/\t+/), nm = parts.length > 1 ? ws(parts[0]) : "";
          nar.push({ kind: "officer", text: text, name: nm, rest: nm ? ws(parts.slice(1).join(" ")) : text });
        }
        else if (b.bold && text.length < 80) nar.push({ kind: "minihead", text: text });
        else if (b.italic && /^(\d+|\*)\s/.test(text)) nar.push({ kind: "note", text: text });
        else nar.push({ kind: "body", text: text });
      }
    }
    // Directors who ceased sit before OFFICERS in the document; they print on
    // the directors' spread, under the last card.
    var firstHead = nar.findIndex(function (x) { return x.kind === "subhead"; });
    copy.ceased = firstHead > 0 ? nar.slice(0, firstHead) : [];
    copy.narrative = firstHead > 0 ? nar.slice(firstHead) : nar;

    var sg = blocks.filter(function (b) { return b.k === "table"; }).map(function (b) { return tables[b.key]; })
      .filter(function (t) { return t.rows.length === 1 && /Melbourne|, \d{4}/.test(t.rows[0].map(T).join(" ")); })[0];
    if (sg) copy.signatories = sg.rows[0].map(T).filter(Boolean).map(function (s) {
      var m = /^([A-Z\u2019'\-. ]+?)(?=[A-Z][a-z])(.+?)([A-Z][a-z]+), (\d{1,2} \w+ \d{4})$/.exec(s.replace(/\s+/g, " ").trim());
      return m ? { name: m[1].trim(), title: m[2].trim(), place: m[3], date: m[4] } : { name: s, title: "", place: "", date: "" };
    });
    else issues.push({ level: "error", text: "Signature block (names, place, date) not found." });

    var dl = blocks.findIndex(function (b) { return b.k === "body" && /^In the opinion of the directors/i.test(b.text || ""); });
    var items = [], n1 = 0, n2 = 0, lvl2 = false, close = "";
    for (var k = dl + 1; k < blocks.length && blocks[k].k === "bullet"; k++) {
      var tx2 = ws(blocks[k].text), pv = items.length ? items[items.length - 1].text : "";
      if (items.length && /:$/.test(pv) && !lvl2) { lvl2 = true; n2 = 0; }
      else if (lvl2 && (blocks[k].level === 0 || !blocks[k].level) && n2 >= 2 && !/:$/.test(pv) && false) lvl2 = false;
      var it;
      if (lvl2 && n2 < 2) { n2++; it = { marker: "(" + ["i", "ii", "iii", "iv"][n2 - 1] + ")", lvl2: true, text: tx2 }; }
      else { lvl2 = false; n1++; it = { marker: "(" + String.fromCharCode(96 + n1) + ")", lvl1: true, text: tx2 }; }
      items.push(it);
    }
    var cl = blocks[k]; close = cl && cl.k === "body" ? ws(cl.text) : "";
    copy.declaration = { heading: pc.declaration.heading, lead: dl >= 0 ? ws(blocks[dl].text) : "", items: items, close: close };
    if (dl < 0) issues.push({ level: "error", text: "Directors\u2019 Declaration not found." });

    var fronts = Object.keys(tables).filter(function (k2) { return /^front-/.test(k2); }).sort();
    var st = {};
    if (fronts.length >= 4) {
      var last4 = fronts.slice(-4);
      ["surplus", "position", "cashflows", "equity"].forEach(function (name, ix) {
        st[name] = statement(tables[last4[ix]], ps[name], Y, issues, name);
        // Footnotes set under a statement in Word ("(i) Funds transferred to or
        // from managed investments...") travel with it (Test 13).
        var at = blocks.findIndex(function (b) { return b.k === "table" && b.key === last4[ix]; }), fn = [];
        for (var q = at + 1; at >= 0 && q < blocks.length && fn.length < 6; q++) {
          var fb = blocks[q];
          if (fb.k === "table" || fb.k === "noteTitle" || fb.k === "sectionHeading" || fb.k === "picture" || fb.k === "textbox") break;
          var ft = fb.text ? ws(fb.text) : "";
          if (!ft) continue;
          if (fb.k !== "bullet" && fb.k !== "body") break;
          if (/^notes to the financial statements/i.test(ft) || ft.length > 400) break;
          fn.push({ mk: fb.k === "bullet" ? "(" + ["i", "ii", "iii", "iv", "v", "vi"][fn.length] + ")" : "", t: ft });
        }
        if (fn.length) st[name].footnotes = fn;
      });
    } else issues.push({ level: "error", text: "Fewer than four financial statements found." });

    var notes = { flow: true, year: Y, stories: { flow: buildNotes(parsed, issues) } };
    return { year: Y, copy: copy, statements: st, notes: notes, issues: issues };
  }

  root.RVFinanceAdapter = { build: build };
})(window);

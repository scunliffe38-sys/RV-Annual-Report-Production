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
      var d = { id: slug(name), name: name, appointed: appointed, paras: rest.map(function (p) { return ws(p.text); }).filter(Boolean) };
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
      var cs = cellsOf(r), tx = cs.map(T), bd = cs.map(B);
      var label = tx[0].trim(), vals = tx.slice(1).filter(function (x, k) { return k > 0 && x.trim() !== ""; });
      var blank = tx.every(function (x) { return x.trim() === ""; });
      var isHeading = !!label && bd[0] && vals.length === 0 && !tx.slice(1).some(function (x) { return x.trim(); });
      var isTotal = (!!label && bd[0] && vals.length > 0) || (!label && vals.length > 0);
      var row = mk(tpl, tx, null);
      row.cells.forEach(function (c, i) { c.w = (i === 0 ? bd[0] : (i > 1 && (bd[i] || isTotal && !label))) ? "700" : "400"; });
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
        return { t: o.t, s: st, f: null, bg: o.sh && /^#[D-F][0-9A-F]{5}$/.test(o.sh) ? o.sh : null, tw: o.bt ? 0.5 : 0, bw: o.bb ? 0.5 : 0, n: span };
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
    var empty = tb.cols.map(function (_, j) {
      return grid.every(function (sl) { var c = sl[j]; return !c || (c.n || 1) > 1 || !String(c.t || "").trim(); });
    });
    // Only drop a column no cell actually owns alone.
    var drop = empty.map(function (e, j) { return e && grid.some(function (sl) { return sl[j] && (sl[j].n || 1) === 1; }); });
    // Marker column: column 0 holds nothing but markers, column 1 the labels.
    var markerCol = n > 2 && !drop[0] && grid.every(function (sl) { var c = sl[0]; return !c || (c.n || 1) > 1 || !String(c.t || "").trim() || MARK.test(String(c.t).trim()); });
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
    else {
      var src = keep.map(function (j) { return tb.cols[j]; }), tot = src.reduce(function (a, c) { return a + c; }, 0);
      cols = src.map(function (c) { return r2(c * W / tot); });
    }
    return { k: "t", cols: cols, rows: rows, auto: true };
  }
  function buildNotes(parsed, issues) {
    var blocks = parsed.blocks, tables = parsed.tables, out = [], start = blocks.findIndex(function (b) { return b.k === "noteTitle"; });
    if (start < 0) { issues.push({ level: "error", text: "No notes found in the document." }); return []; }
    var last = 0, titles = {}, indent = false;
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
        if (heading(text)) { out.push({ k: "p", s: "H4 Sub Heading Italic", t: text, mk: b.marker }); indent = true; }
        else {
          // Numbered notes straight after a table are its footnotes (FY25
          // sets them in the 6.5pt Footnotes style).
          var pv = out[out.length - 1], foot = pv && (pv.k === "t" || pv.s === "Footnotes");
          out.push({ k: "p", s: foot ? "Footnotes" : "B5 Bullet Body Indent Alpha", t: text, mk: b.marker });
        }
      }
      else if (b.k === "bullet") out.push({ k: "p", s: "B7 Bullet double Indent", t: text });
      else if (b.k === "body") {
        var mm = /^\(([a-z]{1,4})\)\s+(.+)$/.exec(text);
        if (b.bold && text.length < 90) { indent = false; out.push({ k: "p", s: "H3 Sub Heading LC Financials", t: text }); }
        else if (b.italic && text.length < 100 && !/[.:]$/.test(text)) {
          if (mm) { out.push({ k: "p", s: "H4 Sub Heading Italic", t: mm[2], mk: "(" + mm[1] + ")" }); indent = true; }
          else { indent = false; out.push({ k: "p", s: "H4 Sub Heading Italic", t: text }); }
        }
        else out.push({ k: "p", s: indent ? "B2 Body Indent" : "A4 V:Body", t: text });
      }
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
      });
    } else issues.push({ level: "error", text: "Fewer than four financial statements found." });

    var notes = { flow: true, year: Y, stories: { flow: buildNotes(parsed, issues) } };
    return { year: Y, copy: copy, statements: st, notes: notes, issues: issues };
  }

  root.RVFinanceAdapter = { build: build };
})(window);

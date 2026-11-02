/* Reads and checks the producer's input folder.
 *
 *   RVInputs.process(files, manifest, year, budgets) -> Promise<{
 *     inputs:  { [inputId]: { file, found, name, issues[] } },
 *     unknown: [{ name, hint }],
 *     payload: { [bridgeId]: overrides }         // handed to production-bridge.js
 *   }>
 *
 * Plain browser script, no dependencies. Needs docx-finance.js and
 * finance-notes.js loaded for the Finance check.
 */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------- zip -- */
  async function readZip(blob) {
    var buf = new Uint8Array(await blob.arrayBuffer());
    var dv = new DataView(buf.buffer);
    var eocd = -1;
    for (var i = buf.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("not a valid Office file");
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), entries = {};
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      var local = dv.getUint32(p + 42, true);
      entries[new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl))] = { method: method, csize: csize, local: local };
      p += 46 + nl + el + cl;
    }
    return {
      read: async function (name) {
        var e = entries[name];
        if (!e) return null;
        var s = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
        var data = buf.subarray(s, s + e.csize);
        if (e.method === 0) return new TextDecoder().decode(data);
        var out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();
        return new TextDecoder().decode(new Uint8Array(out));
      },
    };
  }

  function dec(s) {
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(+d); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&amp;/g, "&");
  }
  function words(s) { return String(s).split(/\s+/).filter(Boolean).length; }
  function issue(level, text) { return { level: level, text: text }; }

  /* ------------------------------------------------------------ docx -- */
  function textOf(xml) {
    var out = "", re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/?>/g, m;
    while ((m = re.exec(xml))) out += m[1] !== undefined ? dec(m[1]) : " ";
    return out.replace(/\s+/g, " ").trim();
  }
  function allBold(xml) {
    var runs = (xml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []).filter(function (r) { return /<w:t[ >]/.test(r); });
    if (!runs.length) return false;
    return runs.every(function (r) {
      var m = r.match(/<w:b(?:\s+w:val="([^"]*)")?\s*\/>/);
      return !!m && m[1] !== "0" && m[1] !== "false";
    });
  }

  function allUnderlined(xml) {
    var runs = (xml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []).filter(function (r) { return /<w:t[ >]/.test(r); });
    if (!runs.length) return false;
    return runs.every(function (r) { return /<w:u\s+w:val="(?!none)[^"]+"/.test(r); });
  }

  // A bold run-in at the start of a paragraph ("Sky - domestic and international:")
  // followed by plain text. Returned only when it ends in a colon and is short.
  function leadBold(xml) {
    var runs = (xml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []).filter(function (r) { return /<w:t[ >]/.test(r); });
    var lead = "", i = 0;
    for (; i < runs.length; i++) {
      var m = runs[i].match(/<w:b(?:\s+w:val="([^"]*)")?\s*\/>/);
      if (!m || m[1] === "0" || m[1] === "false") break;
      lead += textOf(runs[i]);
    }
    lead = lead.trim();
    if (!lead || i >= runs.length || !/:$/.test(lead) || words(lead) > 10) return "";
    return lead;
  }

  // Word paragraphs -> [{ text, kind }]. Headings are recognised by style
  // (Heading 1/2/3) or, for departmental documents without styles, by a short
  // fully-bold line (subhead) or fully-underlined line. Underlined lines are a
  // minor heading when the document also has bold subheads, otherwise they are
  // the subheads. Guidance paragraphs and the template's Images table are skipped.
  function docxBlocks(docXml) {
    var body = (docXml.match(/<w:body>([\s\S]*)<\/w:body>/) || [, docXml])[1];
    body = body.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, "");
    var paras = body.match(/<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) || [];
    var out = [];
    for (var i = 0; i < paras.length; i++) {
      var x = paras[i];
      var style = (x.match(/<w:pStyle\s+w:val="([^"]+)"/) || [, ""])[1];
      var text = textOf(x);
      if (!text || /^(RVGuidance|Title)$/i.test(style)) continue;
      var kind = "body";
      if (/^Heading1$/i.test(style)) kind = "h1";
      else if (/^Heading2$/i.test(style)) kind = "subhead";
      else if (/^Heading[3-9]$/i.test(style)) kind = "strong";
      else if (/List/i.test(style) || /<w:numPr>/.test(x)) kind = "bullet";
      else if (allBold(x) && words(text) <= 14 && !/[.:;]$/.test(text)) kind = "subhead";
      else if (allUnderlined(x) && words(text) <= 14 && !/[.:;]$/.test(text)) kind = "underline";
      if (kind !== "body" && kind !== "bullet" && /^images$/i.test(text)) break;
      var blk = { text: text, kind: kind };
      if (kind === "body" || kind === "bullet") { var ld = leadBold(x); if (ld) blk.lead = ld; }
      out.push(blk);
    }
    var boldSubheads = out.slice(1).some(function (b) { return b.kind === "subhead"; });
    out.forEach(function (b) { if (b.kind === "underline") b.kind = boldSubheads ? "strong" : "subhead"; });
    return out;
  }

  // Wagering docx tables: annual turnover/FBT, turnover by quarter, top five.
  function wageringTables(docXml) {
    var cell = function (c) { return textOf(c).trim(); };
    var num = function (s) { var v = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return isNaN(v) ? null : v; };
    var out = {}, issues = [];
    (docXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).forEach(function (t) {
      var rows = (t.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).map(function (r) { return (r.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(cell); });
      var flat = rows.map(function (r) { return r.join(" "); }).join(" ");
      if (/free bet/i.test(flat)) {
        out.annual = rows.filter(function (r) { return /^FY\d{2}$/.test(r[0]); }).map(function (r) {
          return { fy: r[0], turnover: r[1], turnoverYoY: num(r[2]), fbt: r[3], fbtYoY: num(r[4]) };
        });
      } else if (rows.some(function (r) { return /^Q[1-4]$/.test(r[0]); })) {
        var hd = rows.filter(function (r) { return r.filter(function (c) { return /^FY\d{2}$/.test(c); }).length === 2; })[0] || [];
        var fys = hd.filter(function (c) { return /^FY\d{2}$/.test(c); });
        out.quarterly = { prior: fys[0], current: fys[1], rows: rows.filter(function (r) { return /^Q[1-4]$/.test(r[0]); }).map(function (r) {
          return { q: r[0], prior: r[1], current: r[2], yoy: num(r[3]) };
        }) };
      } else if (/^top\s*(5|five)/i.test(rows[0] && rows[0][0] || "")) {
        out.topFiveTitle = rows[0][0];
        out.topFive = rows.slice(1).map(function (r) { return r.filter(Boolean).pop() || ""; }).filter(Boolean);
      }
    });
    if (!out.annual) issues.push(issue("warning", "No turnover / free bet turnover table found; the charts keep last year\u2019s figures."));
    else issues.push(issue("info", "Turnover and free bet turnover read for " + out.annual[0].fy + "\u2013" + out.annual[out.annual.length - 1].fy + "; the charts show the last six years."));
    if (!out.quarterly) issues.push(issue("warning", "No quarterly turnover table found."));
    if (!out.topFive) issues.push(issue("warning", "No Top 5 turnover races table found."));
    return { data: out, issues: issues };
  }

  // Equine Welfare docx: the welfare-spend table (Category | FYxx Spend (%) | FYxx-1 Spend (%)).
  function welfareTable(docXml) {
    var cell = function (c) { return textOf(c).trim(); };
    var found = null;
    (docXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).forEach(function (t) {
      if (found) return;
      var rows = (t.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || []).map(function (r) { return (r.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || []).map(cell); });
      if (rows.length > 1 && rows[0].length >= 3 && /category/i.test(rows[0][0]) && /spend/i.test(rows[0].join(" ")))
        found = { head: rows[0].slice(0, 3), rows: rows.slice(1).filter(function (r) { return r.some(Boolean); }).map(function (r) { return r.slice(0, 3); }) };
    });
    return found;
  }

// Awards and Feature Race Winners docx: three headed lists, text verbatim.
  // "… Award Winners" / "… Premiership Winners" lines are "Award – Winner";
  // under "… Feature Race Winners" each "Race (Horse)" is followed by "Caption: …".
  function awardsDocx(docXml, year) {
    var issues = [], body = (docXml.match(/<w:body>([\s\S]*)<\/w:body>/) || [, docXml])[1];
    var paras = (body.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(textOf).filter(Boolean);
    var yy = +year.slice(2), label = "20" + (yy - 1) + "-" + yy;
    var sec = null, lines = [], races = [], seen = {};
    paras.forEach(function (t) {
      if (/award winners$/i.test(t)) { sec = "a"; seen.a = 1; lines.push(["h", t, lines.length ? "14pt" : "0"]); return; }
      if (/premiership winners$/i.test(t)) { sec = "p"; seen.p = 1; lines.push(["h", t, lines.length ? "14pt" : "0"]); return; }
      if (/feature race winners$/i.test(t)) { sec = "f"; seen.f = 1; return; }
      if (sec === "a" || sec === "p") { lines.push(["i", t]); return; }
      if (sec === "f") {
        var c = t.match(/^caption\s*:\s*(.*)$/i);
        if (c) {
          if (!races.length || races[races.length - 1].caption !== undefined) issues.push(issue("warning", "A caption has no race above it: \u201c" + c[1].slice(0, 50) + "\u201d."));
          else races[races.length - 1].caption = c[1];
          return;
        }
        var m = t.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
        races.push({ race: m ? m[1] : t, horse: m ? m[2] : "", caption: undefined });
      }
    });
    if (!seen.a) issues.push(issue("error", "No \u201c" + label + " Victorian Racing Award Winners\u201d heading found."));
    if (!seen.p) issues.push(issue("error", "No \u201c" + label + " Premiership Winners\u201d heading found."));
    if (!seen.f) issues.push(issue("error", "No \u201c" + label + " Feature Race Winners\u201d heading found."));
    lines.filter(function (l) { return l[0] === "h" && l[1].indexOf(label) !== 0; }).forEach(function (l) {
      issues.push(issue("warning", "Heading \u201c" + l[1] + "\u201d does not start with " + label + "."));
    });
    var noCap = races.filter(function (r) { return r.caption === undefined; });
    if (noCap.length) issues.push(issue("warning", noCap.length + " race" + (noCap.length > 1 ? "s have" : " has") + " no caption (" + noCap.map(function (r) { return r.race; }).join(", ") + "). They will print as a dash."));
    races.forEach(function (r) { if (r.caption === undefined) r.caption = "\u2014"; });
    if (races.length && races.length !== 12) issues.push(issue("warning", races.length + " feature races found; the page has 12 photo and caption positions."));
    var items = lines.filter(function (l) { return l[0] === "i"; }).length;
    issues.push(issue("info", items + " award and premiership lines and " + races.length + " feature races read."));
    return { issues: issues, payload: { awards: { year: 2000 + yy, season: label, awardLines: lines, races: races } } };
  }

  function narrative(blocks, cfg, budget, label) {
    var issues = [];
    if (!blocks.length) issues.push(issue("error", "No text found in the document."));
    var ph = blocks.filter(function (b) { return /\[[^\]]{2,}\]/.test(b.text); });
    if (ph.length) issues.push(issue("error", ph.length + " template placeholder" + (ph.length > 1 ? "s" : "") + " still in the document, e.g. \u201c" + ph[0].text.slice(0, 60) + "\u201d."));
    var total = blocks.reduce(function (n, b) { return n + words(b.text); }, 0);
    if (budget && total) {
      var r = total / budget;
      if (r > 1.15) issues.push(issue("warning", "About " + total + " words against " + budget + " last year \u2014 likely to overflow the spread."));
      else if (r < 0.7) issues.push(issue("warning", "About " + total + " words against " + budget + " last year \u2014 the spread may look sparse."));
    }
    var kinds = cfg.kinds || {};
    var sign = null;
    if (cfg.strings) {
      // Lines after "Yours sincerely," are the sign-off (name, then role): they go
      // to meta for the signature block, not into the columns.
      var ys = -1;
      blocks.forEach(function (b, i) { if (/^yours (sincerely|faithfully)/i.test(b.text)) ys = i; });
      if (ys >= 0 && ys < blocks.length - 1) {
        var tail = blocks.slice(ys + 1).map(function (b) { return b.text; });
        sign = { signatory: tail[0], signatoryRole: tail.slice(1).join(", ") };
        blocks = blocks.slice(0, ys + 1);
      }
    }
    var payload = cfg.strings
      ? { paragraphs: blocks.filter(function (b, i) { return !(i === 0 && /annual report\s*[\u2013\u2014-]/i.test(b.text)); }).map(function (b) { return b.text; }) }
      : { paragraphs: blocks.map(function (b) {
          var k = kinds[b.kind] || (b.kind === "h1" && label !== "media" ? "subhead" : b.kind);
          var o = k === "body" ? { text: b.text } : { text: b.text, kind: k };
          // Content, Media & Marketing sets a bold run-in ahead of the text.
          if (b.lead && label === "media" && b.text.indexOf(b.lead) === 0) { o.bold = b.lead; o.text = b.text.slice(b.lead.length).trim(); }
          return o;
        }) };
    if (sign) { payload.meta = sign; issues.push(issue("info", "Signed off by " + sign.signatory + (sign.signatoryRole ? ", " + sign.signatoryRole : "") + ".")); }
    return { issues: issues, payload: payload };
  }

  /* ------------------------------------------------------------ xlsx -- */
  function colIndex(ref) {
    var letters = ref.replace(/\d+/g, ""), n = 0;
    for (var i = 0; i < letters.length; i++) n = n * 26 + (letters.charCodeAt(i) - 64);
    return n - 1;
  }
  async function xlsxSheets(zip) {
    var wb = await zip.read("xl/workbook.xml");
    if (!wb) throw new Error("not an Excel workbook");
    var rels = (await zip.read("xl/_rels/workbook.xml.rels")) || "";
    var ss = await zip.read("xl/sharedStrings.xml");
    var shared = ss ? Array.from(ss.matchAll(/<si>([\s\S]*?)<\/si>/g)).map(function (m) {
      return Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map(function (t) { return dec(t[1]); }).join("");
    }) : [];
    var relMap = {};
    Array.from(rels.matchAll(/<Relationship\b[^>]*>/g)).forEach(function (m) {
      var id = (m[0].match(/Id="([^"]+)"/) || [])[1], t = (m[0].match(/Target="([^"]+)"/) || [])[1];
      if (id && t) relMap[id] = t.charAt(0) === "/" ? t.slice(1) : "xl/" + t;
    });
    var out = {};
    var sheets = Array.from(wb.matchAll(/<sheet\b[^>]*>/g));
    for (var s = 0; s < sheets.length; s++) {
      var tag = sheets[s][0];
      var name = dec((tag.match(/name="([^"]+)"/) || [])[1] || "");
      var rid = (tag.match(/r:id="([^"]+)"/) || [])[1];
      var xml = relMap[rid] ? await zip.read(relMap[rid]) : null;
      var rows = [];
      if (xml) {
        Array.from(xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)).forEach(function (m) {
          var ref = (m[1].match(/r="([A-Z]+\d+)"/) || [])[1];
          if (!ref || !m[2]) return;
          var t = (m[1].match(/t="([^"]+)"/) || [])[1];
          var v = (m[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
          var val;
          if (t === "s") val = shared[+v];
          else if (t === "inlineStr") val = Array.from(m[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map(function (x) { return dec(x[1]); }).join("");
          else if (t === "str" || t === "e") val = v !== undefined ? dec(v) : "";
          else if (t === "b") val = v === "1";
          else val = v !== undefined && v !== "" ? Number(v) : undefined;
          var r = +ref.replace(/[A-Z]+/, "") - 1;
          (rows[r] = rows[r] || [])[colIndex(ref)] = val;
        });
      }
      out[name] = rows;
    }
    return out;
  }

  function str(v) { return v === undefined || v === null ? "" : String(v).trim(); }
  function norm(v) { return str(v).toLowerCase().replace(/\s+/g, " "); }
  function tableAfter(rows, header) {
    var h = -1;
    for (var i = 0; i < rows.length; i++) if (rows[i] && norm(rows[i][0]) === norm(header)) { h = i; break; }
    if (h < 0) return null;
    var out = [];
    for (var j = h + 1; j < rows.length; j++) {
      var r = rows[j] || [];
      if (!r.some(function (v) { return str(v) !== ""; })) break;
      out.push(r);
    }
    return out;
  }
  function num(v) {
    if (typeof v === "number") return v;
    var n = Number(str(v).replace(/[$,%\s]/g, ""));
    return str(v) === "" || isNaN(n) ? null : n;
  }

  // "Tim Eddy (Chair)Appointed Director 9 December 2019 ..." -> { name, role }
  function readBoard(blocks) {
    var out = [], inList = false, seen = {};
    blocks.forEach(function (b) {
      if (b.k === "sectionHeading") { inList = /current directors/i.test(b.text || ""); return; }
      if (!inList) return;
      var raw = b.k === "textbox" ? b.paras.map(function (p) { return p.text; }).join(" ") : b.text;
      if (!raw) return;
      var m = /^(.+?)\s*(?:\(([^)]+)\))?\s*Appointed\b/.exec(raw.replace(/\s+/g, " ").trim());
      if (!m || seen[m[1].trim()]) return;
      seen[m[1].trim()] = 1;
      var role = (m[2] || "").trim();
      if (/chief executive/i.test(role)) role = "CEO";
      out.push(role ? { name: m[1].trim(), role: role } : { name: m[1].trim() });
    });
    return out;
  }

  // KPI workbooks (Finance). Racing: label in column B, each group's current and
  // prior year in F/G, J/K, N/O, R/S. Participation: label in B, years in I/J.
  // Variances are not read; the page works them out from the two years.
  function kpiWorkbook(sheets, id, year) {
    var issues = [], payload = {};
    var name = Object.keys(sheets)[0], rows = sheets[name] || [];
    var yy = +year.slice(2), cur = "FY" + yy, pri = "FY" + (yy - 1);
    var lab = function (r) { return str(r && r[1]).replace(/\s+/g, " ").trim(); };
    var fmt = function (l) { return /^Average Starters/i.test(l) ? "dec1" : /^Average Individual/i.test(l) ? "dec2" : /^%/.test(l) ? "pct1" : /\(\$M\)/.test(l) ? "money1" : "int"; };
    var val = function (v) { return typeof v === "number" && isFinite(v) ? v : null; };
    var head = rows.filter(function (r) { return r && r.some(function (v) { return str(v) === cur; }); })[0];
    if (!head) issues.push(issue("error", "No " + cur + " column found in sheet \u201c" + name + "\u201d \u2014 check the workbook is this year\u2019s."));
    if (id === "kpiRacing") {
      var groups = [["picnic", 5], ["country", 9], ["metro", 13], ["total", 17]];
      var titles = ["Racing Statistics", "Prizemoney Statistics", "Wagering Statistics"], tables = [];
      titles.forEach(function (t) {
        var at = rows.findIndex(function (r) { return lab(r) === t; });
        if (at < 0) { issues.push(issue("error", "\u201c" + t + "\u201d block not found.")); return; }
        var out = [];
        for (var i = at + 1; i < rows.length; i++) {
          var r = rows[i] || [], l = lab(r);
          if (titles.indexOf(l) > -1) break;
          if (!l) { if (out.length) break; continue; }
          var vals = {}, any = false;
          groups.forEach(function (g) { var a = val(r[g[1]]), b = val(r[g[1] + 1]); if (a != null || b != null) any = true; vals[g[0]] = [a, b]; });
          if (!any) break;
          out.push({ label: l, fmt: fmt(l), emph: false, source: "row " + (i + 1), values: vals });
        }
        tables.push({ title: t, rows: out });
      });
      var per = rows.map(lab).filter(function (l) { return new RegExp("^" + cur + " \\(").test(l); })[0];
      payload = { meta: { current: cur, prior: pri, periodLabel: per || cur, sources: [name] }, tables: tables, footnotes: [] };
      var n = tables.reduce(function (s, t) { return s + t.rows.length; }, 0);
      issues.push(issue("info", n + " racing, prizemoney and wagering rows read (" + cur + " and " + pri + ")."));
      issues.push(issue("warning", "The workbook has no footnotes. The FY25 prizemoney footnotes are left off until this year\u2019s are supplied."));
    } else {
      var at2 = rows.findIndex(function (r) { return lab(r) === "Participation Statistics"; }), prow = [];
      if (at2 < 0) issues.push(issue("error", "\u201cParticipation Statistics\u201d block not found."));
      else for (var j = at2 + 1; j < rows.length; j++) {
        var r2 = rows[j] || [], l2 = lab(r2);
        if (!l2) { if (prow.length) break; continue; }
        prow.push({ label: l2, fmt: fmt(l2), emph: false, source: "row " + (j + 1), values: [val(r2[8]), val(r2[9])] });
      }
      payload = { participation: { title: "Participation Statistics", rows: prow } };
      issues.push(issue("info", prow.length + " participation rows read (" + cur + " and " + pri + ")."));
    }
    return { issues: issues, payload: payload };
  }

  function needSheets(sheets, names, issues) {
    names.forEach(function (s) {
      if (!sheets[s]) issues.push(issue("error", "Sheet \u201c" + s + "\u201d is missing or has been renamed."));
    });
  }

  function snapshotInputs(sheets, year) {
    var issues = [], payload = {};
    var footYear = 2000 + +year.slice(2);
    needSheets(sheets, ["Industry Snapshot"], issues);

    var snap = sheets["Industry Snapshot"] && tableAfter(sheets["Industry Snapshot"], "ID (do not change)");
    if (snap) {
      var stats = {}, missing = [];
      snap.forEach(function (r) {
        var id = str(r[0]);
        if (!id) return;
        if (str(r[3]) === "") { stats[id] = { value: null }; missing.push(str(r[1]) || id); return; }
        var n = num(r[3]);
        if (n === null) issues.push(issue("error", "Industry Snapshot: \u201c" + (str(r[1]) || id) + "\u201d is not a plain number."));
        stats[id] = { value: n };
      });
      if (missing.length) issues.push(issue("warning", "Industry Snapshot: " + missing.length + " figure" + (missing.length > 1 ? "s" : "") + " not entered (" + missing.join(", ") + "). They will print as a dash."));
      payload["snapshot-data"] = { meta: { period: year, heading: year + " Industry Snapshot", footYear: footYear }, stats: stats };
    }

    return { issues: issues, payload: payload };
  }

  /* ------------------------------------------------------------- pdf -- */
  // The signed auditor pages arrive as a PDF. We can confirm it is a PDF and
  // count its pages; signatures and content are for the producer to eyeball.
  async function pdfCheck(file, expected) {
    var out = [];
    var bytes = new Uint8Array(await file.arrayBuffer());
    var head = new TextDecoder("latin1").decode(bytes.subarray(0, 8));
    if (head.indexOf("%PDF-") !== 0) return [issue("error", "This is not a PDF file.")];
    var text = new TextDecoder("latin1").decode(bytes);
    if (/\/Encrypt\b/.test(text)) out.push(issue("warning", "The PDF is password-protected or encrypted \u2014 ask for an unlocked copy if pages will not place."));
    var counts = Array.from(text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)).map(function (m) { return +(m[1] || m[2]); });
    var pages = counts.length ? Math.max.apply(null, counts) : (text.match(/\/Type\s*\/Page(?!s)\b/g) || []).length;
    if (!pages) out.push(issue("warning", "Could not count the pages \u2014 check the PDF opens normally."));
    else if (expected && pages !== expected) out.push(issue("error", pages + " page" + (pages > 1 ? "s" : "") + " found; the report expects " + expected + " (independence declaration, then the two-page auditor\u2019s report)."));
    else out.push(issue("info", pages + " pages \u2014 check both signatures are present before producing."));
    return out;
  }

  // The PDF is kept in the browser (IndexedDB) for the report to draw at
  // print resolution; here we only check how its pages will place.
  async function pdfPlace(file) {
    var A = root.RVAuditor;
    var stamp = await A.store(file);
    var info = await A.check(new Uint8Array(await file.arrayBuffer()));
    var out = [];
    info.placed.forEach(function (p) {
      if (Math.abs(p.scale - 1.063) > 0.08) out.push(issue("warning", "Page for p. " + p.page + ": body type is " + p.body.toFixed(2) + "pt, so it is scaled to " + Math.round(p.scale * 100) + "% to set at FY25\u2019s 9.48pt. Check the page in the run."));
      if (p.overflow > 0) out.push(issue("warning", "Page for p. " + p.page + ": the text runs " + p.overflow.toFixed(1) + "pt into KPMG\u2019s footer area and will be cropped."));
    });
    return { stamp: stamp, pages: info.pages, issues: out };
  }

  /* --------------------------------------------------------- process -- */
  function key(name) {
    return name.toLowerCase().replace(/\.(docx|xlsx|pdf)$/, "").replace(/^(fy\s?\d{2}|\d{4})\s*/, "").replace(/[^a-z0-9]/g, "");
  }

  async function process(fileList, manifest, year, budgets) {
    var files = Array.from(fileList).filter(function (f) { return !/(^|\/)\.[^/]*$/.test(f.webkitRelativePath || f.name); });
    var expected = manifest.inputs.map(function (i) { return Object.assign({}, i, { file: manifest.fileName(i, year) }); });
    var byName = {};
    files.forEach(function (f) { byName[f.name.toLowerCase()] = f; });

    var result = { inputs: {}, unknown: [], payload: {} };
    var used = {};

    for (var e = 0; e < expected.length; e++) {
      var inp = expected[e];
      var f = byName[inp.file.toLowerCase()];
      var rec = { file: inp.file, found: !!f, name: f ? f.name : null, issues: [] };
      result.inputs[inp.id] = rec;
      if (!f) { rec.issues.push(issue("error", "Not in the folder.")); continue; }
      used[f.name.toLowerCase()] = true;
      if (f.name !== inp.file) rec.issues.push(issue("info", "Name differs only in capitals \u2014 accepted."));
      if (inp.kind === "pdf") {
        var pdf = await pdfCheck(f, inp.pages);
        rec.issues = rec.issues.concat(pdf);
        try {
          var placed = await pdfPlace(f);
          result.auditorPdf = placed.stamp;
          rec.issues = rec.issues.concat(placed.issues);
          rec.issues.push(issue("info", "Pages 1\u20133 placed on pp. 38\u201340 as in FY25 (KPMG\u2019s footers cropped, 300 dpi, no white page)" + (placed.pages > 3 ? "; page " + placed.pages + " is the signed Directors\u2019 Declaration, which the report sets from the Finance document." : ".")));
        } catch (err) {
          rec.issues.push(issue("warning", "The pages could not be read (" + (err && err.message ? err.message : err) + "). Drop them onto the slots on the report instead."));
        }
        continue;
      }
      try {
        var zip = await readZip(f);
        if (inp.kind === "docx") {
          var doc = await zip.read("word/document.xml");
          if (!doc) throw new Error("no document body");
          if (inp.id === "awardsData") {
            var ad = awardsDocx(doc, year);
            rec.issues = rec.issues.concat(ad.issues);
            result.payload.awards = Object.assign(result.payload.awards || {}, ad.payload.awards);
          } else if (inp.id === "finance") {
            var C = root.RVFinanceConverter;
            var parsed = C.parse(doc, root.RV_FINANCE_NOTES, await zip.read("word/numbering.xml"));
            var v = C.validate(C.build(parsed, { source: f.name }), null, parsed.unknownStyles, parsed.missingNotes);
            v.errors.forEach(function (t) { rec.issues.push(issue("error", t)); });
            v.warnings.forEach(function (t) { rec.issues.push(issue("warning", t)); });
            rec.issues.push(issue("info", parsed.counts.tables + " tables and " + parsed.counts.notes + " notes found."));
            var board = readBoard(parsed.blocks);
            if (root.RVFinanceAdapter) {
              var prevMods = await Promise.all([import("./copy/directors-report.js"), import("./copy/statements.js")]);
              var built = root.RVFinanceAdapter.build(parsed, { copy: prevMods[0].copy, statements: prevMods[1].statements });
              built.issues.forEach(function (x) { rec.issues.push(issue(x.level, x.text)); });
              var pics = built.copy.narrative.filter(function (b) { return b.kind === "diagram" && b.rid; });
              if (pics.length) {
                var dx = await C.readDocx(f);
                for (var q = 0; q < pics.length; q++) {
                  pics[q].src = await dx.image(pics[q].rid);
                  if (!pics[q].src) rec.issues.push(issue("warning", "The diagram picture could not be read from the document."));
                  else rec.issues.push(issue("info", "Expenditure diagram taken from the document (" + Math.round(pics[q].w) + " \u00d7 " + Math.round(pics[q].h) + " pt)."));
                }
              }
              result.payload["directors-report"] = built.copy;
              result.payload["statements"] = built.statements;
              result.payload["notes"] = built.notes;
              result.financeYear = built.year;
              rec.issues.push(issue("info", "Directors\u2019 Report, the four statements and the notes built from this document (FY" + String(built.year).slice(2) + ")."));
            }
            if (!board.length) rec.issues.push(issue("warning", "No directors found under Current Directors, so the Images tab still shows last year\u2019s board."));
            else {
              result.people = board;
              rec.issues.push(issue("info", board.length + " current directors: " + board.map(function (d) { return d.name; }).join(", ") + "."));
              if (!board.some(function (d) { return d.role === "Chair"; })) rec.issues.push(issue("warning", "No Chair among the current directors, so no Chair signature is listed."));
              if (!board.some(function (d) { return d.role === "CEO"; })) rec.issues.push(issue("warning", "No CEO among the current directors, so no CEO signature is listed."));
              if (root.RVImages && board.length > root.RVImages.frames) rec.issues.push(issue("warning", board.length + " directors found; the Directors\u2019 Report has frames for " + root.RVImages.frames + ". The rest need a layout change."));
            }
          } else {
            var cfg = manifest.narrative[inp.id];
            var out = narrative(docxBlocks(doc), cfg, budgets && budgets[cfg.payload], inp.id);
            rec.issues = rec.issues.concat(out.issues);
            if (cfg.strings) out.payload.meta = Object.assign({}, out.payload.meta, { footYear: 2000 + +year.slice(2) });
            if (inp.id === "welfare") {
              var et = welfareTable(doc);
              if (et) { out.payload.table = et; rec.issues.push(issue("info", "Welfare spend table read (" + et.rows.length + " rows, " + et.head[1] + " / " + et.head[2] + ").")); }
              else rec.issues.push(issue("warning", "No welfare spend table (Category / Spend %) found in the document."));
            }
            if (inp.id === "wagering") {
              var wt = wageringTables(doc);
              rec.issues = rec.issues.concat(wt.issues);
              Object.assign(out.payload, wt.data, { year: 2000 + +year.slice(2) });
              if (out.payload.paragraphs[0] && /^wagering$/i.test(out.payload.paragraphs[0].text)) out.payload.paragraphs.shift();
            }
            result.payload[cfg.payload] = Object.assign(result.payload[cfg.payload] || {}, out.payload);
          }
        } else {
          var sheets = await xlsxSheets(zip);
          if (inp.id === "snapshotData") {
            var d = snapshotInputs(sheets, year);
            rec.issues = rec.issues.concat(d.issues);
            Object.keys(d.payload).forEach(function (k) { result.payload[k] = Object.assign(result.payload[k] || {}, d.payload[k]); });
          } else if (inp.id === "kpiRacing" || inp.id === "kpiParticipation") {
            var kw = kpiWorkbook(sheets, inp.id, year);
            rec.issues = rec.issues.concat(kw.issues);
            result.payload["kpi-data"] = Object.assign(result.payload["kpi-data"] || {}, kw.payload);
          } else {
            rec.issues.push(issue("info", "Workbook opened (" + n + " sheet" + (n > 1 ? "s" : "") + "). KPI tables still show FY25 figures until the workbook reader is connected."));
          }
        }
      } catch (err) {
        rec.issues.push(issue("error", "Could not be opened (" + (err && err.message ? err.message : err) + "). Re-save it from Word or Excel."));
      }
    }

    if (result.auditorPdf) {
      var dr = result.payload["directors-report"] = result.payload["directors-report"] || {};
      dr.kpmg = Object.assign({}, dr.kpmg, { pdf: "idb", stamp: result.auditorPdf });
    }

    var keys = expected.map(function (i) { return { k: key(i.file), file: i.file }; });
    files.forEach(function (f) {
      if (used[f.name.toLowerCase()]) return;
      var hint = "";
      if (/^~\$/.test(f.name)) hint = "Word/Excel lock file \u2014 close the document and choose the folder again.";
      else {
        var k = key(f.name);
        var hit = keys.filter(function (x) { return x.k === k; })[0] || keys.filter(function (x) { return k.indexOf(x.k) > -1 || (k.length > 6 && x.k.indexOf(k) > -1); })[0];
        hint = hit ? "Looks like \u201c" + hit.file + "\u201d \u2014 rename it exactly." : "Not part of the report \u2014 ignored.";
      }
      result.unknown.push({ name: f.name, hint: hint });
    });
    return result;
  }

  root.RVInputs = { process: process, docxBlocks: docxBlocks, xlsxSheets: xlsxSheets, readZip: readZip, kpiWorkbook: kpiWorkbook };
})(window);

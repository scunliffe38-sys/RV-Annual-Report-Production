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
      out.push({ text: text, kind: kind });
    }
    var boldSubheads = out.slice(1).some(function (b) { return b.kind === "subhead"; });
    out.forEach(function (b) { if (b.kind === "underline") b.kind = boldSubheads ? "strong" : "subhead"; });
    return out;
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
    var payload = cfg.strings
      ? { paragraphs: blocks.filter(function (b, i) { return !(i === 0 && /annual report\s*[\u2013\u2014-]/i.test(b.text)); }).map(function (b) { return b.text; }) }
      : { paragraphs: blocks.map(function (b) {
          var k = kinds[b.kind] || (b.kind === "h1" && label !== "media" ? "subhead" : b.kind);
          return k === "body" ? { text: b.text } : { text: b.text, kind: k };
        }) };
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

  function dataInputs(sheets, year) {
    var issues = [], payload = {};
    var yy = +year.slice(2), label = "20" + (yy - 1) + "-" + yy, footYear = 2000 + yy;
    ["Industry Snapshot", "Wagering Charts", "Wagering Top Five", "VR Awards", "Premierships", "Feature Race Winners"].forEach(function (s) {
      if (!sheets[s]) issues.push(issue("error", "Sheet \u201c" + s + "\u201d is missing or has been renamed."));
    });

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

    var aw = sheets["VR Awards"] && tableAfter(sheets["VR Awards"], "Award (as printed)");
    var pr = sheets["Premierships"] && tableAfter(sheets["Premierships"], "Premiership");
    var fr = sheets["Feature Race Winners"] && tableAfter(sheets["Feature Race Winners"], "#");
    if (aw || pr || fr) {
      var gaps = 0, dash = "\u2014";
      var lines = [["h", label + " Victorian Racing Award Winners", "0"]];
      (aw || []).forEach(function (r) { if (!str(r[0])) return; if (!str(r[2])) gaps++; lines.push(["i", str(r[0]) + " \u2013 " + (str(r[2]) || dash)]); });
      lines.push(["h", label + " Premiership Winners", "14pt"]);
      (pr || []).forEach(function (r) {
        if (!str(r[0])) return;
        if (!str(r[3])) gaps++;
        lines.push(["i", str(r[0]) + " \u2013 " + (str(r[3]) || dash) + (str(r[4]) ? " (" + str(r[4]) + " wins)" : "")]);
      });
      var caps = (fr || []).filter(function (r) { return str(r[0]); }).map(function (r) {
        if (!str(r[4])) gaps++;
        return str(r[0]) + ". " + (str(r[4]) || dash);
      });
      if (gaps) issues.push(issue("warning", "Awards page: " + gaps + " winner or caption cell" + (gaps > 1 ? "s" : "") + " empty. They will print as a dash."));
      payload.awards = { awardLines: lines, captions: caps };
    }

    var top = sheets["Wagering Top Five"] && tableAfter(sheets["Wagering Top Five"], "Rank");
    if (top) {
      var races = top.map(function (r) { return str(r[2]); });
      var got = races.filter(Boolean).length;
      if (got < races.length) issues.push(issue("warning", "Wagering Top Five: " + (races.length - got) + " race" + (races.length - got > 1 ? "s" : "") + " not entered."));
      if (got) payload.wagering = { topFive: races.map(function (r) { return r || "\u2014"; }) };
    }

    var wc = sheets["Wagering Charts"];
    if (wc) {
      var fy = wc.filter(function (r) { return r && norm(r[0]) === norm(year); });
      var blank = fy.filter(function (r) { return str(r[1]) === ""; }).length;
      if (blank) issues.push(issue("warning", "Wagering Charts: " + year + " value missing in " + blank + " chart" + (blank > 1 ? "s" : "") + "."));
      issues.push(issue("info", "Wagering chart figures were read, but the charts still draw FY25 values until they are connected."));
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

  // Each page of the signed PDF as a picture (pdf.js, loaded on demand).
  async function pdfImages(file) {
    var base = "https://cdn.jsdelivr.net/npm/pdf-parse@2.4.5/dist/pdf-parse/web/";
    var m = await import(base + "pdf-parse.es.js");
    m.PDFParse.setWorker(base + "pdf.worker.min.mjs");
    var parser = new m.PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
    var r = await parser.getScreenshot({ scale: 1.4, imageDataUrl: true, imageBuffer: false });
    return r.pages.map(function (p) { return p.dataUrl; });
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
          result.auditorImages = await pdfImages(f);
          rec.issues.push(issue("info", "Pages 1\u20133 drawn for the independence declaration and the audit report" + (result.auditorImages.length > 3 ? "; page " + result.auditorImages.length + " is the signed Directors\u2019 Declaration, which the report sets from the Finance document." : ".")));
        } catch (err) {
          rec.issues.push(issue("warning", "The pages could not be drawn (" + (err && err.message ? err.message : err) + "). Drop them onto the slots on the report instead."));
        }
        continue;
      }
      try {
        var zip = await readZip(f);
        if (inp.kind === "docx") {
          var doc = await zip.read("word/document.xml");
          if (!doc) throw new Error("no document body");
          if (inp.id === "finance") {
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
            if (cfg.strings) out.payload.meta = { footYear: 2000 + +year.slice(2) };
            result.payload[cfg.payload] = Object.assign(result.payload[cfg.payload] || {}, out.payload);
          }
        } else {
          var sheets = await xlsxSheets(zip);
          if (inp.id === "dataInputs") {
            var d = dataInputs(sheets, year);
            rec.issues = rec.issues.concat(d.issues);
            Object.keys(d.payload).forEach(function (k) { result.payload[k] = Object.assign(result.payload[k] || {}, d.payload[k]); });
          } else {
            var n = Object.keys(sheets).length;
            rec.issues.push(issue("info", "Workbook opened (" + n + " sheet" + (n > 1 ? "s" : "") + "). KPI tables still show FY25 figures until the workbook reader is connected."));
          }
        }
      } catch (err) {
        rec.issues.push(issue("error", "Could not be opened (" + (err && err.message ? err.message : err) + "). Re-save it from Word or Excel."));
      }
    }

    if (result.auditorImages) {
      var dr = result.payload["directors-report"] = result.payload["directors-report"] || {};
      dr.kpmg = Object.assign({}, dr.kpmg, { images: result.auditorImages.slice(0, 3) });
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

  root.RVInputs = { process: process, docxBlocks: docxBlocks, xlsxSheets: xlsxSheets, readZip: readZip };
})(window);

/* RV Annual Report — Finance section docx converter.
 *
 * Plain browser script, no build step and no dependencies, so the whole
 * project stays a folder of static files that can be pushed to GitHub or
 * Bitbucket and served as-is (including GitHub Pages / file://).
 *
 *   window.RVFinanceConverter
 *     .readDocx(file)            -> { document, numbering, styles }   (XML strings)
 *     .parse(documentXml)        -> { blocks, tables, counts }
 *     .build(parsed, meta)       -> content object (the content/finance.json shape)
 *     .validate(content, prev)   -> { errors, warnings, info }
 *     .STYLE_MAP
 *
 * Deliberately does NOT touch styling or geometry. It only emits text and
 * cell data; the theme and layout layers live elsewhere and survive a re-run.
 */
(function (root) {
  "use strict";

  var VERSION = "1.0.0";

  // Word paragraph style -> RV block kind. Anything not listed here is
  // reported by validate() rather than silently guessed at.
  var STYLE_MAP = {
    "": "body",
    Normal: "body",
    BodyText: "body",
    NormalWeb: "body",
    Heading7: "sectionHeading",
    Heading9: "subhead",
    ListParagraph: "bullet",
  };

  /* ---------------------------------------------------------------- zip -- */

  function findEOCD(view, len) {
    for (var i = len - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) return i;
    }
    return -1;
  }

  async function readZip(blob) {
    var buf = new Uint8Array(await blob.arrayBuffer());
    var view = new DataView(buf.buffer);
    var eocd = findEOCD(view, buf.length);
    if (eocd < 0) throw new Error("Not a .docx — no zip directory found.");
    var count = view.getUint16(eocd + 10, true);
    var offset = view.getUint32(eocd + 16, true);
    var p = offset;
    var entries = {};
    for (var i = 0; i < count; i++) {
      var method = view.getUint16(p + 10, true);
      var csize = view.getUint32(p + 20, true);
      var nlen = view.getUint16(p + 28, true);
      var elen = view.getUint16(p + 30, true);
      var clen = view.getUint16(p + 32, true);
      var local = view.getUint32(p + 42, true);
      var name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nlen));
      entries[name] = { method: method, csize: csize, local: local };
      p += 46 + nlen + elen + clen;
    }
    return {
      names: Object.keys(entries),
      bytes: async function (name) {
        var e = entries[name];
        if (!e) return null;
        var nlen = view.getUint16(e.local + 26, true);
        var elen = view.getUint16(e.local + 28, true);
        var start = e.local + 30 + nlen + elen;
        var data = buf.subarray(start, start + e.csize);
        if (e.method === 0) return data;
        var stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        return new Uint8Array(await new Response(stream).arrayBuffer());
      },
      read: async function (name) {
        var e = entries[name];
        if (!e) return null;
        var nlen = view.getUint16(e.local + 26, true);
        var elen = view.getUint16(e.local + 28, true);
        var start = e.local + 30 + nlen + elen;
        var data = buf.subarray(start, start + e.csize);
        if (e.method === 0) return new TextDecoder().decode(data);
        var stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        var out = await new Response(stream).arrayBuffer();
        return new TextDecoder().decode(new Uint8Array(out));
      },
    };
  }

  async function readDocx(blob) {
    var zip = await readZip(blob);
    var doc = await zip.read("word/document.xml");
    if (!doc) throw new Error("No word/document.xml inside the file.");
    return {
      document: doc,
      numbering: await zip.read("word/numbering.xml"),
      styles: await zip.read("word/styles.xml"),
      // An embedded picture as a data URL, by its relationship id.
      image: async function (rid) {
        var rels = (await zip.read("word/_rels/document.xml.rels")) || "";
        var m = new RegExp('<Relationship\\b[^>]*\\bId="' + rid + '"[^>]*>').exec(rels);
        var t = m && /\bTarget="([^"]+)"/.exec(m[0]);
        if (!t) return null;
        var path = "word/" + t[1].replace(/^\//, "").replace(/^word\//, "");
        var bytes = await zip.bytes(path);
        if (!bytes) return null;
        var ext = (path.split(".").pop() || "png").toLowerCase();
        var mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/" + ext;
        var bin = "";
        for (var i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
        return "data:" + mime + ";base64," + btoa(bin);
      },
    };
  }

  /* --------------------------------------------------------------- text -- */

  function decodeEntities(s) {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(+d); })
      .replace(/&amp;/g, "&");
  }

  // Ordered text of one <w:p>/<w:tc>, preserving tabs and soft breaks.
  function textOf(xml) {
    var out = "";
    var re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/?>|<w:noBreakHyphen\s*\/>/g;
    var m;
    while ((m = re.exec(xml))) {
      if (m[1] !== undefined) out += decodeEntities(m[1]);
      else if (m[0].indexOf("w:tab") > -1) out += "\t";
      else if (m[0].indexOf("w:br") > -1) out += "\n";
      else out += "\u2011";
    }
    return out;
  }

  function isBold(xml) {
    var runs = xml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/g);
    if (!runs || !runs.length) return false;
    return runs.every(function (r) {
      var m = r.match(/<w:b(?:\s+w:val="([^"]*)")?\s*\/>/);
      return !!m && m[1] !== "0" && m[1] !== "false";
    });
  }

  function isItalic(xml) {
    return /<w:i(?:\s+w:val="(?!0|false)[^"]*")?\s*\/>/.test(xml);
  }

  /* ------------------------------------------------------ ordered walk -- */

  // Splits the body into top-level <w:p> and <w:tbl> chunks in document order,
  // counting nesting so a table inside a table cannot truncate the scan.
  function topLevelChunks(body) {
    var chunks = [];
    var i = 0;
    var open = /<w:(p|tbl)(\s[^>]*?)?(\/?)>/g;
    while (i < body.length) {
      open.lastIndex = i;
      var m = open.exec(body);
      if (!m) break;
      var tag = m[1];
      if (m[3] === "/") { i = open.lastIndex; continue; }
      var depth = 1;
      var scan = new RegExp("<w:" + tag + "(?:\\s[^>]*?)?(/?)>|</w:" + tag + ">", "g");
      scan.lastIndex = m.index + m[0].length;
      var end = -1;
      var s;
      while ((s = scan.exec(body))) {
        if (s[0].charAt(1) === "/") { depth--; if (!depth) { end = scan.lastIndex; break; } }
        else if (s[1] !== "/") depth++;
      }
      if (end < 0) break;
      chunks.push({ tag: tag, xml: body.slice(m.index, end) });
      i = end;
    }
    return chunks;
  }

  function parseRow(rowXml) {
    var cells = [];
    var re = /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g;
    var m;
    while ((m = re.exec(rowXml))) {
      var inner = m[1];
      var span = inner.match(/<w:gridSpan\s+w:val="(\d+)"\s*\/>/);
      var shd = /<w:shd\b[^>]*w:fill="([0-9A-Fa-f]{6})"/.exec(m[0]);
      var tcPr = (/<w:tcPr>[\s\S]*?<\/w:tcPr>/.exec(inner) || [""])[0];
      var line = function (side) { return new RegExp("<w:" + side + "\\b[^>]*w:val=\"(?!nil|none)[a-z]+\"").test(tcPr); };
      var para0 = (/<w:p\b[\s\S]*?<\/w:p>/.exec(inner) || [""])[0];
      var jc = /<w:jc w:val="(right|center|end)"/.exec(para0);
      var tcw = /<w:tcW w:w="(\d+)"/.exec(tcPr);
      cells.push({
        t: textOf(inner).replace(/\n+/g, " ").trim(),
        b: isBold(inner) || undefined,
        span: span ? +span[1] : undefined,
        sh: shd && shd[1].toUpperCase() !== "FFFFFF" && shd[1].toLowerCase() !== "auto" ? "#" + shd[1].toUpperCase() : undefined,
        al: jc ? (jc[1] === "center" ? "c" : "r") : undefined,
        bt: line("top") || undefined,
        bb: line("bottom") || undefined,
        w: tcw ? Math.round(+tcw[1]) / 20 : undefined,
        it: isItalic(inner) || undefined,
      });
    }
    return cells;
  }

  function slugify(s) {
    return s
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  // "12. Trade and other payables" -> { number: "12", title: "Trade and other payables" }
  function splitNoteTitle(text) {
    var m = text.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (m) return { number: m[1], title: m[2].trim() };
    return { number: null, title: text.trim() };
  }

  // Note titles carry no heading style in the source, so they are matched
  // against the register by shape: number stripped, case and punctuation
  // ignored. Renumbering a note therefore cannot break its table keys.
  function normaliseTitle(s) {
    return s
      .replace(/^\s*\d+[.)]\s*/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  // Word list numbering: numId -> levels { fmt, text, start, tick }. The marker
  // Word would print is rebuilt from the counters, so "(i)" or "(a)" in the
  // report is the one in the document.
  function readNumbering(xml) {
    var out = {};
    if (!xml) return out;
    var abs = {};
    (xml.match(/<w:abstractNum\b[\s\S]*?<\/w:abstractNum>/g) || []).forEach(function (a) {
      var id = (/w:abstractNumId="(\d+)"/.exec(a) || [])[1], lv = {};
      (a.match(/<w:lvl\b[\s\S]*?<\/w:lvl>/g) || []).forEach(function (l) {
        var il = +(/w:ilvl="(\d+)"/.exec(l) || [, 0])[1];
        var txt = (/<w:lvlText w:val="([^"]*)"/.exec(l) || [, ""])[1];
        lv[il] = {
          fmt: (/<w:numFmt w:val="(\w+)"/.exec(l) || [, "bullet"])[1],
          text: txt,
          start: +(/<w:start w:val="(\d+)"/.exec(l) || [, 1])[1],
          // Wingdings 0xFC is the tick Word draws for a ticked list.
          tick: txt.charCodeAt(0) === 0xf0fc || (txt === "\u00fc" && /Wingdings/.test(l)),
        };
      });
      abs[id] = lv;
    });
    (xml.match(/<w:num w:numId="\d+"[\s\S]*?<\/w:num>/g) || []).forEach(function (n) {
      var id = /w:numId="(\d+)"/.exec(n)[1], a = (/<w:abstractNumId w:val="(\d+)"/.exec(n) || [])[1];
      if (abs[a]) out[id] = abs[a];
    });
    return out;
  }
  function roman(n) {
    var r = "", v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1], s = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"];
    for (var i = 0; i < v.length; i++) while (n >= v[i]) { r += s[i]; n -= v[i]; }
    return r;
  }
  function fmtNum(n, fmt) {
    if (fmt === "lowerRoman") return roman(n);
    if (fmt === "upperRoman") return roman(n).toUpperCase();
    if (fmt === "lowerLetter") return String.fromCharCode(96 + ((n - 1) % 26) + 1);
    if (fmt === "upperLetter") return String.fromCharCode(64 + ((n - 1) % 26) + 1);
    return String(n);
  }

  function parse(documentXml, register, numberingXml) {
    var NUMS = readNumbering(numberingXml), counters = {};
    var raw = register || root.RV_FINANCE_NOTES || [];
    // A register entry is either a title, or [title, ...alternative wordings]
    // for notes whose table in Word words the heading differently.
    var notes = raw.map(function (e) { return Array.isArray(e) ? e[0] : e; });
    var aliases = raw.map(function (e) {
      return (Array.isArray(e) ? e : [e]).map(normaliseTitle).filter(Boolean);
    });
    var normalised = notes.map(normaliseTitle);
    var nextNote = 0;
    var found = {};
    var bodyMatch = documentXml.match(/<w:body>([\s\S]*)<\/w:body>/);
    var body = bodyMatch ? bodyMatch[1] : documentXml;
    var chunks = topLevelChunks(body);

    var blocks = [];
    var tables = {};
    var unknownStyles = {};
    var currentNote = null;
    var perNote = {};
    var tableIndex = 0;

    chunks.forEach(function (c) {
      if (c.tag === "p") {
        // A large inline picture (a chart or diagram, not a headshot) is kept
        // in place as its own block; the caller fetches the image by rid.
        var pm = /<wp:inline\b[\s\S]*?<wp:extent cx="(\d+)" cy="(\d+)"[\s\S]*?<a:blip r:embed="([^"]+)"/.exec(c.xml);
        if (pm && +pm[1] / 12700 >= 300 && c.xml.indexOf("<w:txbxContent") < 0) {
          blocks.push({ k: "picture", rid: pm[3], w: Math.round(pm[1] / 127) / 100, h: Math.round(pm[2] / 127) / 100 });
        }
        // Text boxes: Word stores each twice (mc:Choice and an mc:Fallback copy)
        // and the paragraphs inside them are not top-level, so lift them out as
        // their own blocks and keep one copy.
        if (c.xml.indexOf("<w:txbxContent") > -1) {
          var cx = c.xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, "");
          var boxes = [];
          var outer = cx.replace(/<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/g, function (_, inner) {
            var paras = [];
            (inner.match(/<w:p(?:\s[^>]*?)?>[\s\S]*?<\/w:p>/g) || []).forEach(function (px) {
              var t = textOf(px).replace(/\t+/g, "\t").replace(/\n+/g, "\n").trim();
              if (t) paras.push({ text: t, bold: isBold(px) || undefined });
            });
            if (paras.length) boxes.push(paras);
            return "";
          });
          var ot = textOf(outer).trim();
          if (ot) blocks.push({ k: "body", text: ot });
          boxes.forEach(function (paras) { blocks.push({ k: "textbox", paras: paras }); });
          return;
        }
        var text = textOf(c.xml).replace(/\t+/g, "\t").trim();
        var st = (c.xml.match(/<w:pStyle\s+w:val="([^"]+)"\s*\/>/) || [, ""])[1];
        var kind = STYLE_MAP[st];
        if (kind === undefined) {
          unknownStyles[st] = (unknownStyles[st] || 0) + 1;
          kind = "body";
        }
        if (/<w:numPr>/.test(c.xml) && kind === "body") kind = "bullet";
        // Advance Word's list counters for every numbered paragraph, empty or
        // not, so markers stay in step with the document.
        var numInfo = null;
        var npm = /<w:numPr>([\s\S]*?)<\/w:numPr>/.exec(c.xml);
        if (npm) {
          var nid = (/<w:numId w:val="(\d+)"/.exec(npm[1]) || [])[1], nil = +(/<w:ilvl w:val="(\d+)"/.exec(npm[1]) || [, 0])[1];
          var def = nid && NUMS[nid] && NUMS[nid][nil];
          if (def) {
            var ct = counters[nid] || (counters[nid] = []);
            if (def.fmt !== "bullet" && def.fmt !== "none") {
              ct[nil] = ct[nil] == null ? def.start : ct[nil] + 1;
              for (var dl = nil + 1; dl < 9; dl++) ct[dl] = null;
              numInfo = { marker: def.text.replace(/%(\d)/g, function (_, d) {
                var L = +d - 1, ld = NUMS[nid][L] || def;
                return fmtNum(ct[L] == null ? ld.start : ct[L], ld.fmt);
              }), fmt: def.fmt, lvl: nil };
            } else {
              for (var dl2 = nil + 1; dl2 < 9; dl2++) ct[dl2] = null;
              numInfo = { tick: def.tick, lvl: nil };
            }
          }
        }
        if (!text) return;

        // Notes are matched in document order, looking only a short way
        // ahead, so a stray heading elsewhere in the document cannot claim a
        // note and notes cannot be picked up out of sequence.
        var canonical;
        if (kind !== "sectionHeading" && text.length < 90 && nextNote < notes.length) {
          var probe = normaliseTitle(text);
          for (var j = nextNote; j < Math.min(nextNote + 3, notes.length); j++) {
            if (aliases[j].some(function (a) { return probe === a || probe.indexOf(a) === 0; })) {
              canonical = notes[j];
              nextNote = j + 1;
              break;
            }
          }
        }
        if (canonical) {
          found[canonical] = true;
          var n = splitNoteTitle(text);
          currentNote = { slug: slugify(canonical), title: canonical, number: n.number };
          perNote[currentNote.slug] = 0;
          blocks.push({ k: "noteTitle", slug: currentNote.slug, number: n.number, text: canonical });
          return;
        }
        var b = { k: kind, text: text };
        if (kind === "bullet") {
          var lvl = c.xml.match(/<w:ilvl\s+w:val="(\d+)"\s*\/>/);
          if (lvl && +lvl[1] > 0) b.level = +lvl[1];
          if (numInfo && numInfo.marker) { b.marker = numInfo.marker; b.numFmt = numInfo.fmt; }
          if (numInfo && numInfo.tick) b.tick = true;
        }
        if (isBold(c.xml)) b.bold = true;
        if (isItalic(c.xml)) b.italic = true;
        blocks.push(b);
        return;
      }

      // table
      var rows = [], rowH = [];
      var rre = /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g;
      var rm;
      while ((rm = rre.exec(c.xml))) {
        rows.push(parseRow(rm[1]));
        var th = /<w:trHeight w:val="(\d+)"/.exec(rm[1]);
        rowH.push(th ? Math.round(+th[1]) / 20 : 0);
      }
      var gridCols = (c.xml.match(/<w:gridCol w:w="(\d+)"/g) || []).map(function (g) { return Math.round(+/(\d+)"/.exec(g)[1]) / 20; });
      if (!rows.length) return;

      tableIndex++;

      // A note's title is carried in its own table's opening rows — often
      // split across two cells ("3." | "Current Trade and Other Receivables")
      // — rather than in a heading above it, so the table opens the note.
      var cellText = function (c) { return typeof c === "string" ? c : c && c.t ? c.t : ""; };
      var lead = rows
        .slice(0, 4)
        .reduce(function (acc, r) { return acc.concat(r.map(cellText)); }, [])
        .join(" ");
      if (lead && nextNote < notes.length) {
        var lp = normaliseTitle(lead);
        for (var w = nextNote; w < Math.min(nextNote + 4, notes.length); w++) {
          if (normalised[w] && aliases[w].some(function (a) { return lp.indexOf(a) > -1; })) {
            found[notes[w]] = true;
            nextNote = w + 1;
            var num = null, nre = /(\d{1,2})\s*\.\s*/g, nm;
            while ((nm = nre.exec(lead))) { if (aliases[w].some(function (a) { return normaliseTitle(lead.slice(nm.index + nm[0].length)).indexOf(a) === 0; })) { num = nm[1]; break; } }
            currentNote = { slug: slugify(notes[w]), title: notes[w], number: num };
            perNote[currentNote.slug] = 0;
            blocks.push({ k: "noteTitle", slug: currentNote.slug, number: currentNote.number, text: notes[w] });
            break;
          }
        }
      }

      var key;
      if (currentNote) {
        perNote[currentNote.slug] += 1;
        key = currentNote.slug + (perNote[currentNote.slug] > 1 ? "--" + perNote[currentNote.slug] : "");
      } else {
        key = "front-" + String(tableIndex).padStart(2, "0");
      }
      while (tables[key]) key += "-x";

      var head = rows[0].every(function (c2) { return c2.b || !/\d/.test(c2.t); }) ? rows.shift() : null;
      if (head) rowH.shift();
      tables[key] = {
        note: currentNote ? currentNote.title : null,
        noteNumber: currentNote ? currentNote.number : null,
        order: tableIndex,
        cols: gridCols,
        rowH: rowH,
        headCells: head || null,
        head: head ? head.map(function (c2) { return c2.t; }) : null,
        rows: rows.map(function (r) {
          return r.map(function (c2) {
            return c2.b || c2.span || c2.sh || c2.al || c2.bt || c2.bb || c2.it ? { t: c2.t, b: c2.b, span: c2.span, sh: c2.sh, al: c2.al, bt: c2.bt, bb: c2.bb, it: c2.it } : c2.t;
          });
        }),
      };
      blocks.push({ k: "table", key: key });
    });

    return {
      blocks: blocks,
      tables: tables,
      unknownStyles: unknownStyles,
      missingNotes: notes.filter(function (t) { return !found[t]; }),
      counts: {
        blocks: blocks.length,
        tables: Object.keys(tables).length,
        notes: Object.keys(found).length,
      },
    };
  }

  function build(parsed, meta) {
    return {
      meta: Object.assign(
        {
          converter: "rv-finance-docx",
          converterVersion: VERSION,
          generated: new Date().toISOString(),
        },
        meta || {},
        parsed.counts
      ),
      blocks: parsed.blocks,
      tables: parsed.tables,
    };
  }

  /* ----------------------------------------------------------- validate -- */

  function widthOf(row) {
    return row.reduce(function (n, c) {
      return n + (c && c.span ? c.span : 1);
    }, 0);
  }

  function validate(content, previous, unknownStyles, missingNotes) {
    var errors = [];
    var warnings = [];
    (missingNotes || []).forEach(function (t) {
      warnings.push('Note "' + t + '" is in the register but not in this document, so it is left out.');
    });
    var info = [];

    var keys = Object.keys(content.tables);
    if (!keys.length) errors.push("No tables were found — check this is the Finance section docx.");
    if (!content.counts && !content.meta.notes) warnings.push("No numbered notes detected.");

    Object.keys(unknownStyles || {}).forEach(function (s) {
      warnings.push(
        'Unmapped Word style "' + (s || "(none)") + '" on ' + unknownStyles[s] +
        " paragraph(s) — treated as body copy."
      );
    });

    keys.forEach(function (k) {
      var t = content.tables[k];
      var widths = t.rows.map(widthOf);
      if (t.head) widths.unshift(t.head.length);
      var uniq = widths.filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (uniq.length > 1) {
        warnings.push(
          "Table " + k + " has ragged columns (" + uniq.join(", ") + ") — check merged cells."
        );
      }
      if (!t.rows.length) errors.push("Table " + k + " parsed with no data rows.");
      if (!t.head) info.push("Table " + k + " has no header row.");
    });

    if (previous && previous.tables) {
      var prevKeys = Object.keys(previous.tables);
      prevKeys.filter(function (k) { return !content.tables[k]; }).forEach(function (k) {
        errors.push("Table " + k + " existed last year and is missing now.");
      });
      keys.filter(function (k) { return !previous.tables[k]; }).forEach(function (k) {
        info.push("New table this year: " + k + ".");
      });
      keys.filter(function (k) { return previous.tables[k]; }).forEach(function (k) {
        var a = previous.tables[k];
        var b = content.tables[k];
        var aw = a.head ? a.head.length : (a.rows[0] ? widthOf(a.rows[0]) : 0);
        var bw = b.head ? b.head.length : (b.rows[0] ? widthOf(b.rows[0]) : 0);
        if (aw !== bw) {
          warnings.push("Table " + k + " changed column count " + aw + " \u2192 " + bw + ".");
        }
        if (a.rows.length !== b.rows.length) {
          info.push("Table " + k + " row count " + a.rows.length + " \u2192 " + b.rows.length + ".");
        }
      });
    }

    return { errors: errors, warnings: warnings, info: info };
  }

  root.RVFinanceConverter = {
    VERSION: VERSION,
    STYLE_MAP: STYLE_MAP,
    readDocx: readDocx,
    parse: parse,
    build: build,
    validate: validate,
    slugify: slugify,
  };
})(window);

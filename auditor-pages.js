/* Auditor pages (KPMG independence declaration + audit report).
 *
 * FY25 placed KPMG's PDF pages straight onto the RV ground: no white paper,
 * KPMG's own footer and page numbers cropped off, the type scaled so KPMG's
 * 8.92pt body sets at 9.48pt, and the text block aligned to fixed positions on
 * pp. 38-40. This file does the same for any year's signed PDF:
 *   - scale  = 9.48 / the PDF's body size
 *   - offset = the top-left of the page's text block lands on the FY25 spot
 *   - frame  = the FY25 frame, its foot raised to clear KPMG's footer
 *   - drawn at 300 dpi; white turned transparent so the ground shows through
 *   - an invisible text layer keeps the pages searchable and selectable
 *
 * The Production Console stores the PDF in IndexedDB (store); the report
 * reads it back (pages). The FY26 preview reads ./data/fy26-auditor.pdf.
 */
(function (root) {
  "use strict";
  var PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/";
  var BODY = 9.48, DPI = 300, SPREAD_H = 841.89;
  // Measured off RV ANNUAL REPORT 2025_FINAL_DPS.pdf (spread pt, from top-left).
  // x/base: left edge and first baseline of the text block. foot: lowest the frame may reach.
  var SLOTS = [
    { page: 38, l: 10.3,   t: 56.69, r: 538.58,  x: 53.54,  base: 175.46, foot: 760 },
    { page: 39, l: 634.73, t: 35.63, r: 1129.52, x: 665.60, base: 173.86, foot: 790 },
    { page: 40, l: 39.66,  t: 43.74, r: 531.58,  x: 69.24,  base: 142.09, foot: 790 },
  ];

  var lib;
  function pdfjs() {
    if (!lib) lib = import(PDFJS + "pdf.min.mjs").then(function (m) { m.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs"; return m; });
    return lib;
  }

  /* ---------------------------------------------------------- storage -- */
  function db() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open("rv-production", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { no(r.error); };
    });
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (ok, no) {
        var t = d.transaction("files", mode), req = fn(t.objectStore("files"));
        t.oncomplete = function () { ok(req && req.result); };
        t.onerror = function () { no(t.error); };
      });
    });
  }
  async function store(file) {
    var stamp = Date.now() + "-" + file.size;
    var bytes = await file.arrayBuffer();
    await tx("readwrite", function (s) { return s.put({ stamp: stamp, name: file.name, bytes: bytes }, "auditor"); });
    return stamp;
  }
  async function source(kp) {
    kp = kp || {};
    if (kp.pdf === "idb") {
      var rec = await tx("readonly", function (s) { return s.get("auditor"); });
      if (!rec || (kp.stamp && rec.stamp !== kp.stamp)) return null;
      return new Uint8Array(rec.bytes);
    }
    if (kp.pdf) {
      var res = await fetch(kp.pdf);
      if (!res.ok) throw new Error(kp.pdf + " " + res.status);
      return new Uint8Array(await res.arrayBuffer());
    }
    return null;
  }

  /* ---------------------------------------------------------- measure -- */
  function items(tc) {
    return tc.items.filter(function (i) { return i.str && i.str.trim(); }).map(function (i) {
      return { s: i.str, fs: Math.hypot(i.transform[0], i.transform[1]), x: i.transform[4], y: i.transform[5], w: i.width };
    });
  }
  function bodySize(list) {
    var c = {};
    list.forEach(function (i) { var k = i.fs.toFixed(2); c[k] = (c[k] || 0) + i.s.length; });
    return +Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
  }
  // Placement of one PDF page into one FY25 slot.
  function place(slot, list, view) {
    var body = bodySize(list);
    var low = view[1] + (view[3] - view[1]) * 0.18; // KPMG's footer and page number live in the bottom ~18%
    var isFoot = function (i) { return i.y < low && (i.fs < 0.9 * body || /^\d+$/.test(i.s.trim())); };
    var main = list.filter(function (i) { return !isFoot(i) && i.fs >= 0.6 * body; });
    var foot = list.filter(isFoot);
    var s = BODY / body;
    var x0 = Math.min.apply(null, main.map(function (i) { return i.x; }));
    var y0 = Math.max.apply(null, main.map(function (i) { return i.y; }));
    var a = slot.x - s * x0;                  // spread x = a + s * pdf x
    var b = SPREAD_H - slot.base - s * y0;    // spread y (from bottom) = b + s * pdf y
    var top = function (y) { return SPREAD_H - (b + s * y); };
    var footTop = foot.length ? Math.min.apply(null, foot.map(function (i) { return top(i.y + i.fs * 0.75); })) : Infinity;
    var bodyBottom = Math.max.apply(null, main.map(function (i) { return top(i.y) + i.fs * s * 0.25; }));
    var frameT = Math.max(slot.t, top(view[3]));
    var frameB = Math.min(slot.foot, footTop - 6);
    var lines = foot.filter(function (i) { return i.fs < 0.9 * body; }).sort(function (p, q) { return q.y - p.y; }).map(function (i) { return i.s.trim(); });
    return {
      scale: s, body: body, a: a, b: b, top: top,
      frame: { l: slot.l, t: frameT, w: slot.r - slot.l, h: frameB - frameT },
      overflow: bodyBottom > frameB ? bodyBottom - frameB : 0,
      footer: lines.join(" "),
    };
  }

  async function open(bytes) {
    var m = await pdfjs();
    return m.getDocument({ data: bytes, isEvalSupported: false }).promise;
  }

  // Text-only pass for the Production Console: page count, sizes, fit.
  async function check(bytes) {
    var doc = await open(bytes.slice ? bytes.slice(0) : bytes);
    var out = { pages: doc.numPages, placed: [] };
    for (var k = 0; k < Math.min(3, doc.numPages); k++) {
      var p = await doc.getPage(k + 1);
      var pl = place(SLOTS[k], items(await p.getTextContent()), p.view);
      out.placed.push({ page: SLOTS[k].page, body: pl.body, scale: pl.scale, overflow: pl.overflow });
    }
    return out;
  }

  /* ------------------------------------------------------------- draw -- */
  // White -> transparent, keeping colours as they looked on white paper.
  function unwhite(ctx, w, h) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], bl = d[i + 2], mn = r < g ? (r < bl ? r : bl) : (g < bl ? g : bl);
      if (mn === 255) { d[i + 3] = 0; continue; }
      var al = 255 - mn, f = 255 / al;
      d[i] = (r - mn) * f; d[i + 1] = (g - mn) * f; d[i + 2] = (bl - mn) * f; d[i + 3] = al;
    }
    ctx.putImageData(img, 0, 0);
  }

  var meas;
  function textWidth(str, fsPt) {
    meas = meas || document.createElement("canvas").getContext("2d");
    meas.font = "400 " + fsPt + "pt Gotham";
    return meas.measureText(str).width * 0.75;
  }

  async function draw(page, slot) {
    var list = items(await page.getTextContent());
    var pl = place(slot, list, page.view);
    var k = DPI / 72, fr = pl.frame;
    var W = Math.round(fr.w * k), H = Math.round(fr.h * k);
    var vp = page.getViewport({
      scale: pl.scale * k,
      offsetX: (pl.a - fr.l) * k + page.view[0] * pl.scale * k,
      offsetY: (SPREAD_H - pl.b - pl.scale * page.view[3] - fr.t) * k,
    });
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    await page.render({ canvasContext: ctx, viewport: vp, intent: "print" }).promise;
    unwhite(ctx, W, H);
    var blob = await new Promise(function (ok) { c.toBlob(ok, "image/png"); });
    var text = [];
    list.forEach(function (i) {
      var fs = i.fs * pl.scale, base = pl.top(i.y) - fr.t, left = pl.a + pl.scale * i.x - fr.l;
      if (base < 0 || base - fs > fr.h || left > fr.w) return;
      var nat = textWidth(i.s, fs), want = i.w * pl.scale;
      text.push({ s: i.s, l: left.toFixed(2) + "pt", t: (base - fs * 0.8).toFixed(2) + "pt", fs: fs.toFixed(2) + "pt", sx: nat > 0 && want > 0 ? (want / nat).toFixed(4) : "1" });
    });
    return {
      src: URL.createObjectURL(blob),
      l: fr.l + "pt", t: fr.t.toFixed(2) + "pt", w: fr.w.toFixed(2) + "pt", h: fr.h.toFixed(2) + "pt",
      text: text, footer: pl.footer, overflow: pl.overflow,
    };
  }

  // Pages 1-3 placed for pp. 38, 39 and 40; null when there is no PDF.
  async function pages(kp) {
    var bytes = await source(kp);
    if (!bytes) return null;
    if (document.fonts) await document.fonts.load('400 9pt "Gotham"').catch(function () {});
    var doc = await open(bytes);
    var out = [];
    for (var k = 0; k < Math.min(3, doc.numPages); k++) out.push(await draw(await doc.getPage(k + 1), SLOTS[k]));
    out.forEach(function (p, k) { if (p.overflow > 0) console.warn("Auditor page " + (k + 1) + ": text runs " + p.overflow.toFixed(1) + "pt into KPMG\u2019s footer zone and is cropped."); });
    return { pages: out, footer: out[0] ? out[0].footer : "" };
  }

  root.RVAuditor = { store: store, check: check, pages: pages, SLOTS: SLOTS };
})(window);

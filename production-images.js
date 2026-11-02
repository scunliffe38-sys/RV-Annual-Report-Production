/* Production images — every image and signature the report places, and the
 * store that holds the files the producer supplies for them.
 *
 * `groups` is the register. One group is one file: a group lists every slot it
 * fills, so a headshot or signature used in several places is supplied once.
 * Slot ids must match the <image-slot id="…"> in the section templates; w/h
 * are the printed size in points (used for the resolution check).
 * When the board, Chair or CEO changes, update the names here and the matching
 * slot ids in Financial Report.dc.html together.
 *
 * Files are kept in this browser's IndexedDB (they never leave the computer)
 * and are placed into the slots by apply() in the print view.
 */
(function (root) {
  "use strict";
  var DB = "rv-annual-report-images", STORE = "images";
  var ACCEPT = /\.(jpe?g|png|svg|webp)$/i;

  function use(section, slot, where, w, h, fit, shape) {
    return { section: section, slot: slot, where: where, w: w, h: h || w, fit: fit || "cover", shape: shape || "circle" };
  }
  function slug(n) { return String(n).replace(/\s+OAM$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function sig(name, role, uses) {
    return { id: "sig-" + slug(name), kind: "signature", label: name, role: role, file: "Signature - " + name, uses: uses };
  }
  function director(n, p, extra) {
    return { id: "head-" + slug(p.name), kind: "headshot", label: p.name, role: p.role || "Director",
      file: "Headshot - " + p.name.replace(/\s+OAM$/i, ""),
      uses: (extra || []).concat([use("finance", "dir-" + n, "board list", 109.91)]) };
  }
  function photo(file, section, slot, where, w, hint, h, shape) {
    return { id: "photo-" + slot, kind: "photo", label: file.replace(/^Photo - /, ""), file: file, hint: hint,
      uses: [use(section, slot, where, w, h, "cover", shape)] };
  }
  function logo(id, label, uses, reversed, hint) {
    return { id: id, kind: "logo", label: label, file: "Logo - " + label, uses: uses, reversed: reversed, hint: hint };
  }

  var fixed = [
    photo("Photo - Cover", "cover", "cover-hero", "front cover", 612.5, "JMac / Via Sistina, Cox Plate", 626.25, "rect"),
    photo("Photo - Contents", "contents", "contents-hero", "large circle", 1034.2, "Robbie Dolan, Melbourne Cup"),
    photo("Photo - VR Awards 1", "awards", "vra-blake-shinn", "winner 1", 154.7, "Blake Shinn"),
    photo("Photo - VR Awards 2", "awards", "vra-jen-duffy", "winner 2", 162.4, "Jennifer Duffy"),
    photo("Photo - VR Awards 3", "awards", "vra-matt-laurie", "winner 3", 151.1, "Matt Laurie"),
    photo("Photo - VR Awards 4", "awards", "vra-gavin-bedggood", "winner 4", 159.4, "Gavin Bedggood"),
    photo("Photo - VR Awards 5", "awards", "vra-logan-bates", "winner 5", 141.3, "Logan Bates"),
    photo("Photo - VR Awards 6", "awards", "vra-ciaron-maher", "winner 6", 169.2, "Ciaron Maher"),
    photo("Photo - VR Awards 7", "awards", "vra-team-hayes", "winner 7", 152.4, "Team Hayes"),
    photo("R&P - 1", "racing", "rp-image-left", "left circle", 357.2, "All-Star Mile \u2014 Ben Melham"),
    photo("R&P - 2", "racing", "rp-image-top", "top-right circle", 318.5, "Pride Of Jenni"),
    photo("R&P - 3", "racing", "rp-image-right", "bottom circle", 357.2, "Nadal Meteorite"),
    photo("Photo - Owners & Breeders", "owners", "obi-image-left", "left circle", 348.9, "VOBIS Owners Bonus \u2014 McGaw"),
    photo("Photo - Infrastructure", "owners", "obi-image-right", "right circle", 513.3, "Pakenham lights"),
    photo("Photo - Workforce 1", "workforce", "wf-image-trackwork", "left circle", 382.9, "Warrnambool trackwork"),
    photo("Photo - Workforce 2", "workforce", "wf-image-strapper", "top-right circle", 352.3, "Mr Brightside strapper"),
    photo("Photo - Workforce 3", "workforce", "wf-image-apprentices", "bottom-right circle", 459, "Apprentice Jockey Squad intake"),
    photo("Photo - Integrity 1", "integrity", "int-image-services", "top-right circle", 464.2, "Integrity Services"),
    photo("Photo - Integrity 2", "integrity", "int-image-additional", "bottom-left circle", 333, "additional photo"),
    photo("Photo - Equine Welfare 1", "welfare", "ew-image-rehomer", "first circle", 309.6, "Jen Duffy \u2014 Rehomer launch"),
    photo("Photo - Equine Welfare 2", "welfare", "ew-image-ott", "second circle", 461.8, "Off The Track"),
    photo("Photo - Wagering", "wagering", "wg-image-manikato", "right circle", 409.4, "Manikato Stakes"),
    photo("Photo - Media 1", "media", "md-image-studio", "left circle", 347.24, "Racing.com studio"),
    photo("Photo - Media 2", "media", "md-image-broadcast", "top-right circle", 406.71, "Broadcast / Melbourne Cup Carnival"),
    photo("Photo - Industry & Community", "industry", "ics-image-wellbeing", "left circle", 345.83, "Participants / community"),
    photo("Photo - Financial Report divider", "finance", "fin-divider-photo", "divider page", 595.28, "Financial statements divider", 841.89),

    logo("logo-rv", "RV", [
      use("cover", "cover-rv-logo", "front cover", 187.4, 67.2, "contain", "rect"),
      use("contents", "contents-rv-logo", "contents page", 149.9, 53.8, "contain", "rect"),
    ]),
    logo("logo-rv-reversed", "RV reversed", [use("back", "back-rv-logo", "back cover", 152.1, 60.5, "contain", "rect")], "#005FA1", "white version"),
    logo("logo-vra", "VR Awards", [use("awards", "vra-logo", "awards page", 182.8, 113.9, "contain", "rect")], "#000000", "white version, FY25 used VRA24"),
  ];
  [["bm-crv", "Country Racing Victoria"], ["bm-mrc", "Melbourne Racing Club"], ["bm-mvrc", "Moonee Valley Racing Club"],
   ["bm-vrc", "Victoria Racing Club"], ["bm-cprc", "Cranbourne Pakenham Racing Club"]].forEach(function (c) {
    fixed.push(logo("logo-" + c[0], c[1], [use("back", c[0], "back cover, clubs", 88, 58, "contain", "rect")], "#005FA1", "white version"));
  });
  [["bm-ajra", "Australian Jumping Racing Association"], ["bm-asu", "Australian Services Union (Victorian Branch)"],
   ["bm-ata", "Australian Trainers Association"], ["bm-awu", "Australian Workers Union (Victoria)"],
   ["bm-meaa", "Media, Entertainment & Arts Alliance"], ["bm-tbv", "Thoroughbred Breeders Victoria"],
   ["bm-troa", "Thoroughbred Racehorse Owners Association"], ["bm-uwu", "United Workers Union"],
   ["bm-vba", "Victorian Bookmakers Association"], ["bm-vja", "Victorian Jockeys Association"]].forEach(function (b) {
    fixed.push(logo("logo-" + b[0], b[1], [use("back", b[0], "back cover, industry bodies", 88, 52, "contain", "rect")], "#005FA1", "white version"));
  });

  // The board: names and order come from the Finance document\u2019s Current Directors.
  // Director n fills frame dir-n on the Directors\u2019 Report spread (FRAMES frames).
  var FRAMES = 12, PKEY = "rv-image-people";
  var DEFAULT_PEOPLE = [
    { name: "Tim Eddy", role: "Chair" }, { name: "Sharon McCrohan", role: "Deputy Chair" }, { name: "Aaron Morrison", role: "CEO" },
    { name: "Kate Joel" }, { name: "Ross Lanyon OAM" }, { name: "Paul Guerra" }, { name: "Mark Player" }, { name: "Tim Rourke" },
  ];
  var isChair = function (r) { return /^chair(man|person)?$/i.test(r || ""); };
  var isCeo = function (r) { return /^ceo$|chief executive/i.test(r || ""); };
  var people = { source: "default", list: DEFAULT_PEOPLE };
  try { var saved = JSON.parse(root.localStorage.getItem(PKEY)); if (saved && saved.list && saved.list.length) people = saved; } catch (e) {}

  var groups = [];
  var kinds = [
    { id: "signature", title: "Signatures", note: "PNG with a transparent background, or a high-resolution scan on white." },
    { id: "headshot", title: "Headshots", note: "Placed in circles. A square crop with the face centred works best." },
    { id: "photo", title: "Photographs", note: "Placed in circles unless noted, filling the frame. Aim for 300 ppi at the printed size." },
    { id: "logo", title: "Logos", note: "SVG, AI, EPS, PDF, PSD, or PNG with a transparent background. Back-cover and awards logos print on colour, so supply the white version." },
  ];

  function rebuild() {
    var list = people.list, chair = null, ceo = null, out = [];
    list.forEach(function (p) { if (!chair && isChair(p.role)) chair = p; if (!ceo && isCeo(p.role)) ceo = p; });
    if (chair) out.push(sig(chair.name, "Chair", [
      use("chair", "chair-signature", "sign-off", 55.5, 49.1, "contain", "rect"),
      use("finance", "sig-chair-fin", "Directors\u2019 Report and Directors\u2019 Declaration", 55.54, 49.1, "contain", "rect")]));
    if (ceo) out.push(sig(ceo.name, "CEO", [
      use("ceo", "ceo-signature", "sign-off", 117.8, 54.8, "contain", "rect"),
      use("finance", "sig-ceo-fin", "Directors\u2019 Report and Directors\u2019 Declaration", 104.44, 48.63, "contain", "rect")]));
    list.forEach(function (p, i) {
      var extra = [];
      if (p === chair) extra.push(use("chair", "chair-portrait", "portrait", 177.3));
      if (p === ceo) extra.push(use("ceo", "ceo-portrait", "portrait", 177.3));
      out.push(director(i + 1, p, extra));
    });
    groups.length = 0;
    out.concat(fixed).forEach(function (x) { groups.push(x); });
    kinds[1].note = (people.source === "finance" ? "Names and order are read from the Finance document\u2019s Current Directors. " : "Showing last year\u2019s board until the Finance document is checked. ") + "Placed in circles. A square crop with the face centred works best.";
    kinds[0].note = "Chair and CEO, from the Finance document. " + "PNG with a transparent background, or a high-resolution scan on white.";
  }
  rebuild();

  // IndexedDB
  var dbp = null;
  function db() {
    if (!dbp && root.navigator && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    if (!dbp) dbp = new Promise(function (res, rej) {
      var r = root.indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { dbp = null; rej(r.error); };
    });
    return dbp;
  }
  function write(fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(STORE, "readwrite");
        fn(t.objectStore(STORE));
        t.oncomplete = function () { res(); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }

  // Signatures were once stored as sig-chair / sig-ceo.
  function legacy(out) {
    var m = { "sig-chair": "sig-tim-eddy", "sig-ceo": "sig-aaron-morrison" };
    Object.keys(m).forEach(function (k) { if (out[k] && !out[m[k]]) out[m[k]] = out[k]; });
  }
  function isSvg(file) { return /svg/.test(file.type) || /\.svg$/i.test(file.name); }
  function measure(file) {
    if (isSvg(file)) return Promise.resolve({ vector: true });
    return root.createImageBitmap(file).then(function (b) {
      var d = { width: b.width, height: b.height };
      if (b.close) b.close();
      return d;
    });
  }

  // Logos supplied as Illustrator, PDF or Photoshop files are drawn to a
  // transparent PNG at 600 ppi of the largest placement, trimmed to the artwork.
  var LOGO_SRC = /\.(ai|pdf|psd|eps)$/i, LOGO_PPI = 600;
  var GS = "https://cdn.jsdelivr.net/npm/@jspawn/ghostscript-wasm@0.0.2/", gsLib;
  var PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/";
  var pdfLib, psdLib;
  function logoPx(g) {
    var pt = 0;
    g.uses.forEach(function (u) { pt = Math.max(pt, u.w, u.h); });
    return Math.max(2000, Math.round(pt / 72 * LOGO_PPI));
  }
  function trim(c) {
    var x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height).data;
    var l = c.width, t = c.height, r = -1, b = -1;
    for (var y = 0; y < c.height; y++) for (var i = 0; i < c.width; i++) {
      if (d[(y * c.width + i) * 4 + 3] > 8) { if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y; }
    }
    if (r < 0) throw new Error("the file has no visible artwork.");
    var pad = Math.round(Math.max(r - l, b - t) * 0.01);
    l = Math.max(0, l - pad); t = Math.max(0, t - pad); r = Math.min(c.width - 1, r + pad); b = Math.min(c.height - 1, b + pad);
    var o = document.createElement("canvas");
    o.width = r - l + 1; o.height = b - t + 1;
    o.getContext("2d").drawImage(c, l, t, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }
  function opaque(c) {
    var d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    for (var i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) return false;
    return true;
  }
  // EPS: Ghostscript (WASM, ~15 MB, loaded on first use) rewrites it as a
  // vector PDF cropped to the bounding box, which pdf.js then draws.
  async function epsToPdf(file) {
    if (!gsLib) gsLib = import(GS + "gs.mjs");
    var init = (await gsLib.catch(function () { gsLib = null; throw new Error("the EPS reader could not load (needs internet)."); })).default;
    var gs = await init({ locateFile: function (f) { return GS + f; }, print: function () {}, printErr: function () {} });
    gs.FS.writeFile("in.eps", new Uint8Array(await file.arrayBuffer()));
    var code = gs.callMain(["-dSAFE", "-dBATCH", "-dNOPAUSE", "-dQUIET", "-dEPSCrop", "-sDEVICE=pdfwrite", "-sOutputFile=out.pdf", "in.eps"]);
    var out;
    try { out = gs.FS.readFile("out.pdf"); } catch (e) { out = null; }
    if (code || !out || out.length < 200) throw new Error("this EPS file could not be converted. Ask for an SVG, PDF or PNG.");
    return new File([out], file.name.replace(/\.eps$/i, ".pdf"), { type: "application/pdf" });
  }
  async function fromPdf(file, px) {
    if (/\.eps$/i.test(file.name)) file = await epsToPdf(file);
    var bytes = new Uint8Array(await file.arrayBuffer());
    var head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
    if (head.indexOf("%PDF-") < 0) {
      throw new Error("this Illustrator file was saved without PDF compatibility. Re-save it from Illustrator with \u201cCreate PDF Compatible File\u201d ticked, or export an SVG.");
    }
    if (!pdfLib) pdfLib = import(PDFJS + "pdf.min.mjs").then(function (m) { m.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs"; return m; });
    var m = await pdfLib.catch(function () { pdfLib = null; throw new Error("the PDF reader could not load (needs internet)."); });
    var doc = await m.getDocument({ data: bytes, isEvalSupported: false }).promise;
    var page = await doc.getPage(1), v1 = page.getViewport({ scale: 1 });
    var vp = page.getViewport({ scale: Math.min(px / Math.max(v1.width, v1.height), 8000 / Math.max(v1.width, v1.height)) });
    var c = document.createElement("canvas");
    c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp, background: "rgba(0,0,0,0)" }).promise;
    doc.destroy();
    return c;
  }
  async function fromPsd(file) {
    if (!psdLib) psdLib = import("https://esm.sh/ag-psd@20.2.1");
    var m = await psdLib.catch(function () { psdLib = null; throw new Error("the Photoshop reader could not load (needs internet)."); });
    var psd = m.readPsd(await file.arrayBuffer(), { skipLayerImageData: true, skipThumbnail: true });
    if (!psd.canvas) throw new Error("this Photoshop file has no flattened image. Re-save it with \u201cMaximize Compatibility\u201d on, or export a PNG.");
    return psd.canvas;
  }
  async function convertLogo(g, file) {
    var c = /\.psd$/i.test(file.name) ? await fromPsd(file) : await fromPdf(file, logoPx(g));
    var flat = opaque(c);
    c = trim(c);
    var blob = await new Promise(function (res) { c.toBlob(res, "image/png"); });
    var out = new File([blob], file.name.replace(/\.[a-z0-9]+$/i, ".png"), { type: "image/png" });
    return { file: out, from: file.name, flat: flat };
  }
  function norm(s) {
    return String(s).replace(/\.[a-z0-9]+$/i, "").replace(/^FY\d{2}\s+/i, "").replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  }

  // Headshot framing (FY25 p.15): face centred, eye line 41% down, eye-to-chin
  // 24% of the circle (ec values tuned so crown-to-chin reads ~58% on all). Landmarks per photo as fractions of the source
  // (a = width/height, cx = face centre x / width, ey = eye line / height,
  // ec = eye-to-chin / height). The supplied file is normalised to a square
  // master at print resolution, background edge-extended where it runs out.
  var EYE_CHIN = 0.24, EYE_Y = 0.41;
  var FACES = {
    "tim-eddy": { a: 1.4971, cx: 0.5117, ey: 0.3567, ec: 0.1249 },
    "tim-rourke": { a: 1.4971, cx: 0.5117, ey: 0.3392, ec: 0.1134 },
    "aaron-morrison": { a: 1.4971, cx: 0.5742, ey: 0.3392, ec: 0.1240 },
    "kate-joel": { a: 1.4971, cx: 0.4531, ey: 0.3041, ec: 0.1465 },
    "ross-lanyon": { a: 1.4971, cx: 0.4688, ey: 0.386, ec: 0.2194 },
    "paul-guerra": { a: 1.4971, cx: 0.5313, ey: 0.3275, ec: 0.1300 },
    "mark-player": { a: 1.4971, cx: 0.5078, ey: 0.345, ec: 0.1125 },
    "peita-duncan": { a: 0.832, cx: 0.5023, ey: 0.2852, ec: 0.1568 },
    "jonathan-hardwick": { a: 1, cx: 0.5469, ey: 0.4414, ec: 0.2503 },
  };
  var CHIN_Y = EYE_Y + EYE_CHIN, MOUTH_K = 1.27; // calibrated on the FY26 headshots against FACES
  function find(id) { for (var i = 0; i < groups.length; i++) if (groups[i].id === id) return groups[i]; return null; }
  function isCover(u) { return u.fit === "cover"; }
  function aspect(g) { var c = g.uses.filter(isCover); return c.length ? c[0].w / c[0].h : 0; }
  // A crop is the visible window in source fractions: l = left / width,
  // t = top / height, w = window width / width (window height follows from
  // the frame's aspect). It may run past the image; the render edge-extends.
  function centred(iw, ih, A) {
    if (iw / ih > A) { var w = ih * A / iw; return { l: (1 - w) / 2, t: 0, w: w }; }
    return { l: 0, t: (1 - iw / A / ih) / 2, w: 1 };
  }
  function fromFace(iw, ih, f) {
    var D = f.ec * ih / EYE_CHIN, w = D / iw;
    return { l: f.cx - w / 2, t: (f.ey * ih - EYE_Y * D) / ih, w: w };
  }

  // Face finder (MediaPipe, loaded from jsDelivr on first use; needs internet).
  var MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14", detp = null;
  function detector() {
    if (!detp) detp = import(MP + "/vision_bundle.mjs").then(function (v) {
      return v.FilesetResolver.forVisionTasks(MP + "/wasm").then(function (fs) {
        return v.FaceDetector.createFromOptions(fs, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" },
          runningMode: "IMAGE", minDetectionConfidence: 0.4 });
      });
    }).catch(function (e) { detp = null; throw e; });
    return detp;
  }
  // Eye line and face centre from the eye keypoints; eye-to-chin estimated
  // from eye-to-mouth (MOUTH_K). All as fractions of the source.
  function detect(blob) {
    return Promise.all([detector(), root.createImageBitmap(blob)]).then(function (r) {
      var det = r[0], bm = r[1], sc = Math.min(1, 1024 / Math.max(bm.width, bm.height));
      var c = root.document.createElement("canvas");
      c.width = Math.round(bm.width * sc); c.height = Math.round(bm.height * sc);
      c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
      if (bm.close) bm.close();
      var ds = (det.detect(c).detections || []).filter(function (d) { return d.keypoints && d.keypoints.length >= 4; });
      if (!ds.length) return null;
      ds.sort(function (p, q) { return q.boundingBox.width * q.boundingBox.height - p.boundingBox.width * p.boundingBox.height; });
      var k = ds[0].keypoints, ey = (k[0].y + k[1].y) / 2;
      return { cx: (k[0].x + k[1].x) / 2, ey: ey, mouth: k[3].y - ey, ec: (k[3].y - ey) * MOUTH_K };
    });
  }
  function tag(c, src) { c.src = src; return c; }
  // Default framing. Photos: centred. Headshots: the face finder, then the
  // FY25 rule; the hand-measured FACES landmarks win when the finder agrees
  // it is the same photo (same shape, eyes within 2.5%).
  function defaultCrop(g, rec) {
    var A = aspect(g), iw = rec.width, ih = rec.height;
    if (!A || !iw || rec.vector) return Promise.resolve(null);
    if (g.kind !== "headshot") return Promise.resolve(tag(centred(iw, ih, A), "centre"));
    var f = FACES[g.id.replace(/^head-/, "")];
    if (f && Math.abs(iw / ih - f.a) / f.a > 0.03) f = null;
    return detect(rec.blob).then(function (d) {
      if (!d || !(d.ec > 0)) return f ? tag(fromFace(iw, ih, f), "fy25") : tag(centred(iw, ih, A), "noface");
      if (f && Math.abs(d.cx - f.cx) < 0.025 && Math.abs(d.ey - f.ey) < 0.025) return tag(fromFace(iw, ih, f), "fy25");
      return tag(fromFace(iw, ih, d), "face");
    }).catch(function () { return f ? tag(fromFace(iw, ih, f), "fy25") : tag(centred(iw, ih, A), "nodetect"); });
  }

  // Cut the framed window out at print resolution, edge-extending the
  // background where the window runs past the photo.
  function render(blob, crop, A, outW, q) {
    return root.createImageBitmap(blob).then(function (bm) {
      var iw = bm.width, ih = bm.height, O = Math.round(outW), Oh = Math.round(outW / A);
      var k = O / (crop.w * iw), W = iw * k, H = ih * k, dx = -crop.l * iw * k, dy = -crop.t * ih * k;
      var c = root.document.createElement("canvas"); c.width = O; c.height = Oh;
      var x = c.getContext("2d"); x.imageSmoothingQuality = "high";
      var t = Math.max(0, dy), b = Math.max(0, Oh - dy - H), l = Math.max(0, dx), r = Math.max(0, O - dx - W);
      if (t) x.drawImage(bm, 0, 0, iw, 1, dx, 0, W, t);
      if (b) x.drawImage(bm, 0, ih - 1, iw, 1, dx, dy + H, W, b);
      if (l) x.drawImage(bm, 0, 0, 1, ih, 0, dy, l, H);
      if (r) x.drawImage(bm, iw - 1, 0, 1, ih, dx + W, dy, r, H);
      if (t && l) x.drawImage(bm, 0, 0, 1, 1, 0, 0, l, t);
      if (t && r) x.drawImage(bm, iw - 1, 0, 1, 1, dx + W, 0, r, t);
      if (b && l) x.drawImage(bm, 0, ih - 1, 1, 1, 0, dy + H, l, b);
      if (b && r) x.drawImage(bm, iw - 1, ih - 1, 1, 1, dx + W, dy + H, r, b);
      x.drawImage(bm, dx, dy, W, H);
      if (bm.close) bm.close();
      return new Promise(function (res) { c.toBlob(res, "image/jpeg", q || 0.95); });
    }).catch(function () { return null; });
  }
  function getRec(id) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var r = d.transaction(STORE).objectStore(STORE).get(id);
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
    });
  }

  // Slot id -> object URL for everything placed on the page this session.
  var placed = {}, watching = false;
  function place() {
    root.document.querySelectorAll("image-slot").forEach(function (el) {
      var u = placed[el.id];
      if (u && el.getAttribute("src") !== u) { el.setAttribute("prefer-src", ""); el.setAttribute("src", u); }
    });
  }
  // A group's file cut to its framing at print resolution, per slot.
  function slotUrls(g, r) {
    var urls = {}, u = URL.createObjectURL(r.blob);
    g.uses.forEach(function (x) { urls[x.slot] = u; });
    var A = aspect(g);
    if (!A || r.vector || !r.width) return Promise.resolve(urls);
    var crop = r.crop || centred(r.width, r.height, A);
    // Proof runs (?proof) cut at 150 ppi, JPEG 80%, for a PDF small enough to share.
    var PPI = root.RV_PROOF ? 150 : 300;
    var need = Math.min(4000, Math.max.apply(null, g.uses.filter(isCover).map(function (x) { return x.w / 72 * PPI * 1.15; })));
    var outW = Math.max(Math.min(crop.w * r.width, need), Math.min(need, 400));
    return render(r.blob, crop, A, outW, root.RV_PROOF ? 0.8 : 0.95).then(function (m) {
      if (!m) { console.warn("Framing failed, placed as supplied: " + g.label); return urls; }
      var mu = URL.createObjectURL(m);
      g.uses.forEach(function (x) { if (isCover(x)) urls[x.slot] = mu; });
      return urls;
    });
  }

  var api = {
    groups: groups,
    frames: FRAMES,
    people: function () { return people; },
    setPeople: function (list, source) {
      people = { source: source || "finance", list: list };
      try { root.localStorage.setItem(PKEY, JSON.stringify(people)); } catch (e) {}
      rebuild();
    },
    kinds: kinds,
    accept: ".jpg,.jpeg,.png,.svg,.webp,.ai,.eps,.pdf,.psd",

    all: function () {
      return db().then(function (d) {
        return new Promise(function (res, rej) {
          var out = {};
          var r = d.transaction(STORE).objectStore(STORE).openCursor();
          r.onsuccess = function () { var c = r.result; if (c) { out[c.key] = c.value; c.continue(); } else { legacy(out); res(out); } };
          r.onerror = function () { rej(r.error); };
        });
      });
    },

    put: function (id, file) {
      var g0 = find(id), isLogo = g0 && g0.kind === "logo";
      if (LOGO_SRC.test(file.name) && !isLogo) {
        return Promise.reject(new Error("this file type can\u2019t be placed here. Save it as JPG or PNG."));
      }
      if (/\.(tiff?|heic)$/i.test(file.name)) {
        return Promise.reject(new Error("this file type can\u2019t be placed. Save it as JPG or PNG (logos: SVG or PNG)."));
      }
      if (!ACCEPT.test(file.name) && !LOGO_SRC.test(file.name)) return Promise.reject(new Error("not an image file. Use JPG, PNG, SVG or WebP (logos also AI, EPS, PDF or PSD)."));
      var original = file, conv = LOGO_SRC.test(file.name)
        ? convertLogo(g0, file).catch(function (e) { throw e instanceof Error && !/^[A-Z]/.test(e.message) ? e : new Error("the file could not be read (" + (e && e.message || e) + ")."); })
        : Promise.resolve(null);
      return conv.then(function (cv) {
        if (cv) file = cv.file;
        return measure(file).catch(function () { throw new Error("the file could not be opened as an image."); }).then(function (d) { return [d, cv]; });
      }).then(function (dc) {
        var d = dc[0], cv = dc[1];
        var rec = { blob: file, name: original.name, size: original.size, type: file.type, width: d.width || 0, height: d.height || 0, vector: !!d.vector, added: new Date().toISOString() };
        if (cv) { rec.convertedFrom = original.name.split(".").pop().toUpperCase(); if (cv.flat) rec.flat = true; }
        var g = find(id);
        return (g ? defaultCrop(g, rec) : Promise.resolve(null)).then(function (c) {
          if (c) rec.crop = c;
          return write(function (s) { s.put(rec, id); });
        });
      });
    },
    // Framing: replacing a file resets it (put() computes a fresh default).
    aspect: aspect,
    centred: centred,
    guides: { eye: EYE_Y, chin: CHIN_Y },
    autoCrop: function (id) { return getRec(id).then(function (rec) { var g = find(id); return g && rec ? defaultCrop(g, rec) : null; }); },
    setCrop: function (id, crop) {
      return getRec(id).then(function (rec) { if (!rec) return; rec.crop = crop; return write(function (s) { s.put(rec, id); }); });
    },
    // Records stored before framing existed get their default now.
    ensureCrops: function (recs) {
      var todo = groups.filter(function (g) { var r = recs[g.id]; return r && !r.crop && !r.vector && aspect(g); });
      return todo.reduce(function (p, g) {
        return p.then(function () { return defaultCrop(g, recs[g.id]).then(function (c) { if (c) return api.setCrop(g.id, c); }); });
      }, Promise.resolve()).then(function () { return todo.length; });
    },
    remove: function (id) { return write(function (s) { s.delete(id); }); },
    clear: function () { return write(function (s) { s.clear(); }); },

    // Match a folder of files to groups by name ("Headshot - Tim Eddy.jpg").
    match: function (files) {
      var byName = {};
      groups.forEach(function (g) { byName[norm(g.file)] = g.id; });
      var matched = [], unmatched = [];
      Array.prototype.forEach.call(files, function (f) {
        if (/^\./.test(f.name) || /^(thumbs\.db|desktop\.ini)$/i.test(f.name)) return;
        var id = byName[norm(f.name)];
        if (id) matched.push([id, f]); else unmatched.push(f.name);
      });
      return { matched: matched, unmatched: unmatched };
    },

    // Effective resolution at the most demanding placement.
    quality: function (group, rec) {
      if (rec.vector) return { ppi: Infinity, use: null };
      var worst = { ppi: Infinity, use: null };
      group.uses.forEach(function (u) {
        var sx = rec.width / (u.w / 72), sy = rec.height / (u.h / 72);
        var p = u.fit === "contain" ? Math.max(sx, sy) : rec.crop ? rec.crop.w * rec.width / (u.w / 72) : Math.min(sx, sy);
        if (p < worst.ppi) worst = { ppi: p, use: u };
      });
      return worst;
    },

    // Print view: put every supplied file into its slots, including slots
    // that mount later as sections load.
    apply: function () {
      return api.all().then(function (recs) {
        return Promise.all(groups.map(function (g) { return recs[g.id] ? slotUrls(g, recs[g.id]) : null; }));
      }).then(function (list) {
        list.forEach(function (m) { if (m) Object.assign(placed, m); });
        place();
        if (!watching) {
          watching = true;
          var queued = false;
          new MutationObserver(function () {
            if (!queued) { queued = true; root.requestAnimationFrame(function () { queued = false; place(); }); }
          }).observe(root.document.body, { childList: true, subtree: true });
        }
        return Object.keys(placed).length;
      }).catch(function () { return 0; });
    },

    // Re-cut one group after its framing or file changed and swap it into
    // every slot on the page (the run's Adjust images editor).
    refresh: function (id) {
      var g = find(id);
      if (!g) return Promise.resolve();
      return getRec(id).then(function (r) {
        if (!r) { g.uses.forEach(function (x) { delete placed[x.slot]; }); return; }
        return slotUrls(g, r).then(function (m) { Object.assign(placed, m); place(); });
      });
    },
    find: find,
    get: function (id) { return getRec(id); },
    // The group that fills a slot on the page.
    groupForSlot: function (slot) {
      for (var i = 0; i < groups.length; i++) if (groups[i].uses.some(function (u) { return u.slot === slot; })) return groups[i];
      return null;
    },
  };

  root.RVImages = api;
})(window);

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
    photo("Photo - Racing 1", "racing", "rp-image-left", "left circle", 357.2, "All-Star Mile \u2014 Ben Melham"),
    photo("Photo - Racing 2", "racing", "rp-image-top", "top-right circle", 318.5, "Pride Of Jenni"),
    photo("Photo - Racing 3", "racing", "rp-image-right", "bottom circle", 357.2, "Nadal Meteorite"),
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
    { id: "logo", title: "Logos", note: "SVG, or PNG with a transparent background. Back-cover and awards logos print on colour, so supply the white version." },
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
  function norm(s) {
    return String(s).replace(/\.[a-z0-9]+$/i, "").replace(/^FY\d{2}\s+/i, "").replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
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
    accept: ".jpg,.jpeg,.png,.svg,.webp",

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
      if (/\.(tiff?|heic|psd|eps|ai|pdf)$/i.test(file.name)) {
        return Promise.reject(new Error("this file type can\u2019t be placed. Save it as JPG or PNG (logos: SVG or PNG)."));
      }
      if (!ACCEPT.test(file.name)) return Promise.reject(new Error("not an image file. Use JPG, PNG, SVG or WebP."));
      return measure(file).catch(function () { throw new Error("the file could not be opened as an image."); }).then(function (d) {
        var rec = { blob: file, name: file.name, size: file.size, type: file.type, width: d.width || 0, height: d.height || 0, vector: !!d.vector, added: new Date().toISOString() };
        return write(function (s) { s.put(rec, id); });
      });
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
        var p = u.fit === "contain" ? Math.max(sx, sy) : Math.min(sx, sy);
        if (p < worst.ppi) worst = { ppi: p, use: u };
      });
      return worst;
    },

    // Print view: put every supplied file into its slots, including slots
    // that mount later as sections load.
    apply: function () {
      return api.all().then(function (recs) {
        var urls = {};
        groups.forEach(function (g) {
          var r = recs[g.id];
          if (!r) return;
          var u = URL.createObjectURL(r.blob);
          g.uses.forEach(function (x) { urls[x.slot] = u; });
        });
        var queued = false;
        function place() {
          queued = false;
          root.document.querySelectorAll("image-slot").forEach(function (el) {
            var u = urls[el.id];
            if (u && el.getAttribute("src") !== u) el.setAttribute("src", u);
          });
        }
        place();
        new MutationObserver(function () {
          if (!queued) { queued = true; root.requestAnimationFrame(place); }
        }).observe(root.document.body, { childList: true, subtree: true });
        return Object.keys(urls).length;
      }).catch(function () { return 0; });
    },
  };

  root.RVImages = api;
})(window);

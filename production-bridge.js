/* Production bridge.
 *
 * Sections load their copy with `import('./copy/…')`. During a production run
 * (the page URL carries ?production) the bridge overlays that year's content,
 * read from the input folder by the Production Console, on top of the module.
 * Outside a run nothing changes: sections show the content in their copy files.
 *
 * Overrides are merged deeply, so a payload only needs the fields that change
 * (arrays replace, objects merge).
 */
(function (root) {
  "use strict";
  var KEY = "rv-production-run";

  function preview() { return root.RV_PREVIEW === true || /[?&]fy26\b/.test(root.location.search); }
  function active() { return preview() || /[?&]production\b/.test(root.location.search); }
  function run() {
    if (!active()) return null;
    if (preview()) {
      // Preview mode: the FY26 Finance content built from the signed Finance document.
      if (!root.__rvPreview) {
        var x = new XMLHttpRequest();
        x.open("GET", "./data/fy26-payload.json", false);
        x.send();
        root.__rvPreview = JSON.parse(x.responseText);
      }
      return root.__rvPreview;
    }
    try { return JSON.parse(root.localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function merge(a, b) {
    if (b === undefined) return a;
    if (!isObj(a) || !isObj(b)) return b;
    var out = Object.assign({}, a);
    Object.keys(b).forEach(function (k) { out[k] = merge(a[k], b[k]); });
    return out;
  }

  root.RVProduction = {
    KEY: KEY,
    active: active,
    run: run,
    get: function (id) {
      var r = run();
      return (r && r.payload && r.payload[id]) || null;
    },
    load: function (id, importer) {
      return importer().then(function (mod) {
        var ov = root.RVProduction.get(id);
        if (!ov) return mod;
        var out = {};
        Object.keys(mod).forEach(function (k) { out[k] = isObj(mod[k]) ? merge(mod[k], ov) : mod[k]; });
        return out;
      });
    },
  };
})(window);

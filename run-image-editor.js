/* Adjust images, in the Production Run.
 *
 * With Adjust on, clicking a photo, headshot, logo or signature on the laid-out
 * pages opens a framing editor: drag to move, scroll or use the slider to zoom,
 * Auto to go back to the default framing, Replace to swap the file. Save writes
 * the framing to the same store the Console uses (RVImages.setCrop), so the
 * Console and every later run see it, and re-cuts the picture on the page.
 */
(function (root) {
  "use strict";
  var IM = function () { return root.RVImages; };
  var BLUE = "#005FA1", MAG = "#A51890", INK = "#25272a", GREY = "#6D6E71";
  var on = false, modal = null;

  var css = document.createElement("style");
  css.textContent =
    "body.rv-adjust image-slot{cursor:pointer;outline:2px dashed " + MAG + ";outline-offset:3px}" +
    "body.rv-adjust image-slot[shape=circle]{border-radius:50%}" +
    "body.rv-adjust image-slot:hover{outline:3px solid " + MAG + "}" +
    "@media print{body.rv-adjust image-slot{outline:none!important}}";
  document.head.appendChild(css);

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(label, primary) {
    return el("button", "font:700 14px Arial,sans-serif;padding:10px 16px;border-radius:8px;cursor:pointer;" +
      (primary ? "background:" + BLUE + ";color:#fff;border:0" : "background:#fff;color:" + BLUE + ";border:2px solid " + BLUE), label);
  }

  function onClick(e) {
    if (!on || modal) return;
    var path = e.composedPath ? e.composedPath() : [e.target];
    var slot = null;
    for (var i = 0; i < path.length; i++) if (path[i].tagName === "IMAGE-SLOT") { slot = path[i]; break; }
    if (!slot) return;
    e.preventDefault(); e.stopPropagation();
    open(slot);
  }
  document.addEventListener("click", onClick, true);
  document.addEventListener("dblclick", function (e) { if (on) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("keydown", function (e) { if (modal && e.key === "Escape") close(); });

  function close() { if (modal) { modal.remove(); modal = null; document.body.style.overflow = ""; } }

  function open(slot) {
    var M = IM();
    var g = M && M.groupForSlot(slot.id);
    var back = el("div", "position:fixed;inset:0;z-index:2147483000;background:rgba(20,22,25,.55);display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif");
    var box = el("div", "background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.35);width:min(620px,94vw);max-height:94vh;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column");
    back.appendChild(box);
    back.addEventListener("mousedown", function (e) { if (e.target === back) close(); });
    modal = back; document.body.appendChild(back); document.body.style.overflow = "hidden";
    box.appendChild(el("div", "height:5px;background:linear-gradient(90deg,#EC008C,#005FA1);border-radius:12px 12px 0 0"));
    var head = el("div", "padding:16px 20px 8px");
    box.appendChild(head);
    if (!g) {
      head.appendChild(el("div", "font-size:18px;font-weight:700;color:" + INK, "Not set from the Console"));
      head.appendChild(el("div", "font-size:13.5px;line-height:1.45;color:" + GREY + ";margin-top:6px", "This picture isn\u2019t one of the Console\u2019s images, so it can\u2019t be adjusted here."));
      var f0 = el("div", "padding:12px 20px 18px;display:flex;justify-content:flex-end"); var c0 = btn("Close", true); c0.onclick = close; f0.appendChild(c0); box.appendChild(f0);
      return;
    }
    head.appendChild(el("div", "font-size:18px;font-weight:700;color:" + INK, g.label || g.file));
    var sub = el("div", "font-size:13px;line-height:1.45;color:" + GREY + ";margin-top:4px");
    head.appendChild(sub);
    var body = el("div", "padding:8px 20px");
    box.appendChild(body);
    var foot = el("div", "padding:12px 20px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap");
    box.appendChild(foot);
    var input = el("input"); input.type = "file"; input.accept = M.accept; input.style.display = "none"; box.appendChild(input);

    var A = M.aspect(g), rec = null, crop = null, url = null, img = null;
    var stage, win, pic, slider, ppiEl, msg;

    function ppi() {
      if (!rec || !crop) return 0;
      var w = 0; g.uses.forEach(function (u) { if (u.fit === "cover") w = Math.max(w, u.w); });
      return w ? crop.w * rec.width / (w / 72) : 0;
    }
    function lay() {
      if (!img || !crop) return;
      var dw = win.w / crop.w, dh = dw * rec.height / rec.width;
      pic.style.width = dw + "px"; pic.style.height = dh + "px";
      pic.style.left = (win.x - crop.l * dw) + "px"; pic.style.top = (win.y - crop.t * dh) + "px";
      var p = Math.round(ppi());
      ppiEl.textContent = p ? p + " ppi at the largest print size" + (p < 200 ? " \u2014 too low, will print soft" : p < 300 ? " \u2014 borderline" : "") : "";
      ppiEl.style.color = p && p < 200 ? MAG : p && p < 300 ? "#B07A00" : GREY;
      if (slider) slider.value = String(Math.log(cover().w / crop.w));
    }
    function cover() { return M.centred(rec.width, rec.height, A); }
    function zoomTo(w, fx, fy) {
      var c = cover();
      w = Math.max(c.w / 8, Math.min(c.w * 1.25, w));
      // keep the point at window fraction (fx, fy) still
      var hFrac = w * rec.width / A / rec.height, hOld = crop.w * rec.width / A / rec.height;
      crop = { l: crop.l + fx * (crop.w - w), t: crop.t + fy * (hOld - hFrac), w: w, src: "hand" };
      lay();
    }

    function build() {
      body.innerHTML = ""; foot.innerHTML = "";
      sub.textContent = (rec ? rec.name + " \u00b7 " + (rec.vector ? "vector" : rec.width + " \u00d7 " + rec.height + " px") + " \u00b7 " : "") +
        "used on " + g.uses.map(function (u) { return u.where; }).filter(Boolean).join(", ");
      if (!rec) {
        body.appendChild(el("div", "font-size:14px;line-height:1.5;color:" + INK + ";padding:20px 0", "No file has been added for this picture yet."));
      } else if (!A || rec.vector) {
        body.appendChild(el("div", "font-size:14px;line-height:1.5;color:" + INK + ";padding:12px 0", (g.kind === "logo" || g.kind === "signature" ? "Logos and signatures are placed whole, scaled to fit their space." : "This picture is placed whole.") + " Replace the file to change it."));
        var pv = el("img", "display:block;max-width:100%;max-height:260px;margin:8px auto;background:" + (g.reversed ? BLUE : "#f2f2f2") + ";padding:12px");
        pv.src = url; body.appendChild(pv);
      } else {
        var S = Math.max(280, body.clientWidth - 40), H = Math.min(380, Math.round(root.innerHeight * 0.5));
        stage = el("div", "position:relative;height:" + H + "px;overflow:hidden;background:#2b2d30;border-radius:8px;cursor:grab;touch-action:none;user-select:none");
        var ww = Math.min(S * 0.62, (H - 60) * A), wh = ww / A;
        win = { w: ww, h: wh, x: (S - ww) / 2, y: (H - wh) / 2 };
        stage.style.width = S + "px";
        pic = el("img", "position:absolute;max-width:none;pointer-events:none"); pic.src = url; pic.draggable = false;
        stage.appendChild(pic);
        var round = slot.getAttribute("shape") === "circle" ? "50%" : "0";
        var hole = el("div", "position:absolute;pointer-events:none;left:" + win.x + "px;top:" + win.y + "px;width:" + ww + "px;height:" + wh + "px;border-radius:" + round + ";box-shadow:0 0 0 2000px rgba(20,22,25,.62);outline:2px solid #fff");
        stage.appendChild(hole);
        if (g.kind === "headshot" && M.guides) {
          [["eye", M.guides.eye], ["chin", M.guides.chin]].forEach(function (q) {
            var ln = el("div", "position:absolute;pointer-events:none;left:" + (win.x - 14) + "px;width:" + (ww + 28) + "px;top:" + (win.y + q[1] * wh) + "px;border-top:1px dashed #EC008C");
            ln.appendChild(el("span", "position:absolute;left:" + (ww + 32) + "px;top:-8px;font-size:11px;color:#fff", q[0]));
            stage.appendChild(ln);
          });
        }
        body.appendChild(stage);
        var row = el("div", "display:flex;align-items:center;gap:12px;margin-top:12px;font-size:13px;color:" + GREY);
        row.appendChild(el("span", "", "Zoom"));
        slider = el("input", "flex:1"); slider.type = "range"; slider.min = String(Math.log(0.8)); slider.max = String(Math.log(8)); slider.step = "0.01";
        slider.oninput = function () { zoomTo(cover().w / Math.exp(+slider.value), 0.5, 0.5); };
        row.appendChild(slider);
        body.appendChild(row);
        ppiEl = el("div", "font-size:13px;margin-top:8px");
        body.appendChild(ppiEl);
        body.appendChild(el("div", "font-size:12.5px;color:" + GREY + ";margin-top:4px", "Drag to move \u00b7 scroll to zoom. Where the picture runs out, its edge is extended."));

        var drag = null;
        stage.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, c: crop }; stage.setPointerCapture(e.pointerId); stage.style.cursor = "grabbing"; });
        stage.addEventListener("pointermove", function (e) {
          if (!drag) return;
          var dw = win.w / drag.c.w, dh = dw * rec.height / rec.width;
          crop = { l: drag.c.l - (e.clientX - drag.x) / dw, t: drag.c.t - (e.clientY - drag.y) / dh, w: drag.c.w, src: "hand" };
          lay();
        });
        stage.addEventListener("pointerup", function () { drag = null; stage.style.cursor = "grab"; });
        stage.addEventListener("wheel", function (e) {
          e.preventDefault();
          var r = stage.getBoundingClientRect();
          zoomTo(crop.w * Math.exp(e.deltaY * 0.0015), (e.clientX - r.left - win.x) / win.w, (e.clientY - r.top - win.y) / win.h);
        }, { passive: false });
        lay();
      }
      msg = el("div", "flex:1 1 100%;font-size:13px;color:" + MAG + ";min-height:0");
      foot.appendChild(msg);
      var rep = btn(rec ? "Replace file\u2026" : "Add file\u2026"); rep.onclick = function () { input.click(); };
      foot.appendChild(rep);
      if (rec && A && !rec.vector) {
        var auto = btn("Auto"); auto.title = g.kind === "headshot" ? "Face finder / FY25 rule" : "Centred";
        auto.onclick = function () { auto.disabled = true; M.autoCrop(g.id).then(function (c) { if (c) { crop = c; lay(); } auto.disabled = false; }); };
        foot.appendChild(auto);
      }
      foot.appendChild(el("div", "flex:1"));
      var cancel = btn("Cancel"); cancel.onclick = close; foot.appendChild(cancel);
      if (rec && A && !rec.vector) {
        var save = btn("Save", true);
        save.onclick = function () {
          save.disabled = true; save.textContent = "Saving\u2026";
          M.setCrop(g.id, crop).then(function () { return M.refresh(g.id); }).then(close)
            .catch(function (e) { msg.textContent = "Could not save: " + (e && e.message || e); save.disabled = false; save.textContent = "Save"; });
        };
        foot.appendChild(save);
      }
    }

    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      msg && (msg.textContent = "Adding " + f.name + "\u2026");
      M.put(g.id, f).then(function () { return M.refresh(g.id); }).then(load)
        .catch(function (e) { if (msg) msg.textContent = "Not added: " + (e && e.message || e); });
      input.value = "";
    };

    function load() {
      return M.get(g.id).then(function (r) {
        rec = r || null;
        if (url) URL.revokeObjectURL(url);
        url = rec ? URL.createObjectURL(rec.blob) : null;
        crop = rec && A && !rec.vector ? Object.assign({}, rec.crop || M.centred(rec.width, rec.height, A)) : null;
        if (!url || !crop) { img = null; build(); return; }
        img = new Image();
        img.onload = build;
        img.src = url;
      });
    }
    sub.textContent = "Loading\u2026";
    load();
  }

  root.RVImageEditor = {
    setActive: function (v) { on = !!v; document.body.classList.toggle("rv-adjust", on); if (!on) close(); },
    active: function () { return on; },
  };
})(window);

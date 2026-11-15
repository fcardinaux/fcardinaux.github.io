// The 128 GB Club: browse the model records (models.json, exported from the repository).
(function () {
  "use strict";
  var root = document.getElementById("club-browser");
  if (!root) return;

  var FEEDBACK = { rich: "Rich feedback", moderate: "Moderate feedback", thin: "Thin feedback", none: "No feedback found" };
  var FACTS = [
    ["licence", "Licence"], ["gated", "Gated"], ["publisher", "Publisher"], ["release_date", "Released"],
    ["parameters_total_b", "Parameters (B)"], ["parameters_active_b", "Active parameters (B)"], ["size_gb", "Size (GB)"],
    ["formats", "Formats"], ["languages", "Languages"], ["runtimes", "Runtimes"], ["fits_128gb", "Fits in 128 GB"],
    ["provenance", "Provenance"]
  ];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var data, els = {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//.test(u) ? u : null; }
  function link(url, label) {
    var u = safeUrl(url);
    return u ? '<a href="' + esc(u) + '" rel="noopener">' + esc(label) + "</a>" : esc(label);
  }
  // Markdown-ish text: [label](url), `code` and bare URLs; everything else escaped.
  function rich(text) {
    var out = "", re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|`([^`]+)`|(https?:\/\/[^\s,;)]+)/g, last = 0, m;
    text = String(text);
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index));
      if (m[1]) out += link(m[2], m[1]);
      else if (m[3]) out += "<code>" + esc(m[3]) + "</code>";
      else out += link(m[4], shortUrl(m[4]));
      last = re.lastIndex;
    }
    return out + esc(text.slice(last));
  }
  function shortUrl(u) {
    var s = u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return s.length > 48 ? s.slice(0, 45) + "…" : s;
  }
  function num(x) { return typeof x === "number" ? String(+x.toFixed(2)) : String(x); }
  function value(v) {
    if (v === true) return "yes";
    if (v === false) return "no";
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return Object.keys(v).map(function (k) { return k + ": " + num(v[k]); }).join(" · ");
    return num(v);
  }
  function month(iso) {
    var m = /^(\d{4})-(\d{2})/.exec(iso || "");
    return m ? MONTHS[+m[2] - 1] + " " + m[1] : "";
  }
  function date(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? +m[3] + " " + MONTHS[+m[2] - 1] + " " + m[1] : iso || "";
  }
  function fact(r, k) { return r.facts[k] ? r.facts[k].value : undefined; }
  function counts(r) {
    var c = { positive: 0, negative: 0, neutral: 0 };
    r.comments.forEach(function (x) { c[x.sentiment] = (c[x.sentiment] || 0) + 1; });
    return c;
  }
  function sourceUrl(s) {
    if (s.kind === "huggingface") return "https://huggingface.co/" + s.repo;
    if (s.kind === "github") return "https://github.com/" + s.repo;
    if (s.kind === "ollama") return "https://ollama.com/library/" + s.repo + (s.tag ? ":" + s.tag : "");
    return null;
  }

  function card(r) {
    var c = counts(r), d = r.derived, fb = r.appraisals.web.feedback, size = d.size_min_gb;
    var multi = r.facts.size_gb && typeof r.facts.size_gb.value === "object";
    var chips = [
      '<span class="chip lic' + (d.licence_class === "other" ? " other" : "") + '">' + esc(d.licence_class === "other" ? "Other licence" : d.licence_class) + "</span>",
      size != null ? '<span class="chip">' + (multi ? "from " : "") + esc(num(size)) + " GB</span>" : "",
      fact(r, "fits_128gb") === false ? '<span class="chip warn">Too large</span>' : "",
      month(fact(r, "release_date")) ? '<span class="chip">' + esc(month(fact(r, "release_date"))) + "</span>" : "",
      '<span class="chip fb-' + esc(fb) + '">' + esc(FEEDBACK[fb] || fb) + "</span>",
      c.positive ? '<span class="chip pos" title="positive comments">+' + c.positive + "</span>" : "",
      c.negative ? '<span class="chip neg" title="negative comments">−' + c.negative + "</span>" : ""
    ].join("");

    var rows = FACTS.filter(function (f) { return r.facts[f[0]]; }).map(function (f) {
      var x = r.facts[f[0]], src = x.source || "";
      var srcHtml = /^https?:\/\//.test(src) ? rich(src) : esc(src);
      return "<tr><th>" + esc(f[1]) + "</th><td>" + esc(value(x.value)) +
        (x.note ? '<div class="note">' + rich(x.note) + "</div>" : "") +
        (src ? '<div class="src">Source: ' + srcHtml + (x.checked ? ", checked " + esc(date(x.checked)) : "") + "</div>" : "") +
        "</td></tr>";
    }).join("");

    var web = r.appraisals.web;
    var speed = (r.appraisals.speed || []).map(function (s) {
      return "<li>" + esc(s.value) + " — " + esc([s.machine, s.runtime, s.quantisation].filter(Boolean).join(", ")) +
        " (" + link(s.url, date(s.date) || "source") + ")</li>";
    }).join("");
    var comments = r.comments.map(function (x) {
      var refs = /\]\(http/.test(x.text) ? "" : (x.refs || []).map(function (f) {
        return link(f.url, [f.label, date(f.date)].filter(Boolean).join(", ") || "source");
      }).join("; ");
      return '<li class="' + esc(x.sentiment) + '"><span class="mark" aria-label="' + esc(x.sentiment) + '">' +
        ({ positive: "+", negative: "−", neutral: "•" }[x.sentiment] || "•") + "</span><span>" + rich(x.text) +
        (refs ? " (" + refs + ")" : "") + "</span></li>";
    }).join("");
    var sources = r.sources.map(function (s) {
      var u = sourceUrl(s), label = s.repo + (s.tag ? ":" + s.tag : "");
      return "<li>" + (u ? link(u, label) : esc(label)) + (s.note ? ' <span class="note">' + esc(s.note) + "</span>" : "") + "</li>";
    }).join("");

    return '<details class="model" id="' + esc(r.id) + '"><summary>' +
      '<span class="head"><span class="name">' + esc(r.name) + '</span><span class="cat">' + esc(data.categories[r.category] || r.category) + "</span></span>" +
      '<span class="usage">' + esc(r.usage) + '</span><span class="chips">' + chips + "</span></summary>" +
      '<div class="body">' +
      "<h4>What users say</h4><p><strong>" + rich(web.verdict) + "</strong></p>" +
      (web.summary ? "<p>" + rich(web.summary) + "</p>" : "") +
      (web.scope ? '<p class="note">Searched ' + esc(date(web.searched)) + ". " + rich(web.scope) + "</p>" : "") +
      (comments ? '<ul class="comments">' + comments + "</ul>" : "") +
      (speed ? "<h4>Measured speed</h4><ul>" + speed + "</ul>" : "") +
      '<h4>Facts</h4><div class="facts-wrap"><table class="facts">' + rows + "</table></div>" +
      (sources ? '<h4>Repositories</h4><ul class="sources">' + sources + "</ul>" : "") +
      '<p class="permalink"><a href="#' + esc(r.id) + '">Link to this model</a> · <a href="https://github.com/fcardinaux/the-128gb-club/blob/main/models/' +
      esc(r.id) + '.json" rel="noopener">Record on GitHub</a></p>' +
      "</div></details>";
  }

  function matches(r, q, cat, lic, fits, fb) {
    if (cat && r.category !== cat) return false;
    if (lic === "open" && r.derived.licence_class === "other") return false;
    if (lic && lic !== "open" && r.derived.licence_class !== lic) return false;
    if (fits && fact(r, "fits_128gb") === false) return false;
    if (fb === "some" && (r.appraisals.web.feedback === "none" || r.appraisals.web.feedback === "thin")) return false;
    if (fb && fb !== "some" && r.appraisals.web.feedback !== fb) return false;
    if (q) {
      var hay = [r.name, r.id, r.usage, fact(r, "publisher"), data.categories[r.category]].join(" ").toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
    }
    return true;
  }

  function update() {
    var q = els.q.value.trim().toLowerCase(), cat = els.cat.value, lic = els.lic.value, fits = els.fits.checked,
      fb = els.fb.value, sort = els.sort.value;
    var list = data.models.filter(function (r) { return matches(r, q, cat, lic, fits, fb); });
    list.sort(function (a, b) {
      if (sort === "new") return String(fact(b, "release_date")).localeCompare(String(fact(a, "release_date")));
      if (sort === "small") return (a.derived.size_min_gb == null ? 1e9 : a.derived.size_min_gb) - (b.derived.size_min_gb == null ? 1e9 : b.derived.size_min_gb);
      if (sort === "feedback") return b.comments.length - a.comments.length;
      return 0; // export order: by category, then name
    });
    els.count.textContent = list.length === data.models.length ? data.models.length + " models"
      : list.length + " of " + data.models.length + " models";
    els.list.innerHTML = list.length ? list.map(card).join("") : '<p class="empty">No model matches these filters.</p>';
  }

  function openHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || !data) return;
    var el = document.getElementById(id);
    if (!el || !el.classList.contains("model")) {
      if (data.models.some(function (r) { return r.id === id; })) { reset(); el = document.getElementById(id); }
    }
    if (el && el.classList.contains("model")) { el.open = true; el.scrollIntoView({ block: "start" }); }
  }
  function reset() {
    els.q.value = ""; els.cat.value = ""; els.lic.value = ""; els.fits.checked = false; els.fb.value = ""; els.sort.value = "";
    update();
  }

  fetch(root.getAttribute("data-src"))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      data = d;
      ["q", "cat", "lic", "fits", "fb", "sort", "count", "list"].forEach(function (k) { els[k] = root.querySelector("[data-k=" + k + "]"); });
      var per = {};
      d.models.forEach(function (r) { per[r.category] = (per[r.category] || 0) + 1; });
      Object.keys(d.categories).forEach(function (k) {
        if (!per[k]) return;
        var o = document.createElement("option");
        o.value = k; o.textContent = d.categories[k] + " (" + per[k] + ")";
        els.cat.appendChild(o);
      });
      root.querySelector(".updated").textContent = "Data of " + date(d.generated) + ".";
      ["input", "change"].forEach(function (ev) { root.querySelector(".filters").addEventListener(ev, update); });
      root.querySelector("[data-k=reset]").addEventListener("click", reset);
      root.classList.add("ready");
      update();
      openHash();
    })
    .catch(function () {
      root.querySelector("[data-k=list]").innerHTML =
        '<p class="empty">The list could not be loaded. See the <a href="https://github.com/fcardinaux/the-128gb-club/blob/main/model-comparison.md">comparison on GitHub</a>.</p>';
    });

  // ------------------------------------------------------------ tabs and documents
  var REPO = "https://github.com/fcardinaux/the-128gb-club/blob/main/";
  var RAW = "https://raw.githubusercontent.com/fcardinaux/the-128gb-club/main/";
  var TABS = { models: 1, taxonomies: 1, glossary: 1, method: 1 };
  var PAGES = { "glossary.md": "#glossary", "research-method.md": "#method", "model-comparison.md": "#models" };
  var loaded = {};

  function resolve(base, href) {
    var parts = base.split("/").slice(0, -1);
    href.split("/").forEach(function (x) { if (x === "..") parts.pop(); else if (x !== ".") parts.push(x); });
    return parts.join("/");
  }
  // In-repository links stay on this page when it can show the target, else go to GitHub.
  function fixLinks(el, path) {
    el.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (/^https?:/.test(h)) { a.rel = "noopener"; return; }
      if (h.charAt(0) === "#") { a.href = REPO + path + h; a.rel = "noopener"; return; }
      var m = /^([^#]*)(#.*)?$/.exec(h), target = resolve(path, m[1]);
      var tm = /^taxonomies\/([\w-]+)\.md$/.exec(target), mm = /^models\/([\w.-]+)\.json$/.exec(target);
      if (PAGES[target] && !m[2]) a.href = PAGES[target];
      else if (tm && !m[2]) a.href = "#taxonomies/" + tm[1];
      else if (mm) a.href = "#" + mm[1];
      else { a.href = REPO + target + (m[2] || ""); a.rel = "noopener"; }
    });
    el.querySelectorAll("table").forEach(function (t) {
      var heads = Array.prototype.map.call(t.querySelectorAll("thead th"), function (h) { return h.textContent.trim(); });
      t.querySelectorAll("tbody tr").forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i]) td.setAttribute("data-label", heads[i]); });
      });
      var w = document.createElement("div"); w.className = "table-wrap";
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
  }
  function loadDoc(box, path) {
    if (box.getAttribute("data-shown") === path) return;
    box.setAttribute("data-shown", path);
    if (!window.marked || !window.DOMPurify) {
      box.innerHTML = '<p><a href="' + REPO + path + '">Read it on GitHub</a>.</p>';
      return;
    }
    box.innerHTML = '<p class="empty">Loading…</p>';
    (loaded[path] || (loaded[path] = fetch(RAW + path).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })))
      .then(function (md) {
        if (box.getAttribute("data-shown") !== path) return;
        box.innerHTML = DOMPurify.sanitize(marked.parse(md)) +
          '<p class="doc-src">From <a href="' + REPO + path + '" rel="noopener">' + path + "</a> in the repository.</p>";
        fixLinks(box, path);
      })
      .catch(function () {
        delete loaded[path];
        box.innerHTML = '<p class="empty">Could not load it. <a href="' + REPO + path + '">Read it on GitHub</a>.</p>';
      });
  }
  function show(tab, sub) {
    document.querySelectorAll(".club-tabs [data-tab]").forEach(function (a) {
      a.setAttribute("aria-selected", a.getAttribute("data-tab") === tab ? "true" : "false");
    });
    document.querySelectorAll(".club-panel").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== tab; });
    if (tab === "glossary" || tab === "method") {
      var box = document.querySelector('[data-doc-target="' + tab + '"]');
      loadDoc(box, box.getAttribute("data-doc-src"));
    }
    if (tab === "taxonomies") {
      var links = document.querySelectorAll(".tax-list a");
      var chosen = sub ? "taxonomies/" + sub + ".md" : links[0].getAttribute("data-doc");
      links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("data-doc") === chosen ? "true" : "false"); });
      loadDoc(document.querySelector('[data-doc-target="taxonomies"]'), chosen);
    }
  }
  function route() {
    var h = decodeURIComponent(location.hash.slice(1)), parts = h.split("/");
    if (TABS[parts[0]]) {
      show(parts[0], parts[1]);
      if (parts[1] || parts[0] !== "models") {
        var nav = document.querySelector(".club-tabs");
        if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: "start" });
      }
    } else { show("models"); openHash(); }
  }
  window.addEventListener("hashchange", route);
  route();
})();

(() => {
  "use strict";

  const EMOJI = { best: "⭐", special: "✨", grail: "🏆", wanted: "🏅", worst: "🗑️", ai: "🤖" };
  const FLAG_NAME = { best: "Best Of", special: "Special", grail: "Grail", wanted: "Wanted", worst: "Worst Of", ai: "AI" };
  const PLAYABLE = new Set(["OG File", "Full", "Tagged", "Partial", "Snippet", "Beat Only", "Stem Bounce"]);
  const PAGE = 40;

  const $ = (s) => document.querySelector(s);
  const els = {
    q: $("#q"), era: $("#era"), portion: $("#portion"), portionWrap: $("#portion-wrap"), notes: $("#notes"),
    list: $("#list"), more: $("#more"), count: $("#count"), meta: $("#meta"), tpl: $("#card-tpl"),
    views: [...document.querySelectorAll(".views button")],
  };

  let data = null;
  let state = { view: "all", q: "", era: "", portion: "", notes: false };
  let results = [];
  let shown = 0;

  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9?$¥]+/g, " ").trim();

  function prepare(set) {
    for (const s of set.songs) {
      s._key = norm([s.name, s.alt, s.era, ...s.versions.map((v) => v.credits)].join(" "));
      s._notes = norm(s.versions.map((v) => v.notes).join(" "));
      s._name = norm(s.name);
    }
  }

  // ---------- state <-> URL hash so searches can be shared ----------
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.view = ["all", "best", "special", "grail", "released"].includes(p.get("view")) ? p.get("view") : "all";
    state.q = p.get("q") || "";
    state.era = p.get("era") || "";
    state.portion = p.get("portion") || "";
    state.notes = p.get("notes") === "1";
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.view !== "all") p.set("view", state.view);
    if (state.q) p.set("q", state.q);
    if (state.era) p.set("era", state.era);
    if (state.portion) p.set("portion", state.portion);
    if (state.notes) p.set("notes", "1");
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }

  const currentSet = () => (state.view === "released" ? data.released : data.unreleased);

  function syncControls() {
    els.views.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
    const set = currentSet();
    els.era.replaceChildren(new Option("All eras", ""), ...set.eras.map((e) => new Option(e || "Unsorted", e)));
    if (state.era && !set.eras.includes(state.era)) state.era = "";
    els.era.value = state.era;
    els.portionWrap.hidden = state.view === "released";
    els.portion.value = state.portion;
    els.q.value = state.q;
    els.notes.checked = state.notes;
  }

  // ---------- filtering ----------
  function versionMatchesPortion(v) {
    if (!state.portion) return true;
    if (state.portion === "playable") return PLAYABLE.has(v.portion);
    return v.portion === state.portion;
  }

  function filter() {
    const set = currentSet();
    const words = norm(state.q).split(" ").filter(Boolean);
    const flag = ["best", "special", "grail"].includes(state.view) ? state.view : null;
    const usePortion = state.view !== "released" && state.portion;

    results = set.songs.filter((s) => {
      if (state.era && s.era !== state.era) return false;
      if (flag && !(s.flags || []).includes(flag)) return false;
      if (usePortion && !s.versions.some(versionMatchesPortion)) return false;
      if (words.length) {
        const hay = state.notes ? s._key + " " + s._notes : s._key;
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    if (words.length) {
      // songs whose own title matches come first, keeping era order otherwise
      const q = words.join(" ");
      const rank = (s) => (s._name === q ? 0 : s._name.startsWith(q) ? 1 : s._name.includes(q) ? 2 : words.every((w) => s._name.includes(w)) ? 3 : 4);
      results = results.map((s, i) => [rank(s), i, s]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
    }
    shown = 0;
    els.list.replaceChildren();
    renderMore();

    const total = set.songs.length;
    const vcount = results.reduce((n, s) => n + s.versions.length, 0);
    els.count.textContent = `${results.length.toLocaleString()} songs · ${vcount.toLocaleString()} versions` +
      (results.length !== total ? ` (of ${total.toLocaleString()} songs)` : "");
    if (!results.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "No songs match. Try fewer words, another era, or turn on “search notes too”.";
      els.list.append(p);
    }
  }

  // ---------- rendering ----------
  function versionLabel(v, i, released) {
    const flags = (v.flags || []).map((f) => EMOJI[f]).join("");
    const bits = released
      ? [v.tag || `#${i + 1}`, v.type, v.releaseDate]
      : [v.tag || `#${i + 1}`, v.portion, v.quality, v.length];
    return (flags ? flags + " " : "") + bits.filter(Boolean).join(" · ");
  }

  function fact(dl, k, v) {
    if (!v) return;
    const d = document.createElement("div");
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    d.append(dt, dd); dl.append(d);
  }

  function linkText(u) {
    try {
      const x = new URL(u);
      const rest = (x.pathname + x.search).replace(/\/$/, "");
      return x.hostname.replace(/^www\./, "") + (rest.length > 28 ? rest.slice(0, 28) + "…" : rest);
    } catch { return u; }
  }

  function showVersion(card, song, i, released) {
    const v = song.versions[i];
    const dl = card.querySelector(".facts");
    dl.replaceChildren();
    if (v.flags) fact(dl, "Tag", v.flags.map((f) => EMOJI[f] + " " + FLAG_NAME[f]).join(", "));
    if (released) {
      fact(dl, "Type", v.type); fact(dl, "Released", v.releaseDate); fact(dl, "Length", v.length); fact(dl, "Streaming", v.streaming);
    } else {
      fact(dl, "Available", v.portion); fact(dl, "Quality", v.quality); fact(dl, "Length", v.length);
      fact(dl, "File date", v.fileDate); fact(dl, "Leak date", v.leakDate);
    }
    if (song.versions.length > 1 && v.credits) fact(dl, "Credits", v.credits);
    card.querySelector(".notes").textContent = v.notes || "";
    const ul = card.querySelector(".links");
    ul.replaceChildren();
    for (const u of v.links || []) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = linkText(u); a.title = u;
      li.append(a); ul.append(li);
    }
    if (!(v.links || []).length) {
      const li = document.createElement("li"); li.className = "nolink"; li.textContent = "No link listed"; ul.append(li);
    }
  }

  function makeCard(song) {
    const released = state.view === "released";
    const card = els.tpl.content.firstElementChild.cloneNode(true);
    card.querySelector(".name").textContent = song.name;
    card.querySelector(".flags").textContent = (song.flags || []).map((f) => EMOJI[f]).join(" ");
    card.querySelector(".flags").title = (song.flags || []).map((f) => FLAG_NAME[f]).join(", ");
    card.querySelector(".alt").textContent = song.alt || "";
    card.querySelector(".era").textContent = song.era || "Unsorted";
    const credits = [...new Set(song.versions.map((v) => v.credits).filter(Boolean))];
    card.querySelector(".credits").textContent = credits.length === 1 ? credits[0] : "";

    const sel = card.querySelector(".versions");
    const n = song.versions.length;
    card.querySelector(".vlabel").textContent = n === 1 ? "1 version" : `${n} versions`;
    sel.setAttribute("aria-label", `Version of ${song.name}`);
    song.versions.forEach((v, i) => sel.append(new Option(versionLabel(v, i, released), String(i))));

    // pick a sensible default: the flagged version in Best Of / Special, else the first one matching filters
    let pick = 0;
    const flag = ["best", "special", "grail"].includes(state.view) ? state.view : null;
    const idx = song.versions.findIndex((v) => (flag ? (v.flags || []).includes(flag) : true) && (released || versionMatchesPortion(v)));
    if (idx >= 0) pick = idx;
    sel.value = String(pick);
    if (n === 1) sel.disabled = true;
    sel.addEventListener("change", () => showVersion(card, song, Number(sel.value), released));
    showVersion(card, song, pick, released);
    return card;
  }

  function renderMore() {
    const frag = document.createDocumentFragment();
    const end = Math.min(shown + PAGE, results.length);
    for (let i = shown; i < end; i++) frag.append(makeCard(results[i]));
    shown = end;
    els.list.append(frag);
  }

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && data && shown < results.length) renderMore();
  }, { rootMargin: "1200px" }).observe(els.more);

  // ---------- events ----------
  let t;
  const update = () => { writeHash(); filter(); };
  els.q.addEventListener("input", () => { state.q = els.q.value; clearTimeout(t); t = setTimeout(update, 150); });
  els.era.addEventListener("change", () => { state.era = els.era.value; update(); });
  els.portion.addEventListener("change", () => { state.portion = els.portion.value; update(); });
  els.notes.addEventListener("change", () => { state.notes = els.notes.checked; update(); });
  els.views.forEach((b) => b.addEventListener("click", () => {
    state.view = b.dataset.view;
    syncControls(); update(); window.scrollTo({ top: 0 });
  }));
  window.addEventListener("hashchange", () => { readHash(); syncControls(); filter(); });

  // ---------- load ----------
  fetch("data.json")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      data = d;
      prepare(d.unreleased); prepare(d.released);
      els.meta.textContent = `Updated ${d.updated}`;
      readHash(); syncControls(); filter();
    })
    .catch((e) => {
      els.meta.textContent = "";
      els.count.textContent = "Couldn’t load the song list (" + e.message + "). Refresh to try again.";
    });
})();

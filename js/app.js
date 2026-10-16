// Ponte de Idiomas: lecciones, práctica y navegación. El contenido vive en content/*.json.
(function () {
  "use strict";
  const SPEAK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ponte:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ponte:" + k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Solo se admite **negrita** en el contenido: todo lo demás se escapa.
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  const app = { langs: [], course: {}, lang: store.get("lang", "en"), unitIdx: 0, done: store.get("done", {}) };
  window.Ponte = app;

  app.toast = function (t) {
    const el = $("#toast"); el.textContent = t; el.hidden = false;
    clearTimeout(app.toast.t); app.toast.t = setTimeout(() => (el.hidden = true), 2600);
  };
  app.esc = esc;

  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text.split(" / ")[0]);
      u.lang = app.course[app.lang].voice; u.rate = 0.9;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { app.toast("Tu navegador no permite reproducir la voz."); }
  }

  function setLang(code) {
    if (!app.course[code]) code = app.langs[0].code;
    app.lang = code; app.unitIdx = 0; store.set("lang", code);
    const meta = app.langs.find((l) => l.code === code);
    document.documentElement.style.setProperty("--accent-lang", meta.color);
    document.body.classList.toggle("lang-pt", code === "pt");
    document.querySelectorAll("#langs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === code));
    $("#path-label").textContent = "Ruta · " + meta.name + " para hispanohablantes";
    renderLessons(); renderQuizSetup();
    document.dispatchEvent(new CustomEvent("ponte:lang", { detail: code }));
  }

  function renderLessons() {
    const c = app.course[app.lang], done = app.done;
    const n = c.units.filter((u) => done[u.id]).length;
    $("#bar").style.width = (n / c.units.length) * 100 + "%";
    $("#bar-txt").textContent = n + " de " + c.units.length + " unidades";
    $("#units").innerHTML = c.units.map((u, i) =>
      `<button class="unit" data-i="${i}" aria-current="${i === app.unitIdx}"><span class="lvl">${esc(u.level)} · Unidad ${i + 1}</span><strong>${esc(u.title)}</strong><small>${esc(u.subtitle)}</small>${done[u.id] ? '<span class="done">✓ Completada</span>' : ""}</button>`).join("");
    const u = c.units[app.unitIdx];
    $("#lesson").innerHTML = `<div><div class="eyebrow">Unidad ${app.unitIdx + 1} · ${esc(u.level)}</div><h2>${esc(u.title)}</h2></div>
      <div class="grammar"><h3>La regla</h3>${u.grammar.map((g) => `<p>${rich(g)}</p>`).join("")}</div>
      <div><div class="eyebrow" style="margin-bottom:8px">Vocabulario · toca el altavoz para escuchar</div>
      <div class="vocab">${u.words.map((w, i) => `<div class="word"><button class="say" data-say="${i}" aria-label="Escuchar ${esc(w.term)}">${SPEAK}</button><div><b>${esc(w.term)}</b><span class="es">${esc(w.es)}</span> <span class="ipa">${esc(w.ipa || "")}</span></div></div>`).join("")}</div></div>
      <div class="row"><button class="btn" id="go-quiz">Practicar esta unidad</button><button class="btn ghost" id="mark">${done[u.id] ? "Marcar como pendiente" : "Marcar como completada"}</button></div>`;
  }

  $("#units").addEventListener("click", (e) => {
    const b = e.target.closest(".unit"); if (!b) return;
    app.unitIdx = +b.dataset.i; renderLessons();
    $("#lesson").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
  $("#lesson").addEventListener("click", (e) => {
    const u = app.course[app.lang].units[app.unitIdx];
    const s = e.target.closest("[data-say]");
    if (s) speak(u.words[+s.dataset.say].term);
    if (e.target.id === "mark") { app.done[u.id] = !app.done[u.id]; store.set("done", app.done); renderLessons(); }
    if (e.target.id === "go-quiz") { $("#q-unit").value = app.unitIdx; showTab("practica"); newQuiz(); }
  });

  // Práctica
  const q = { score: 0, total: 0, cur: null };
  function renderQuizSetup() {
    $("#q-unit").innerHTML = app.course[app.lang].units.map((u, i) => `<option value="${i}">${i + 1}. ${esc(u.title)}</option>`).join("") + '<option value="all">Todas</option>';
    q.score = 0; q.total = 0; newQuiz();
  }
  function newQuiz() {
    const units = app.course[app.lang].units, v = $("#q-unit").value;
    const pool = v === "all" ? units.flatMap((u) => u.words) : units[+v].words;
    const w = pool[Math.floor(Math.random() * pool.length)], toEs = $("#q-dir").value === "to-es";
    const others = units.flatMap((u) => u.words).filter((x) => x !== w).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [w, ...others].sort(() => Math.random() - 0.5);
    q.cur = { w, opts };
    $("#quiz").innerHTML = `<div class="row" style="justify-content:space-between"><span class="eyebrow">${toEs ? "¿Qué significa?" : "¿Cómo se dice?"}</span><span class="score">${q.score} / ${q.total} aciertos</span></div>
      <div class="row"><div class="prompt">${esc(toEs ? w.term : w.es)}</div>${toEs ? `<button class="say" data-sayq aria-label="Escuchar">${SPEAK}</button>` : ""}</div>
      <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(toEs ? o.es : o.term)}</button>`).join("")}</div>
      <div class="row"><button class="btn" id="next" hidden>Siguiente</button></div>`;
  }
  $("#quiz").addEventListener("click", (e) => {
    if (e.target.closest("[data-sayq]")) return speak(q.cur.w.term);
    const o = e.target.closest(".opt");
    if (o && !o.disabled) {
      const ok = q.cur.opts[+o.dataset.i] === q.cur.w; q.total++; if (ok) q.score++;
      document.querySelectorAll(".opt").forEach((b) => { b.disabled = true; if (q.cur.opts[+b.dataset.i] === q.cur.w) b.classList.add("right"); });
      if (!ok) o.classList.add("wrong"); else speak(q.cur.w.term);
      $("#quiz .score").textContent = q.score + " / " + q.total + " aciertos";
      $("#next").hidden = false; $("#next").focus();
    }
    if (e.target.id === "next") newQuiz();
  });
  $("#q-unit").addEventListener("change", newQuiz);
  $("#q-dir").addEventListener("change", newQuiz);

  // Pestañas (también por #ancla para enlazar directo)
  function showTab(t) {
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === t));
    document.querySelectorAll("section.panel").forEach((s) => (s.hidden = s.id !== "p-" + t));
    if (location.hash !== "#" + t) history.replaceState(null, "", "#" + t);
  }
  app.showTab = showTab;
  document.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showTab(b.dataset.tab); });
  $("#langs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLang(b.dataset.lang); });
  app.setLang = (c) => setLang(c);

  // Instalar como app (PWA)
  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; $("#install").hidden = false; });
  $("#install").addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#install").hidden = true; });
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});

  const repo = (window.PONTE_CONFIG || {}).repoUrl;
  if (repo) $("#repo-link").href = repo; else $("#repo-link").hidden = true;

  async function boot() {
    try {
      const idx = await (await fetch("content/languages.json")).json();
      app.langs = idx.languages;
      await Promise.all(app.langs.map(async (l) => { app.course[l.code] = await (await fetch("content/" + l.file)).json(); }));
    } catch (e) {
      $("#units").innerHTML = '<p class="note">No se pudieron cargar las lecciones. Revisa tu conexión y recarga la página.</p>';
      return;
    }
    $("#langs").innerHTML = app.langs.map((l) => `<button data-lang="${esc(l.code)}" aria-pressed="false"><span class="code">${esc(l.code.toUpperCase())}</span> ${esc(l.name)}</button>`).join("");
    const tab = location.hash.slice(1);
    if (["lecciones", "practica", "comunidad", "proyecto"].includes(tab)) showTab(tab);
    setLang(app.lang);
    document.dispatchEvent(new CustomEvent("ponte:ready"));
  }
  boot();
})();

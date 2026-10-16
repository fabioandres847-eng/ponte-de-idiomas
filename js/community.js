// Muro de la comunidad. Con Supabase configurado (js/config.js) los aportes son compartidos;
// sin configuración funciona en modo local, guardando los aportes solo en este navegador.
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const KINDS = { gramatica: "Gramática", vocabulario: "Vocabulario", pronunciacion: "Pronunciación", audiovisual: "Video o audio", consejo: "Consejo" };
  const cfg = window.PONTE_CONFIG || {};
  const state = { posts: [], votes: [], filter: "all", user: null, sb: null, mode: "local" };

  const local = {
    get(k) { try { return JSON.parse(localStorage.getItem("ponte:" + k) || "[]"); } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem("ponte:" + k, JSON.stringify(v)); } catch (e) {} },
  };

  function loadScript(src) {
    return new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }

  // ---- Origen de datos ----
  const api = {
    async load() {
      if (state.mode === "local") { state.posts = local.get("posts"); state.votes = local.get("votes"); return; }
      const [p, v] = await Promise.all([
        state.sb.from("posts").select("*").order("created_at", { ascending: false }).limit(500),
        state.sb.from("votes").select("post_id,user_id").limit(5000),
      ]);
      if (p.error) throw p.error;
      state.posts = p.data.map((r) => ({ ...r, at: Date.parse(r.created_at) }));
      state.votes = (v.data || []).map((r) => ({ post: r.post_id, by: r.user_id }));
    },
    async add(post) {
      if (state.mode === "local") {
        const posts = local.get("posts"); posts.unshift({ ...post, id: crypto.randomUUID(), user_id: "local", at: Date.now() });
        local.set("posts", posts); return;
      }
      const { error } = await state.sb.from("posts").insert(post); if (error) throw error;
    },
    async remove(id) {
      if (state.mode === "local") { local.set("posts", local.get("posts").filter((p) => p.id !== id)); return; }
      const { error } = await state.sb.from("posts").delete().eq("id", id); if (error) throw error;
    },
    async toggleVote(id, has) {
      const me = myId();
      if (state.mode === "local") {
        let votes = local.get("votes");
        votes = has ? votes.filter((v) => !(v.post === id && v.by === me)) : votes.concat({ post: id, by: me });
        local.set("votes", votes); return;
      }
      const q = has ? state.sb.from("votes").delete().eq("post_id", id).eq("user_id", me) : state.sb.from("votes").insert({ post_id: id, user_id: me });
      const { error } = await q; if (error) throw error;
    },
  };
  const myId = () => (state.mode === "local" ? "local" : state.user && state.user.id);

  // ---- Interfaz ----
  function renderAuth() {
    const el = $("#auth"), send = $("#f-send");
    if (state.mode === "local") { el.innerHTML = ""; send.disabled = false; return; }
    if (state.user) {
      el.innerHTML = `<span>Conectado como <b></b></span> <button class="del" type="button" id="logout">Cerrar sesión</button>`;
      el.querySelector("b").textContent = state.user.email || "tú";
      send.disabled = false;
    } else {
      el.innerHTML = `<input id="login-email" type="email" placeholder="Tu correo para entrar" autocomplete="email"><button class="btn ghost" type="button" id="login">Recibir enlace</button>`;
      send.disabled = true;
    }
  }
  function renderBanner() {
    const b = $("#mode-banner");
    b.hidden = state.mode !== "local";
    b.textContent = "Modo local: tus aportes se guardan solo en este navegador. Cuando el proyecto conecte su base de datos gratuita, el muro será compartido con todos.";
  }
  function renderFilters() {
    const opts = [["all", "Todo"], ...Object.entries(KINDS)];
    $("#filters").innerHTML = opts.map(([k, v]) => `<button class="chip" data-f="${k}" aria-pressed="${state.filter === k}">${v}</button>`).join("");
  }
  function renderSelects() {
    const P = window.Ponte;
    $("#f-lang").innerHTML = P.langs.map((l) => `<option value="${P.esc(l.code)}">${P.esc(l.name)}</option>`).join("");
    $("#f-lang").value = P.lang;
    $("#f-kind").innerHTML = Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  }
  function renderFeed() {
    const P = window.Ponte, esc = P.esc, feed = $("#feed"), lang = P.lang;
    const langName = (P.langs.find((l) => l.code === lang) || {}).name || lang;
    const count = {}, mine = new Set(), me = myId();
    state.votes.forEach((v) => { count[v.post] = (count[v.post] || 0) + 1; if (v.by === me) mine.add(v.post); });
    const list = state.posts.filter((p) => p.lang === lang && (state.filter === "all" || p.kind === state.filter))
      .sort((a, b) => (count[b.id] || 0) - (count[a.id] || 0) || b.at - a.at);
    if (!list.length) {
      feed.innerHTML = `<div class="empty"><strong>Todavía no hay aportes de ${esc(langName.toLowerCase())}${state.filter !== "all" ? " en «" + KINDS[state.filter] + "»" : ""}</strong>Sé la primera persona en compartir algo con el formulario. Los aportes con más votos suben arriba.</div>`;
      return;
    }
    feed.innerHTML = list.map((p) => {
      let link = "";
      try { if (p.link) { const u = new URL(p.link); if (/^https?:$/.test(u.protocol)) link = `<a href="${esc(u.href)}" target="_blank" rel="noopener nofollow">${esc(u.hostname)} ↗</a>`; } } catch (e) {}
      return `<article class="post"><div class="meta"><span class="tag ${esc(p.lang)}">${esc(p.lang.toUpperCase())}</span><span class="tag kind">${esc(KINDS[p.kind] || p.kind)}</span><span>${new Date(p.at).toLocaleDateString("es", { day: "numeric", month: "short" })}</span></div>
        <h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>${link}
        <div class="actions"><button class="like" data-like="${esc(p.id)}" aria-pressed="${mine.has(p.id)}">▲ Útil · ${count[p.id] || 0}</button>${me && p.user_id === me ? `<button class="del" data-del="${esc(p.id)}">Borrar</button>` : ""}</div></article>`;
    }).join("");
  }
  const renderAll = () => { renderBanner(); renderAuth(); renderFilters(); renderFeed(); };
  async function refresh() { try { await api.load(); } catch (e) { window.Ponte.toast("No se pudieron cargar los aportes."); } renderFeed(); }

  $("#filters").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { state.filter = b.dataset.f; renderFilters(); renderFeed(); } });
  $("#feed").addEventListener("click", async (e) => {
    const l = e.target.closest("[data-like]"), d = e.target.closest("[data-del]");
    try {
      if (l) {
        if (!myId()) return window.Ponte.toast("Entra con tu correo para votar.");
        const id = l.dataset.like, has = state.votes.some((v) => v.post === id && v.by === myId());
        await api.toggleVote(id, has); await refresh();
      }
      if (d) { await api.remove(d.dataset.del); window.Ponte.toast("Aporte borrado"); await refresh(); }
    } catch (err) { window.Ponte.toast("No se pudo guardar el cambio. Inténtalo de nuevo."); }
  });
  $("#auth").addEventListener("click", async (e) => {
    if (e.target.id === "logout") { await state.sb.auth.signOut(); return; }
    if (e.target.id !== "login") return;
    const email = $("#login-email").value.trim();
    if (!email) return window.Ponte.toast("Escribe tu correo.");
    const { error } = await state.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname + "#comunidad" } });
    window.Ponte.toast(error ? "No se pudo enviar el enlace: " + error.message : "Revisa tu correo y abre el enlace para entrar.");
  });
  $("#add").addEventListener("submit", async (e) => {
    e.preventDefault();
    const post = { lang: $("#f-lang").value, kind: $("#f-kind").value, title: $("#f-title").value.trim(), body: $("#f-body").value.trim(), link: $("#f-link").value.trim() || null };
    if (!post.title || !post.body) return;
    $("#f-send").disabled = true; $("#f-state").textContent = "Publicando…";
    try {
      await api.add(post);
      ["#f-title", "#f-body", "#f-link"].forEach((s) => ($(s).value = ""));
      $("#f-state").textContent = ""; window.Ponte.toast("Aporte publicado");
      if (post.lang !== window.Ponte.lang) window.Ponte.setLang(post.lang);
      await refresh();
    } catch (err) { $("#f-state").textContent = "No se pudo publicar. Revisa tu conexión e inténtalo de nuevo."; }
    renderAuth();
  });
  document.addEventListener("ponte:lang", () => { if ($("#f-lang").options.length) $("#f-lang").value = window.Ponte.lang; renderFeed(); });

  document.addEventListener("ponte:ready", async () => {
    renderSelects();
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
        state.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        state.mode = "shared";
        const { data } = await state.sb.auth.getSession(); state.user = data.session ? data.session.user : null;
        state.sb.auth.onAuthStateChange((_ev, session) => { state.user = session ? session.user : null; renderAuth(); renderFeed(); });
      } catch (e) { state.mode = "local"; }
    }
    renderAll(); refresh();
  });
})();

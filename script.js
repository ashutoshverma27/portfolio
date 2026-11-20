(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // ---------- Small helpers ----------
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  if (!isMac) $$("[data-mod]").forEach((k) => (k.textContent = "Ctrl K"));

  const toastEl = $(".toast");
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast("Email copied to clipboard"); }
    catch { window.location.href = `mailto:${text}`; }
  };
  $$(".copy-email").forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy)));

  // Local time in Noida
  const clock = $("#clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const tick = () => (clock.textContent = `${fmt.format(new Date())} IST`);
    tick();
    setInterval(tick, 30000);
  }

  // ---------- Header: shadow, scroll progress, active link ----------
  const bar = $(".topbar");
  const progress = $(".progress span");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
    bar.classList.toggle("scrolled", scrollY > 8);
  };

  const navLinks = new Map($$(".nav a").map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a, id) => a.classList.toggle("active", id === e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  navLinks.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  // ---------- Reveal on scroll ----------
  let pending = $$(".reveal");
  const revealCheck = () => {
    let i = 0;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top >= innerHeight * 0.92) return true;
      el.style.transitionDelay = `${Math.min(i++ * 80, 320)}ms`;
      el.classList.add("in");
      setTimeout(() => (el.style.transitionDelay = ""), 1200);
      return false;
    });
  };

  // ---------- Interactive diagrams ----------
  const figs = $$(".fig");
  if (!matchMedia("(hover: hover)").matches) {
    $$(".fig-hint").forEach((h) => (h.textContent = "Tap a box to explore"));
  }

  const play = (fig) => {
    if (reduceMotion) return;
    fig.classList.remove("play");
    void fig.offsetWidth; // restart the animation
    fig.classList.add("play");
    clearTimeout(fig._playTimer);
    fig._playTimer = setTimeout(() => fig.classList.remove("play"), 1800);
  };

  figs.forEach((fig) => {
    const nodes = $$(".nd", fig);
    const edges = $$(".ln", fig);
    const title = $(".fig-note-title", fig);
    const body = $(".fig-note-body", fig);
    const reset = () => {
      fig.classList.remove("focus");
      nodes.forEach((n) => n.classList.remove("on", "near"));
      edges.forEach((l) => l.classList.remove("on"));
      title.textContent = "System overview";
      body.textContent = fig.dataset.default;
    };
    const select = (node) => {
      const id = node.dataset.id;
      const near = new Set((node.dataset.rel || "").split(" ").filter(Boolean));
      fig.classList.add("focus");
      edges.forEach((l) => {
        const ends = l.dataset.n.split(" ");
        const hit = ends.includes(id);
        l.classList.toggle("on", hit);
        if (hit) ends.forEach((x) => near.add(x));
      });
      nodes.forEach((n) => {
        n.classList.toggle("on", n === node);
        n.classList.toggle("near", n !== node && near.has(n.dataset.id));
      });
      title.textContent = node.dataset.name;
      body.textContent = node.dataset.note;
    };

    nodes.forEach((n, i) => {
      n.style.setProperty("--i", i);
      n.setAttribute("role", "button");
      n.setAttribute("aria-label", n.dataset.name);
      n.addEventListener("mouseenter", () => select(n));
      n.addEventListener("focus", () => select(n));
      n.addEventListener("click", () => select(n));
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n); } });
    });
    $(".dg", fig).addEventListener("mouseleave", () => { if (!fig.contains(document.activeElement)) reset(); });
    fig.addEventListener("focusout", (e) => { if (!fig.contains(e.relatedTarget)) reset(); });
    reset();
  });

  // ---------- Projects: sticky stage on desktop, inline on mobile ----------
  const cases = $$(".case");
  const stage = $(".stage-figs");
  const stageNo = $("[data-stage-no]");
  const dots = $$(".stage-dots button");
  const desktop = matchMedia("(min-width: 980px)");
  let activeIndex = -1;

  const activate = (i) => {
    if (i === activeIndex) return;
    activeIndex = i;
    cases.forEach((c, k) => c.classList.toggle("active", k === i));
    if (desktop.matches) {
      figs.forEach((f, k) => f.classList.toggle("active", k === i));
      play(figs[i]);
    }
    stageNo.textContent = String(i + 1).padStart(2, "0");
    dots.forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
  };

  const layout = () => {
    if (desktop.matches) figs.forEach((f) => stage.appendChild(f));
    else figs.forEach((f, k) => $(".fig-slot", cases[k]).appendChild(f));
    const i = activeIndex < 0 ? 0 : activeIndex;
    activeIndex = -1;
    activate(i);
  };
  layout();
  desktop.addEventListener("change", layout);

  // The project crossing the middle of the screen is the active one
  const pickCase = () => {
    const mid = innerHeight / 2;
    let best = 0, bestD = Infinity;
    cases.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
      if (d < bestD) { bestD = d; best = i; }
    });
    activate(best);
  };

  // Mobile: play each diagram once when it scrolls into view
  const figSpy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !desktop.matches) { play(e.target); figSpy.unobserve(e.target); }
    });
  }, { threshold: 0.35 });
  figs.forEach((f) => figSpy.observe(f));

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY;
    const offset = desktop.matches && el.classList.contains("case") ? (innerHeight - el.offsetHeight) / 2 : 84;
    scrollTo({ top: top - Math.max(offset, 84), behavior: reduceMotion ? "auto" : "smooth" });
  };
  dots.forEach((d) => d.addEventListener("click", () => goTo(d.dataset.go)));
  $$(".tl-links a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); goTo(a.getAttribute("href").slice(1)); }));

  // ---------- Experience timeline fill ----------
  const timeline = $(".timeline");
  const items = $$(".tl-item");
  const fillTimeline = () => {
    if (!timeline) return;
    const r = timeline.getBoundingClientRect();
    const pivot = innerHeight * 0.6;
    const f = Math.min(1, Math.max(0, (pivot - r.top) / r.height));
    timeline.style.setProperty("--fill", f.toFixed(4));
    items.forEach((it) => {
      const dotY = it.getBoundingClientRect().top + 18;
      it.classList.toggle("lit", dotY < pivot);
    });
  };

  // ---------- Tech stack filter ----------
  const names = { rcs: "RCS Engine", ucs: "Unified Communication Service", up: "UpNest" };
  const filterBtns = $$(".filter button");
  const filterCount = $(".filter-count");
  const cards = $$(".cap-card");
  const applyFilter = (f) => {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
    let count = 0;
    cards.forEach((card) => {
      let hits = 0;
      $$(".tags li", card).forEach((li) => {
        const on = f !== "all" && (li.dataset.p || "").split(" ").includes(f);
        li.classList.toggle("hit", on);
        li.classList.toggle("off", f !== "all" && !on);
        if (on) hits++;
      });
      card.classList.toggle("dim", f !== "all" && hits === 0);
      count += hits;
    });
    filterCount.textContent = f === "all" ? "" : `${count} tools used on ${names[f]}`;
  };
  filterBtns.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.f)));

  // ---------- Scroll loop ----------
  let ticking = false;
  const onFrame = () => { onScroll(); fillTimeline(); pickCase(); revealCheck(); ticking = false; };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  addEventListener("resize", onFrame);
  onFrame();

  // ---------- Quick-jump menu (⌘K / Ctrl K) ----------
  const dialog = $("#cmdk");
  const input = $("#cmdk-input");
  const list = $("#cmdk-list");
  const email = "ashutoshverma2799@gmail.com";
  const commands = [
    { group: "Sections", label: "Projects", hint: "Section", run: () => goTo("work") },
    { group: "Sections", label: "Experience", hint: "Section", run: () => goTo("experience") },
    { group: "Sections", label: "Tech Stack", hint: "Section", run: () => goTo("stack") },
    { group: "Sections", label: "Contact", hint: "Section", run: () => goTo("contact") },
    { group: "Projects", label: "RCS Engine", hint: "Realtor.com", run: () => goTo("rcs") },
    { group: "Projects", label: "Unified Communication Service", hint: "Realtor.com", run: () => goTo("ucs") },
    { group: "Projects", label: "UpNest Platform Modernization", hint: "UpNest.com", run: () => goTo("upnest") },
    { group: "Actions", label: "Copy email address", hint: email, run: () => copy(email) },
    { group: "Actions", label: "Send an email", hint: "Opens mail app", run: () => (location.href = `mailto:${email}`) },
    { group: "Actions", label: "Open resume (PDF)", hint: "New tab", run: () => open("assets/Ashutosh_Verma_Resume.pdf", "_blank", "noopener") },
    { group: "Links", label: "LinkedIn", hint: "linkedin.com", run: () => open("https://linkedin.com/in/ashutosh-verma27", "_blank", "noopener") },
    { group: "Links", label: "GitHub", hint: "github.com", run: () => open("https://github.com/ashutoshverma27", "_blank", "noopener") },
  ];
  let shown = [];
  let sel = 0;
  let lastFocus = null;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = commands.filter((c) => !q || `${c.label} ${c.group} ${c.hint}`.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) {
      list.innerHTML = `<li class="cmdk-empty">No results for “${input.value.replace(/[<>&]/g, "")}”</li>`;
      return;
    }
    let group = "";
    shown.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const g = document.createElement("li");
        g.className = "cmdk-group";
        g.setAttribute("role", "presentation");
        g.textContent = group;
        list.appendChild(g);
      }
      const li = document.createElement("li");
      li.className = "cmdk-item";
      li.id = `cmdk-opt-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === sel));
      li.innerHTML = `<span></span><span></span>`;
      li.firstChild.textContent = c.label;
      li.lastChild.textContent = c.hint;
      li.addEventListener("mousemove", () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener("click", () => runAt(i));
      list.appendChild(li);
    });
    input.setAttribute("aria-activedescendant", `cmdk-opt-${sel}`);
  };
  const mark = () => {
    $$(".cmdk-item", list).forEach((li, i) => li.setAttribute("aria-selected", String(i === sel)));
    const cur = $(`#cmdk-opt-${sel}`);
    if (cur) { cur.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", cur.id); }
  };
  const openMenu = () => {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    sel = 0;
    render();
    input.focus();
  };
  const closeMenu = () => {
    dialog.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  const runAt = (i) => { const c = shown[i]; if (!c) return; closeMenu(); setTimeout(c.run, 10); };

  $$("[data-cmdk-open]").forEach((b) => b.addEventListener("click", openMenu));
  $$("[data-cmdk-close]").forEach((b) => b.addEventListener("click", closeMenu));
  input.addEventListener("input", () => { sel = 0; render(); });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); mark(); }
    else if (e.key === "Enter") { e.preventDefault(); runAt(sel); }
    else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
  });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.hidden ? openMenu() : closeMenu();
    } else if (e.key === "/" && dialog.hidden && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      openMenu();
    }
  });
})();

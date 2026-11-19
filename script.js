(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Cursor spotlight ----
  const spot = document.querySelector(".spotlight");
  if (spot && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    let raf = 0;
    window.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        spot.style.setProperty("--x", `${e.clientX}px`);
        spot.style.setProperty("--y", `${e.clientY}px`);
      });
    }, { passive: true });
  }

  // ---- Per-card glow follows the cursor ----
  document.querySelectorAll(".case").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ---- Count-up numbers ----
  const fmt = new Intl.NumberFormat("en-US");
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---- Reveal on scroll (staggered) ----
  const revealer = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .forEach((entry, i) => {
        const el = entry.target;
        el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
        el.classList.add("in");
        el.querySelectorAll("[data-count]").forEach(countUp);
        // clear the delay so hover transitions stay snappy
        setTimeout(() => { el.style.transitionDelay = ""; }, 1200);
        revealer.unobserve(el);
      });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

  // ---- Active nav link ----
  const links = new Map(
    [...document.querySelectorAll("[data-nav]")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const setActive = (id) => links.forEach((a, key) => a.classList.toggle("active", key === id));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll("main .section").forEach((s) => spy.observe(s));

  // ---- Local time in Noida ----
  const clock = document.getElementById("clock");
  if (clock) {
    const timeFmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
    });
    const update = () => { clock.textContent = timeFmt.format(new Date()); };
    update();
    setInterval(update, 30_000);
  }

  // ---- Copy email ----
  const copyBtn = document.getElementById("copy-email");
  if (copyBtn) {
    const label = copyBtn.querySelector(".copy-text");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.email);
        label.textContent = "Copied ✓";
        copyBtn.classList.add("copied");
      } catch {
        label.textContent = copyBtn.dataset.email;
      }
      setTimeout(() => { label.textContent = "Copy email"; copyBtn.classList.remove("copied"); }, 2000);
    });
  }

  // ---- Footer year ----
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();

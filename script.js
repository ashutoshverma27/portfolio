(() => {
  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Hairline under the header once the page scrolls
  const bar = document.querySelector(".topbar");
  const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Underline the nav link for the section in view
  const links = new Map(
    [...document.querySelectorAll(".nav a")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a, id) => a.classList.toggle("active", id === e.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  links.forEach((_, id) => {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });
})();

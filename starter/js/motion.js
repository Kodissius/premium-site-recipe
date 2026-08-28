/* ============================================================================
   MOTION — three tiers, and only three.
     Tier 1  page glide          (Lenis)
     Tier 2  one pinned scrub    (ScrollTrigger, driven through a proxy)
     Tier 3  reveal on enter     (one class, once)

   Debug hooks (build these on day one — see recipe/05-verify.md):
     ?p=0.42   freeze the signature scene at a progress value
     ?ss=2000  translate the page instead of scrolling (headless screenshots)
   Both disable smooth scroll AND the pin. They must not coexist with the
   trigger — a live ScrollTrigger will reset progress mid-capture.
   ========================================================================== */
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params  = new URLSearchParams(location.search);
  const pParam  = params.get("p");
  const ssParam = params.get("ss");
  const debug   = pParam !== null || ssParam !== null;

  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- phase labels — MIRRORS SEG in js/scene.js ------------- */
  const phases = gsap.utils.toArray(".phase-label");
  const phaseAt = (p) =>
    p < 0.08 ? 0 : p < 0.20 ? 1 : p < 0.55 ? 2 : p < 0.75 ? 3 : p < 0.90 ? 4 : 5;
  const setPhase = (i) =>
    phases.forEach((el) => el.classList.toggle("active", +el.dataset.phase === i));

  /* ---------------- TIER 1: page glide ----------------------------------- */
  if (!reduced && !debug && matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    window.__lenis = lenis;                        // exposed for QA scripts
    lenis.on("scroll", ScrollTrigger.update);      // triggers see Lenis's position
    gsap.ticker.add((t) => lenis.raf(t * 1000));   // one clock, not two rAF loops
    gsap.ticker.lagSmoothing(0);                   // no catch-up jump after a stall
  }

  /* ---------------- TIER 2: the one pinned scrub ------------------------- */
  if (!reduced && !debug) {
    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=500%",     // MIRRORS SEG in js/scene.js and phaseAt() above
        pin: ".hero-pin",
        scrub: 0.5,        // smoothing constant: wheel ticks become one glide
      },
      onUpdate() {
        window.__setProgress && window.__setProgress(proxy.p);
        setPhase(phaseAt(proxy.p));
        gsap.set(".scroll-hint", { opacity: proxy.p > 0.03 ? 0 : 1 });
        gsap.set(".hero-copy", { opacity: 1 - clamp01((proxy.p - 0.16) / 0.10) });
      },
    });
    setPhase(0);

    /* the ONE kinetic-type moment on the page */
    gsap.to(".hero-h1 .line > span", {
      y: 0, duration: 1.05, ease: "power4.out", stagger: 0.09, delay: 0.15,
    });
    gsap.to(".hero-sub", { opacity: 1, duration: 0.8, delay: 0.7 });
  } else {
    setPhase(1);
  }

  /* ---------------- TIER 3: reveal on enter ------------------------------ */
  gsap.utils.toArray(".strip-item, .sheet-frame, .tblock-grid").forEach((el, i) => {
    el.classList.add("reveal");
    ScrollTrigger.create({
      trigger: el,
      start: "top 82%",
      once: true,
      onEnter: () => setTimeout(() => el.classList.add("in"), (i % 4) * 80),
    });
  });

  /* ---------------- debug settle ----------------------------------------- */
  if (debug) {
    const settle = () => {
      gsap.set(".hero-h1 .line > span", { y: 0 });
      gsap.set(".hero-sub", { opacity: 1 });
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      if (pParam !== null) {
        const p = +pParam;
        window.__snapshot && window.__snapshot(p);
        setPhase(phaseAt(p));
        gsap.set(".hero-copy", { opacity: p > 0.22 ? 0 : 1 });
        gsap.set(".scroll-hint", { opacity: 0 });
      }
      if (ssParam !== null) {
        /* NOTE: a transform does not move layout position, so anything gated on
           IntersectionObserver will NOT fire under ?ss=. Use real scrolling for
           those. See recipe/05-verify.md. */
        document.body.style.transform = `translateY(-${+ssParam}px)`;
      }
    };
    settle();
    addEventListener("DOMContentLoaded", settle);
    addEventListener("load", settle);
    document.fonts && document.fonts.ready.then(settle);
  }
})();

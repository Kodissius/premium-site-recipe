/* ============================================================================
   SIGNATURE SCENE — 2D canvas, so the architecture is readable without WebGL.
   Swap the drawing for Three.js, SVG, or a stack of photographs; the contract
   below does not change.

   THE CONTRACT
     - apply(p, t) is a PURE function of progress p ∈ [0,1].
     - No internal animation state, no "current step", no accumulators.
     - t (seconds) is used ONLY for idle motion whose amplitude is itself a
       function of p and is exactly zero everywhere determinism matters.
   Everything downstream depends on this: backwards scrub, ?p= screenshots,
   deep links, and free retiming. See recipe/04-signature-scene.md.
   ========================================================================== */
(function () {
  const canvas = document.getElementById("scene");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- tokens: read once, so the scene and the CSS share one material ---- */
  const css = getComputedStyle(document.documentElement);
  const T = (n) => css.getPropertyValue(n).trim();
  const COL = {
    line:  T("--line")      || "rgba(159,180,200,.28)",
    soft:  T("--line-soft") || "rgba(159,180,200,.14)",
    panel: T("--panel")     || "#1a1d22",
    lit:   T("--panel-lit") || "#242931",
    deep:  T("--panel-deep")|| "#15181c",
    text:  T("--text")      || "#e6e8ec",
    dim:   T("--dim")       || "#8b93a0",
    accent:T("--accent")    || "#c8371e",
    ramp: [T("--data-cold") || "#2f6fd0",
           T("--data-mid")  || "#38b27a",
           T("--data-warm") || "#d9a520",
           T("--data-hot")  || "#c8371e"],
  };

  /* ======================= CHOREOGRAPHY AS DATA =========================
     Retiming the whole film is editing this object. Three places encode this
     timing: SEG, the pin length in motion.js (end: "+=500%"), and phaseAt().
     Change one, change all three.                                        */
  const SEG = {
    outline: [0.00, 0.08],   // the subject appears as line art
    build:   [0.08, 0.20],   // it gains material
    zoom:    [0.20, 0.30],   // camera dives to one detail
    examine: [0.30, 0.55],   // the detail is analysed — the substantive beat
    revise:  [0.55, 0.75],   // it changes as a result
    verify:  [0.75, 0.90],   // the change is checked
    scale:   [0.90, 1.00],   // pull back; many of them
  };

  /* ---- the entire animation engine ---- */
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const seg01 = (p, [a, b]) => clamp01((p - a) / (b - a));
  const ease  = (t) => t * t * (3 - 2 * t);              // smoothstep
  const ss    = (p, r) => ease(seg01(p, r));
  const mix   = (a, b, t) => a + (b - a) * t;
  const mixHex = (h1, h2, t) => {                        // for the data ramp
    const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = n(h1), [r2, g2, b2] = n(h2);
    return `rgb(${Math.round(mix(r1,r2,t))},${Math.round(mix(g1,g2,t))},${Math.round(mix(b1,b2,t))})`;
  };
  const heatColor = (v) => {                             // 0 cold → 1 hot
    const x = clamp01(v) * (COL.ramp.length - 1);
    const i = Math.min(COL.ramp.length - 2, Math.floor(x));
    return mixHex(COL.ramp[i], COL.ramp[i + 1], x - i);
  };

  /* ---- the subject: a generic module with four mounts and two ribs ---- */
  const W = 340, H = 210, R = 14;
  const MOUNT = [[-144, -79], [144, -79], [144, 79], [-144, 79]];
  const DETAIL = MOUNT[1];                               // the corner we dive to

  /* ======================= apply(p, t) — PURE ============================ */
  const S = {};   // frame state; every field is a function of p (and safely t)

  function apply(p, t = 0) {
    const outline = ss(p, SEG.outline);
    const build   = ss(p, SEG.build);
    const zoom    = ss(p, SEG.zoom);
    const exam    = seg01(p, SEG.examine);
    const revise  = ss(p, SEG.revise);
    const verify  = ss(p, SEG.verify);
    const scaled  = ss(p, SEG.scale);

    /* camera: two named rigs, blended — never hand-keyed */
    S.zoomLevel = mix(mix(1, 1.85, zoom), 0.30, scaled);
    S.camX      = mix(mix(0, DETAIL[0], zoom), 0, scaled);
    S.camY      = mix(mix(0, DETAIL[1], zoom), 0, scaled);

    /* "present during X, gone by Y" — the workhorse composition idiom */
    S.fill  = build;                              // line art until it has material
    S.ghost = outline * (1 - 0.35 * zoom * (1 - scaled)); // body steps aside on the dive

    /* the analysis overlay owns the frame only while examine/revise run */
    S.overlay = clamp01(exam * 1.6) * (1 - clamp01(scaled * 2.2));
    S.peak    = mix(1.0, 0.42, revise);    // illustrative index, drains on revise
    S.gusset  = revise;                    // the geometry change itself
    S.check   = verify * (1 - clamp01(scaled * 2.2)); // the measurement beat
    S.fleet   = scaled;

    /* idle sway: amplitude is a function of p, and is ZERO everywhere it
       would break determinism (before build, and once the dive starts) */
    S.sway = Math.sin(t * 0.7) * 0.005 * build * (1 - zoom);
  }

  const needsTime = (p) => ss(p, SEG.build) * (1 - ss(p, SEG.zoom)) > 0.001;

  /* ============================ DRAWING ================================= */
  let cssW = 0, cssH = 0, dpr = 1, fit = 1;

  function resize() {
    cssW = canvas.clientWidth || 1;
    cssH = canvas.clientHeight || 1;
    dpr  = Math.min(devicePixelRatio || 1,
                    matchMedia("(max-width: 768px)").matches ? 1.5 : 1.75);
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    fit = Math.min(cssW / 620, cssH / 460);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  /* one module, drawn in world coordinates centred on (0,0) */
  function drawModule(k, opts) {
    const { solid, ghost, gusset } = opts;
    ctx.lineWidth = 1.3 / k;

    if (solid > 0.001) {
      ctx.globalAlpha = solid * ghost;
      ctx.fillStyle = COL.lit;
      roundRect(-W / 2, -H / 2, W, H, R); ctx.fill();
      ctx.fillStyle = COL.panel;
      roundRect(-W / 2 + 16, -H / 2 + 16, W - 32, H - 32, R - 6); ctx.fill();
    }

    ctx.globalAlpha = ghost;
    ctx.strokeStyle = COL.line;
    roundRect(-W / 2, -H / 2, W, H, R); ctx.stroke();
    roundRect(-W / 2 + 16, -H / 2 + 16, W - 32, H - 32, R - 6); ctx.stroke();

    ctx.strokeStyle = COL.soft;
    [-60, 60].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, -H / 2 + 16); ctx.lineTo(x, H / 2 - 16); ctx.stroke();
    });

    ctx.strokeStyle = COL.line;
    MOUNT.forEach(([mx, my]) => {
      ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, Math.PI * 2); ctx.stroke();
    });

    /* the revision: a gusset grows on the examined corner */
    if (gusset > 0.001) {
      const g = 40 * gusset;
      ctx.globalAlpha = ghost * gusset;
      ctx.fillStyle = COL.lit;
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 1.6 / k;
      ctx.beginPath();
      ctx.moveTo(DETAIL[0] + 26,     DETAIL[1] - 8);
      ctx.lineTo(DETAIL[0] + 26 - g, DETAIL[1] - 8);
      ctx.lineTo(DETAIL[0] + 26,     DETAIL[1] - 8 + g);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = ghost;
    }
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const k = fit * S.zoomLevel;
    const originX = cssW / 2, originY = cssH / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(k, k);
    ctx.rotate(S.sway);
    ctx.translate(-S.camX, -S.camY);

    /* the fleet: many of them, at the pull-back */
    if (S.fleet > 0.001) {
      ctx.globalAlpha = S.fleet;
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (!r && !c) continue;
          ctx.save();
          ctx.translate(c * 430, r * 300);
          drawModule(k, { solid: 1, ghost: 0.85, gusset: 1 });
          ctx.restore();
        }
      }
    }

    drawModule(k, { solid: S.fill, ghost: S.ghost, gusset: S.gusset });

    /* the analysis overlay — the reserved second colour family, used here
       and nowhere else on the page */
    if (S.overlay > 0.001) {
      const rings = 5;
      for (let i = rings; i >= 1; i--) {
        const f = i / rings;                       // 1 = outermost = coolest
        const v = S.peak * (1 - f * 0.72);
        ctx.globalAlpha = S.overlay * (0.07 + 0.13 * (1 - f));
        ctx.fillStyle = heatColor(v);
        ctx.beginPath();
        ctx.arc(DETAIL[0], DETAIL[1], 7 + f * 34, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = S.overlay;
      ctx.strokeStyle = heatColor(S.peak);
      ctx.lineWidth = 1.6 / k;
      ctx.beginPath(); ctx.arc(DETAIL[0], DETAIL[1], 11, 0, Math.PI * 2); ctx.stroke();
    }

    /* the verification beat: a measurement bracket on the revised corner */
    if (S.check > 0.001) {
      ctx.globalAlpha = S.check;
      ctx.strokeStyle = COL.accent;
      ctx.lineWidth = 1.2 / k;
      const x0 = DETAIL[0] - 78, x1 = DETAIL[0] + 30, y = DETAIL[1] + 46;
      ctx.beginPath();
      ctx.moveTo(x0, y - 6); ctx.lineTo(x0, y + 6);
      ctx.moveTo(x0, y);     ctx.lineTo(x1, y);
      ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6);
      ctx.stroke();
    }

    ctx.restore();

    /* ---- labels in screen space (crisper than scaled canvas text) ---- */
    const sx = originX + (DETAIL[0] - S.camX) * k;
    const sy = originY + (DETAIL[1] - S.camY) * k;

    if (S.overlay > 0.01) {
      ctx.globalAlpha = S.overlay;
      ctx.font = "500 11px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillStyle = COL.dim;
      ctx.fillText("PROBE A — INDEX (ILLUSTRATIVE)", sx + 74, sy - 30);
      ctx.fillStyle = heatColor(S.peak);
      ctx.font = "600 22px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillText(S.peak.toFixed(2), sx + 74, sy - 6);
      ctx.strokeStyle = COL.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx + 14, sy - 14); ctx.lineTo(sx + 68, sy - 36); ctx.stroke();
    }
    if (S.check > 0.01) {
      ctx.globalAlpha = S.check;
      ctx.font = "500 11px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillStyle = COL.accent;
      ctx.fillText("PREDICTED 0.42  ·  MEASURED 0.44", sx - 74, sy + 78);
    }
    ctx.globalAlpha = 1;
  }

  /* ====================== THE LOOP MUST SLEEP =========================== */
  let raf = 0, running = false, current = 0, target = 0, frozen = false;

  function tick() {
    raf = 0;
    current = target;                 // motion.js already smooths via scrub: 0.5
    apply(current, performance.now() / 1000);
    render();
    if (!frozen && running && (current !== target || needsTime(current)))
      raf = requestAnimationFrame(tick);
  }
  const wake = () => { if (!frozen && running && !raf) raf = requestAnimationFrame(tick); };

  /* the ONE entry point */
  window.__setProgress = (p) => { target = p; wake(); };

  /* debug: freeze an exact frame, and stop the loop easing away from it */
  window.__snapshot = (p) => {
    frozen = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    target = current = p;
    resize(); apply(p, 0); render();
  };

  addEventListener("resize", () => {
    resize();
    if (frozen) { apply(current, 0); render(); } else wake();
  });

  new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) wake();
  }, { threshold: 0 }).observe(canvas);

  resize();
  if (reduced) { apply(0.17, 0); render(); }   // one good static frame
  else { apply(0, 0); render(); }
})();

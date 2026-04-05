/* ═══════════════════════════════════════════════════════
   DS Systems — Scroll-Driven Animation Engine
   GSAP + ScrollTrigger + Lenis
═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─── CONFIG ─── */
  const FRAME_COUNT  = 145;
  const FRAME_SPEED  = 2.0;   // animation completes at ~50% scroll
  const IMAGE_SCALE  = 0.88;  // slight padding so edges blend into bg
  const FRAME_PATH   = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;

  /* ─── STATE ─── */
  const frames       = new Array(FRAME_COUNT).fill(null);
  let   loadedCount  = 0;
  let   currentFrame = 0;
  let   bgColor      = "#080808";
  let   isReady      = false;

  /* ─── DOM REFS ─── */
  const loader        = document.getElementById("loader");
  const loaderBar     = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const canvasWrap    = document.getElementById("canvas-wrap");
  const canvas        = document.getElementById("canvas");
  const ctx           = canvas.getContext("2d");
  const marqueeWrap   = document.getElementById("marquee-wrap");
  const marqueeText   = marqueeWrap ? marqueeWrap.querySelector(".marquee-text") : null;
  const scrollContainer = document.getElementById("scroll-container");
  const heroSection   = document.getElementById("hero");
  const siteHeader    = document.getElementById("site-header");
  const navToggle     = document.querySelector(".nav-toggle");
  const mobileNav     = document.getElementById("mobile-nav");

  /* ══════════════════════════════════════════════════════
     CANVAS SETUP — devicePixelRatio aware
  ══════════════════════════════════════════════════════ */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cw  = canvasWrap.offsetWidth;
    const ch  = canvasWrap.offsetHeight;
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
    if (isReady) drawFrame(currentFrame);
  }

  /* Sample bg color from frame corner pixels */
  function sampleBgColor(img) {
    const tmp = document.createElement("canvas");
    tmp.width  = img.naturalWidth;
    tmp.height = img.naturalHeight;
    const tc = tmp.getContext("2d");
    tc.drawImage(img, 0, 0);
    try {
      // Sample corners + center edges
      const points = [
        [2, 2], [img.naturalWidth - 2, 2],
        [2, img.naturalHeight - 2],
        [img.naturalWidth - 2, img.naturalHeight - 2],
        [Math.floor(img.naturalWidth / 2), 2],
      ];
      let r = 0, g = 0, b = 0;
      points.forEach(([x, y]) => {
        const d = tc.getImageData(x, y, 1, 1).data;
        r += d[0]; g += d[1]; b += d[2];
      });
      r = Math.round(r / points.length);
      g = Math.round(g / points.length);
      b = Math.round(b / points.length);
      return `rgb(${r},${g},${b})`;
    } catch (e) {
      return "#080808";
    }
  }

  /* Draw frame with padded-cover mode */
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete) return;

    const cw = canvasWrap.offsetWidth;
    const ch = canvasWrap.offsetHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ══════════════════════════════════════════════════════
     FRAME PRELOADER — 2-phase: first 10 fast, rest bg
  ══════════════════════════════════════════════════════ */
  function updateLoader() {
    const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
    loaderBar.style.width = pct + "%";
    loaderPercent.textContent = pct + "%";
  }

  function loadFrame(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
        updateLoader();
        // Sample bg color every 20 frames
        if (i % 20 === 0) bgColor = sampleBgColor(img);
        resolve();
      };
      img.onerror = () => { loadedCount++; updateLoader(); resolve(); };
      img.src = FRAME_PATH(i + 1);
    });
  }

  async function preloadFrames() {
    // Phase 1: load first 10 frames immediately
    const firstBatch = [];
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      firstBatch.push(loadFrame(i));
    }
    await Promise.all(firstBatch);

    // Show first frame immediately
    if (frames[0]) {
      bgColor = sampleBgColor(frames[0]);
      drawFrame(0);
    }

    // Phase 2: load remaining in background
    const remaining = [];
    for (let i = 10; i < FRAME_COUNT; i++) {
      remaining.push(loadFrame(i));
    }
    await Promise.all(remaining);

    // All loaded — hide loader
    isReady = true;
    loader.classList.add("hidden");
    initAnimations();
  }

  /* ══════════════════════════════════════════════════════
     LENIS SMOOTH SCROLL
  ══════════════════════════════════════════════════════ */
  function initLenis() {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* ══════════════════════════════════════════════════════
     HERO TRANSITION — circle-wipe reveal
  ══════════════════════════════════════════════════════ */
  function initHeroTransition() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Hero fades as scroll starts
        const heroOpacity = Math.max(0, 1 - p * 18);
        heroSection.style.opacity = heroOpacity;

        // Canvas circle-wipe expands
        const wipeProgress = Math.min(1, Math.max(0, (p - 0.005) / 0.07));
        const radius = wipeProgress * 80;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;

        // Canvas fades out after Revolution of Quality section, before Services (67%–75% scroll)
        if (p > 0.67) {
          canvasWrap.style.opacity = Math.max(0, 1 - (p - 0.67) / 0.08);
        } else {
          canvasWrap.style.opacity = 1;
        }
      },
    });
  }

  /* ══════════════════════════════════════════════════════
     FRAME SCRUBBING — scroll → canvas frame
  ══════════════════════════════════════════════════════ */
  function initFrameScrub() {
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (!isReady) return;
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(
          Math.floor(accelerated * FRAME_COUNT),
          FRAME_COUNT - 1
        );
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      },
    });
  }

  /* ══════════════════════════════════════════════════════
     SECTION ANIMATIONS
  ══════════════════════════════════════════════════════ */
  function setupSectionAnimation(section) {
    const type    = section.dataset.animation;
    const persist = section.dataset.persist === "true";
    const enter   = parseFloat(section.dataset.enter) / 100;
    const leave   = parseFloat(section.dataset.leave) / 100;
    const totalH  = scrollContainer.offsetHeight - window.innerHeight;

    // Position section at midpoint of its enter/leave range
    const midPct = (enter + leave) / 2;
    section.style.top = midPct * totalH + "px";
    section.style.transform = "translateY(-50%)";

    const children = section.querySelectorAll(
      ".section-label, .section-heading, .section-body, .section-note, " +
      ".section-link, .stat, .services-label, .services-heading, " +
      ".service-cards, .card-cta"
    );

    const tl = gsap.timeline({ paused: true });
    const ease = "power3.out";

    switch (type) {
      case "fade-up":
        gsap.set(children, { y: 50, opacity: 0 });
        tl.to(children, { y: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease });
        break;
      case "slide-left":
        gsap.set(children, { x: -80, opacity: 0 });
        tl.to(children, { x: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease });
        break;
      case "slide-right":
        gsap.set(children, { x: 80, opacity: 0 });
        tl.to(children, { x: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease });
        break;
      case "scale-up":
        gsap.set(children, { scale: 0.85, opacity: 0 });
        tl.to(children, { scale: 1, opacity: 1, stagger: 0.1, duration: 1.0, ease: "power2.out" });
        break;
      case "clip-reveal":
        gsap.set(children, { clipPath: "inset(100% 0 0 0)", opacity: 0 });
        tl.to(children, {
          clipPath: "inset(0% 0 0 0)", opacity: 1,
          stagger: 0.13, duration: 1.1, ease: "power4.inOut"
        });
        break;
      case "stagger-up":
        gsap.set(children, { y: 60, opacity: 0 });
        tl.to(children, { y: 0, opacity: 1, stagger: 0.13, duration: 0.85, ease });
        break;
      case "rotate-in":
        gsap.set(children, { y: 40, rotation: 3, opacity: 0 });
        tl.to(children, { y: 0, rotation: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease });
        break;
      default:
        gsap.set(children, { opacity: 0 });
        tl.to(children, { opacity: 1, stagger: 0.1, duration: 0.8, ease });
    }

    let hasPlayed = false;
    let hasLeft   = false;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;

        if (p >= enter && p < leave) {
          section.classList.add("visible");
          if (!hasPlayed) {
            tl.play();
            hasPlayed = true;
            hasLeft   = false;
          }
        } else if (p >= leave && !persist) {
          if (!hasLeft) {
            tl.reverse();
            setTimeout(() => section.classList.remove("visible"), 800);
            hasLeft   = true;
            hasPlayed = false;
          }
        } else if (p < enter && hasPlayed && !persist) {
          tl.reverse();
          setTimeout(() => section.classList.remove("visible"), 800);
          hasPlayed = false;
          hasLeft   = false;
        }
      },
    });
  }

  /* ══════════════════════════════════════════════════════
     MARQUEE — scroll-driven horizontal slide
  ══════════════════════════════════════════════════════ */
  function initMarquee() {
    if (!marqueeWrap || !marqueeText) return;
    const speed = parseFloat(marqueeWrap.dataset.scrollSpeed) || -22;
    const enterPct = 0.52;
    const leavePct = 0.75;
    const fade = 0.04;

    // Horizontal movement
    gsap.to(marqueeText, {
      xPercent: speed,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    // Fade in/out
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enterPct - fade && p < enterPct) {
          opacity = (p - (enterPct - fade)) / fade;
        } else if (p >= enterPct && p <= leavePct) {
          opacity = 1;
        } else if (p > leavePct && p <= leavePct + fade) {
          opacity = 1 - (p - leavePct) / fade;
        }
        marqueeWrap.style.opacity = opacity;
        marqueeWrap.style.pointerEvents = opacity > 0.1 ? "none" : "none";
      },
    });
  }

  /* ══════════════════════════════════════════════════════
     HEADER SCROLL EFFECT
  ══════════════════════════════════════════════════════ */
  function initHeader() {
    ScrollTrigger.create({
      trigger: document.body,
      start: "80px top",
      onEnter:  () => siteHeader.classList.add("scrolled"),
      onLeaveBack: () => siteHeader.classList.remove("scrolled"),
    });
  }

  /* ══════════════════════════════════════════════════════
     HERO — cinematic character-split reveal
  ══════════════════════════════════════════════════════ */
  function initHeroReveal() {
    const chars   = document.querySelectorAll(".hc");
    const eyebrow = document.querySelector(".hero-eyebrow");
    const tagline = document.querySelector(".hero-tagline");
    const scroll  = document.querySelector(".hero-scroll-indicator");

    // Set initial states
    gsap.set(chars,   { y: "110%", opacity: 0 });
    gsap.set([eyebrow, tagline, scroll], { opacity: 0, y: 18 });

    // Each .hero-line is overflow:hidden, so chars clip at parent edge
    const tl = gsap.timeline({ delay: 0.3 });

    // Eyebrow slides in first
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" })

    // "DESIRE" chars
      .to(".hero-line--desire .hc", {
        y: "0%", opacity: 1,
        stagger: 0.06, duration: 0.9, ease: "power4.out"
      }, "-=0.2")

    // "SECURITY" chars
      .to(".hero-line--security .hc", {
        y: "0%", opacity: 1,
        stagger: 0.05, duration: 0.8, ease: "power4.out"
      }, "-=0.5")

    // "SYSTEMS" chars
      .to(".hero-line--sub .hc", {
        y: "0%", opacity: 1,
        stagger: 0.045, duration: 0.8, ease: "power3.out"
      }, "-=0.5")

    // Tagline + scroll indicator
      .to(tagline, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.3")
      .to(scroll,  { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4")

    // Unlock overflow so drop words can appear below the line
      .call(() => {
        const subLine = document.querySelector(".hero-line--sub");
        const titleEl = document.querySelector(".hero-title");
        if (subLine) subLine.style.overflow = "visible";
        if (titleEl) titleEl.style.overflow = "visible";
      })

    // Drop words fall in under each SYSTEMS letter
      .fromTo(".hc-drop",
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.09, duration: 0.55, ease: "power3.out" },
        "+=0.1");
  }

  /* ══════════════════════════════════════════════════════
     MOBILE NAV TOGGLE
  ══════════════════════════════════════════════════════ */
  function initMobileNav() {
    let open = false;
    navToggle.addEventListener("click", () => {
      open = !open;
      mobileNav.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      // Animate hamburger
      const spans = navToggle.querySelectorAll("span");
      if (open) {
        gsap.to(spans[0], { rotation: 45,  y: 6.5, duration: 0.3 });
        gsap.to(spans[1], { opacity: 0, duration: 0.2 });
        gsap.to(spans[2], { rotation: -45, y: -6.5, duration: 0.3 });
      } else {
        gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
        gsap.to(spans[1], { opacity: 1, duration: 0.2 });
        gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
      }
    });

    // Close on link click
    document.querySelectorAll(".mobile-link, .mobile-cta").forEach((link) => {
      link.addEventListener("click", () => {
        open = false;
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
        const spans = navToggle.querySelectorAll("span");
        gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
        gsap.to(spans[1], { opacity: 1, duration: 0.2 });
        gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     MAIN INIT — runs after all frames loaded
  ══════════════════════════════════════════════════════ */
  function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    initLenis();

    initHeroReveal();
    initHeroTransition();
    initFrameScrub();
    initHeader();
    initMobileNav();

    // Set up all scroll sections
    const sections = document.querySelectorAll(".scroll-section");
    sections.forEach((section) => {
      setupSectionAnimation(section);
    });

    // Marquee
    initMarquee();

    // Recalculate on resize (debounced)
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        ScrollTrigger.refresh();
        // Re-position sections
        sections.forEach((section) => {
          const enter = parseFloat(section.dataset.enter) / 100;
          const leave = parseFloat(section.dataset.leave) / 100;
          const midPct = (enter + leave) / 2;
          const totalH = scrollContainer.offsetHeight - window.innerHeight;
          section.style.top = midPct * totalH + "px";
        });
      }, 200);
    });

    ScrollTrigger.refresh();
  }

  /* ══════════════════════════════════════════════════════
     BOOTSTRAP
  ══════════════════════════════════════════════════════ */
  window.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    preloadFrames();
  });

})();

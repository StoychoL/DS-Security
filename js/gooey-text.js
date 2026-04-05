/* ═══════════════════════════════════════════════════════
   Gooey Text Morphing — Vanilla JS
   Cycles through security service labels in the hero
═══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const TEXTS        = ["CCTV Surveillance", "Access Control", "Perimeter Security", "Smart Monitoring", "24/7 Protection"];
  const MORPH_TIME   = 1.0;   // seconds to morph between texts
  const COOLDOWN     = 0.25;  // seconds to hold each text before morphing

  const container = document.getElementById("gooey-text-container");
  if (!container) return;

  const text1 = container.querySelector(".gt-text1");
  const text2 = container.querySelector(".gt-text2");

  let textIndex = TEXTS.length - 1;
  let time      = new Date();
  let morph     = 0;
  let cooldown  = COOLDOWN;

  function setMorph(fraction) {
    text2.style.filter  = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
    fraction = 1 - fraction;
    text1.style.filter  = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
  }

  function doCooldown() {
    morph = 0;
    text2.style.filter  = "";
    text2.style.opacity = "100%";
    text1.style.filter  = "";
    text1.style.opacity = "0%";
  }

  function doMorph() {
    morph -= cooldown;
    cooldown = 0;
    let fraction = morph / MORPH_TIME;
    if (fraction > 1) {
      cooldown = COOLDOWN;
      fraction = 1;
    }
    setMorph(fraction);
  }

  function animate() {
    requestAnimationFrame(animate);
    const newTime = new Date();
    const shouldAdvance = cooldown > 0;
    const dt = (newTime.getTime() - time.getTime()) / 1000;
    time = newTime;
    cooldown -= dt;

    if (cooldown <= 0) {
      if (shouldAdvance) {
        textIndex = (textIndex + 1) % TEXTS.length;
        text1.textContent = TEXTS[textIndex % TEXTS.length];
        text2.textContent = TEXTS[(textIndex + 1) % TEXTS.length];
      }
      doMorph();
    } else {
      doCooldown();
    }
  }

  // Seed initial content
  text1.textContent = TEXTS[textIndex % TEXTS.length];
  text2.textContent = TEXTS[(textIndex + 1) % TEXTS.length];

  animate();
}());

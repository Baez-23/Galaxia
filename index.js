(() => {
  const gCanvas = document.getElementById("galaxy");
  const gCtx = gCanvas.getContext("2d");
  const sCanvas = document.getElementById("sky");
  const sCtx = sCanvas.getContext("2d");
  const mensaje = document.getElementById("dedicatoria");

  let w = (gCanvas.width = sCanvas.width = window.innerWidth);
  let h = (gCanvas.height = sCanvas.height = window.innerHeight);

  const CONFIG = {
    seed: 7,
    tilt: 0.45,
    batchSize: 9,
    armsCount: 900,
    shootingStarChance: 0.032,
    rotationSpeed: 0.00018,
  };

  let scale = Math.min(w, h) / 620;

  window.addEventListener("resize", () => {
    w = gCanvas.width = sCanvas.width = window.innerWidth;
    h = gCanvas.height = sCanvas.height = window.innerHeight;
    scale = Math.min(w, h) / 620;
  });

  let seed = CONFIG.seed;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const randUniform = (min, max) => min + rand() * (max - min);
  const randInt = (min, max) => Math.floor(randUniform(min, max + 1));
  const randGauss = (mean, std) => {
    const u = 1 - rand();
    const v = rand();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  function hsvToRgb(h, s, v) {
    h = ((h % 1) + 1) % 1;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    const map = [
      [v, t, p],
      [q, v, p],
      [p, v, t],
      [p, q, v],
      [t, p, v],
      [v, p, q],
    ][i % 6];

    return [
      Math.round(map[0] * 255),
      Math.round(map[1] * 255),
      Math.round(map[2] * 255),
    ];
  }

  const bgStars = [];
  const galaxyParticles = [];

  function generateUniverseData() {
    for (let i = 0; i < 140; i++) {
      bgStars.push({
        nx: randUniform(-0.5, 0.5),
        ny: randUniform(-0.5, 0.5),
        size: randInt(1, 3),
        phase: randUniform(0, Math.PI * 2),
        alpha: 0,
      });
    }

    for (let i = 0; i < 700; i++) {
      const r = randGauss(0, 120);
      const a = randUniform(0, 6.283);
      galaxyParticles.push({
        x: r * Math.cos(a),
        y: r * Math.sin(a),
        size: randInt(2, 4),
        rgb: hsvToRgb(0.7, 0.7, 0.3),
        twinkle: false,
        alpha: 0,
      });
    }

    for (let i = 0; i < CONFIG.armsCount; i++) {
      for (let k = 0; k < 4; k++) {
        const d = i / CONFIG.armsCount;
        const a = (k * Math.PI) / 2 + d * 5.5;
        const r = 10 + d * 290;
        const s = 4 + d * 26;
        const x = r * Math.cos(a) + randGauss(0, s);
        const y = r * Math.sin(a) + randGauss(0, s);
        const hue = 0.13 - d * 0.55;
        const v = randUniform(0.6, 1);
        galaxyParticles.push({
          x,
          y,
          size: randInt(2, 4),
          rgb: hsvToRgb(hue, 0.7, v),
          twinkle: false,
          alpha: 0,
        });
      }
    }

    for (let i = 0; i < 260; i++) {
      const r = randGauss(0, 26);
      const a = randUniform(0, 6.283);
      galaxyParticles.push({
        x: r * Math.cos(a),
        y: r * Math.sin(a),
        size: randInt(2, 5),
        rgb: hsvToRgb(0.12, 0.7, 1.0),
        twinkle: false,
        alpha: 0,
      });
    }

    for (let i = 0; i < 100; i++) {
      const r = randGauss(0, 150);
      const a = randUniform(0, 6.283);
      galaxyParticles.push({
        x: r * Math.cos(a),
        y: r * Math.sin(a),
        size: randInt(4, 7),
        rgb: [255, 255, 255],
        twinkle: true,
        phase: randUniform(0, Math.PI * 2),
        alpha: 0,
      });
    }
  }

  generateUniverseData();

  let rotationAngle = 0;
  let currentRotationSpeed = 0;
  let visibleStarsCount = 0;
  let visibleParticlesCount = 0;
  let coreAlpha = 0;
  let glowIntensity = 0;

  function drawFrame(time) {
    gCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.45;
    const cosRot = Math.cos(rotationAngle);
    const sinRot = Math.sin(rotationAngle);
    const cosTilt = Math.cos(CONFIG.tilt);
    const sinTilt = Math.sin(CONFIG.tilt);

    for (let i = 0; i < visibleStarsCount; i++) {
      const st = bgStars[i];
      if (st.alpha < 1) st.alpha = Math.min(1, st.alpha + 0.04);

      const twinkle =
        glowIntensity > 0
          ? 0.55 + 0.45 * Math.sin(time * 0.001 + st.phase) * glowIntensity
          : 1;
      const finalAlpha = st.alpha * twinkle;

      gCtx.fillStyle = `rgba(255, 255, 255, ${finalAlpha.toFixed(3)})`;
      gCtx.beginPath();
      gCtx.arc(
        cx + st.nx * w,
        cy + st.ny * h,
        Math.max(0.8, (st.size * scale) / 2),
        0,
        Math.PI * 2
      );
      gCtx.fill();
    }

    for (let i = 0; i < visibleParticlesCount; i++) {
      const p = galaxyParticles[i];
      if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + 0.045);

      const rx = p.x * cosRot - p.y * sinRot;
      const ry = p.x * sinRot + p.y * cosRot;

      const yCompressed = ry * 0.55;
      const px = (rx * cosTilt - yCompressed * sinTilt) * scale;
      const py = (rx * sinTilt + yCompressed * cosTilt) * scale;

      let radius = Math.max(0.8, (p.size * scale) / 2);
      let finalAlpha = p.alpha;

      if (p.twinkle && glowIntensity > 0) {
        const pulse = 0.7 + 0.3 * Math.sin(time * 0.002 + p.phase);
        radius *= 1 + (pulse - 1) * glowIntensity;
        finalAlpha *= pulse;
      }

      gCtx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${finalAlpha.toFixed(3)})`;
      gCtx.beginPath();
      gCtx.arc(cx + px, cy - py, radius, 0, Math.PI * 2);
      gCtx.fill();
    }

    if (coreAlpha > 0) {
      const pulse = 1 + 0.14 * Math.sin(time * 0.0015) * glowIntensity;
      const coreRadius = Math.max(6, 13 * scale) * pulse;

      if (glowIntensity > 0) {
        const aura = gCtx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          coreRadius * 3.8
        );
        aura.addColorStop(
          0,
          `rgba(255, 243, 196, ${(0.85 * glowIntensity).toFixed(3)})`
        );
        aura.addColorStop(
          0.35,
          `rgba(255, 215, 130, ${(0.32 * glowIntensity).toFixed(3)})`
        );
        aura.addColorStop(1, "rgba(255, 215, 130, 0)");

        gCtx.fillStyle = aura;
        gCtx.beginPath();
        gCtx.arc(cx, cy, coreRadius * 3.8, 0, Math.PI * 2);
        gCtx.fill();
      }

      gCtx.fillStyle = `rgba(255, 243, 196, ${coreAlpha.toFixed(3)})`;
      gCtx.beginPath();
      gCtx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      gCtx.fill();
    }
  }

  const shootingStars = [];

  function spawnShootingStar(customX, customY) {
    const tier = Math.random();
    const isBright = tier > 0.68;
    const isMedium = tier > 0.28 && tier <= 0.68;

    const startX = customX ?? Math.random() * w * 0.95;
    const startY = customY ?? Math.random() * h * 0.65;
    const angle = Math.PI * (0.14 + Math.random() * 0.24);
    const speed = isBright
      ? 6.5 + Math.random() * 3.5
      : isMedium
        ? 4.8 + Math.random() * 2.5
        : 3.5 + Math.random() * 2;

    shootingStars.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: isBright
        ? 125 + Math.random() * 75
        : isMedium
          ? 75 + Math.random() * 45
          : 38 + Math.random() * 30,
      thickness: isBright ? 2.6 : isMedium ? 1.6 : 0.9,
      headRadius: isBright ? 2.8 : isMedium ? 1.7 : 1.0,
      brightness: isBright ? 1.0 : isMedium ? 0.72 : 0.42,
      alpha: 1,
      decay: isBright
        ? 0.009 + Math.random() * 0.004
        : 0.012 + Math.random() * 0.006,
      isBright,
    });
  }

  function updateSky() {
    sCtx.clearRect(0, 0, w, h);

    if (Math.random() < CONFIG.shootingStarChance) {
      spawnShootingStar();
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const st = shootingStars[i];
      const norm = Math.hypot(st.vx, st.vy);
      const tailX = st.x - (st.vx / norm) * st.len;
      const tailY = st.y - (st.vy / norm) * st.len;
      const currentAlpha = st.alpha * st.brightness;

      const grad = sCtx.createLinearGradient(st.x, st.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 252, 238, ${currentAlpha})`);
      grad.addColorStop(0.35, `rgba(255, 243, 196, ${currentAlpha * 0.5})`);
      grad.addColorStop(1, "rgba(255, 243, 196, 0)");

      sCtx.strokeStyle = grad;
      sCtx.lineWidth = st.thickness;
      sCtx.lineCap = "round";
      sCtx.beginPath();
      sCtx.moveTo(st.x, st.y);
      sCtx.lineTo(tailX, tailY);
      sCtx.stroke();

      if (st.isBright) {
        const halo = sCtx.createRadialGradient(
          st.x,
          st.y,
          0,
          st.x,
          st.y,
          st.headRadius * 4.5
        );
        halo.addColorStop(0, `rgba(255, 250, 220, ${currentAlpha * 0.85})`);
        halo.addColorStop(1, "rgba(255, 243, 196, 0)");

        sCtx.fillStyle = halo;
        sCtx.beginPath();
        sCtx.arc(st.x, st.y, st.headRadius * 4.5, 0, Math.PI * 2);
        sCtx.fill();
      }

      sCtx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
      sCtx.beginPath();
      sCtx.arc(st.x, st.y, st.headRadius, 0, Math.PI * 2);
      sCtx.fill();

      st.x += st.vx;
      st.y += st.vy;
      st.alpha -= st.decay;

      if (st.alpha <= 0 || st.x > w + 120 || st.y > h + 120) {
        shootingStars.splice(i, 1);
      }
    }
  }

  let isBuilt = false;

  function mainLoop(time) {
    if (!isBuilt) {
      if (visibleStarsCount < bgStars.length) {
        visibleStarsCount = Math.min(bgStars.length, visibleStarsCount + 2);
      } else if (visibleParticlesCount < galaxyParticles.length) {
        visibleParticlesCount = Math.min(
          galaxyParticles.length,
          visibleParticlesCount + CONFIG.batchSize
        );
      } else {
        isBuilt = true;
        setTimeout(() => {
          mensaje.classList.add("visible");
          spawnShootingStar();
        }, 600);
      }
    }

    if (isBuilt) {
      if (coreAlpha < 1) coreAlpha = Math.min(1, coreAlpha + 0.012);
      if (glowIntensity < 1) glowIntensity = Math.min(1, glowIntensity + 0.008);

      if (currentRotationSpeed < CONFIG.rotationSpeed) {
        currentRotationSpeed += 0.000001;
      }
      rotationAngle += currentRotationSpeed;

      updateSky();
    }

    drawFrame(time);
    requestAnimationFrame(mainLoop);
  }

  sCanvas.addEventListener("pointerdown", (e) => {
    if (isBuilt) {
      spawnShootingStar(e.clientX, e.clientY);
    }
  });

  requestAnimationFrame(mainLoop);
})();
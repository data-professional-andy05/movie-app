// Halloween ambience: procedural music + page-wide effects (sky, moon, graveyard, fog,
// bats, ghosts, spiders, eyes, lightning + thunder). wheel.html injects this once into the
// Streamlit page, so it keeps running across reruns. API: window.__hwFx.
(() => {
  if (window.__hwFx) return;
  const W = window, D = document;
  const reduceMotion = !!(W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const rand = (a, b) => a + Math.random() * (b - a);
  const chance = p => Math.random() < p;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const vw = () => W.innerWidth, vh = () => W.innerHeight;

  // ------------------------------------------------------------------ styles
  const style = D.createElement("style");
  style.id = "hwfx-style";
  style.textContent = `
  body { background: #05020a; }
  .stApp, [data-testid="stAppViewContainer"], [data-testid="stHeader"], [data-testid="stMain"],
  [data-testid="stBottom"] > div { background: transparent !important; }

  #hwfx-back, #hwfx-front { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
  #hwfx-back { z-index: -1; background: radial-gradient(ellipse at 50% -10%, #3a1556 0%, #160822 45%, #05020a 80%); }
  #hwfx-front { z-index: 999980; }

  .hwfx-stars { position: absolute; top: 0; left: 0; width: 2px; height: 2px; border-radius: 50%; animation: hwfx-twinkle 4s ease-in-out infinite alternate; }
  .hwfx-stars.b { animation-duration: 6.5s; animation-delay: -3s; }
  @keyframes hwfx-twinkle { from { opacity: .25; } to { opacity: .9; } }

  .hwfx-moon {
    position: absolute; top: 7vh; right: 7vw; width: 120px; height: 120px; border-radius: 50%;
    background:
      radial-gradient(circle at 62% 38%, rgba(120,100,60,.35) 0 9%, transparent 10%),
      radial-gradient(circle at 38% 64%, rgba(120,100,60,.3) 0 13%, transparent 14%),
      radial-gradient(circle at 70% 70%, rgba(120,100,60,.25) 0 6%, transparent 7%),
      radial-gradient(circle at 35% 35%, #fffbea, #f1dea0 55%, #c7a95e 100%);
    box-shadow: 0 0 50px 14px rgba(255,236,170,.28), 0 0 170px 70px rgba(255,170,90,.12);
    animation: hwfx-moonglow 7s ease-in-out infinite alternate;
  }
  @keyframes hwfx-moonglow { to { box-shadow: 0 0 70px 22px rgba(255,236,170,.36), 0 0 200px 90px rgba(255,170,90,.16); } }

  .hwfx-cloud {
    position: absolute; left: 0; height: 70px; border-radius: 50%;
    background: radial-gradient(ellipse at center, rgba(40,18,58,.95) 0%, rgba(30,12,44,.7) 45%, transparent 72%);
    filter: blur(6px); animation: hwfx-cloud linear infinite;
  }
  @keyframes hwfx-cloud { from { transform: translateX(-40vw); } to { transform: translateX(120vw); } }

  .hwfx-horizon { position: absolute; left: 0; bottom: 0; width: 100%; height: 45vh;
    background: radial-gradient(ellipse 75% 55% at 50% 100%, rgba(255,117,24,.28), rgba(110,40,150,.28) 45%, transparent 75%); }
  .hwfx-ground { position: absolute; left: 0; bottom: 0; width: 100%; height: 24vh; min-height: 130px; }

  .hwfx-fog {
    position: absolute; left: 0; bottom: -4vh; width: 200%; height: 34vh;
    background:
      radial-gradient(ellipse 18% 55% at 10% 70%, rgba(190,170,225,.16), transparent 70%),
      radial-gradient(ellipse 22% 50% at 32% 80%, rgba(190,170,225,.12), transparent 70%),
      radial-gradient(ellipse 16% 60% at 55% 75%, rgba(190,170,225,.15), transparent 70%),
      radial-gradient(ellipse 24% 45% at 78% 82%, rgba(190,170,225,.12), transparent 70%);
    filter: blur(14px); animation: hwfx-fog 70s linear infinite;
  }
  .hwfx-fog.b { bottom: -8vh; opacity: .8; animation-duration: 110s; animation-direction: reverse; }
  @keyframes hwfx-fog { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  .hwfx-eyes { position: absolute; display: flex; gap: 9px; opacity: 0; }
  .hwfx-eyes span {
    width: 9px; height: 5px; border-radius: 50%; background: var(--c);
    box-shadow: 0 0 6px 2px var(--c); animation: hwfx-blink 2.6s ease-in-out infinite;
  }
  @keyframes hwfx-blink { 0%, 42%, 50%, 100% { transform: scaleY(1); } 46% { transform: scaleY(.1); } }

  .hwfx-bat { position: absolute; top: 0; left: 0; will-change: transform; }
  .hwfx-bat .wings { transform-origin: 50px 21px; animation: hwfx-flap var(--flap, .22s) ease-in-out infinite alternate; }
  @keyframes hwfx-flap { from { transform: scaleY(1); } to { transform: scaleY(-.55); } }

  .hwfx-ghost { position: absolute; top: 0; left: 0; filter: drop-shadow(0 0 14px rgba(200,180,255,.75)); }
  .hwfx-ghost svg { animation: hwfx-sway 2.4s ease-in-out infinite alternate; }
  @keyframes hwfx-sway { from { transform: rotate(-7deg) translateX(-6px); } to { transform: rotate(7deg) translateX(6px); } }

  .hwfx-spider { position: absolute; top: -60px; }
  .hwfx-spider::before {
    content: ""; position: absolute; left: 50%; bottom: 30px; width: 1px; height: 100vh;
    background: linear-gradient(to bottom, rgba(220,220,230,.15), rgba(220,220,230,.55));
  }
  .hwfx-spider svg { animation: hwfx-dangle 1.8s ease-in-out infinite alternate; transform-origin: 50% 0; }
  @keyframes hwfx-dangle { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }

  .hwfx-flash { position: absolute; inset: 0; background: radial-gradient(ellipse at var(--x, 50%) 0%, #e8f0ff, #9fb6ff 60%, #5a4a9a); opacity: 0; mix-blend-mode: screen; }
  .hwfx-bolt { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; filter: drop-shadow(0 0 6px #fff) drop-shadow(0 0 18px #8fb8ff); }

  h1.spooky { animation: hwfx-flicker 7s infinite; }
  @keyframes hwfx-flicker {
    0%, 18%, 21%, 63%, 66%, 100% { opacity: 1; }
    19% { opacity: .55; } 20% { opacity: .9; } 64% { opacity: .4; } 65% { opacity: .85; }
  }
  h1.spooky.hwfx-struck {
    color: #f4f8ff !important;
    text-shadow: 0 0 4px #fff, 0 0 16px #a9c8ff, 0 0 40px #6d8dff, 0 0 80px #8b00ff !important;
    animation: hwfx-jolt .55s steps(1) 1;
  }
  @keyframes hwfx-jolt {
    0% { transform: translate(0, 0) skewX(0); } 15% { transform: translate(-3px, 1px) skewX(-4deg); }
    30% { transform: translate(3px, -1px) skewX(3deg); } 45% { transform: translate(-1px, 2px); }
    60% { transform: translate(2px, 0) skewX(-2deg); } 80%, 100% { transform: translate(0, 0); }
  }

  .hwfx-sound {
    position: fixed; left: 16px; bottom: 16px; pointer-events: auto; cursor: pointer;
    font: 600 14px system-ui, sans-serif; color: #f0e6ff; padding: 8px 14px; border-radius: 20px;
    background: rgba(26,13,36,.85); border: 1px solid #ff751888; box-shadow: 0 0 12px #ff751844;
  }
  .hwfx-sound:hover { border-color: #ff7518; box-shadow: 0 0 18px #ff751888; }
  .hwfx-sound.pending { animation: hwfx-nudge 1.6s ease-in-out infinite; }
  @keyframes hwfx-nudge { 50% { box-shadow: 0 0 22px #ff7518cc; } }
  `;
  D.head.appendChild(style);

  // ------------------------------------------------------------------ static scenery
  const NS = "http://www.w3.org/2000/svg";
  const back = D.createElement("div"), front = D.createElement("div");
  back.id = "hwfx-back";
  front.id = "hwfx-front";

  const starField = cls => {
    const s = D.createElement("div");
    s.className = "hwfx-stars " + cls;
    s.style.boxShadow = Array.from({ length: 70 }, () =>
      `${rand(0, 100).toFixed(1)}vw ${rand(0, 70).toFixed(1)}vh ${chance(.15) ? 1 : 0}px rgba(255,255,255,${rand(.4, 1).toFixed(2)})`
    ).join(",");
    return s;
  };
  back.append(starField("a"), starField("b"));

  const moon = D.createElement("div");
  moon.className = "hwfx-moon";
  back.appendChild(moon);

  for (let i = 0; i < 4; i++) {
    const c = D.createElement("div");
    c.className = "hwfx-cloud";
    c.style.top = `${rand(3, 26)}vh`;
    c.style.width = `${rand(220, 420)}px`;
    const dur = rand(80, 150);
    c.style.animationDuration = `${dur}s`;
    c.style.animationDelay = `${-rand(0, dur)}s`;
    back.appendChild(c);
  }

  // Graveyard silhouette: hills, a dead tree, tombstones and crosses.
  const stones = [[230, 128, 26, 34, -4], [300, 126, 20, 26, 6], [470, 122, 32, 42, -2], [715, 126, 22, 30, 5],
                  [985, 126, 26, 36, -6], [1065, 118, 18, 26, 3]];
  const crosses = [[390, 124, -5], [850, 128, 4], [1135, 116, -3]];
  back.insertAdjacentHTML("beforeend", `
  <div class="hwfx-horizon"></div>
  <svg class="hwfx-ground" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
    <g fill="#030106" stroke="#4a1d6e" stroke-width="1.5">
      <path d="M0 200 L0 118 Q150 88 300 112 T600 104 T900 118 T1200 98 L1200 200 Z"/>
      ${stones.map(([x, y, w, h, r]) =>
        `<path transform="rotate(${r} ${x + w / 2} ${y})" d="M${x} ${y} v${-h + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} z"/>`).join("")}
      ${crosses.map(([x, y, r]) =>
        `<path transform="rotate(${r} ${x} ${y})" d="M${x - 3} ${y} v-30 h-9 v-6 h9 v-8 h6 v8 h9 v6 h-9 v30 z"/>`).join("")}
    </g>
    <g stroke="#030106" stroke-linecap="round" fill="none">
      <path d="M95 125 C92 90 99 60 90 28" stroke-width="11"/>
      <path d="M93 72 C76 58 62 54 44 40" stroke-width="5"/>
      <path d="M62 54 L54 31" stroke-width="3"/>
      <path d="M95 56 C111 46 126 40 142 20" stroke-width="5"/>
      <path d="M126 40 L144 46" stroke-width="3"/>
      <path d="M90 30 L79 8" stroke-width="4"/>
      <path d="M91 33 L103 7" stroke-width="3"/>
    </g>
  </svg>
  <div class="hwfx-fog"></div><div class="hwfx-fog b"></div>`);

  // Shared SVG defs (ghost gradient) + lightning layers.
  front.insertAdjacentHTML("beforeend", `
  <svg width="0" height="0" style="position:absolute"><defs>
    <linearGradient id="hwfx-ghost-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
      <stop offset="1" stop-color="#d8ccff" stop-opacity=".15"/>
    </linearGradient>
  </defs></svg>
  <div class="hwfx-flash"></div>
  <svg class="hwfx-bolt"></svg>`);
  const flash = front.querySelector(".hwfx-flash"), bolt = front.querySelector(".hwfx-bolt");

  D.body.append(back, front);

  // ------------------------------------------------------------------ audio
  const audio = (() => {
    const STORE = "hwfx-muted";
    let muted = false;
    try { muted = W.localStorage.getItem(STORE) === "1"; } catch (e) { /* storage blocked */ }
    let ctx = null, master, comp, music, ambience, sfx, reverb, warble;
    let started = false, seqTimer = null, nextTime = 0, step = 0, loop = 0, lastTick = 0;

    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const noiseBuf = (sec, brown) => {
      const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = brown ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w;
      }
      return buf;
    };
    const impulse = (sec, decay) => {
      const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    };
    const gainNode = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const env = (g, t, peak, attack, release) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    };

    // --- music: a slightly detuned music-box waltz in D harmonic minor (original tune)
    const BEAT = 60 / 92;
    const MELODY = [ // [midi, beats]; 16 bars of 3/4
      [69, 1], [74, 1], [77, 1], [76, 2], [74, 1], [73, 1], [76, 1], [69, 1], [74, 3],
      [69, 1], [74, 1], [77, 1], [79, 1.5], [77, .5], [76, 1], [77, 1], [74, 1], [70, 1], [69, 3],
      [70, 1], [74, 1], [79, 1], [77, 2], [76, 1], [69, 1], [73, 1], [76, 1], [74, 2], [69, 1],
      [67, 1], [70, 1], [74, 1], [73, 1], [76, 1], [79, 1], [77, 1], [76, 1], [73, 1], [74, 3],
    ];
    const CH = { Dm: [38, 53, 57], A: [45, 49, 52], Gm: [43, 50, 58], Bb: [46, 50, 53], C: [48, 52, 55], A7: [45, 49, 55] };
    const BARS = ["Dm", "A", "A", "Dm", "Dm", "C", "Bb", "A", "Gm", "Dm", "A", "Dm", "Gm", "A7", "A", "Dm"];
    const STEPS = BARS.length * 6; // half-beat grid
    const grid = Array.from({ length: STEPS }, () => []);
    let pos = 0;
    for (const [m, b] of MELODY) { grid[Math.round(pos * 2)].push({ kind: "mel", m, dur: b }); pos += b; }
    BARS.forEach((name, bar) => {
      const [bass, a, b] = CH[name];
      grid[bar * 6].push({ kind: "bass", m: bass });
      grid[bar * 6 + 2].push({ kind: "acc", m: a }, { kind: "acc", m: b });
      grid[bar * 6 + 4].push({ kind: "acc", m: a }, { kind: "acc", m: b });
    });

    function musicBox(t, m, vel, dest) {
      const f = hz(m) * (1 + rand(-0.003, 0.003));
      const out = ctx.createGain();
      env(out, t, vel, 0.004, 1.8);
      out.connect(dest);
      [[1, 1], [2.005, 0.28], [4.01, 0.07]].forEach(([mult, amp]) => {
        const o = ctx.createOscillator(), g = gainNode(amp);
        o.type = "sine";
        o.frequency.value = f * mult;
        warble.connect(o.detune);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 2);
      });
    }
    function bassNote(t, m) {
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = hz(m);
      lp.type = "lowpass";
      lp.frequency.value = 500;
      env(g, t, 0.35, 0.02, BEAT * 2.8);
      o.connect(lp).connect(g).connect(music);
      o.start(t);
      o.stop(t + BEAT * 3);
    }
    function schedule() {
      while (nextTime < ctx.currentTime + 0.3) {
        for (const ev of grid[step]) {
          if (ev.kind === "mel") {
            musicBox(nextTime, ev.m, 0.32, music);
            if (loop % 2 === 1) musicBox(nextTime + 0.012, ev.m + 12, 0.08, music); // ghostly octave on repeats
          } else if (ev.kind === "acc") musicBox(nextTime, ev.m + 12, 0.07, music);
          else bassNote(nextTime, ev.m);
        }
        if (step === STEPS - 1 && chance(0.6)) theremin(nextTime + BEAT * 2, hz(pick([81, 86, 84])), hz(pick([74, 69, 70])), 3.2, 0.06);
        nextTime += BEAT / 2;
        step = (step + 1) % STEPS;
        if (step === 0) loop++;
      }
    }

    function theremin(t, f0, f1, dur, vol) {
      const o = ctx.createOscillator(), vib = ctx.createOscillator(), vibAmt = gainNode(f0 * 0.02), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
      vib.frequency.value = 5.5;
      vib.connect(vibAmt).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(sfx);
      g.connect(reverb);
      [o, vib].forEach(n => { n.start(t); n.stop(t + dur + 0.1); });
    }

    function startDrone() {
      const lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lfoAmt = gainNode(90), g = gainNode(0.07);
      lp.type = "lowpass";
      lp.frequency.value = 220;
      lfo.frequency.value = 0.05;
      lfo.connect(lfoAmt).connect(lp.frequency);
      [36.71, 36.9, 55.0].forEach(f => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(lp);
        o.start();
      });
      lp.connect(g).connect(music);
      lfo.start();
    }
    function startWind() {
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = gainNode(0.05);
      const lfo = ctx.createOscillator(), lfoAmt = gainNode(320), lfo2 = ctx.createOscillator(), lfo2Amt = gainNode(0.035);
      src.buffer = noiseBuf(4, false);
      src.loop = true;
      bp.type = "bandpass";
      bp.frequency.value = 600;
      bp.Q.value = 1.2;
      lfo.frequency.value = 0.07;
      lfo2.frequency.value = 0.11;
      lfo.connect(lfoAmt).connect(bp.frequency);
      lfo2.connect(lfo2Amt).connect(g.gain);
      src.connect(bp).connect(g).connect(ambience);
      [src, lfo, lfo2].forEach(n => n.start());
    }

    function init() {
      if (ctx) return true;
      const AC = W.AudioContext || W.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = gainNode(muted ? 0 : 0.85);
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.connect(master).connect(ctx.destination);
      reverb = ctx.createConvolver();
      reverb.buffer = impulse(3.5, 2.6);
      reverb.connect(gainNode(0.45)).connect(comp);
      music = gainNode(0.6);
      music.connect(comp);
      music.connect(gainNode(0.7)).connect(reverb);
      ambience = gainNode(1);
      ambience.connect(comp);
      sfx = gainNode(0.9);
      sfx.connect(comp);
      sfx.connect(gainNode(0.3)).connect(reverb);
      warble = gainNode(9); // cents of "old tape" wobble on the music box
      const wob = ctx.createOscillator();
      wob.frequency.value = 0.35;
      wob.connect(warble);
      wob.start();
      return true;
    }

    function unlock() {
      if (!init()) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!started) {
        started = true;
        startDrone();
        startWind();
        nextTime = ctx.currentTime + 0.15;
        seqTimer = W.setInterval(schedule, 60);
        updateButton();
      }
    }

    function setMuted(m) {
      muted = m;
      try { W.localStorage.setItem(STORE, m ? "1" : "0"); } catch (e) { /* storage blocked */ }
      if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.15);
      updateButton();
    }

    const duck = (level, tc) => music && music.gain.setTargetAtTime(level, ctx.currentTime, tc);

    function thunder(intensity) {
      if (!started) return;
      const t = ctx.currentTime, I = Math.min(1, intensity);
      const rumble = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      rumble.buffer = noiseBuf(6, true);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.exponentialRampToValueAtTime(140, t + 2.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.9 * I, t + 0.08);
      let k = t + 0.08;
      for (let i = 0; i < 4; i++) { k += rand(0.35, 0.9); g.gain.setTargetAtTime(rand(0.25, 0.75) * I, k, 0.2); }
      g.gain.setTargetAtTime(0.0001, k + 0.4, 0.9);
      rumble.connect(lp).connect(g).connect(ambience);
      rumble.start(t);
      rumble.stop(t + 6);
      if (I > 0.6) { // close strike: sharp crack first
        const crack = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), cg = ctx.createGain();
        crack.buffer = noiseBuf(0.3, false);
        hp.type = "highpass";
        hp.frequency.value = 1200;
        env(cg, t, 0.5 * I, 0.003, 0.25);
        crack.connect(hp).connect(cg).connect(ambience);
        crack.start(t);
      }
    }

    function tick() {
      if (!started) return;
      const t = ctx.currentTime;
      if (t - lastTick < 0.035) return;
      lastTick = t;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square";
      o.frequency.value = rand(1500, 1900);
      env(g, t, 0.06, 0.001, 0.035);
      o.connect(g).connect(sfx);
      o.start(t);
      o.stop(t + 0.05);
    }

    function heartbeat(t, vol) {
      [0, 0.18].forEach((off, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(70, t + off);
        o.frequency.exponentialRampToValueAtTime(38, t + off + 0.15);
        env(g, t + off, vol * (i ? 0.7 : 1), 0.01, 0.18);
        o.connect(g).connect(sfx);
        o.start(t + off);
        o.stop(t + off + 0.25);
      });
    }

    function spinStart(sec) {
      if (!started) return;
      duck(0.18, 0.3);
      const t = ctx.currentTime;
      // Heartbeat that speeds up while the wheel spins.
      for (let at = 0.2, gap = 0.95; at < sec - 0.2; at += gap, gap = Math.max(0.42, gap * 0.9)) heartbeat(t + at, 0.5);
      // Low riser.
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf(sec, false);
      bp.type = "bandpass";
      bp.Q.value = 6;
      bp.frequency.setValueAtTime(180, t);
      bp.frequency.exponentialRampToValueAtTime(1400, t + sec);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + sec * 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
      src.connect(bp).connect(g).connect(sfx);
      src.start(t);
    }

    function reveal() {
      if (!started) return;
      const t = ctx.currentTime;
      duck(0.0001, 0.05);
      // Boom.
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(35, t + 0.9);
      env(g, t, 0.9, 0.005, 1.6);
      o.connect(g).connect(sfx);
      o.start(t);
      o.stop(t + 1.8);
      // Dissonant organ stab (D minor + tritone).
      const lp = ctx.createBiquadFilter(), sg = ctx.createGain();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(2400, t);
      lp.frequency.exponentialRampToValueAtTime(500, t + 2.5);
      env(sg, t, 0.16, 0.01, 3);
      lp.connect(sg);
      sg.connect(sfx);
      sg.connect(reverb);
      [50, 57, 62, 65, 68].forEach(m => {
        const so = ctx.createOscillator();
        so.type = "sawtooth";
        so.frequency.value = hz(m) * (1 + rand(-0.004, 0.004));
        so.connect(lp);
        so.start(t);
        so.stop(t + 3.2);
      });
      theremin(t + 1.1, hz(86), hz(74), 2.8, 0.09);
      W.setTimeout(() => duck(0.6, 1.2), 4200);
    }

    D.addEventListener("visibilitychange", () => {
      if (!ctx || !started) return;
      if (D.hidden) ctx.suspend(); else ctx.resume();
    });

    // Sound toggle button.
    const btn = D.createElement("button");
    btn.className = "hwfx-sound";
    btn.type = "button";
    function updateButton() {
      btn.classList.toggle("pending", !started);
      btn.textContent = !started ? "🔈 Click for spooky sounds" : muted ? "🔇 Sound off" : "🎵 Sound on";
      btn.title = started ? "Toggle music and sound effects" : "Browsers need a click before playing sound";
    }
    btn.addEventListener("pointerdown", e => e.stopPropagation());
    btn.addEventListener("click", () => {
      if (!started) { if (muted) setMuted(false); unlock(); } else setMuted(!muted);
    });
    updateButton();
    front.appendChild(btn);

    return { unlock, thunder, tick, spinStart, reveal, isMuted: () => muted };
  })();

  // Any click/key on the page can start the audio (browsers block autoplay).
  ["pointerdown", "keydown"].forEach(ev => D.addEventListener(ev, () => audio.unlock(), { passive: true }));

  // ------------------------------------------------------------------ moving creatures
  const BAT_SVG = `
    <g class="wings" fill="#0b0612">
      <path d="M46 20 C38 8 22 4 2 12 C8 16 10 22 8 28 C14 24 20 26 22 32 C26 26 32 26 36 32 C38 26 42 26 46 28 Z"/>
      <path d="M54 20 C62 8 78 4 98 12 C92 16 90 22 92 28 C86 24 80 26 78 32 C74 26 68 26 64 32 C62 26 58 26 54 28 Z"/>
    </g>
    <path fill="#0b0612" d="M50 14 L47 9 L46.5 16 C44 18 44 30 50 37 C56 30 56 18 53.5 16 L53 9 Z"/>
    <circle cx="48.6" cy="18.5" r="1" fill="#ff3b3b"/><circle cx="51.4" cy="18.5" r="1" fill="#ff3b3b"/>`;

  function spawnBat(opts = {}) {
    const size = opts.size || rand(28, 90);
    const near = (size - 28) / 62; // 0 = far, 1 = near
    const el = D.createElementNS(NS, "svg");
    el.setAttribute("viewBox", "0 0 100 40");
    el.setAttribute("class", "hwfx-bat");
    el.setAttribute("width", size);
    el.setAttribute("height", size * 0.4);
    el.innerHTML = BAT_SVG;
    el.style.setProperty("--flap", `${(0.14 + (1 - near) * 0.12).toFixed(2)}s`);
    el.style.opacity = (0.55 + near * 0.45).toFixed(2);
    if (near < 0.3) el.style.filter = "blur(.6px)";
    front.appendChild(el);

    const ltr = opts.ltr ?? chance(0.5);
    const x0 = ltr ? -size - 20 : vw() + 20, x1 = ltr ? vw() + 20 : -size - 20;
    const y0 = opts.y ?? rand(0.04, 0.6) * vh(), drift = rand(-0.2, 0.2) * vh();
    const amp = rand(10, 45), waves = rand(2, 5);
    const frames = Array.from({ length: 13 }, (_, i) => {
      const p = i / 12;
      const x = x0 + (x1 - x0) * p, y = y0 + drift * p + Math.sin(p * Math.PI * waves) * amp;
      return { transform: `translate(${x}px, ${y}px) rotate(${Math.cos(p * Math.PI * waves) * 12}deg)` };
    });
    const speed = (opts.speed || 1) * (140 + near * 320); // px/s
    el.animate(frames, { duration: Math.abs(x1 - x0) / speed * 1000, delay: opts.delay || 0, easing: "linear", fill: "both" })
      .onfinish = () => el.remove();
  }

  function batSwarm(count) {
    const ltr = chance(0.5), y = rand(0.1, 0.45) * vh();
    for (let i = 0; i < count; i++) spawnBat({ ltr, y: y + rand(-80, 80), delay: i * rand(60, 220), speed: rand(1.1, 1.5) });
  }

  // Ghost: fades in out of nothing, floats a bit, then dissolves.
  let ghosts = 0;
  function spawnGhost(opts = {}) {
    if (ghosts >= 4 && !opts.force) return;
    ghosts++;
    const size = rand(50, 110);
    const wrap = D.createElement("div");
    wrap.className = "hwfx-ghost";
    wrap.innerHTML = `
      <svg viewBox="0 0 60 80" width="${size}" height="${size * 1.33}">
        <path fill="url(#hwfx-ghost-grad)" d="M30 4 C14 4 6 18 6 34 L6 72 Q11 64 16 72 Q21 80 26 72 Q30 64 34 72 Q39 80 44 72 Q49 64 54 72 L54 34 C54 18 46 4 30 4 Z"/>
        <ellipse cx="22" cy="30" rx="4" ry="6" fill="#1a0d24"/><ellipse cx="38" cy="30" rx="4" ry="6" fill="#1a0d24"/>
        <ellipse cx="30" cy="47" rx="${rand(3, 6).toFixed(1)}" ry="${rand(4, 8).toFixed(1)}" fill="#1a0d24"/>
      </svg>`;
    front.appendChild(wrap);
    // Prefer the sides so ghosts don't sit on top of the wheel.
    const side = vw() > 1000 ? (vw() - 760) / 2 : vw() * 0.3;
    const x = chance(0.5) ? rand(10, side - size) : rand(vw() - side, vw() - size - 10);
    const y = rand(0.1, 0.65) * vh(), dx = rand(-60, 60), dy = rand(-90, -30);
    const peak = rand(0.55, 0.85);
    const T = (x2, y2, s) => `translate(${x2}px, ${y2}px) scale(${s})`;
    wrap.animate([
      { transform: T(x, y, 0.6), opacity: 0, filter: "blur(10px)" },
      { transform: T(x + dx * 0.3, y + dy * 0.3, 1), opacity: peak, filter: "blur(0px)", offset: 0.25 },
      { transform: T(x + dx * 0.6, y + dy * 0.6, 1), opacity: peak * 0.4, filter: "blur(1px)", offset: 0.45 },
      { transform: T(x + dx * 0.8, y + dy * 0.8, 1.05), opacity: peak, filter: "blur(0px)", offset: 0.65 },
      { transform: T(x + dx, y + dy, 1.4), opacity: 0, filter: "blur(12px)" },
    ], { duration: rand(5000, 8500), delay: opts.delay || 0, easing: "ease-in-out", fill: "both" })
      .onfinish = () => { wrap.remove(); ghosts--; };
  }

  function spawnSpider() {
    const el = D.createElement("div");
    el.className = "hwfx-spider";
    el.style.left = `${rand(4, 96)}vw`;
    el.innerHTML = `
      <svg viewBox="0 0 40 40" width="34" height="34">
        <g stroke="#120a18" stroke-width="1.6" fill="none" stroke-linecap="round">
          <path d="M17 18 L8 10 L3 15"/><path d="M17 21 L6 18 L2 23"/><path d="M17 24 L7 26 L4 32"/><path d="M18 26 L11 32 L10 38"/>
          <path d="M23 18 L32 10 L37 15"/><path d="M23 21 L34 18 L38 23"/><path d="M23 24 L33 26 L36 32"/><path d="M22 26 L29 32 L30 38"/>
        </g>
        <circle cx="20" cy="23" r="6.5" fill="#120a18"/><circle cx="20" cy="14" r="4" fill="#120a18"/>
        <circle cx="18.6" cy="13.5" r=".9" fill="#ff3b3b"/><circle cx="21.4" cy="13.5" r=".9" fill="#ff3b3b"/>
      </svg>`;
    front.appendChild(el);
    const drop = rand(0.15, 0.45) * vh();
    el.animate([
      { transform: "translateY(0)" },
      { transform: `translateY(${drop}px)`, offset: 0.3, easing: "ease-in-out" },
      { transform: `translateY(${drop - 25}px)`, offset: 0.45 },
      { transform: `translateY(${drop}px)`, offset: 0.6 },
      { transform: "translateY(0)" },
    ], { duration: rand(9000, 14000), easing: "ease-out", fill: "both" }).onfinish = () => el.remove();
  }

  function spawnEyes() {
    const el = D.createElement("div");
    el.className = "hwfx-eyes";
    el.style.setProperty("--c", pick(["#ffcc00", "#ff2a2a", "#9dff3a"]));
    el.style.left = `${rand(3, 95)}vw`;
    el.style.bottom = `${rand(3, 16)}vh`;
    el.innerHTML = "<span></span><span></span>";
    back.appendChild(el);
    el.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { opacity: 0.9, offset: 0.85 }, { opacity: 0 }],
      { duration: rand(3500, 6000), easing: "ease-in-out" }).onfinish = () => el.remove();
  }

  // ------------------------------------------------------------------ lightning
  function boltPath(x, yEnd) {
    let y = -10, d = `M${x} ${y}`;
    const branches = [];
    while (y < yEnd) {
      y += rand(18, 45);
      x += rand(-35, 35);
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
      if (chance(0.12)) branches.push([x, y]);
    }
    for (let [bx, by] of branches) {
      const dir = chance(0.5) ? 1 : -1;
      d += ` M${bx.toFixed(0)} ${by.toFixed(0)}`;
      for (let i = 0, n = 2 + Math.floor(rand(0, 4)); i < n; i++) {
        bx += dir * rand(10, 40);
        by += rand(15, 35);
        d += ` L${bx.toFixed(0)} ${by.toFixed(0)}`;
      }
    }
    return d;
  }

  function strike(opts = {}) {
    const big = !!opts.big;
    const x = rand(0.08, 0.92) * vw();
    if (!reduceMotion) {
      bolt.setAttribute("viewBox", `0 0 ${vw()} ${vh()}`);
      bolt.innerHTML = `<path d="${boltPath(x, rand(0.35, big ? 0.85 : 0.65) * vh())}" fill="none" stroke="#fff"
        stroke-width="${big ? 3.5 : 2.5}" stroke-linejoin="bevel"/>`;
      bolt.animate([{ opacity: 0 }, { opacity: 1, offset: 0.05 }, { opacity: 0.15, offset: 0.25 }, { opacity: 0.9, offset: 0.4 }, { opacity: 0 }],
        { duration: 650, easing: "linear" });
    }
    flash.style.setProperty("--x", `${(x / vw() * 100).toFixed(0)}%`);
    const peak = reduceMotion ? 0.12 : big ? 0.6 : 0.4;
    flash.animate([{ opacity: 0 }, { opacity: peak, offset: 0.05 }, { opacity: 0.05, offset: 0.25 }, { opacity: peak * 0.8, offset: 0.4 }, { opacity: 0 }],
      { duration: 900, easing: "ease-out" });
    D.querySelectorAll("h1.spooky").forEach(h => {
      h.classList.remove("hwfx-struck");
      void h.offsetWidth; // restart the animation
      h.classList.add("hwfx-struck");
      W.setTimeout(() => h.classList.remove("hwfx-struck"), 700);
    });
    // Sound travels slower than light.
    const dist = big ? 0 : rand(0.2, 1);
    W.setTimeout(() => audio.thunder(1 - dist * 0.6), 150 + dist * 1800);
  }

  // ------------------------------------------------------------------ ambient loop
  const every = (min, max, fn, first) => {
    const run = () => { if (!D.hidden) fn(); W.setTimeout(run, rand(min, max) * 1000); };
    W.setTimeout(run, (first ?? rand(min, max)) * 1000);
  };
  every(2.5, 7, () => (chance(0.08) ? batSwarm(Math.floor(rand(6, 11))) : spawnBat()), 1);
  every(6, 13, () => spawnGhost(), 3);
  every(14, 32, () => strike(), 5);
  every(20, 40, spawnSpider, 12);
  every(7, 15, spawnEyes, 6);

  // ------------------------------------------------------------------ public API
  W.__hwFx = {
    unlock: audio.unlock,
    tick: audio.tick,
    spinStart(sec) {
      audio.spinStart(sec);
      for (let i = 0; i < 3; i++) spawnBat({ delay: i * 400, speed: 1.4 });
    },
    reveal() {
      strike({ big: true });
      audio.reveal();
      batSwarm(Math.floor(rand(10, 16)));
      for (let i = 0; i < 3; i++) spawnGhost({ force: true, delay: 300 + i * 450 });
    },
    strike,
  };
})();

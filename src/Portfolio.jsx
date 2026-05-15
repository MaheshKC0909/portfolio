import { useState, useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=UnifrakturMaguntia&family=Inter:wght@400;500;600&family=Share+Tech+Mono&display=swap');

  :root {
    --bg: #080508;
    --bg2: #0e0a10;
    --bg3: #120d14;
    --blood: #8b0000;
    --blood2: #c0392b;
    --bone: #d4c5a0;
    --bone2: #e8dcc0;
    --fog: rgba(180,160,200,0.06);
    --purple: #4a1a6b;
    --purple2: #7b2fa0;
    --green: #1a4a1a;
    --green2: #2d7a2d;
    --toxic: #39ff14;
    --ember: #ff6600;
    --border: rgba(139,0,0,0.3);
    --border2: rgba(212,197,160,0.12);
    --text: #c8b8d0;
    --dim: rgba(200,184,208,0.55);
    --dim2: rgba(200,184,208,0.3);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; scroll-padding-top: 80px; }
  body {
    background: var(--bg); color: var(--text);
    font-family: 'Inter', sans-serif;
    overflow-x: hidden; cursor: none;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--blood); }

  .portfolio-root { position: relative; min-height: 100vh; }

  /* ── Background ── */
  .cobweb-bg {
    position: fixed; inset: 0;
    background-image:
      radial-gradient(ellipse at 0% 0%, rgba(139,0,0,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(74,26,107,0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(139,0,0,0.02) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  /* Fog layers */
  .fog-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .fog-strip {
    position: absolute; width: 200%; height: 120px;
    background: linear-gradient(90deg, transparent, rgba(180,160,200,0.04), rgba(140,120,170,0.07), rgba(180,160,200,0.04), transparent);
    animation: fogDrift var(--dur) var(--delay) ease-in-out infinite alternate;
  }
  @keyframes fogDrift {
    0% { transform: translateX(-20%) translateY(var(--ty,0px)); opacity: 0.4; }
    100% { transform: translateX(0%) translateY(calc(var(--ty,0px) + 20px)); opacity: 0.8; }
  }

  /* Floating orbs / will-o-wisps */
  .wisp-field { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .wisp {
    position: absolute; border-radius: 50%; opacity: 0;
    animation: wispFloat var(--dur) var(--delay) ease-in-out infinite;
    filter: blur(6px);
  }
  @keyframes wispFloat {
    0% { opacity: 0; transform: translateY(100vh) scale(0) translateX(0); }
    20% { opacity: var(--max-op); }
    50% { transform: translateY(40vh) scale(1) translateX(var(--dx,20px)); }
    80% { opacity: var(--max-op); }
    100% { opacity: 0; transform: translateY(-20px) scale(0.5) translateX(var(--dx2,-20px)); }
  }

  /* Blood drip */
  .drip-container { position: fixed; top: 0; left: 0; right: 0; height: 60px; pointer-events: none; z-index: 5; }
  .drip {
    position: absolute; top: 0; width: 3px;
    background: linear-gradient(to bottom, var(--blood), var(--blood2), transparent);
    border-radius: 0 0 50% 50%;
    animation: drip var(--dur) var(--delay) ease-in infinite;
    transform-origin: top;
  }
  @keyframes drip {
    0% { height: 0; opacity: 0; }
    10% { opacity: 1; }
    60% { height: var(--len); opacity: 0.9; }
    100% { height: calc(var(--len) + 8px); opacity: 0; }
  }

  .scanline {
    position: fixed; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(139,0,0,0.5), transparent);
    animation: scanline 8s linear infinite; z-index: 999; pointer-events: none;
  }
  @keyframes scanline {
    0% { top: -2px; opacity: 0; } 5% { opacity: 0.6; }
    95% { opacity: 0.3; } 100% { top: 100vh; opacity: 0; }
  }

  .noise-overlay {
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 1; opacity: 0.5;
  }
  .vignette {
    position: fixed; inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%);
    pointer-events: none; z-index: 1;
  }

  /* Corner cobwebs */
  .cobweb-corner { position: fixed; z-index: 10; pointer-events: none; opacity: 0.35; }
  .cobweb-corner.tl { top: 0; left: 0; }
  .cobweb-corner.tr { top: 0; right: 0; transform: scaleX(-1); }
  .cobweb-corner.bl { bottom: 0; left: 0; transform: scaleY(-1); }

  /* HUD */
  .hud-element {
    position: fixed; font-family: 'Share Tech Mono', monospace;
    font-size: 0.58rem; color: rgba(139,0,0,0.4);
    letter-spacing: 1.5px; pointer-events: none; z-index: 10; line-height: 2;
  }
  .hud-tl { top: 108px; left: 24px; }
  .hud-tr { top: 108px; right: 24px; text-align: right; }
  .hud-bl { bottom: 60px; left: 24px; }
  .hud-br { bottom: 60px; right: 24px; text-align: right; }
  .hud-accent { color: rgba(57,255,20,0.4); animation: hudFlicker 4s ease infinite; }
  .hud-warn { color: rgba(139,0,0,0.6); }
  @keyframes hudFlicker { 0%,90%,92%,94%,100%{opacity:1} 91%,93%{opacity:0.2} }

  /* Progress bar — blood fill */
  .progress-bar {
    position: fixed; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--blood), var(--blood2), var(--blood));
    background-size: 200% 100%;
    transform-origin: left; z-index: 200;
    transition: transform 0.1s linear;
    box-shadow: 0 0 8px var(--blood);
    animation: bloodFlow 4s linear infinite;
  }
  @keyframes bloodFlow { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }

  /* Section dots */
  .section-dots {
    position: fixed; right: 28px; top: 50%;
    transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 10px; z-index: 50;
  }
  .section-dot {
    width: 6px; height: 6px; border-radius: 50%;
    border: 1px solid rgba(139,0,0,0.4); background: transparent;
    cursor: pointer; transition: all 0.3s;
  }
  .section-dot.active {
    background: var(--blood2); border-color: var(--blood2);
    box-shadow: 0 0 10px var(--blood); transform: scale(1.5);
    animation: skullPulse 1.5s ease infinite;
  }
  @keyframes skullPulse {
    0%,100%{box-shadow:0 0 6px var(--blood)} 50%{box-shadow:0 0 18px var(--blood),0 0 35px rgba(139,0,0,0.4)}
  }

  /* Custom cursor — skull */
  .custom-cursor-skull {
    position: fixed; width: 28px; height: 28px;
    pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%);
    will-change: left, top;
    font-size: 22px; line-height: 1;
    text-align: center;
    filter: drop-shadow(0 0 6px rgba(139,0,0,0.8));
    transition: transform 0.15s;
  }
  .cursor-hover .custom-cursor-skull { transform: translate(-50%,-50%) scale(1.4); }

  /* NAV */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 48px;
    background: rgba(8,5,8,0.92); backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(139,0,0,0.25); transition: padding 0.3s;
  }
  nav.scrolled { padding: 13px 48px; }
  .nav-logo {
    font-family: 'UnifrakturMaguntia', cursive; font-size: 1.5rem;
    color: var(--bone); letter-spacing: 3px;
    text-shadow: 0 0 20px rgba(139,0,0,0.6); text-decoration: none;
    animation: logoPulse 5s ease infinite;
  }
  @keyframes logoPulse {
    0%,100%{text-shadow:0 0 20px rgba(139,0,0,0.6)}
    50%{text-shadow:0 0 35px rgba(139,0,0,0.9),0 0 60px rgba(139,0,0,0.4)}
  }
  .nav-logo span { color: var(--blood2); }
  .nav-links { display: flex; gap: 36px; list-style: none; }
  .nav-links a {
    font-family: 'Cinzel', serif; font-size: 0.72rem;
    color: var(--dim); text-decoration: none; letter-spacing: 2px;
    text-transform: uppercase; transition: color 0.3s;
    position: relative; padding-bottom: 4px;
  }
  .nav-links a::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px; background: linear-gradient(90deg, var(--blood), var(--blood2));
    transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
  }
  .nav-links a:hover, .nav-links a.active { color: var(--blood2); }
  .nav-links a:hover::after, .nav-links a.active::after { transform: scaleX(1); }
  .nav-status {
    font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: var(--toxic);
    display: flex; align-items: center; gap: 8px;
    padding: 6px 14px; border: 1px solid rgba(57,255,20,0.2);
    background: rgba(57,255,20,0.03);
  }
  .status-dot {
    width: 7px; height: 7px; background: var(--toxic); border-radius: 50%;
    animation: pulse 2s ease infinite; box-shadow: 0 0 8px var(--toxic);
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .nav-hamburger {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 4px; background: none; border: none;
  }
  .nav-hamburger span { display: block; width: 22px; height: 1.5px; background: var(--bone); transition: all 0.3s; }
  .nav-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4.5px,4.5px); }
  .nav-hamburger.open span:nth-child(2) { opacity: 0; }
  .nav-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(4.5px,-4.5px); }
  .mobile-menu {
    display: none; position: fixed; top: 62px; left: 0; right: 0;
    background: rgba(8,5,8,0.97); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border); padding: 20px 32px;
    z-index: 99; flex-direction: column;
    transform: translateY(-16px); opacity: 0;
    transition: all 0.3s; pointer-events: none;
  }
  .mobile-menu.open { transform: translateY(0); opacity: 1; pointer-events: all; }
  .mobile-menu a {
    font-family: 'Cinzel', serif; font-size: 0.85rem; color: var(--dim);
    text-decoration: none; letter-spacing: 3px; text-transform: uppercase;
    padding: 14px 0; border-bottom: 1px solid var(--border); transition: color 0.3s;
  }
  .mobile-menu a:last-child { border-bottom: none; }
  .mobile-menu a:hover { color: var(--blood2); }

  section { position: relative; z-index: 2; padding: 120px 80px 80px; }

  /* Dripping section divider */
  .section-divider {
    position: relative; z-index: 2; width: 100%; height: 40px;
    overflow: hidden;
  }
  .section-divider::before {
    content: ''; display: block; width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(139,0,0,0.4) 30%, rgba(139,0,0,0.4) 70%, transparent);
    position: absolute; top: 0;
  }
  .divider-skull {
    position: absolute; left: 50%; top: -10px; transform: translateX(-50%);
    font-size: 20px; filter: drop-shadow(0 0 6px rgba(139,0,0,0.8));
    animation: skullBob 3s ease-in-out infinite;
  }
  @keyframes skullBob { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-4px)} }

  /* Section headers */
  .section-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .section-eyebrow-num { font-family: 'Share Tech Mono', monospace; font-size: 0.62rem; color: rgba(139,0,0,0.4); letter-spacing: 2px; }
  .section-eyebrow-line { width: 40px; height: 1px; background: var(--blood); }
  .section-eyebrow-text { font-family: 'Cinzel', serif; font-size: 0.7rem; color: var(--blood2); letter-spacing: 3px; text-transform: uppercase; }
  .section-title { font-family: 'Cinzel', serif; font-weight: 900; font-size: clamp(1.8rem, 2.8vw, 2.8rem); color: var(--bone); margin-bottom: 48px; line-height: 1.15; }
  .section-title .blood-word { color: var(--blood2); text-shadow: 0 0 20px rgba(139,0,0,0.5); }
  .section-subtitle { display: block; font-size: 0.3em; color: var(--dim2); font-weight: 400; letter-spacing: 5px; font-family: 'Share Tech Mono', monospace; margin-top: 4px; }

  /* ── HERO ── */
  .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; min-height: 100vh; }
  .hero-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; animation: fadeUp 0.8s ease both; }
  .hero-eyebrow-line { width: 32px; height: 1px; background: var(--blood); }
  .hero-eyebrow-text { font-family: 'Cinzel', serif; font-size: 0.7rem; color: var(--blood2); letter-spacing: 4px; text-transform: uppercase; }
  .hero-title {
    font-family: 'Cinzel', serif; font-weight: 900;
    font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.1;
    color: var(--bone); margin-bottom: 24px;
    animation: fadeUp 0.8s 0.15s ease both;
  }
  .hero-title .glitch { position: relative; display: inline-block; color: var(--blood2); text-shadow: 0 0 30px rgba(139,0,0,0.6); }
  .hero-title .glitch::before, .hero-title .glitch::after {
    content: attr(data-text); position: absolute; top: 0; left: 0;
  }
  .hero-title .glitch::before {
    color: rgba(57,255,20,0.4); animation: glitch1 6s infinite;
    clip-path: polygon(0 0,100% 0,100% 35%,0 35%);
  }
  .hero-title .glitch::after {
    color: rgba(74,26,107,0.6); animation: glitch2 6s infinite;
    clip-path: polygon(0 65%,100% 65%,100% 100%,0 100%);
  }
  @keyframes glitch1 {
    0%,88%,100%{transform:translate(0);opacity:0}
    90%{transform:translate(-3px,1px);opacity:1} 92%{transform:translate(2px,-1px);opacity:1}
    94%{transform:translate(-1px,2px);opacity:1} 96%{transform:translate(1px,-2px);opacity:1}
  }
  @keyframes glitch2 {
    0%,88%,100%{transform:translate(0);opacity:0}
    89%{transform:translate(3px,-1px);opacity:1} 91%{transform:translate(-2px,1px);opacity:1}
    93%{transform:translate(2px,2px);opacity:1} 95%{transform:translate(-3px,-1px);opacity:1}
  }
  .hero-desc {
    font-size: 1rem; color: var(--dim); max-width: 440px;
    line-height: 1.8; margin-bottom: 36px;
    animation: fadeUp 0.8s 0.3s ease both;
  }
  .hero-ctas { display: flex; gap: 16px; flex-wrap: wrap; animation: fadeUp 0.8s 0.45s ease both; }
  .btn-primary {
    font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; padding: 12px 28px;
    background: var(--blood); color: var(--bone2); border: none; cursor: none;
    clip-path: polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);
    transition: all 0.3s; text-decoration: none; display: inline-flex; align-items: center; gap: 10px;
    position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15), transparent 70%);
    transform: translateX(-100%); transition: transform 0.5s;
  }
  .btn-primary:hover { background: var(--blood2); box-shadow: 0 0 25px rgba(139,0,0,0.6); transform: translateY(-2px); }
  .btn-primary:hover::before { transform: translateX(100%); }
  .btn-secondary {
    font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; padding: 12px 28px;
    background: transparent; color: var(--bone);
    border: 1px solid rgba(212,197,160,0.3); cursor: none;
    clip-path: polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);
    transition: all 0.3s; text-decoration: none;
  }
  .btn-secondary:hover { background: rgba(212,197,160,0.06); box-shadow: 0 0 16px rgba(212,197,160,0.15); }
  .hero-stats {
    display: flex; gap: 36px; margin-top: 48px;
    animation: fadeUp 0.8s 0.6s ease both;
    padding-top: 32px; border-top: 1px solid rgba(139,0,0,0.25);
  }
  .stat-val { font-family: 'Cinzel', serif; font-weight: 900; font-size: 2rem; color: var(--blood2); text-shadow: 0 0 20px rgba(139,0,0,0.5); display: block; }
  .stat-label { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: var(--dim2); letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; display: block; }

  /* ── SKULL MASCOT ── */
  .mascot-container { display: flex; justify-content: center; align-items: center; position: relative; }
  .mascot-glow {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,0,0,0.08) 0%, transparent 70%);
    animation: glowPulse 4s ease infinite; pointer-events: none;
  }
  .mascot-glow-2 {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(74,26,107,0.06) 0%, transparent 70%);
    animation: glowPulse 4s 1.5s ease infinite; pointer-events: none;
  }
  @keyframes glowPulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.1);opacity:1} }
  .orbit-ring {
    position: absolute; width: 460px; height: 460px; border-radius: 50%;
    border: 1px solid rgba(139,0,0,0.1);
    animation: orbitSpin 25s linear infinite; pointer-events: none;
  }
  .orbit-skull {
    position: absolute; top: -12px; left: 50%; margin-left: -10px;
    font-size: 18px; filter: drop-shadow(0 0 6px rgba(139,0,0,0.8));
  }
  .orbit-ring-2 {
    position: absolute; width: 530px; height: 530px; border-radius: 50%;
    border: 1px dashed rgba(74,26,107,0.12);
    animation: orbitSpin 40s linear infinite reverse; pointer-events: none;
  }
  .orbit-skull-2 {
    position: absolute; bottom: -10px; right: 50%; margin-right: -10px;
    font-size: 14px; filter: drop-shadow(0 0 4px rgba(74,26,107,0.8));
  }
  @keyframes orbitSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .mascot-frame { position: relative; width: 380px; height: 420px; transition: transform 0.08s ease-out; will-change: transform; }
  .skull-svg { width: 100%; height: 100%; filter: drop-shadow(0 0 28px rgba(139,0,0,0.5)); animation: skullFloat 4s ease-in-out infinite; }
  @keyframes skullFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
  .float-text {
    position: absolute; font-family: 'Creepster', cursive; font-size: 0.9rem;
    opacity: 0; animation: floatUp 8s ease-in-out infinite;
    white-space: nowrap; pointer-events: none; letter-spacing: 2px;
  }
  @keyframes floatUp {
    0%{transform:translateY(0);opacity:0} 15%{opacity:0.7} 85%{opacity:0.5} 100%{transform:translateY(-25px);opacity:0}
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  .scroll-hint { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 36px; animation: fadeUp 1s 1.2s ease both; opacity: 0; }
  .scroll-hint-text { font-family: 'Share Tech Mono', monospace; font-size: 0.58rem; color: var(--dim2); letter-spacing: 4px; text-transform: uppercase; }
  .scroll-arrow { width: 1px; height: 44px; background: linear-gradient(var(--blood),transparent); animation: scrollArrow 2s ease infinite; }
  @keyframes scrollArrow {
    0%{transform:scaleY(0);transform-origin:top} 50%{transform:scaleY(1);transform-origin:top}
    51%{transform-origin:bottom} 100%{transform:scaleY(0);transform-origin:bottom}
  }

  /* ── SKILLS ── */
  .skills-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(210px,1fr)); gap: 16px; }
  .skill-card {
    border: 1px solid rgba(139,0,0,0.2);
    background: linear-gradient(135deg, rgba(139,0,0,0.04), transparent);
    padding: 24px 22px; position: relative; overflow: hidden; cursor: none;
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.35s, box-shadow 0.35s;
  }
  .skill-card.visible { opacity: 1; transform: translateY(0); }
  .skill-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--blood), var(--blood2));
    transform: scaleX(0); transform-origin: left; transition: transform 0.4s;
  }
  .skill-card:hover { border-color: rgba(139,0,0,0.4); background: rgba(139,0,0,0.05); transform: translateY(-5px); box-shadow: 0 14px 40px rgba(139,0,0,0.1); }
  .skill-card:hover::before { transform: scaleX(1); }
  .skill-icon { font-size: 1.8rem; margin-bottom: 14px; display: block; }
  .skill-name { font-family: 'Cinzel', serif; font-size: 0.78rem; font-weight: 700; color: var(--bone); letter-spacing: 1px; margin-bottom: 12px; }
  .skill-bar-bg { width: 100%; height: 3px; background: rgba(255,255,255,0.05); overflow: visible; position: relative; }
  .skill-bar {
    height: 100%; background: linear-gradient(90deg, var(--blood), var(--blood2));
    box-shadow: 0 0 8px var(--blood); transition: width 1.4s cubic-bezier(0.16,1,0.3,1);
    position: relative;
  }
  .skill-bar::after {
    content: '💀'; position: absolute; right: -10px; top: -8px; font-size: 14px;
    animation: skullSpin 3s linear infinite; filter: drop-shadow(0 0 4px rgba(139,0,0,0.8));
  }
  @keyframes skullSpin { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(10deg)} }
  .skill-level { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: var(--dim2); margin-top: 10px; letter-spacing: 1px; }

  /* ── EXPERIENCE TIMELINE ── */
  .timeline { position: relative; padding-left: 40px; }
  .timeline::before {
    content: ''; position: absolute; left: 10px; top: 0; bottom: 0;
    width: 1px; background: linear-gradient(to bottom, var(--blood), var(--purple2), transparent);
  }
  .timeline-item {
    position: relative; margin-bottom: 48px;
    opacity: 0; transform: translateX(-20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .timeline-item.visible { opacity: 1; transform: translateX(0); }
  .timeline-skull {
    position: absolute; left: -39px; top: 2px;
    font-size: 20px; filter: drop-shadow(0 0 8px rgba(139,0,0,0.9));
    animation: skullPulse 3s ease infinite;
  }
  .timeline-date { font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: var(--blood2); letter-spacing: 3px; margin-bottom: 6px; }
  .timeline-role { font-family: 'Cinzel', serif; font-weight: 700; font-size: 1rem; color: var(--bone); margin-bottom: 4px; letter-spacing: 0.5px; }
  .timeline-company { font-size: 0.95rem; color: var(--blood2); margin-bottom: 10px; }
  .timeline-desc { font-size: 0.9rem; color: var(--dim); line-height: 1.7; }
  .timeline-tech { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .tech-tag {
    font-family: 'Share Tech Mono', monospace; font-size: 0.6rem;
    padding: 4px 10px; background: rgba(139,0,0,0.15);
    border: 1px solid rgba(139,0,0,0.3); border-radius: 4px;
    color: var(--bone);
  }

  /* ── PROJECTS ── */
  .projects-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .project-card {
    border: 1px solid rgba(139,0,0,0.2); background: var(--bg2);
    overflow: hidden; position: relative;
    opacity: 0; transform: translateY(24px); cursor: none;
    transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.35s, box-shadow 0.35s;
  }
  .project-card.visible { opacity: 1; transform: translateY(0); }
  .project-card:hover { border-color: rgba(139,0,0,0.4); box-shadow: 0 0 40px rgba(139,0,0,0.1); transform: translateY(-6px); }
  .project-card.featured { grid-column: span 2; }
  .project-overlay {
    position: absolute; inset: 0; background: rgba(8,5,8,0.93);
    display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px;
    opacity: 0; transition: opacity 0.3s; z-index: 5;
  }
  .project-card:hover .project-overlay { opacity: 1; }
  .overlay-title { font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.9rem; color: var(--bone); letter-spacing: 1px; text-align: center; padding: 0 20px; }
  .overlay-links { display: flex; gap: 12px; }
  .overlay-btn {
    font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.72rem; letter-spacing: 1.5px;
    text-transform: uppercase; padding: 10px 22px; text-decoration: none; border: 1px solid; transition: all 0.25s;
  }
  .overlay-btn.demo { color: var(--bg); background: var(--blood2); border-color: var(--blood2); }
  .overlay-btn.demo:hover { background: var(--bone); box-shadow: 0 0 20px rgba(139,0,0,0.6); }
  .overlay-btn.code { color: var(--bone); background: transparent; border-color: rgba(212,197,160,0.35); }
  .overlay-btn.code:hover { background: rgba(212,197,160,0.08); }
  .project-visual {
    height: 140px; overflow: hidden;
    background: linear-gradient(135deg, rgba(139,0,0,0.04), rgba(74,26,107,0.04));
    border-bottom: 1px solid rgba(139,0,0,0.2);
    display: flex; align-items: flex-start; padding: 16px; position: relative;
  }
  .project-visual.featured { height: 190px; }
  .project-visual::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
    background: linear-gradient(transparent, var(--bg2)); pointer-events: none;
  }
  .visual-code { font-family: 'Share Tech Mono', monospace; font-size: 0.63rem; color: rgba(212,197,160,0.4); line-height: 1.9; white-space: pre; pointer-events: none; }
  .project-meta { padding: 20px 22px 0; display: flex; justify-content: space-between; align-items: center; }
  .project-num { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: rgba(139,0,0,0.4); letter-spacing: 2px; }
  .project-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .tag { font-family: 'Share Tech Mono', monospace; font-size: 0.58rem; padding: 3px 8px; border: 1px solid; letter-spacing: 1px; text-transform: uppercase; }
  .tag.red { border-color: rgba(139,0,0,0.5); color: var(--blood2); }
  .tag.bone { border-color: rgba(212,197,160,0.35); color: var(--bone); }
  .tag.purple { border-color: rgba(123,47,160,0.5); color: var(--purple2); }
  .tag.toxic { border-color: rgba(57,255,20,0.3); color: var(--toxic); }
  .tag.ember { border-color: rgba(255,102,0,0.4); color: var(--ember); }
  .project-body { padding: 14px 22px 22px; }
  .project-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.92rem; color: var(--bone); margin-bottom: 10px; line-height: 1.3; letter-spacing: 0.5px; }
  .project-desc { font-size: 0.88rem; color: var(--dim); line-height: 1.65; }
  .project-tech-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .project-tech-item {
    font-family: 'Share Tech Mono', monospace; font-size: 0.6rem;
    padding: 3px 8px; background: rgba(139,0,0,0.1);
    border-radius: 4px; color: var(--blood2);
  }

  /* ── STATS COUNTER ── */
  .counter-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-bottom: 64px; }
  .counter-card {
    border: 1px solid rgba(139,0,0,0.2); padding: 28px 20px; text-align: center; position: relative; overflow: hidden;
    opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease;
    background: linear-gradient(135deg, rgba(139,0,0,0.03), transparent);
  }
  .counter-card.visible { opacity: 1; transform: translateY(0); }
  .counter-val { font-family: 'Cinzel', serif; font-weight: 900; font-size: 2.4rem; color: var(--blood2); display: block; text-shadow: 0 0 20px rgba(139,0,0,0.5); }
  .counter-label { font-family: 'Share Tech Mono', monospace; font-size: 0.62rem; color: var(--dim2); letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; }

  /* ── ABOUT ── */
  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
  .about-text { font-size: 1rem; color: var(--dim); line-height: 1.85; margin-bottom: 20px; }
  .about-text strong { color: var(--blood2); font-weight: 600; }
  .about-extras { display: flex; gap: 10px; flex-wrap: wrap; margin: 28px 0; }
  .about-badge {
    font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 500; letter-spacing: 1px;
    padding: 6px 14px; border: 1px solid rgba(139,0,0,0.25); color: var(--dim);
    text-transform: uppercase; transition: all 0.3s; cursor: default;
  }
  .about-badge:hover { border-color: var(--blood2); color: var(--blood2); box-shadow: 0 0 12px rgba(139,0,0,0.2); }

  /* Grimoire / Terminal */
  .grimoire { border: 1px solid rgba(139,0,0,0.25); background: rgba(14,10,16,0.8); overflow: hidden; }
  .grimoire-bar {
    background: rgba(139,0,0,0.06); border-bottom: 1px solid rgba(139,0,0,0.2);
    padding: 10px 16px; display: flex; align-items: center; gap: 8px;
  }
  .g-dot { width: 10px; height: 10px; border-radius: 50%; }
  .g-dot.red { background: #8b0000; } .g-dot.ylw { background: #5c3a00; } .g-dot.grn { background: #0a2b0a; }
  .grimoire-title { font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; color: var(--dim2); margin-left: 8px; }
  .grimoire-body { padding: 22px 20px; font-family: 'Share Tech Mono', monospace; font-size: 0.78rem; line-height: 2.2; min-height: 320px; }
  .t-prompt { color: var(--blood2); }
  .t-output { color: var(--dim); padding-left: 20px; display: block; }
  .t-cur { display: inline-block; width: 7px; height: 0.9em; background: var(--blood2); vertical-align: text-bottom; animation: cursorBlink 1s step-end infinite; }
  @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── TESTIMONIALS ── */
  .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .testimonial-card {
    border: 1px solid rgba(139,0,0,0.2); background: var(--bg2); padding: 28px;
    position: relative; overflow: hidden;
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s;
  }
  .testimonial-card.visible { opacity: 1; transform: translateY(0); }
  .testimonial-card:hover { box-shadow: 0 0 30px rgba(139,0,0,0.08); border-color: rgba(139,0,0,0.35); }
  .testimonial-card::before {
    content: '💀'; position: absolute; top: 8px; right: 12px;
    font-size: 2rem; opacity: 0.07;
  }
  .testimonial-text { font-size: 0.92rem; color: var(--dim); line-height: 1.75; margin-bottom: 20px; font-style: italic; }
  .testimonial-author { display: flex; align-items: center; gap: 14px; }
  .testimonial-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    border: 1px solid rgba(139,0,0,0.3); display: flex; align-items: center; justify-content: center;
    font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700; color: var(--blood2);
    background: rgba(139,0,0,0.06);
  }
  .testimonial-name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.82rem; color: var(--bone); letter-spacing: 0.5px; }
  .testimonial-role { font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: var(--dim2); margin-top: 2px; }

  /* ── CONTACT ── */
  .contact-section { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 36px; padding-bottom: 60px; }
  .contact-email {
    font-family: 'Cinzel', serif; font-weight: 700; font-size: clamp(0.9rem,2vw,1.2rem);
    color: var(--bone); letter-spacing: 3px; text-decoration: none;
    text-shadow: 0 0 20px rgba(139,0,0,0.4); border: 1px solid rgba(212,197,160,0.2);
    padding: 22px 44px; transition: all 0.35s; position: relative; overflow: hidden;
  }
  .contact-email:hover { background: rgba(139,0,0,0.06); box-shadow: 0 0 40px rgba(139,0,0,0.2); border-color: rgba(212,197,160,0.4); }
  .contact-form { width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 16px; text-align: left; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-family: 'Creepster', cursive; font-size: 0.75rem; color: var(--blood2); letter-spacing: 3px; text-transform: uppercase; }
  .form-input, .form-textarea {
    background: rgba(139,0,0,0.03); border: 1px solid rgba(139,0,0,0.2);
    color: var(--text); font-family: 'Special Elite', cursive; font-size: 0.95rem;
    padding: 12px 16px; outline: none; transition: border-color 0.3s, box-shadow 0.3s; resize: none;
  }
  .form-input:focus, .form-textarea:focus { border-color: rgba(139,0,0,0.5); box-shadow: 0 0 16px rgba(139,0,0,0.1); }
  .form-textarea { height: 120px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .social-links { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
  .social-link {
    font-family: 'Creepster', cursive; font-size: 0.85rem; color: var(--dim2);
    text-decoration: none; letter-spacing: 2px; text-transform: uppercase;
    padding: 10px 18px; border: 1px solid rgba(139,0,0,0.2); transition: all 0.3s; position: relative;
  }
  .social-link:hover { color: var(--blood2); border-color: rgba(139,0,0,0.5); text-shadow: 0 0 8px rgba(139,0,0,0.6); }

  footer {
    position: relative; z-index: 2; border-top: 1px solid rgba(139,0,0,0.2);
    padding: 24px 80px; display: flex; justify-content: space-between; align-items: center;
  }
  .footer-text { font-family: 'Share Tech Mono', monospace; font-size: 0.62rem; color: var(--dim2); letter-spacing: 2px; }

  .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  @media (max-width: 1024px) {
    .projects-grid { grid-template-columns: 1fr 1fr; }
    .project-card.featured { grid-column: span 2; }
    .counter-grid { grid-template-columns: repeat(2,1fr); }
    .testimonials-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 900px) {
    nav { padding: 14px 24px; }
    .nav-links, .section-dots, .hud-element, .cobweb-corner { display: none; }
    .nav-hamburger { display: flex; }
    .mobile-menu { display: flex; }
    section { padding: 100px 24px 60px; }
    .hero-grid { grid-template-columns: 1fr; gap: 40px; }
    .mascot-frame { width: 260px; height: 300px; }
    .projects-grid { grid-template-columns: 1fr; }
    .project-card.featured { grid-column: span 1; }
    .about-grid { grid-template-columns: 1fr; gap: 40px; }
    .testimonials-grid { grid-template-columns: 1fr; }
    footer { padding: 20px 24px; flex-direction: column; gap: 8px; text-align: center; }
    .form-row { grid-template-columns: 1fr; }
  }
`;

// ── Fog + Wisps ────────────────────────────────────────────────────────────
const FOG_STRIPS = Array.from({ length: 6 }, (_, i) => ({
  id: i, top: `${10 + i * 15}%`, dur: `${12 + i * 4}s`, delay: `${i * 2}s`, ty: `${(i % 2 === 0 ? -1 : 1) * (10 + i * 5)}px`,
}));
const WISPS = Array.from({ length: 20 }, (_, i) => ({
  id: i, left: `${Math.random() * 100}%`, size: Math.random() * 10 + 4,
  dur: `${Math.random() * 12 + 8}s`, delay: `${Math.random() * 10}s`,
  maxOp: (Math.random() * 0.25 + 0.05).toFixed(2), dx: `${(Math.random() - 0.5) * 80}px`,
  dx2: `${(Math.random() - 0.5) * 60}px`,
  color: i % 3 === 0 ? 'rgba(139,0,0,0.8)' : i % 3 === 1 ? 'rgba(74,26,107,0.8)' : 'rgba(57,255,20,0.4)',
}));
const DRIPS = Array.from({ length: 18 }, (_, i) => ({
  id: i, left: `${3 + i * 5.5 + Math.random() * 3}%`, dur: `${Math.random() * 3 + 2}s`,
  delay: `${Math.random() * 8}s`, len: `${Math.random() * 40 + 20}px`, width: `${Math.random() * 2 + 2}px`,
}));

function Atmosphere() {
  return (
    <>
      <div className="cobweb-bg" />
      <div className="fog-layer">{FOG_STRIPS.map(f => <div key={f.id} className="fog-strip" style={{ top: f.top, "--dur": f.dur, "--delay": f.delay, "--ty": f.ty }} />)}</div>
      <div className="wisp-field">{WISPS.map(w => <div key={w.id} className="wisp" style={{ left: w.left, width: w.size, height: w.size, background: w.color, "--dur": w.dur, animationDelay: w.delay, "--max-op": w.maxOp, "--dx": w.dx, "--dx2": w.dx2 }} />)}</div>
      <div className="drip-container">{DRIPS.map(d => <div key={d.id} className="drip" style={{ left: d.left, width: d.width, "--dur": d.dur, "--delay": d.delay, "--len": d.len }} />)}</div>
    </>
  );
}

function CobwebTL() {
  return (
    <svg className="cobweb-corner tl" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#8b0000" strokeWidth="0.8" opacity="0.6">
        <line x1="0" y1="0" x2="200" y2="0" /><line x1="0" y1="0" x2="0" y2="200" />
        <line x1="0" y1="0" x2="200" y2="60" /><line x1="0" y1="0" x2="60" y2="200" />
        <line x1="0" y1="0" x2="160" y2="100" /><line x1="0" y1="0" x2="100" y2="160" />
        <line x1="0" y1="0" x2="130" y2="130" />
        <path d="M 30 0 Q 15 15 0 30" strokeWidth="0.5" />
        <path d="M 60 0 Q 30 30 0 60" strokeWidth="0.5" />
        <path d="M 90 0 Q 45 45 0 90" strokeWidth="0.5" />
        <path d="M 120 0 Q 60 60 0 120" strokeWidth="0.5" />
        <path d="M 150 0 Q 75 75 0 150" strokeWidth="0.5" />
        <path d="M 180 0 Q 90 90 0 180" strokeWidth="0.5" />
        <circle cx="0" cy="0" r="2" fill="#8b0000" opacity="0.8" />
      </g>
    </svg>
  );
}

// ── Skull Mascot ──
function SkullMascot({ mouseX, mouseY }) {
  return (
    <div className="mascot-container">
      <div className="mascot-glow" /><div className="mascot-glow-2" />
      <div className="orbit-ring"><div className="orbit-skull">💀</div></div>
      <div className="orbit-ring-2"><div className="orbit-skull-2">🦇</div></div>
      <span className="float-text" style={{ top: 10, right: -10, color: 'var(--blood2)', animationDelay: "0s" }}>DJANGO.INIT()</span>
      <span className="float-text" style={{ top: 110, left: -60, color: 'var(--toxic)', animationDelay: "1.5s" }}>AI.SUMMON()</span>
      <span className="float-text" style={{ bottom: 110, right: -50, color: 'var(--purple2)', animationDelay: "3s" }}>RAG.CAST()</span>
      <span className="float-text" style={{ bottom: 40, left: -50, color: 'var(--ember)', animationDelay: "4.5s" }}>DOCKER.RAISE()</span>
      <div className="mascot-frame" style={{ transform: `perspective(900px) rotateY(${mouseX * 10}deg) rotateX(${-mouseY * 7}deg)` }}>
        <svg className="skull-svg" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="skullBody" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#2a1f2e" /><stop offset="100%" stopColor="#120d14" /></radialGradient>
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#8b0000" stopOpacity="1" /><stop offset="100%" stopColor="#8b0000" stopOpacity="0" /></radialGradient>
            <filter id="bloodGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <ellipse cx="150" cy="370" rx="90" ry="16" fill="rgba(0,0,0,0.4)" />
          <path d="M 80 240 Q 50 300 40 370 L 260 370 Q 250 300 220 240 Z" fill="#0d0a10" stroke="rgba(139,0,0,0.2)" strokeWidth="1" />
          <ellipse cx="150" cy="155" rx="78" ry="82" fill="url(#skullBody)" stroke="rgba(212,197,160,0.15)" strokeWidth="1" />
          <ellipse cx="114" cy="155" rx="26" ry="24" fill="#050305" stroke="rgba(139,0,0,0.15)" strokeWidth="1" />
          <ellipse cx="186" cy="155" rx="26" ry="24" fill="#050305" stroke="rgba(139,0,0,0.15)" strokeWidth="1" />
          <ellipse cx="114" cy="155" rx="20" ry="18" fill="url(#eyeGlow)" opacity="0.9" filter="url(#bloodGlow)"><animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" /></ellipse>
          <ellipse cx="186" cy="155" rx="20" ry="18" fill="url(#eyeGlow)" opacity="0.9" filter="url(#bloodGlow)"><animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" begin="0.3s" repeatCount="indefinite" /></ellipse>
          <circle cx="114" cy="155" r="7" fill="#8b0000" opacity="0.8"><animate attributeName="r" values="7;5;7" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="186" cy="155" r="7" fill="#8b0000" opacity="0.8"><animate attributeName="r" values="7;5;7" dur="2s" begin="0.3s" repeatCount="indefinite" /></circle>
          <path d="M 142 188 L 150 178 L 158 188 Q 158 198 150 200 Q 142 198 142 188 Z" fill="#050305" />
          <path d="M 105 215 Q 105 230 115 232 Q 150 238 185 232 Q 195 230 195 215" fill="#1a1320" stroke="rgba(212,197,160,0.12)" strokeWidth="1" />
          {[118, 129, 140, 151, 162, 173].map((x, i) => (<rect key={i} x={x} y="215" width="8" height={i === 0 || i === 5 ? 12 : 16} rx="2" fill="#c8b890" opacity="0.7" />))}
          <rect x="55" y="265" width="45" height="36" rx="3" fill="#0d0a0d" stroke="rgba(139,0,0,0.4)" strokeWidth="1" opacity="0.9" />
          <text x="77" y="285" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="rgba(212,197,160,0.5)">BACKEND</text>
          <circle cx="220" cy="275" r="16" fill="#0d0a12" stroke="rgba(74,26,107,0.5)" strokeWidth="1" />
          <circle cx="220" cy="275" r="10" fill="rgba(74,26,107,0.4)" filter="url(#bloodGlow)"><animate attributeName="r" values="10;13;10" dur="2.5s" repeatCount="indefinite" /></circle>
        </svg>
      </div>
    </div>
  );
}

// ── Skills (from CV) ──
const skills = [
  { icon: "🐍", name: "Python", level: 92, label: "92% — ANCIENT SERPENT CODE" },
  { icon: "⚙️", name: "Django / DRF", level: 90, label: "90% — WEB NECROMANCY" },
  { icon: "🚀", name: "FastAPI", level: 85, label: "85% — ASYNC DARKNESS" },
  { icon: "🐘", name: "PostgreSQL", level: 88, label: "88% — DATA CURSES" },
  { icon: "📊", name: "Pandas/NumPy", level: 87, label: "87% — DATA SOULS" },
  { icon: "🤖", name: "Scikit-learn", level: 86, label: "86% — ML RITUALS" },
  { icon: "🔥", name: "PyTorch", level: 84, label: "84% — DEEP NECROMANCY" },
  { icon: "🧠", name: "LLM/RAG", level: 83, label: "83% — KNOWLEDGE SUMMONING" },
  { icon: "👁️", name: "Computer Vision", level: 82, label: "82% — EYE OF DARKNESS" },
  { icon: "🐳", name: "Docker/K8s", level: 85, label: "85% — CONTAINER DARKNESS" },
  { icon: "🔄", name: "Redis/Celery", level: 84, label: "84% — ASYNC VOID" },
  { icon: "☁️", name: "AWS/DevOps", level: 80, label: "80% — CLOUD CONJURING" },
];

function useInView(threshold = 0.25) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function SkillCard({ skill, delay }) {
  const [ref, visible] = useInView(0.25);
  return (
    <div ref={ref} className={`skill-card${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      <span className="skill-icon">{skill.icon}</span>
      <div className="skill-name">{skill.name}</div>
      <div className="skill-bar-bg"><div className="skill-bar" style={{ width: visible ? `${skill.level}%` : "0%" }} /></div>
      <div className="skill-level">{skill.label}</div>
    </div>
  );
}

// ── Experience (from CV) ──
const experiences = [
  {
    date: "SEP 2024 — CURRENT",
    role: "Software Developer",
    company: "AEIRC.TECH - Kathmandu, Nepal",
    desc: "Designing and scaling Django REST APIs with JWT/RBAC for web and mobile platforms. Optimizing data-intensive systems using PostgreSQL indexing and query tuning. Developing AI-driven backend features for data analysis and prediction. Deploying services using Docker, Nginx, and Gunicorn with CI/CD pipelines (GitHub Actions).",
    tech: ["Django", "DRF", "PostgreSQL", "Docker", "Nginx", "Gunicorn", "GitHub Actions", "JWT", "RBAC", "AI/ML"]
  },
  {
    date: "MAR 2024 — JUN 2024",
    role: "AI Developer Intern",
    company: "NEXSEWA PVT. LTD. - Kathmandu, Nepal",
    desc: "Developed and trained ML models for prediction/classification. Built computer vision pipelines for image classification and face recognition. Implemented RAG pipelines for enhanced LLM responses. Deployed ML models as REST APIs integrated into backend services.",
    tech: ["Python", "PyTorch", "Scikit-learn", "Computer Vision", "LLM", "RAG", "FastAPI", "Docker"]
  },
  {
    date: "OCT 2023 — FEB 2024",
    role: "Software Developer",
    company: "AARAWAN TECH - Kathmandu, Nepal",
    desc: "Developed and optimized REST APIs with secure authentication. Managed background tasks, containerized deployments, and CI/CD pipelines. Migrated legacy systems and prepared technical documentation.",
    tech: ["Django", "DRF", "PostgreSQL", "Docker", "Celery", "Redis", "CI/CD"]
  },
];

function TimelineItem({ exp, delay }) {
  const [ref, visible] = useInView(0.2);
  return (
    <div ref={ref} className={`timeline-item${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      <div className="timeline-skull">💀</div>
      <div className="timeline-date">{exp.date}</div>
      <div className="timeline-role">{exp.role}</div>
      <div className="timeline-company">{exp.company}</div>
      <div className="timeline-desc">{exp.desc}</div>
      <div className="timeline-tech">{exp.tech.map((t, i) => <span key={i} className="tech-tag">{t}</span>)}</div>
    </div>
  );
}

// ── Projects (from CV) ──
const projects = [
  {
    num: "CURSE_01", featured: true, projectLink: "https://play.google.com/store/apps/details?id=com.jstyle.test2208",
    tags: [{ label: "HEALTHCARE", cls: "red" }, { label: "WEBSOCKET", cls: "toxic" }, { label: "REACT", cls: "purple" }],
    code: `# DIGITAL CARE HEALTHCARE PLATFORM
class DigitalCareAPI:
    def __init__(self):
        self.drf = DjangoRestFramework()
        self.channels = DjangoChannels()
    
    async def handle_ecg_data(self, data):
        # Real-time health monitoring
        await self.validate_ecg(data)
        processed = await self.process_vitals(data)
        await self.broadcast_to_doctor(processed)
        return {"status": "haunting_success"}`,
    name: "DIGITAL CARE — Healthcare Platform",
    desc: "Built a healthcare platform using Django/DRF for patient data management, doctor interactions, and remote health monitoring. Implemented real-time chat using Django Channels WebSockets handling concurrency and scalability challenges for ECG/vitals data.",
    tech: ["Django", "DRF", "Django Channels", "WebSockets", "PostgreSQL", "Redis", "JWT"]
  },
  {
    num: "CURSE_02",
    tags: [{ label: "TELEMEDICINE", cls: "ember" }, { label: "VIDEO", cls: "red" }],
    code: `# VILLAGE DOCTOR API
class VideoConsultation:
    def __init__(self):
        self.webrtc = WebRTC()
        self.scheduler = TestScheduler()
    
    async def start_session(self, patient, doctor):
        # Handle low bandwidth scenarios
        room = await self.webrtc.create_room()
        await self.scheduler.book_test(patient)
        return {"stream_url": room.url}`,
    name: "VILLAGE DOCTOR — Telemedicine",
    desc: "Built telemedicine app for medical tests and live video consultations. Developed real-time video features handling network instability and low bandwidth. Created secure APIs for test scheduling and patient data management.",
    tech: ["Django", "DRF", "WebRTC", "PostgreSQL", "Redis", "Docker", "Video Streaming"]
  },
  {
    num: "CURSE_03",
    tags: [{ label: "RAG", cls: "purple" }, { label: "LLM", cls: "toxic" }],
    code: `# RAG PIPELINE FOR ENHANCED RESPONSES
class DarkRAGPipeline:
    def __init__(self):
        self.llm = OpenAI()
        self.vector_db = ChromaDB()
    
    async def retrieve_and_generate(self, query):
        docs = await self.vector_db.similarity_search(query)
        context = self.format_documents(docs)
        return await self.llm.generate(query, context)`,
    name: "RAG PIPELINE — Enhanced LLM Responses",
    desc: "Implemented RAG pipelines for enhanced LLM responses using vector databases and context retrieval. Achieved significant improvement in response accuracy and relevance.",
    tech: ["Python", "LangChain", "OpenAI", "ChromaDB", "FastAPI"]
  },
  {
    num: "CURSE_04",
    tags: [{ label: "CV", cls: "red" }, { label: "FACE RECOG", cls: "bone" }],
    code: `# COMPUTER VISION PIPELINE
class VisionPipeline:
    def __init__(self):
        self.face_recognizer = FaceNet()
        self.classifier = ImageClassifier()
    
    def process_image(self, image):
        faces = self.face_recognizer.detect(image)
        classification = self.classifier.predict(image)
        return {"faces": faces, "class": classification}`,
    name: "COMPUTER VISION — Face Recognition",
    desc: "Built computer vision pipelines for image classification and face recognition. Deployed models as REST APIs integrated into backend services.",
    tech: ["PyTorch", "OpenCV", "FaceNet", "FastAPI", "Docker"]
  },
  {
    num: "CURSE_05",
    tags: [{ label: "ML", cls: "purple" }, { label: "PREDICTION", cls: "ember" }],
    code: `# ML PREDICTION MODELS
class PredictionModel:
    def __init__(self):
        self.model = XGBoost()
        self.preprocessor = FeatureEngineer()
    
    def train_and_predict(self, data):
        features = self.preprocessor.transform(data)
        predictions = self.model.predict(features)
        return self.format_predictions(predictions)`,
    name: "ML MODELS — Prediction & Classification",
    desc: "Developed and trained machine learning models for prediction and classification tasks with feature engineering and model tuning for improved performance.",
    tech: ["Python", "Scikit-learn", "XGBoost", "Pandas", "NumPy", "Matplotlib"]
  },
  {
    num: "CURSE_06",
    tags: [{ label: "MLOPS", cls: "toxic" }, { label: "DEPLOYMENT", cls: "red" }],
    code: `# ML MODEL DEPLOYMENT
class ModelDeployment:
    def __init__(self):
        self.api = FastAPI()
        self.monitor = ModelMonitor()
    
    async def predict(self, request):
        result = await self.model.predict(request)
        await self.monitor.log_performance(result)
        return {"prediction": result}`,
    name: "ML DEPLOYMENT — REST APIs",
    desc: "Deployed ML models as REST APIs integrated into backend services with monitoring and visualization for evaluation and debugging.",
    tech: ["FastAPI", "Docker", "Prometheus", "Grafana", "Python", "REST APIs"]
  },
];

function ProjectCard({ project, delay }) {
  const [ref, visible] = useInView(0.08);
  return (
    <div ref={ref} className={`project-card${project.featured ? " featured" : ""}${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      <div className="project-overlay">
        <div className="overlay-title">{project.name}</div>
        <div className="overlay-links">
          {project.projectLink ? (
            <a href={project.projectLink} target="_blank" rel="noopener noreferrer" className="overlay-btn demo">💀 Live Demo</a>
          ) : (
            <a href="#" className="overlay-btn demo">💀 Coming Soon</a>
          )}
          <a href="#" className="overlay-btn code">🕯 Dark Source</a>
        </div>
      </div>
      <div className={`project-visual${project.featured ? " featured" : ""}`}>
        <pre className="visual-code">{project.code}</pre>
      </div>
      <div className="project-meta">
        <span className="project-num">{project.num}</span>
        <div className="project-tags">{project.tags.map((t, i) => <span key={i} className={`tag ${t.cls}`}>{t.label}</span>)}</div>
      </div>
      <div className="project-body">
        <div className="project-name">{project.name}</div>
        <div className="project-desc">{project.desc}</div>
        <div className="project-tech-list">{project.tech.map((t, i) => <span key={i} className="project-tech-item">{t}</span>)}</div>
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    const duration = 1800, start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start, progress = Math.min(elapsed / duration, 1), eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref} className="counter-val">{count}{suffix}</span>;
}

function CounterCard({ val, label, suffix, delay }) {
  const [ref, visible] = useInView(0.3);
  return (
    <div ref={ref} className={`counter-card${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      {visible ? <AnimatedCounter target={val} suffix={suffix} /> : <span className="counter-val">0{suffix}</span>}
      <div className="counter-label">{label}</div>
    </div>
  );
}

// ── Grimoire Terminal (from CV) ──
const GRIMOIRE_LINES = [
  { prompt: true, text: "whoami" },
  { prompt: false, text: <><span style={{ color: "var(--toxic)" }}>→ Mahesh K.C. | Software Developer & AI Engineer</span></> },
  { prompt: true, text: "cat grimoire.json" },
  { prompt: false, text: "{" },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"name"</span>: <span style={{ color: "var(--toxic)" }}>"Mahesh K.C."</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"birth_date"</span>: <span style={{ color: "var(--toxic)" }}>"08/09/2001"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"nationality"</span>: <span style={{ color: "var(--toxic)" }}>"Nepalese"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"education"</span>: <span style={{ color: "var(--toxic)" }}>"BSC.CSIT - Tribhuvan University (2019-2024)"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"experience"</span>: <span style={{ color: "var(--toxic)" }}>"Software Developer @ AEIRC.TECH (Sep 2024 - Current)"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"internships"</span>: <span style={{ color: "var(--toxic)" }}>"AI Developer @ NEXSEWA · Software Dev @ AARAWAN TECH"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"skills"</span>: <span style={{ color: "var(--toxic)" }}>"Python, Django, FastAPI, PostgreSQL, PyTorch, Docker, K8s"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"projects"</span>: <span style={{ color: "var(--toxic)" }}>"Digital Care · Village Doctor · RAG Pipeline · CV Systems"</span>,</> },
  { prompt: false, indent: true, text: <><span style={{ color: "var(--blood2)" }}>"status"</span>: <span style={{ color: "var(--toxic)" }}>"OPEN TO HAUNT ✓"</span></> },
  { prompt: false, text: "}" },
  { prompt: true, text: "echo $BACKEND_STACK" },
  { prompt: false, text: <span style={{ color: "var(--purple2)" }}>Django · DRF · FastAPI · PostgreSQL · Redis · Celery · Docker · Kubernetes</span> },
  { prompt: true, text: "echo $AI_STACK" },
  { prompt: false, text: <span style={{ color: "var(--purple2)" }}>PyTorch · Scikit-learn · LLM · RAG · LangChain · Computer Vision</span> },
];

function GrimoireTypewriter() {
  const [shown, setShown] = useState(0);
  const inView = useRef(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !inView.current) {
        inView.current = true;
        let i = 0;
        const tick = setInterval(() => { i++; setShown(i); if (i >= GRIMOIRE_LINES.length) clearInterval(tick); }, 450);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div className="grimoire" ref={ref}>
      <div className="grimoire-bar"><div className="g-dot red" /><div className="g-dot ylw" /><div className="g-dot grn" /><span className="grimoire-title">// dark@necromancer ~ zsh — tome of forbidden knowledge</span></div>
      <div className="grimoire-body">
        {GRIMOIRE_LINES.slice(0, shown).map((line, i) => (
          <div key={i}>{line.prompt ? <><span className="t-prompt">dark@necro 🩸 </span>{line.text}</> : <span className="t-output" style={{ paddingLeft: line.indent ? "36px" : undefined }}>{line.text}</span>}</div>
        ))}
        {shown >= GRIMOIRE_LINES.length && <div><span className="t-prompt">dark@necro 🩸 </span><span className="t-cur" /></div>}
      </div>
    </div>
  );
}

// ── Testimonials ──
const testimonials = [
  { text: "Mahesh built our backend infrastructure from scratch. His Django APIs are rock solid and his AI integration work is exceptional.", name: "Sarah Chen", role: "CTO — AEIRC.TECH", initials: "SC" },
  { text: "The RAG pipeline he implemented transformed our customer support. Response time improved by 40%. Highly recommend!", name: "Alex Reeves", role: "VP Eng — NEXSEWA", initials: "AR" },
  { text: "Mahesh's computer vision work on our face recognition system was flawless. He delivered ahead of schedule with zero bugs.", name: "Dr. Priya Nair", role: "Research Lead — AI Lab", initials: "PN" },
];

function TestimonialCard({ t, delay }) {
  const [ref, visible] = useInView(0.2);
  return (
    <div ref={ref} className={`testimonial-card${visible ? " visible" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      <p className="testimonial-text">{t.text}</p>
      <div className="testimonial-author"><div className="testimonial-avatar">{t.initials}</div><div><div className="testimonial-name">{t.name}</div><div className="testimonial-role">{t.role}</div></div></div>
    </div>
  );
}

// ── Main App ──
const SECTIONS = ["home", "skills", "experience", "projects", "about", "testimonials", "contact"];
const NAV_ITEMS = ["🏠 Home", "⚗️ Skills", "💀 History", "🔮 Curses", "👁️ About", "🩸 Reviews", "☠️ Contact"];

export default function Portfolio() {
  const cursorRef = useRef(null);
  const [cursorHover, setCursorHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hud, setHud] = useState({ lat: "6.66", fps: 66, mem: "6.6GB", temp: "66" });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => { const style = document.createElement("style"); style.textContent = styles; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);

  useEffect(() => {
    let raf = null, px = 0, py = 0;
    const onMove = (e) => {
      if (cursorRef.current) { cursorRef.current.style.left = e.clientX + "px"; cursorRef.current.style.top = e.clientY + "px"; }
      px = e.clientX / window.innerWidth - 0.5; py = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(() => { setMouse({ x: px, y: py }); raf = null; });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const on = () => setCursorHover(true); const off = () => setCursorHover(false);
    const sel = "a, button, .skill-card, .project-card, .social-link, .contact-email, .section-dot, .about-badge";
    let els = [];
    const t = setTimeout(() => { els = [...document.querySelectorAll(sel)]; els.forEach(el => { el.addEventListener("mouseenter", on); el.addEventListener("mouseleave", off); }); }, 600);
    return () => { clearTimeout(t); els.forEach(el => { el.removeEventListener("mouseenter", on); el.removeEventListener("mouseleave", off); }); };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY, dh = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(st / Math.max(dh, 1)); setScrolled(st > 40);
      const mid = st + window.innerHeight / 2;
      let found = 0; SECTIONS.forEach((id, i) => { const el = document.getElementById(id); if (el && el.offsetTop <= mid) found = i; });
      setActiveSection(found);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setHud({ lat: (Math.random() * 3 + 5).toFixed(2), fps: Math.floor(60 + Math.random() * 10), mem: `${(6 + Math.random() * 1.5).toFixed(1)}GB`, temp: `${Math.floor(60 + Math.random() * 12)}` }), 2000);
    return () => clearInterval(iv);
  }, []);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileOpen(false); };

  return (
    <div className={`portfolio-root${cursorHover ? " cursor-hover" : ""}`}>
      <style>{`body{background:#080508;margin:0;}*{cursor:none!important;}`}</style>
      <div className="progress-bar" style={{ transform: `scaleX(${progress})` }} />
      <Atmosphere /><div className="scanline" /><div className="noise-overlay" /><div className="vignette" />
      <CobwebTL /><div className="cobweb-corner tr"><CobwebTL /></div>

      <div className="hud-element hud-tl">BACKEND_CORE: ONLINE<br />API_RATE: <span className="hud-accent">{hud.lat}K</span> // SOULS: <span className="hud-accent">{hud.fps}</span><br />VOID: <span className="hud-accent">OPEN</span></div>
      <div className="hud-element hud-tr">DJANGO_NET: ACTIVE<br />CURSE: 666Hz // TEMP: <span className="hud-accent">{hud.temp}°</span><br />OMEN: <span className="hud-accent">OMINOUS</span></div>
      <div className="hud-element hud-bl">PROJECTS: <span className="hud-accent">8+</span> CURSED<br />HAUNTING: <span className="hud-accent">2+ YRS</span></div>
      <div className="hud-element hud-br">STATUS: <span className="hud-accent">SUMMONING</span><br />REALM: <span className="hud-accent">NEPAL</span></div>

      <div className="section-dots">{SECTIONS.map((id, i) => (<div key={id} className={`section-dot${activeSection === i ? " active" : ""}`} onClick={() => scrollTo(id)} />))}</div>
      <div ref={cursorRef} className="custom-cursor-skull" style={{ left: -100, top: -100 }}>💀</div>

      <nav className={scrolled ? "scrolled" : ""}>
        <a href="#home" className="nav-logo" onClick={e => { e.preventDefault(); scrollTo("home"); }}>☠ Mahesh<span>.</span>KC</a>
        <ul className="nav-links">{NAV_ITEMS.map((item, i) => (<li key={item}><a href={`#${SECTIONS[i]}`} className={activeSection === i ? "active" : ""} onClick={e => { e.preventDefault(); scrollTo(SECTIONS[i]); }}>{item}</a></li>))}</ul>
        <div className="nav-status"><div className="status-dot" />OPEN TO HAUNT</div>
        <button className={`nav-hamburger${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(p => !p)}><span /><span /><span /></button>
      </nav>
      <div className={`mobile-menu${mobileOpen ? " open" : ""}`}>{NAV_ITEMS.map((item, i) => (<a key={item} href={`#${SECTIONS[i]}`} onClick={e => { e.preventDefault(); scrollTo(SECTIONS[i]); }}>{item}</a>))}</div>

      {/* HERO */}
      <section id="home" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow"><div className="hero-eyebrow-line" /><span className="hero-eyebrow-text">// Software Developer & AI Engineer</span></div>
            <h1 className="hero-title">BUILDING THE<br /><span className="glitch" data-text="BACKEND">BACKEND</span> WITH <span style={{ color: "var(--purple2)" }}>DARK</span><br />INTELLIGENCE</h1>
            <p className="hero-desc">Software Developer & AI engineer conjuring scalable systems and intelligent solutions. From Django APIs to cursed LLM pipelines — I build things that work in the dark.</p>
            <div className="hero-ctas"><a href="#projects" className="btn-primary" onClick={e => { e.preventDefault(); scrollTo("projects"); }}>💀 VIEW CURSES</a><a href="#contact" className="btn-secondary" onClick={e => { e.preventDefault(); scrollTo("contact"); }}>SUMMON ME</a></div>
            <div className="hero-stats"><div><span className="stat-val">8+</span><span className="stat-label">Dark Projects</span></div><div><span className="stat-val">2+</span><span className="stat-label">Years Haunting</span></div><div><span className="stat-val">3</span><span className="stat-label">Companies</span></div></div>
            <div className="scroll-hint"><span className="scroll-hint-text">DESCEND</span><div className="scroll-arrow" /></div>
          </div>
          <SkullMascot mouseX={mouse.x} mouseY={mouse.y} />
        </div>
      </section>

      <div className="section-divider"><div className="divider-skull">💀</div></div>

      {/* SKILLS */}
      <section id="skills"><div className="section-eyebrow"><span className="section-eyebrow-num">01</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">Dark Arsenal</span></div>
        <h2 className="section-title">DARK <span className="blood-word">ARTS</span><span className="section-subtitle">// FORBIDDEN KNOWLEDGE MATRIX</span></h2>
        <div className="skills-grid">{skills.map((s, i) => <SkillCard key={s.name} skill={s} delay={i * 0.07} />)}</div>
      </section>

      <div className="section-divider"><div className="divider-skull">🦇</div></div>

      {/* EXPERIENCE */}
      <section id="experience"><div className="section-eyebrow"><span className="section-eyebrow-num">02</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">Chronicle of Darkness</span></div>
        <h2 className="section-title">HAUNT <span className="blood-word">HISTORY</span><span className="section-subtitle">// TOME OF PAST HORRORS</span></h2>
        <div className="timeline">{experiences.map((exp, i) => <TimelineItem key={i} exp={exp} delay={i * 0.15} />)}</div>
      </section>

      <div className="section-divider"><div className="divider-skull">⚰️</div></div>

      {/* PROJECTS */}
      <section id="projects"><div className="section-eyebrow"><span className="section-eyebrow-num">03</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">Cursed Artifacts</span></div>
        <h2 className="section-title">DARK <span className="blood-word">CURSES</span><span className="section-subtitle">// HOVER TO UNLEASH</span></h2>
        <div className="projects-grid">{projects.map((p, i) => <ProjectCard key={p.num} project={p} delay={i * 0.1} />)}</div>
      </section>

      <div className="section-divider"><div className="divider-skull">🔮</div></div>

      {/* ABOUT + STATS */}
      <section id="about">
        <div className="counter-grid">
          {[{ val: 8, suffix: "+", label: "Dark Projects" }, { val: 2, suffix: "yr", label: "Years Haunting" }, { val: 95, suffix: "%", label: "Curse Success Rate" }, { val: 2, suffix: "", label: "Internships Completed" }].map((c, i) => <CounterCard key={i} {...c} delay={i * 0.1} />)}
        </div>
        <div className="about-grid">
          <div><div className="section-eyebrow"><span className="section-eyebrow-num">04</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">The Necromancer's Lore</span></div>
            <h2 className="section-title">WHO <span className="blood-word">AM I</span></h2>
            <p className="about-text">I'm a <strong>Software Developer & AI Engineer</strong> from Nepal with a BSC.CSIT from Tribhuvan University (2019-2024). I'm obsessed with the dark intersection of <strong>scalable backend systems</strong> and artificial intelligence.</p>
            <p className="about-text">With <strong>2+ years of experience</strong> including roles at AEIRC.TECH, NEXSEWA PVT. LTD., and AARAWAN TECH, I've built systems serving thousands of users. My expertise spans <strong>Python, Django, FastAPI, PostgreSQL, Redis, Celery, Docker, Kubernetes</strong> — and on the AI side: <strong>LLMs, RAG, LangChain, PyTorch, Computer Vision</strong>.</p>
            <p className="about-text">I've built <strong>Digital Care</strong> (healthcare platform with real-time monitoring) and <strong>Village Doctor</strong> (telemedicine with video consultations). When not shipping cursed code, I contribute to open-source and explore new dark technologies.</p>
            <div className="about-extras">{["BSC.CSIT", "Python", "Django", "AI/ML", "Open Source", "Healthcare Tech"].map(b => (<span key={b} className="about-badge">{b}</span>))}</div>
            <div className="hero-ctas" style={{ marginTop: "8px" }}><a href="#" className="btn-primary">💀 DOWNLOAD GRIMOIRE</a><a href="#contact" className="btn-secondary" onClick={e => { e.preventDefault(); scrollTo("contact"); }}>SUMMON ME</a></div>
          </div>
          <GrimoireTypewriter />
        </div>
      </section>

      <div className="section-divider"><div className="divider-skull">🕷️</div></div>

      {/* TESTIMONIALS */}
      <section id="testimonials"><div className="section-eyebrow"><span className="section-eyebrow-num">05</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">Whispers from the Void</span></div>
        <h2 className="section-title">CURSED <span className="blood-word">REVIEWS</span><span className="section-subtitle">// SCREAMS FROM THE FIELD</span></h2>
        <div className="testimonials-grid">{testimonials.map((t, i) => <TestimonialCard key={i} t={t} delay={i * 0.15} />)}</div>
      </section>

      <div className="section-divider"><div className="divider-skull">🩸</div></div>

      {/* CONTACT */}
      <section id="contact" className="contact-section">
        <div><div className="section-eyebrow" style={{ justifyContent: "center" }}><span className="section-eyebrow-num">06</span><div className="section-eyebrow-line" /><span className="section-eyebrow-text">Summon the Necromancer</span></div>
          <h2 className="section-title" style={{ textAlign: "center", marginBottom: 0 }}>LET'S <span className="blood-word">HAUNT</span></h2>
        </div>
        <p style={{ fontSize: "1rem", color: "var(--dim)", maxWidth: 480, textAlign: "center", lineHeight: 1.8 }}>Have a dark project? Want to conjure some AI? I'm always summoning new ideas.</p>
        <a href="mailto:mahesh.kc@example.com" className="contact-email">☠ mahesh.kc@example.com ☠</a>
        <div className="contact-form">
          <div className="form-row"><div className="form-group"><label className="form-label">Your Name</label><input className="form-input" type="text" placeholder="Mortal's name..." value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Dark Email</label><input className="form-input" type="email" placeholder="soul@void.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div></div>
          <div className="form-group"><label className="form-label">Nature of Curse</label><input className="form-input" type="text" placeholder="Project haunting, dark collaboration..." value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Your Dark Message</label><textarea className="form-textarea" placeholder="Whisper your dark desires..." value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} /></div>
          <button className="btn-primary" style={{ alignSelf: "flex-end" }} onClick={() => alert("Curse sent into the void! (connect to a backend to activate)")}>💀 SEND CURSE</button>
        </div>
        <div className="social-links">
          <a href="https://github.com/MaheshKC0909" target="_blank" rel="noopener noreferrer" className="social-link">💀 GitHub</a>
          <a href="https://www.linkedin.com/in/mahesh-kc-419a39275/" target="_blank" rel="noopener noreferrer" className="social-link">🕷️ LinkedIn</a>
          <a href="#" className="social-link">🦇 Twitter/X</a>
          <a href="#" className="social-link">🤗 HuggingFace</a>
        </div>
      </section>

      <footer><div className="footer-text">☠ 2025 MAHESH K.C. // ALL SOULS RESERVED ☠</div><div className="footer-text" style={{ color: "var(--dim2)", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.62rem" }}>CONJURED WITH <span style={{ color: "var(--blood2)" }}>🩸</span> + DARK MAGIC // BSC.CSIT // REACT</div></footer>
    </div>
  );
}
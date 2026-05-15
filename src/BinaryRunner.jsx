import { useState, useEffect, useRef, useCallback } from "react";

const GW = 860, GH = 520, GY = GH - 65;
const GRAVITY = 0.13;
const DRAG = 0.0015;
const IC_THRUST = 0.48;
const IC_MAXSPD = 9.5;
const IC_KILL_R = 20;
const RADAR_R = 290;

let _id = 1;
const uid = () => _id++;

function vlen(ax, ay) { return Math.sqrt(ax * ax + ay * ay); }
function vnorm(ax, ay) { const l = vlen(ax, ay) || 1e-9; return [ax / l, ay / l]; }

function sparks(x, y, color, n = 14) {
    return Array.from({ length: n }, () => ({
        id: uid(), x, y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.95) * 8,
        life: 1, color, r: Math.random() * 4 + 2
    }));
}

function buildTerrain() {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
        const x = (i / 30) * GW;
        const y = GY + Math.sin(i * 0.8) * 9 + Math.sin(i * 2.1) * 4;
        pts.push({ x, y });
    }
    return pts;
}

function predictIntercept(mx, my, mvx, mvy, bx, by, spd) {
    let lo = 0, hi = 240;
    for (let k = 0; k < 40; k++) {
        const t = (lo + hi) / 2;
        const fx = mx + mvx * t;
        const fy = my + mvy * t + 0.5 * GRAVITY * t * t;
        if (vlen(fx - bx, fy - by) < spd * t) hi = t; else lo = t;
    }
    const t = (lo + hi) / 2;
    return { x: mx + mvx * t, y: my + mvy * t + 0.5 * GRAVITY * t * t, t };
}

const DEF_TARGETS = [
    { id: "cmd", x: 660, label: "CMD", color: "#ff2d6b", hp: 3, maxhp: 3, alive: true },
    { id: "rad", x: 745, label: "RADAR", color: "#f0ff00", hp: 2, maxhp: 2, alive: true },
    { id: "base", x: 820, label: "BASE", color: "#ff7700", hp: 4, maxhp: 4, alive: true },
];

const DEF_BATTERIES = [
    { id: 0, x: 620, range: RADAR_R, reload: 140, timer: 0 },
    { id: 1, x: 748, range: RADAR_R * 0.82, reload: 95, timer: 0 },
    { id: 2, x: 832, range: RADAR_R * 0.68, reload: 75, timer: 0 },
];

export default function App() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    const rafRef = useRef(null);
    const ltRef = useRef(null);
    const mouseRef = useRef({ x: 200, y: 260 });
    const aimRef = useRef({ angle: -55 });
    const chargeRef = useRef({ on: false, level: 0, t0: 0 });

    const [screen, setScreen] = useState("start");
    const [best, setBest] = useState(0);

    const goToPortfolio = useCallback(() => {
        window.location.href = "/";
    }, []);

    function makeState() {
        return {
            missiles: [], interceptors: [],
            explosions: [], particles: [], flashes: [], pings: [],
            terrain: buildTerrain(),
            targets: DEF_TARGETS.map(t => ({ ...t, alive: true })),
            batteries: DEF_BATTERIES.map(b => ({ ...b, timer: 0 })),
            tracked: new Set(),
            sweepAngle: 0,
            score: 0, ammo: 5, frame: 0, alive: true
        };
    }

    const doLaunch = useCallback(() => {
        const g = gameRef.current;
        if (!g || !g.alive || g.ammo <= 0 || !chargeRef.current.on) return;
        const ang = aimRef.current.angle * Math.PI / 180;
        const pwr = chargeRef.current.level * 0.78 + 22;
        const spd = pwr * 0.182;
        g.missiles.push({
            id: uid(), x: 70, y: GY - 10,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            trail: [], alive: true
        });
        g.ammo--;
        chargeRef.current = { on: false, level: 0, t0: 0 };
    }, []);

    const startGame = useCallback(() => {
        _id = 1;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        gameRef.current = makeState();
        chargeRef.current = { on: false, level: 0, t0: 0 };
        setScreen("playing");
        setBest(prev => prev); // keep best
    }, []);

    // Mouse events
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const getXY = (e) => {
            const r = canvas.getBoundingClientRect();
            return {
                x: Math.max(10, Math.min(GW - 10, (e.clientX - r.left) * (GW / r.width))),
                y: Math.max(20, Math.min(GH - 20, (e.clientY - r.top) * (GH / r.height)))
            };
        };

        const onMove = (e) => {
            const p = getXY(e);
            mouseRef.current = p;
            const dx = p.x - 70, dy = p.y - (GY - 10);
            const a = Math.atan2(dy, dx) * 180 / Math.PI;
            aimRef.current.angle = Math.max(-88, Math.min(-5, a));
        };

        const onDown = (e) => {
            if (screen !== "playing") return;
            e.preventDefault();
            const g = gameRef.current;
            if (!g || !g.alive || g.ammo <= 0) return;
            chargeRef.current = { on: true, level: 0, t0: performance.now() };
        };

        const onUp = () => {
            if (screen !== "playing") return;
            doLaunch();
        };

        canvas.addEventListener("mousemove", onMove);
        canvas.addEventListener("mousedown", onDown);
        canvas.addEventListener("mouseup", onUp);
        return () => {
            canvas.removeEventListener("mousemove", onMove);
            canvas.removeEventListener("mousedown", onDown);
            canvas.removeEventListener("mouseup", onUp);
        };
    }, [screen, doLaunch]);

    // Keyboard
    useEffect(() => {
        const onKey = (e) => {
            if (e.repeat) return;
            if (["Space", "Enter"].includes(e.code)) {
                e.preventDefault();
                if (screen !== "playing") startGame();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [screen, startGame]);

    // GAME LOOP
    useEffect(() => {
        if (screen !== "playing") {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ltRef.current = performance.now();

        function loop(ts) {
            const dt = Math.min((ts - ltRef.current) / 16.67, 2.5);
            ltRef.current = ts;
            const g = gameRef.current;
            if (!g || !g.alive) return;

            // Update charge level
            if (chargeRef.current.on) {
                chargeRef.current.level = Math.min(100, (ts - chargeRef.current.t0) / 17);
            } else {
                chargeRef.current.level = 0;
            }

            g.frame++;
            g.sweepAngle = (g.sweepAngle + 1.3 * dt) % 360;

            // ── PHYSICS: player missiles ──────────────────────────────────────────
            for (let i = g.missiles.length - 1; i >= 0; i--) {
                const m = g.missiles[i];
                if (!m || !m.alive) continue;

                m.trail.unshift({ x: m.x, y: m.y });
                if (m.trail.length > 28) m.trail.pop();

                m.vy += GRAVITY * dt;
                const spd = vlen(m.vx, m.vy);
                const drag = DRAG * spd * spd * dt;
                const [nx, ny] = vnorm(m.vx, m.vy);
                m.vx -= nx * drag;
                m.vy -= ny * drag;

                m.x += m.vx * dt;
                m.y += m.vy * dt;

                if (m.y >= GY) {
                    m.alive = false;
                    g.explosions.push({ id: uid(), x: m.x, y: GY, r: 0, maxR: 34, life: 1, color: "#ff8800" });
                    g.particles.push(...sparks(m.x, GY, "#ff9933", 20));

                    for (const tgt of g.targets) {
                        if (!tgt.alive || tgt.hp <= 0) continue;
                        if (Math.abs(tgt.x - m.x) < 38) {
                            tgt.hp--;
                            if (tgt.hp <= 0) {
                                tgt.alive = false;
                                g.score += 500;
                                g.particles.push(...sparks(tgt.x, GY - 20, tgt.color, 30));
                                g.flashes.push({ text: "DESTROYED! +500", x: tgt.x, y: GY - 100, life: 1.6, color: "#00ff88" });
                            } else {
                                g.flashes.push({ text: "-HP", x: tgt.x, y: GY - 80, life: 1.2, color: "#ff2d6b" });
                            }
                            break;
                        }
                    }
                }
            }
            g.missiles = g.missiles.filter(m => m && m.alive && m.y < GY + 20);

            // ── RADAR: detect & launch interceptors ───────────────────────────────
            for (const bat of g.batteries) {
                if (bat.timer > 0) { bat.timer -= dt; continue; }
                for (const m of g.missiles) {
                    if (!m || !m.alive || g.tracked.has(m.id)) continue;
                    const dist = vlen(m.x - bat.x, m.y - (GY - 15));
                    if (dist < bat.range) {
                        g.tracked.add(m.id);
                        g.pings.push({ x: bat.x, y: GY - 15, r: 0, maxR: bat.range, life: 1 });

                        const ip = predictIntercept(m.x, m.y, m.vx, m.vy, bat.x, GY - 15, IC_MAXSPD);
                        if (ip.y < GY - 8 && ip.t > 5 && ip.t < 200) {
                            const ddx = ip.x - bat.x, ddy = ip.y - (GY - 15);
                            const [inx, iny] = vnorm(ddx, ddy);
                            const ls = Math.min(IC_MAXSPD * 0.55, vlen(ddx, ddy) / Math.max(ip.t, 1));
                            g.interceptors.push({
                                id: uid(),
                                x: bat.x, y: GY - 15,
                                vx: inx * ls * 1.7, vy: iny * ls * 1.7,
                                targetId: m.id,
                                predX: ip.x, predY: ip.y,
                                trail: [], alive: true, fuel: 44
                            });
                            bat.timer = bat.reload;
                        }
                        break;
                    }
                }
            }

            // ── PHYSICS: interceptors ─────────────────────────────────────────────
            for (let i = g.interceptors.length - 1; i >= 0; i--) {
                const ic = g.interceptors[i];
                if (!ic || !ic.alive) continue;

                ic.trail.unshift({ x: ic.x, y: ic.y });
                if (ic.trail.length > 18) ic.trail.pop();

                ic.fuel -= dt;
                const target = g.missiles.find(m => m && m.id === ic.targetId && m.alive);

                if (target && ic.fuel > 0) {
                    const lp = predictIntercept(target.x, target.y, target.vx, target.vy, ic.x, ic.y, IC_MAXSPD);
                    const [lnx, lny] = vnorm(lp.x - ic.x, lp.y - ic.y);
                    ic.vx += lnx * IC_THRUST * dt;
                    ic.vy += lny * IC_THRUST * dt;
                    const s2 = vlen(ic.vx, ic.vy);
                    if (s2 > IC_MAXSPD) {
                        ic.vx = ic.vx / s2 * IC_MAXSPD;
                        ic.vy = ic.vy / s2 * IC_MAXSPD;
                    }
                } else {
                    ic.vy += GRAVITY * dt;
                }

                const ispd = vlen(ic.vx, ic.vy);
                const idrag = DRAG * ispd * ispd * dt;
                const [inx2, iny2] = vnorm(ic.vx, ic.vy);
                ic.vx -= inx2 * idrag;
                ic.vy -= iny2 * idrag;

                ic.x += ic.vx * dt;
                ic.y += ic.vy * dt;

                for (const m of g.missiles) {
                    if (!m || !m.alive) continue;
                    if (vlen(ic.x - m.x, ic.y - m.y) < IC_KILL_R) {
                        ic.alive = false;
                        m.alive = false;
                        g.tracked.delete(m.id);
                        const ex = (ic.x + m.x) / 2, ey = (ic.y + m.y) / 2;
                        g.explosions.push({ id: uid(), x: ex, y: ey, r: 0, maxR: 55, life: 1.2, color: "#00f5ff" });
                        g.particles.push(...sparks(ex, ey, "#00f5ff", 22));
                        g.particles.push(...sparks(ex, ey, "#ffffff", 8));
                        g.score += 150;
                        g.flashes.push({ text: "INTERCEPTED! +150", x: ex, y: ey - 18, life: 1.5, color: "#00ff88" });
                        break;
                    }
                }

                if (!ic.alive) continue;
                if (ic.y > GY || ic.x < -80 || ic.x > GW + 80) {
                    if (ic.y > GY) g.explosions.push({ id: uid(), x: ic.x, y: GY, r: 0, maxR: 16, life: 0.7, color: "#336" });
                    ic.alive = false;
                }
            }
            g.interceptors = g.interceptors.filter(ic => ic && ic.alive);

            // Update explosions (in‑place splice)
            for (let i = g.explosions.length - 1; i >= 0; i--) {
                const e = g.explosions[i];
                e.r += 2.5 * dt;
                e.life -= 0.028 * dt;
                if (e.life <= 0 || e.r >= e.maxR * 1.4) {
                    g.explosions.splice(i, 1);
                }
            }

            // Update particles (in‑place splice)
            for (let i = g.particles.length - 1; i >= 0; i--) {
                const p = g.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += GRAVITY * 0.3 * dt;
                p.life -= 0.024 * dt;
                if (p.life <= 0) g.particles.splice(i, 1);
            }

            // Update flashes (in‑place splice)
            for (let i = g.flashes.length - 1; i >= 0; i--) {
                const f = g.flashes[i];
                f.y -= 1.1 * dt;
                f.life -= 0.022 * dt;
                if (f.life <= 0) g.flashes.splice(i, 1);
            }

            // Update pings (in‑place splice)
            for (let i = g.pings.length - 1; i >= 0; i--) {
                const p = g.pings[i];
                p.r += 2.9 * dt;
                p.life -= 0.03 * dt;
                if (p.life <= 0) g.pings.splice(i, 1);
            }

            // ── WIN / LOSE ────────────────────────────────────────────────────────
            const allGone = g.targets.every(t => !t.alive || t.hp <= 0);
            const outOfMissiles = g.ammo <= 0 && g.missiles.length === 0 && g.interceptors.length === 0;

            if (allGone) {
                g.alive = false;
                g.score += 1000;
                setBest(p => Math.max(p, Math.floor(g.score)));
                setTimeout(() => setScreen("win"), 1100);
                return;
            }
            if (outOfMissiles) {
                g.alive = false;
                setBest(p => Math.max(p, Math.floor(g.score)));
                setTimeout(() => setScreen("dead"), 900);
                return;
            }

            // ════════════════════════════════════════════════════════════════
            // DRAW (unchanged, but uses chargeRef for crosshair)
            // ════════════════════════════════════════════════════════════════
            ctx.clearRect(0, 0, GW, GH);

            // Sky gradient
            const sky = ctx.createLinearGradient(0, 0, 0, GH);
            sky.addColorStop(0, "#000308");
            sky.addColorStop(0.55, "#010a16");
            sky.addColorStop(1, "#011020");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, GW, GH);

            // Stars
            for (let i = 0; i < 110; i++) {
                const sx = (i * 137.5) % GW;
                const sy = (i * 89.3) % (GH * 0.68);
                const tw = 0.3 + Math.sin(g.frame * 0.012 + i * 1.4) * 0.28;
                ctx.globalAlpha = tw * 0.75;
                ctx.fillStyle = i % 6 === 0 ? "#aabbff" : "#ffffff";
                ctx.fillRect(sx, sy, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
            }
            ctx.globalAlpha = 1;

            // Attacker side glow (left = blue)
            const lg = ctx.createLinearGradient(0, 0, GW * 0.25, 0);
            lg.addColorStop(0, "rgba(30,80,255,0.07)");
            lg.addColorStop(1, "transparent");
            ctx.fillStyle = lg;
            ctx.fillRect(0, 0, GW, GH);

            // Defender side glow (right = red)
            const rg = ctx.createLinearGradient(GW * 0.55, 0, GW, 0);
            rg.addColorStop(0, "transparent");
            rg.addColorStop(1, "rgba(255,45,107,0.05)");
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, GW, GH);

            // ── RADAR SWEEPS ──────────────────────────────────────────────────────
            for (const bat of g.batteries) {
                const bx = bat.x, by = GY - 15;
                ctx.save();
                ctx.setLineDash([4, 9]);
                ctx.strokeStyle = "rgba(0,245,255,0.06)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(bx, by, bat.range, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                const sa = (g.sweepAngle + bat.id * 90) * Math.PI / 180;
                ctx.strokeStyle = "rgba(0,245,255,0.32)";
                ctx.lineWidth = 1.5;
                ctx.shadowColor = "#00f5ff";
                ctx.shadowBlur = 7;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + Math.cos(sa) * bat.range, by + Math.sin(sa) * bat.range);
                ctx.stroke();

                ctx.globalAlpha = 0.07;
                ctx.fillStyle = "#00f5ff";
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.arc(bx, by, bat.range, sa - 0.28, sa);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // Radar pings
            for (const p of g.pings) {
                ctx.save();
                ctx.globalAlpha = p.life * 0.45;
                ctx.strokeStyle = "#00f5ff";
                ctx.shadowColor = "#00f5ff";
                ctx.shadowBlur = 12;
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // ── TERRAIN ───────────────────────────────────────────────────────────
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, GH);
            for (const pt of g.terrain) ctx.lineTo(pt.x, pt.y);
            ctx.lineTo(GW, GH);
            ctx.closePath();
            const tg = ctx.createLinearGradient(0, GY, 0, GH);
            tg.addColorStop(0, "#091a0c");
            tg.addColorStop(1, "#040b06");
            ctx.fillStyle = tg;
            ctx.fill();
            ctx.strokeStyle = "rgba(0,200,80,0.45)";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "rgba(0,200,80,0.25)";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            for (let i = 0; i < g.terrain.length; i++) {
                const pt = g.terrain[i];
                if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
            ctx.restore();

            // ── SAM BATTERIES ─────────────────────────────────────────────────────
            for (const bat of g.batteries) {
                const bx = bat.x, by = GY - 2;
                const reloadFrac = 1 - Math.max(0, bat.timer / bat.reload);
                ctx.save();
                ctx.shadowColor = "rgba(0,245,255,0.55)";
                ctx.shadowBlur = 10;

                ctx.fillStyle = "#071c28";
                ctx.strokeStyle = "rgba(0,245,255,0.65)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(bx - 16, by - 23, 32, 23);
                ctx.fill();
                ctx.stroke();

                ctx.save();
                ctx.translate(bx, by - 13);
                ctx.rotate(-Math.PI / 3);
                ctx.fillStyle = "#00f5ff";
                ctx.shadowColor = "#00f5ff";
                ctx.shadowBlur = 8;
                ctx.fillRect(-2.5, -14, 5, 14);
                ctx.restore();

                ctx.shadowBlur = 0;
                ctx.fillStyle = "rgba(0,245,255,0.1)";
                ctx.fillRect(bx - 13, by - 6, 26, 4);

                ctx.fillStyle = reloadFrac >= 1 ? "#00ff88" : "#00f5ff";
                ctx.shadowColor = reloadFrac >= 1 ? "#00ff88" : "#00f5ff";
                ctx.shadowBlur = 5;
                ctx.fillRect(bx - 13, by - 6, 26 * reloadFrac, 4);

                ctx.font = "8px monospace";
                ctx.fillStyle = "rgba(0,245,255,0.55)";
                ctx.shadowBlur = 0;
                ctx.textAlign = "center";
                ctx.fillText("SAM-" + (bat.id + 1), bx, by - 27);
                ctx.restore();
            }

            // ── DEFENDER TARGETS ──────────────────────────────────────────────────
            for (const tgt of g.targets) {
                if (!tgt.alive || tgt.hp <= 0) {
                    ctx.save();
                    ctx.fillStyle = "rgba(70,25,10,0.65)";
                    ctx.fillRect(tgt.x - 22, GY - 26, 44, 26);
                    ctx.restore();
                    continue;
                }
                const bh = 40 + tgt.maxhp * 7;
                const r = parseInt(tgt.color.slice(1, 3), 16);
                const g2 = parseInt(tgt.color.slice(3, 5), 16);
                const b = parseInt(tgt.color.slice(5, 7), 16);

                ctx.save();
                ctx.shadowColor = tgt.color;
                ctx.shadowBlur = 14;

                ctx.fillStyle = `rgba(${r},${g2},${b},0.12)`;
                ctx.strokeStyle = tgt.color;
                ctx.lineWidth = 1.5;
                ctx.fillRect(tgt.x - 21, GY - bh, 42, bh);
                ctx.strokeRect(tgt.x - 21, GY - bh, 42, bh);

                const wa = 0.3 + Math.sin(g.frame * 0.04 + tgt.x) * 0.15;
                ctx.fillStyle = `rgba(${r},${g2},${b},${wa})`;
                for (let wx = 0; wx < 3; wx++) {
                    for (let wy = 0; wy < 3; wy++) {
                        ctx.fillRect(tgt.x - 15 + wx * 11, GY - bh + 8 + wy * 11, 7, 7);
                    }
                }

                ctx.shadowBlur = 0;
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(tgt.x - 21, GY - bh - 11, 42, 5);
                const hpf = tgt.hp / tgt.maxhp;
                ctx.fillStyle = hpf > 0.5 ? "#00ff88" : hpf > 0.25 ? "#f0ff00" : "#ff2d6b";
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 4;
                ctx.fillRect(tgt.x - 21, GY - bh - 11, 42 * hpf, 5);

                ctx.font = "bold 9px monospace";
                ctx.fillStyle = tgt.color;
                ctx.shadowBlur = 6;
                ctx.textAlign = "center";
                ctx.fillText(tgt.label, tgt.x, GY - bh - 14);
                ctx.restore();
            }

            // ── LAUNCH PAD (attacker) ─────────────────────────────────────────────
            const lpx = 70, lpy = GY - 2;
            const ang = aimRef.current.angle * Math.PI / 180;

            ctx.save();
            ctx.shadowColor = "rgba(68,136,255,0.7)";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#091525";
            ctx.strokeStyle = "rgba(68,136,255,0.75)";
            ctx.lineWidth = 1.5;
            ctx.fillRect(lpx - 22, lpy - 28, 44, 28);
            ctx.strokeRect(lpx - 22, lpy - 28, 44, 28);

            ctx.strokeStyle = "#4488ff";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#4488ff";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(lpx, lpy - 14);
            ctx.lineTo(lpx + Math.cos(ang) * 30, lpy - 14 + Math.sin(ang) * 30);
            ctx.stroke();

            ctx.font = "bold 8px monospace";
            ctx.fillStyle = "rgba(68,136,255,0.75)";
            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            ctx.fillText("ATTACKER", lpx, lpy - 32);

            const ammoColor = g.ammo > 2 ? "#4488ff" : g.ammo > 0 ? "#f0ff00" : "#ff2d6b";
            ctx.fillStyle = ammoColor;
            ctx.shadowColor = ammoColor;
            ctx.shadowBlur = 8;
            ctx.font = "bold 13px monospace";
            ctx.fillText("x" + g.ammo, lpx, lpy - 45);
            ctx.restore();

            // ── TRAJECTORY PREVIEW ────────────────────────────────────────────────
            if (g.ammo > 0) {
                const pwr2 = (chargeRef.current.on ? chargeRef.current.level * 0.78 + 22 : 52) * 0.182;
                let px2 = lpx, py2 = lpy - 14;
                let pvx = Math.cos(ang) * pwr2, pvy = Math.sin(ang) * pwr2;
                ctx.save();
                ctx.strokeStyle = chargeRef.current.on ? "rgba(240,255,0,0.35)" : "rgba(68,136,255,0.22)";
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 7]);
                ctx.beginPath();
                ctx.moveTo(px2, py2);
                for (let t = 0; t < 90; t++) {
                    const spd3 = vlen(pvx, pvy);
                    pvx -= DRAG * spd3 * pvx;
                    pvy -= DRAG * spd3 * pvy;
                    pvy += GRAVITY;
                    px2 += pvx; py2 += pvy;
                    if (py2 > GY || px2 > GW + 50) break;
                    if (t % 3 === 0) ctx.lineTo(px2, py2);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }

            // ── EXPLOSIONS ────────────────────────────────────────────────────────
            for (const e of g.explosions) {
                const prog = e.r / e.maxR;
                ctx.save();
                ctx.globalAlpha = e.life * (1 - prog * 0.6);
                ctx.strokeStyle = e.color;
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 22;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                ctx.stroke();

                const radg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 0.65);
                radg.addColorStop(0, e.color + "55");
                radg.addColorStop(1, "transparent");
                ctx.globalAlpha = e.life * 0.5 * (1 - prog);
                ctx.fillStyle = radg;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r * 0.65, 0, Math.PI * 2);
                ctx.fill();

                if (e.r > 12) {
                    ctx.globalAlpha = e.life * 0.22;
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.r * 0.45, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // ── PLAYER MISSILES ───────────────────────────────────────────────────
            for (const m of g.missiles) {
                if (!m || !m.alive) continue;
                ctx.save();
                for (let i = 0; i < m.trail.length - 1; i++) {
                    const a = (1 - i / m.trail.length) * 0.7;
                    ctx.globalAlpha = a;
                    ctx.strokeStyle = `hsl(${28 - i * 1.3}, 100%, ${62 - i}%)`;
                    ctx.lineWidth = 3.5 - i * 0.1;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(m.trail[i].x, m.trail[i].y);
                    ctx.lineTo(m.trail[i + 1].x, m.trail[i + 1].y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                const ma = Math.atan2(m.vy, m.vx);
                ctx.translate(m.x, m.y);
                ctx.rotate(ma);
                ctx.shadowColor = "#ff8800";
                ctx.shadowBlur = 18;
                ctx.fillStyle = "#ffaa44";
                ctx.beginPath();
                ctx.ellipse(0, 0, 11, 3.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ff4400";
                ctx.beginPath();
                ctx.moveTo(9, 0); ctx.lineTo(16, -2.5); ctx.lineTo(16, 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // ── INTERCEPTORS ──────────────────────────────────────────────────────
            for (const ic of g.interceptors) {
                if (!ic || !ic.alive) continue;
                ctx.save();
                for (let i = 0; i < ic.trail.length - 1; i++) {
                    const a = (1 - i / ic.trail.length) * 0.72;
                    ctx.globalAlpha = a;
                    ctx.strokeStyle = `hsl(${192 + i * 1.5}, 100%, ${70 - i * 2}%)`;
                    ctx.lineWidth = 3 - i * 0.1;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(ic.trail[i].x, ic.trail[i].y);
                    ctx.lineTo(ic.trail[i + 1].x, ic.trail[i + 1].y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                const ia = Math.atan2(ic.vy, ic.vx);
                ctx.translate(ic.x, ic.y);
                ctx.rotate(ia);
                ctx.shadowColor = "#00f5ff";
                ctx.shadowBlur = 16;
                ctx.fillStyle = "#88eeff";
                ctx.beginPath();
                ctx.ellipse(0, 0, 8, 2.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#00f5ff";
                ctx.beginPath();
                ctx.moveTo(7, 0); ctx.lineTo(11, -2); ctx.lineTo(11, 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                if (ic.fuel > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.28;
                    ctx.strokeStyle = "#00f5ff";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 5]);
                    ctx.beginPath();
                    ctx.arc(ic.predX, ic.predY, 9, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();
                }
            }

            // ── PARTICLES ─────────────────────────────────────────────────────────
            for (const p of g.particles) {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ── SCORE FLASHES ─────────────────────────────────────────────────────
            for (const f of g.flashes) {
                ctx.save();
                ctx.globalAlpha = Math.min(f.life, 1);
                ctx.font = "bold 13px monospace";
                ctx.fillStyle = f.color;
                ctx.shadowColor = f.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = "center";
                ctx.fillText(f.text, f.x, f.y);
                ctx.restore();
            }

            // ── CROSSHAIR ─────────────────────────────────────────────────────────
            const mx = mouseRef.current.x, my = mouseRef.current.y;
            ctx.save();
            const cc = chargeRef.current.on ? "rgba(240,255,0,0.9)" : "rgba(68,136,255,0.85)";
            ctx.strokeStyle = cc;
            ctx.lineWidth = 1.2;
            ctx.shadowColor = cc;
            ctx.shadowBlur = 8;
            const cs = 15;
            ctx.beginPath();
            ctx.moveTo(mx - cs, my); ctx.lineTo(mx - 6, my);
            ctx.moveTo(mx + 6, my); ctx.lineTo(mx + cs, my);
            ctx.moveTo(mx, my - cs); ctx.lineTo(mx, my - 6);
            ctx.moveTo(mx, my + 6); ctx.lineTo(mx, my + cs);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(mx, my, 5, 0, Math.PI * 2);
            ctx.stroke();

            if (chargeRef.current.on && chargeRef.current.level > 0) {
                ctx.globalAlpha = 0.72;
                ctx.strokeStyle = "#f0ff00";
                ctx.lineWidth = 2.8;
                ctx.shadowColor = "#f0ff00";
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(mx, my, 13, -Math.PI / 2, -Math.PI / 2 + (chargeRef.current.level / 100) * Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // ── HUD TOP ───────────────────────────────────────────────────────────
            ctx.save();
            ctx.fillStyle = "rgba(0,4,14,0.74)";
            ctx.fillRect(0, 0, GW, 36);
            ctx.strokeStyle = "rgba(0,245,255,0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(GW, 36); ctx.stroke();

            ctx.font = "bold 12px monospace";
            ctx.fillStyle = "rgba(0,245,255,0.9)";
            ctx.shadowColor = "#00f5ff"; ctx.shadowBlur = 7;
            ctx.textAlign = "left";
            ctx.fillText("SCORE: " + Math.floor(g.score).toString().padStart(6, "0"), 16, 23);
            ctx.textAlign = "right";
            ctx.fillText("MISSILES: " + g.ammo, GW - 16, 23);
            ctx.textAlign = "center";
            ctx.font = "9px monospace";
            ctx.fillStyle = "rgba(0,245,255,0.38)";
            ctx.shadowBlur = 0;
            ctx.fillText("HOLD TO CHARGE POWER  •  AIM WITH CURSOR  •  RELEASE TO FIRE", GW / 2, 23);

            // ── HUD BOTTOM ────────────────────────────────────────────────────────
            ctx.fillStyle = "rgba(0,4,14,0.74)";
            ctx.fillRect(0, GH - 28, GW, 28);
            ctx.strokeStyle = "rgba(255,45,107,0.12)";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, GH - 28); ctx.lineTo(GW, GH - 28); ctx.stroke();

            for (let i = 0; i < g.targets.length; i++) {
                const tgt = g.targets[i];
                const tx = GW / 2 - 120 + i * 120;
                const alive = tgt.alive && tgt.hp > 0;
                ctx.font = "9px monospace";
                ctx.textAlign = "center";
                ctx.fillStyle = alive ? tgt.color : "rgba(100,100,100,0.5)";
                ctx.shadowColor = alive ? tgt.color : "transparent";
                ctx.shadowBlur = alive ? 5 : 0;
                ctx.fillText(`${tgt.label}: ${Math.max(0, tgt.hp)}/${tgt.maxhp} HP`, tx, GH - 11);
            }
            ctx.restore();

            if (g.alive) rafRef.current = requestAnimationFrame(loop);
        }

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [screen]);

    // ── SCREENS (unchanged except reading score from gameRef) ─────────────────
    const glow = (c = "#00f5ff") => ({ color: c, textShadow: `0 0 18px ${c}, 0 0 36px ${c}` });
    const btnStyle = (c = "#00f5ff") => ({
        fontFamily: "monospace", fontSize: 13, letterSpacing: 3,
        padding: "11px 30px", background: "transparent", color: c,
        border: `1px solid ${c}88`, cursor: "pointer",
        clipPath: "polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%)",
        transition: "all .2s", textShadow: `0 0 10px ${c}`,
    });
    const overlayStyle = {
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "rgba(0,3,12,0.93)", backdropFilter: "blur(6px)",
        zIndex: 10, gap: 18, fontFamily: "monospace",
    };

    return (
        <div style={{ background: "#010308", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "monospace" }}>
            <div style={{ marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 900, letterSpacing: 6, ...glow("#4488ff"), marginBottom: 4 }}>
                    STRIKE <span style={{ color: "#ff2d6b", textShadow: "0 0 16px #ff2d6b" }}>&amp;</span>{" "}
                    <span style={{ ...glow("#00f5ff") }}>DEFEND</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(0,245,255,0.35)", letterSpacing: 4 }}>
                    BALLISTIC MISSILE ENGAGEMENT SIMULATOR
                </div>
            </div>

            <div style={{ position: "relative", width: GW, maxWidth: "100%", background: "#010609", border: "1px solid rgba(0,245,255,0.15)", boxShadow: "0 0 60px rgba(0,20,60,0.7)", overflow: "hidden" }}>
                <canvas ref={canvasRef} width={GW} height={GH} style={{ display: "block", maxWidth: "100%", cursor: "none" }} />

                {screen === "start" && (
                    <div style={overlayStyle}>
                        <div style={{ fontSize: 9, letterSpacing: 6, color: "rgba(68,136,255,0.55)" }}>TARGETING SYSTEM ARMED</div>
                        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 4, ...glow("#4488ff") }}>
                            STRIKE <span style={{ ...glow("#ff2d6b") }}>&amp;</span>{" "}
                            <span style={{ ...glow("#00f5ff") }}>DEFEND</span>
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(0,245,255,0.5)", letterSpacing: 1.5, textAlign: "center", lineHeight: 2.3, maxWidth: 480 }}>
                            <span style={{ color: "#4488ff" }}>HOLD</span> mouse button to charge power — longer = faster missile<br />
                            <span style={{ color: "#4488ff" }}>MOVE</span> cursor to aim — trajectory follows real ballistic arc<br />
                            <span style={{ color: "#f0ff00" }}>RELEASE</span> to fire — gravity + drag physics always applied<br />
                            <span style={{ color: "#00f5ff" }}>3 SAM BATTERIES</span> radar-detect your missile &amp; fire interceptors<br />
                            Interceptors use <span style={{ color: "#00f5ff" }}>proportional navigation</span> to predict &amp; intercept<br />
                            Destroy all <span style={{ color: "#ff2d6b" }}>3 targets</span> using only <span style={{ color: "#ff2d6b" }}>5 missiles</span>
                        </div>
                        <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
                            <button
                                style={btnStyle("#4488ff")}
                                onClick={startGame}
                                onMouseOver={e => { e.target.style.background = "rgba(68,136,255,0.12)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                INITIATE STRIKE
                            </button>
                            <button
                                style={btnStyle("#f0ff00")}
                                onClick={goToPortfolio}
                                onMouseOver={e => { e.target.style.background = "rgba(240,255,0,0.1)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                BACK TO PORTFOLIO
                            </button>
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(68,136,255,0.3)", letterSpacing: 3 }}>SPACE / ENTER to begin</div>
                    </div>
                )}

                {screen === "dead" && (
                    <div style={overlayStyle}>
                        <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,45,107,0.7)" }}>STRIKE FAILED</div>
                        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, ...glow("#ff2d6b") }}>MISSION FAILED</div>
                        <div style={{ fontSize: 11, color: "rgba(255,45,107,0.55)", letterSpacing: 2 }}>Missiles exhausted — targets survived</div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 26, fontWeight: 900, ...glow("#00f5ff") }}>{Math.floor(gameRef.current?.score || 0).toString().padStart(6, "0")}</div>
                            <div style={{ fontSize: 9, color: "rgba(0,245,255,0.4)", letterSpacing: 3, marginTop: 4 }}>FINAL SCORE</div>
                        </div>
                        <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
                            <button
                                style={btnStyle("#ff2d6b")}
                                onClick={startGame}
                                onMouseOver={e => { e.target.style.background = "rgba(255,45,107,0.12)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                RETRY MISSION
                            </button>
                            <button
                                style={btnStyle("#f0ff00")}
                                onClick={goToPortfolio}
                                onMouseOver={e => { e.target.style.background = "rgba(240,255,0,0.1)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                BACK TO PORTFOLIO
                            </button>
                        </div>
                    </div>
                )}

                {screen === "win" && (
                    <div style={overlayStyle}>
                        <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(0,255,136,0.8)" }}>ALL TARGETS NEUTRALIZED</div>
                        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, ...glow("#00ff88") }}>MISSION SUCCESS</div>
                        <div style={{ display: "flex", gap: 52, margin: "8px 0" }}>
                            {[["SCORE", Math.floor(gameRef.current?.score || 0).toString().padStart(6, "0"), "#00f5ff"], ["BEST", best.toString().padStart(6, "0"), "#f0ff00"]].map(([l, v, c]) => (
                                <div key={l} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 26, fontWeight: 900, ...glow(c) }}>{v}</div>
                                    <div style={{ fontSize: 9, color: `${c}66`, letterSpacing: 3, marginTop: 4 }}>{l}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
                            <button
                                style={btnStyle("#f0ff00")}
                                onClick={startGame}
                                onMouseOver={e => { e.target.style.background = "rgba(240,255,0,0.1)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                NEW MISSION
                            </button>
                            <button
                                style={btnStyle("#4488ff")}
                                onClick={goToPortfolio}
                                onMouseOver={e => { e.target.style.background = "rgba(68,136,255,0.12)"; }}
                                onMouseOut={e => { e.target.style.background = "transparent"; }}
                            >
                                BACK TO PORTFOLIO
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: 10, color: "rgba(0,245,255,0.28)", letterSpacing: 2 }}>
                <span><span style={{ color: "#4488ff" }}>HOLD+AIM</span> Charge &amp; direct</span>
                <span><span style={{ color: "#f0ff00" }}>RELEASE</span> Fire missile</span>
                <span><span style={{ color: "#00f5ff" }}>RADAR</span> Auto-intercepts</span>
                <span><span style={{ color: "#ff8800" }}>GRAVITY+DRAG</span> Physics</span>
            </div>
        </div>
    );
}
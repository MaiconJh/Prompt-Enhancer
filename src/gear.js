// ===== src/gear.js =====
    // ===== Gear canvas (loading overlay) =====
    const GEAR_STATES = {
        connecting: { rgb: [124, 156, 255], rgb2: [168,  85, 247], morph: 0.0, speed: 1.0, minDisplayMs: 250 },
        waiting:    { rgb: [148, 154, 177], rgb2: [100, 116, 139], morph: 0.25, speed: 0.6, minDisplayMs: 300 },
        dispatching:{ rgb: [124, 156, 255], rgb2: [168,  85, 247], morph: 0.1, speed: 1.2, minDisplayMs: 250 },
        awaiting_ttfb: { rgb: [148, 154, 177], rgb2: [100, 116, 139], morph: 0.3, speed: 0.8, minDisplayMs: 350 },
        awaiting_token: { rgb: [148, 154, 177], rgb2: [100, 116, 139], morph: 0.45, speed: 1.0, minDisplayMs: 300 },
        streaming:  { rgb: [ 56, 189, 248], rgb2: [124, 156, 255], morph: 0.65, speed: 1.8, minDisplayMs: 200 },
        finalizing: { rgb: [ 16, 185, 129], rgb2: [ 52, 211, 153], morph: 1.0, speed: 1.4, minDisplayMs: 250 },
        retrying:   { rgb: [245, 158,  11], rgb2: [239,  68,  68], morph: 0.4, speed: -0.7, minDisplayMs: 400 }
    };

    function createGear(canvas, initialState = 'connecting') {
        if (!canvas) return null;
        const size = 48;
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        canvas.style.width  = size + 'px';
        canvas.style.height = size + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const initial = GEAR_STATES[initialState] || GEAR_STATES.connecting;
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const sim = {
            phase: 0, absTime: 0,
            speed: initial.speed,
            morphProgress: initial.morph,
            rgb: [...initial.rgb],
            rgb2: [...initial.rgb2]
        };
        let target = initial;
        let stateQueue = [];
        let queueTimer = null;
        let last = performance.now();
        let rafId = null;
        let stopped = false;

        function render() {
            ctx.clearRect(0, 0, size, size);
            const cx = size / 2, cy = size / 2;
            const baseR = size * 0.35;
            const [r1, g1, b1] = sim.rgb.map(Math.round);
            const [r2, g2, b2] = sim.rgb2.map(Math.round);
            const morph = sim.morphProgress;

            const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseR * 1.5);
            glow.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.2 + morph * 0.15})`);
            glow.addColorStop(1, `rgba(${r1}, ${g1}, ${b1}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, baseR * 1.5, 0, Math.PI * 2);
            ctx.fill();

            if (morph < 1) {
                const alphaRing = Math.pow(1 - morph, 0.7) * 0.55;
                if (alphaRing > 0.005) {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(sim.phase * 0.5);
                    ctx.beginPath();
                    ctx.arc(0, 0, baseR * 1.18, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${alphaRing})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            const steps = 120;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(sim.phase * (0.4 + morph * 0.6));
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * Math.PI * 2;
                const fluidWave =
                    Math.sin(theta * 3 + sim.absTime * 2.5) * 0.12 +
                    Math.cos(theta * 5 - sim.absTime * 1.8) * 0.08;
                const teeth = 8;
                const gearWave = (Math.cos(teeth * theta) - 0.18 * Math.cos(3 * teeth * theta)) * 0.15;
                const combinedDeform = (1 - morph) * fluidWave + morph * gearWave;
                const r = baseR * (1 + combinedDeform);
                const x = Math.cos(theta) * r;
                const y = Math.sin(theta) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            const fillGrad = ctx.createLinearGradient(-baseR, -baseR, baseR, baseR);
            fillGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${0.25 + morph * 0.15})`);
            fillGrad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${0.08 + morph * 0.1})`);
            ctx.fillStyle = fillGrad;
            ctx.fill();

            const strokeGrad = ctx.createLinearGradient(-baseR, -baseR, baseR, baseR);
            strokeGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
            strokeGrad.addColorStop(0.5, '#FFFFFF');
            strokeGrad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
            ctx.strokeStyle = strokeGrad;
            ctx.lineWidth = 1.8;
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.restore();

            if (morph > 0.3) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(-sim.phase * 1.2);
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${morph * 0.75})`;
                ctx.lineWidth = 1.1;
                ctx.setLineDash([2.5, 2.5]);
                ctx.stroke();
                ctx.restore();
            }

            const pulse = 1 + 0.12 * Math.sin(sim.absTime * 4);
            ctx.beginPath();
            ctx.arc(cx, cy, (size * 0.08) * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }

        function loop(now) {
            if (stopped) return;
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const damp = 1 - Math.exp(-5.5 * dt);
            sim.speed += (target.speed - sim.speed) * damp;
            sim.morphProgress += (target.morph - sim.morphProgress) * damp;
            for (let i = 0; i < 3; i++) {
                sim.rgb[i]  += (target.rgb[i]  - sim.rgb[i])  * damp;
                sim.rgb2[i] += (target.rgb2[i] - sim.rgb2[i]) * damp;
            }
            sim.absTime += dt;
            sim.phase   += dt * sim.speed;
            render();
            rafId = requestAnimationFrame(loop);
        }
        rafId = requestAnimationFrame(loop);

        function flushQueue() {
            if (queueTimer) { clearTimeout(queueTimer); queueTimer = null; }
            if (stateQueue.length === 0) return;
            const next = stateQueue.shift();
            const s = GEAR_STATES[next];
            if (s) target = s;
            const waitMs = reducedMotion ? 0 : (s?.minDisplayMs ?? 0);
            queueTimer = setTimeout(flushQueue, waitMs);
        }

        return {
            setState(state) {
                const s = GEAR_STATES[state];
                if (!s) return;
                if (target === s && stateQueue.length === 0) return;
                stateQueue.push(state);
                if (!queueTimer) flushQueue();
            },
            setMorphProgress(value) {
                const v = Math.max(0, Math.min(1, Number(value)));
                sim.morphProgress = v;
                target.morph = v;
            },
            getMorphProgress() {
                return sim.morphProgress;
            },
            destroy() {
                stopped = true;
                if (queueTimer) { clearTimeout(queueTimer); queueTimer = null; }
                stateQueue = [];
                if (rafId) cancelAnimationFrame(rafId);
                rafId = null;
            }
        };
    }


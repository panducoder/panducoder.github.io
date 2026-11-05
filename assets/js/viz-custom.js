/* Bespoke interactive visualizations, one per flagship project. */
(() => {
  const { V, h, escapeHTML, visibleStart, reduced } = window.VZ;
  const svgNS = 'http://www.w3.org/2000/svg';
  const S = (tag, attrs = {}) => { const el = document.createElementNS(svgNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
  const tabs = (labels, onPick, start = 0) => {
    const row = h('div', { class: 'ctl', role: 'tablist' });
    const bs = labels.map((l, i) => h('button', { role: 'tab', onclick: () => pick(i) }, l));
    const pick = (i) => { bs.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); }); onPick(i); };
    row.append(...bs); setTimeout(() => pick(start)); return row;
  };
  const toggles = (items, onChange) => {
    const row = h('div', { class: 'ctl' });
    const state = {};
    items.forEach(([k, l, on]) => {
      state[k] = !!on;
      const b = h('button', { 'aria-pressed': String(!!on), onclick: () => { state[k] = !state[k]; b.classList.toggle('on', state[k]); b.setAttribute('aria-pressed', state[k]); onChange(state); } }, l);
      if (on) b.classList.add('on'); row.append(b);
    });
    setTimeout(() => onChange(state)); return row;
  };

  /* ---------- ScreenCraft: raw recording vs beautified ---------- */
  V.recorder = (root) => {
    const W = 640, H = 380;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'A screen recording with effects applied' });
    const defs = S('defs');
    defs.innerHTML = `<linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#11f590"/><stop offset=".5" stop-color="#1395a1"/><stop offset="1" stop-color="#1537b3"/></linearGradient>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".55"/></filter>
      <clipPath id="clipr"><rect id="cliprect" x="0" y="0" width="${W}" height="${H}" rx="0"/></clipPath>`;
    svg.append(defs);
    const bg = S('rect', { width: W, height: H, fill: '#0d0d0d' }); svg.append(bg);
    const cam = S('g'); svg.append(cam);
    const win = S('g', { 'clip-path': 'url(#clipr)' }); cam.append(win);
    const winBox = S('rect', { width: W, height: H, fill: '#f6f6f4' }); win.append(winBox);
    // fake app UI
    win.append(S('rect', { width: W, height: 34, fill: '#e9e9e6' }));
    [14, 30, 46].forEach((x, i) => win.append(S('circle', { cx: x, cy: 17, r: 5, fill: ['#ff5f57', '#febc2e', '#28c840'][i] })));
    win.append(S('rect', { x: 0, y: 34, width: 150, height: H - 34, fill: '#efefec' }));
    for (let i = 0; i < 6; i++) win.append(S('rect', { x: 16, y: 56 + i * 30, width: 100 - (i % 3) * 18, height: 10, rx: 5, fill: '#d4d4cf' }));
    for (let i = 0; i < 3; i++) win.append(S('rect', { x: 176, y: 60 + i * 92, width: 430, height: 74, rx: 10, fill: '#fff', stroke: '#e2e2de' }));
    const btn = S('rect', { x: 470, y: 300, width: 120, height: 36, rx: 9, fill: '#1537b3' }); win.append(btn);
    const btnT = S('text', { x: 530, y: 323, 'text-anchor': 'middle', 'font-size': 13, fill: '#fff', 'font-weight': 600 }); btnT.textContent = 'Publish'; win.append(btnT);
    const cursor = S('path', { d: 'M0 0 L0 18 L5 13 L9 22 L12 21 L8 12 L15 12 Z', fill: '#111', stroke: '#fff', 'stroke-width': 1.4 });
    cam.append(cursor);
    const ring = S('circle', { r: 0, fill: 'none', stroke: '#11f590', 'stroke-width': 3, opacity: 0 }); cam.append(ring);
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Turn effects on and off. The recording stays the same; only post-processing changes.'));
    let st = {};
    root.append(toggles([['smooth', 'Smooth cursor', true], ['frame', 'Rounded frame + shadow', true], ['bg', 'Background', true], ['zoom', 'Auto-zoom on click', true]], (s) => { st = s; layout(); }));
    root.append(h('div', { class: 'panel' }, [svg]));
    const pathPts = [[260, 120], [420, 90], [380, 210], [520, 318], [520, 318], [300, 260], [260, 120]];
    const layout = () => {
      const pad = st.bg ? 34 : 0;
      bg.setAttribute('fill', st.bg ? 'url(#bgg)' : '#0d0d0d');
      const r = st.frame ? 14 : 0;
      document.getElementById('cliprect') && svg.querySelector('#cliprect').setAttribute('rx', r);
      win.setAttribute('filter', st.frame ? 'url(#sh)' : '');
      const sc = (W - pad * 2) / W;
      win.setAttribute('transform', `translate(${pad},${pad * (H / W)}) scale(${sc})`);
      win.dataset.pad = pad; win.dataset.sc = sc;
    };
    let t = 0, raf, last = performance.now(), sm = [260, 120];
    const lerp = (a, b, k) => a + (b - a) * k;
    const tick = (now) => {
      const dt = Math.min(50, now - last); last = now; t += dt / 1000;
      const seg = (t * 0.55) % (pathPts.length - 1), i = Math.floor(seg), f = seg - i;
      let x = lerp(pathPts[i][0], pathPts[i + 1][0], f), y = lerp(pathPts[i][1], pathPts[i + 1][1], f);
      const jitter = st.smooth ? 0 : 6;
      x += (Math.random() - 0.5) * jitter; y += (Math.random() - 0.5) * jitter;
      const k = st.smooth ? 0.12 : 1; sm = [lerp(sm[0], x, k), lerp(sm[1], y, k)];
      const pad = +win.dataset.pad, sc = +win.dataset.sc;
      const cx = pad + sm[0] * sc, cy = pad * (H / W) + sm[1] * sc;
      cursor.setAttribute('transform', `translate(${cx},${cy})`);
      const atClick = i === 3;
      ring.setAttribute('cx', cx); ring.setAttribute('cy', cy);
      ring.setAttribute('r', atClick ? 10 + f * 26 : 0); ring.setAttribute('opacity', atClick ? 1 - f : 0);
      btn.setAttribute('fill', atClick ? '#11f590' : '#1537b3');
      const z = st.zoom ? (i === 3 ? 1.9 : i === 2 ? 1 + f * 0.9 : i === 4 ? 1.9 - f * 0.9 : 1) : 1;
      const fx = pad + 530 * sc, fy = pad * (H / W) + 318 * sc;
      cam.setAttribute('transform', `translate(${fx},${fy}) scale(${z}) translate(${-fx},${-fy})`);
      raf = requestAnimationFrame(tick);
    };
    visibleStart(root, () => { if (!raf && !reduced) { last = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = null; });
    if (reduced) tick(performance.now());
  };

  /* ---------- Smart Form Filler: rule match, then local AI fallback ---------- */
  V.matcher = (root, D) => {
    const fields = D.fields || [];
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Press Fill. Known fields match by rules instantly; odd ones go to a small AI model running in the browser. Nothing leaves the machine.'));
    const run = h('button', {}, 'Fill this form ⌘⇧F');
    const reset = h('button', {}, 'Reset');
    root.append(h('div', { class: 'ctl' }, [run, reset]));
    const list = h('div', { class: 'panel', style: 'display:grid;gap:10px' });
    const rows = fields.map((f) => {
      const val = h('div', { style: 'font:500 14px var(--mono);color:#fff;min-height:20px' }, '');
      const badge = h('span', { style: 'font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--night-line);color:var(--moon-2)' }, 'empty');
      const row = h('div', { style: 'display:grid;grid-template-columns:minmax(120px,1fr) 2fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03)' },
        [h('label', {}, f.label), val, badge]);
      list.append(row); return { f, val, badge, row };
    });
    root.append(list);
    const stats = h('div', { class: 'detail muted' }, ''); root.append(stats);
    let timers = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; rows.forEach((r) => { r.val.textContent = ''; r.badge.textContent = 'empty'; r.badge.style.color = ''; r.badge.style.borderColor = ''; r.row.style.boxShadow = ''; }); stats.textContent = ''; };
    reset.onclick = clear;
    run.onclick = () => {
      clear(); let t = 0, rule = 0, ai = 0;
      rows.forEach((r) => {
        const isAI = r.f.via === 'ai';
        timers.push(setTimeout(() => { r.badge.textContent = isAI ? 'thinking…' : 'rule'; r.row.style.boxShadow = '0 0 0 1px ' + (isAI ? '#1395a1' : '#11f590'); if (isAI) r.badge.classList.add('pulse'); }, t));
        t += isAI ? 900 : 180;
        timers.push(setTimeout(() => {
          r.badge.classList.remove('pulse');
          r.val.textContent = r.f.value; r.badge.textContent = isAI ? 'local AI' : 'rule match';
          r.badge.style.color = isAI ? '#7fe3ec' : '#11f590'; r.badge.style.borderColor = isAI ? '#1395a1' : '#11f590';
          isAI ? ai++ : rule++; stats.innerHTML = `<b>${rule}</b> filled by rules · <b>${ai}</b> by the on-device model · <b>0</b> bytes sent to a server`;
        }, t));
        t += 120;
      });
    };
    if (document.documentElement.classList.contains('thumb')) setTimeout(() => run.onclick(), 50);
  };

  /* ---------- Koi: one conversational turn ---------- */
  V.orb = (root, D) => {
    const stages = D.stages || [];
    const turns = D.turns || [];
    let ti = 0;
    const orb = h('div', { style: 'width:120px;height:120px;border-radius:50%;margin:6px auto 14px;background:radial-gradient(circle at 35% 30%,#b9ffe0,#11f590 35%,#1395a1 70%,#1537b3);box-shadow:0 0 60px rgba(17,245,144,.45);transition:transform .3s' });
    const you = h('div', { class: 'panel', style: 'margin-bottom:8px' }, '');
    const koi = h('div', { class: 'panel', style: 'margin-bottom:12px;border-color:rgba(17,245,144,.35)' }, '');
    const bars = h('div', { style: 'display:grid;gap:8px' });
    const items = stages.map((s) => {
      const bar = h('i', { style: 'width:0' });
      const ms = h('span', { style: 'font:500 12px var(--mono);color:var(--moon-2)' }, '');
      bars.append(h('div', { style: 'display:grid;grid-template-columns:140px 1fr 60px;gap:10px;align-items:center' }, [h('span', {}, s.name), h('div', { class: 'bar' }, [bar]), ms]));
      return { s, bar, ms };
    });
    const go = h('button', {}, 'Next turn ▸');
    root.append(h('div', { class: 'ctl' }, [go]), h('div', { class: 'grid2' }, [h('div', {}, [orb]), h('div', {}, [you, koi])]), bars);
    const total = h('div', { class: 'detail muted' }); root.append(total);
    const play = () => {
      const tr = turns[ti % turns.length]; ti++;
      you.innerHTML = `<span class="muted">You said</span><br>“${escapeHTML(tr.you)}”`;
      koi.innerHTML = `<span class="muted">Koi</span><br><span class="pulse">listening…</span>`;
      let t = 0, sum = 0;
      items.forEach((it) => { it.bar.style.width = '0'; it.ms.textContent = ''; });
      items.forEach((it, i) => {
        const ms = it.s.ms + Math.round((Math.random() - 0.5) * it.s.ms * 0.3);
        setTimeout(() => {
          orb.style.transform = `scale(${1 + (i % 2 ? 0.08 : 0.15)})`;
          it.bar.style.width = Math.min(100, ms / 4) + '%'; it.ms.textContent = ms + ' ms'; sum += ms;
          total.innerHTML = `Time to first audio: <b>${sum} ms</b>`;
          if (i === items.length - 1) { koi.innerHTML = `<span class="muted">Koi</span><br>“${escapeHTML(tr.koi)}”`; orb.style.transform = 'scale(1)'; }
        }, t);
        t += 450;
      });
    };
    go.onclick = play; setTimeout(play, 300);
  };

  /* ---------- Signal scanner: scrub days, scores stack ---------- */
  V.signals = (root, D) => {
    const accts = D.accounts, days = D.days, ev = D.events, types = D.types;
    root.append(h('div', { class: 'muted', style: 'margin-bottom:10px' }, 'Drag through 30 days. Each public signal adds to a company\'s score (strongest signal per type). At 15+ Claude writes a "why now" note.'));
    const lab = h('label', {}, 'Day 1'); const rng = h('input', { type: 'range', min: 1, max: days, value: 1, 'aria-label': 'Day' });
    root.append(lab, rng);
    const board = h('div', { class: 'panel', style: 'margin-top:12px;display:grid;gap:10px' });
    const rows = accts.map((a) => {
      const segs = h('div', { style: 'display:flex;height:14px;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.06)' });
      const sc = h('b', { style: 'font:600 14px var(--mono);color:#fff;text-align:right' }, '0');
      const st = h('span', { style: 'font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--night-line);color:var(--moon-2);text-align:center' }, 'noise');
      board.append(h('div', { style: 'display:grid;grid-template-columns:110px 1fr 34px 64px;gap:10px;align-items:center' }, [h('span', {}, a), segs, sc, st]));
      return { segs, sc, st };
    });
    const legend = h('div', { class: 'row', style: 'margin-top:12px;font-size:12px' }, Object.entries(types).map(([k, t]) => h('span', { style: 'display:inline-flex;gap:6px;align-items:center;color:var(--moon-2)' }, [h('i', { style: `width:10px;height:10px;border-radius:3px;background:${t.c}` }), t.l])));
    const feed = h('div', { class: 'detail muted', 'aria-live': 'polite' });
    root.append(board, legend, feed);
    const draw = () => {
      const d = +rng.value; lab.textContent = `Day ${d} of ${days}`;
      let latest = null;
      rows.forEach((r, ai) => {
        const best = {};
        ev.filter((e) => e.a === ai && e.d <= d).forEach((e) => { best[e.t] = Math.max(best[e.t] || 0, e.s); if (!latest || e.d >= latest.d) latest = { ...e, an: accts[ai] }; });
        const total = Object.values(best).reduce((x, y) => x + y, 0);
        r.segs.innerHTML = '';
        Object.entries(best).forEach(([t, s]) => r.segs.append(h('i', { style: `width:${s * 3.4}%;background:${types[t].c};transition:width .4s` })));
        r.sc.textContent = total;
        const hot = total >= 15, watch = total >= 9;
        r.st.textContent = hot ? 'HOT' : watch ? 'watch' : 'noise';
        r.st.style.color = hot ? '#001b0f' : watch ? '#11f590' : '';
        r.st.style.background = hot ? '#11f590' : '';
        r.st.style.borderColor = hot || watch ? '#11f590' : '';
      });
      feed.innerHTML = latest ? `Latest: <b>${escapeHTML(latest.an)}</b> — ${escapeHTML(latest.n)} (strength ${latest.s})` : 'No signals yet.';
    };
    if (document.documentElement.classList.contains('thumb')) rng.value = days - 4;
    rng.oninput = draw; draw();
    let timer; visibleStart(root, () => { if (reduced || timer) return; timer = setInterval(() => { if (+rng.value >= days) { clearInterval(timer); return; } rng.value = +rng.value + 1; draw(); }, 260); }, () => { clearInterval(timer); timer = null; });
    rng.addEventListener('pointerdown', () => { clearInterval(timer); timer = -1; });
  };

  /* ---------- Hidden moats: six invisible layers ---------- */
  V.layers = (root, D) => {
    const ind = D.industries, layers = D.layers;
    const out = h('div', { style: 'display:grid;gap:8px;margin-top:4px' });
    const det = h('div', { class: 'detail panel' });
    root.append(tabs(ind.map((i) => i.name), (k) => {
      out.innerHTML = '';
      layers.forEach((l, j) => {
        const ex = ind[k].ex[j];
        const b = h('button', { class: 'node', style: `margin-left:${j * 3}%;text-align:left;display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center`, onclick: () => {
          out.querySelectorAll('.node').forEach((n) => n.classList.remove('on')); b.classList.add('on');
          det.innerHTML = `<b>${escapeHTML(l.name)} layer.</b> ${escapeHTML(l.why)}<br><span class="muted">In ${escapeHTML(ind[k].name.toLowerCase())}: ${escapeHTML(ex)}</span>`;
        } }, [h('b', {}, l.name), h('span', { class: 'muted' }, ex)]);
        out.append(b);
      });
      out.firstChild.click();
    }));
    root.append(h('div', { class: 'muted', style: 'font-size:12px;margin-bottom:6px' }, 'The end product sits on top. The hidden layers sit below — ordered from most visible to least.'), out, det);
  };

  /* ---------- Data-source scorecard ---------- */
  V.scorecard = (root, D) => {
    const cols = D.cols, rows = D.rows;
    const col = { ok: '#11f590', part: '#f5c542', no: '#ff6b6b' }, lbl = { ok: 'works', part: 'partial', no: 'broken' };
    const tbl = h('div', { style: 'overflow-x:auto' });
    const t = h('table', { style: 'width:100%;border-collapse:collapse;font-size:13px;min-width:560px' });
    t.innerHTML = '<thead><tr><th style="text-align:left;padding:8px;color:var(--moon-2);font-weight:500">Source</th>' + cols.map((c) => `<th style="padding:8px;color:var(--moon-2);font-weight:500">${escapeHTML(c)}</th>`).join('') + '</tr></thead>';
    const tb = h('tbody'); t.append(tb); tbl.append(t);
    const det = h('div', { class: 'detail panel' }, 'Click a row to see why.');
    rows.forEach((r) => {
      const tr = h('tr', { style: 'cursor:pointer;border-top:1px solid var(--night-line)', onclick: () => { det.innerHTML = `<b>${escapeHTML(r.n)}:</b> ${escapeHTML(r.note)}`; } });
      tr.innerHTML = `<td style="padding:9px 8px;color:#fff;font-weight:600">${escapeHTML(r.n)}</td>` + r.v.map((v) => `<td style="text-align:center;padding:9px 8px"><span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;color:${col[v]};border:1px solid ${col[v]}">${lbl[v]}</span></td>`).join('');
      tb.append(tr);
    });
    root.append(h('div', { class: 'panel' }, [tbl]), det);
  };

  /* ---------- Radar self-assessment ---------- */
  V.radar = (root, D) => {
    const ax = D.axes, N = ax.length, R = 120, C = 160;
    const vals = ax.map(() => 2);
    const svg = S('svg', { viewBox: '0 0 320 320', role: 'img', 'aria-label': 'Radar chart of AI skills' });
    for (let l = 1; l <= 4; l++) { const pts = ax.map((_, i) => pt(i, l / 4 * R)); svg.append(S('polygon', { points: pts.join(' '), fill: 'none', stroke: 'rgba(255,255,255,.12)' })); }
    ax.forEach((a, i) => { const [x, y] = pt(i, R); svg.append(S('line', { x1: C, y1: C, x2: x, y2: y, stroke: 'rgba(255,255,255,.12)' })); const [tx, ty] = pt(i, R + 22); const tt = S('text', { x: tx, y: ty, 'text-anchor': 'middle', 'font-size': 10 }); tt.textContent = a.short; svg.append(tt); });
    const poly = S('polygon', { fill: 'rgba(17,245,144,.22)', stroke: '#11f590', 'stroke-width': 2 }); svg.append(poly);
    function pt(i, r) { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
    const lvl = D.levels || ['Unaware', 'Tries it', 'Uses it daily', 'Builds with it', 'Teaches it'];
    const sliders = h('div', { style: 'display:grid;gap:8px' });
    const score = h('div', { class: 'big' }); const band = h('div', { class: 'muted' });
    const draw = () => {
      poly.setAttribute('points', vals.map((v, i) => pt(i, v / 4 * R).join(',')).join(' '));
      const avg = vals.reduce((a, b) => a + b, 0) / N; score.textContent = Math.round(avg / 4 * 120);
      band.textContent = `of 120 · overall level: ${lvl[Math.round(avg)]}. Weakest: ${ax[vals.indexOf(Math.min(...vals))].name}.`;
    };
    ax.forEach((a, i) => {
      const out = h('span', { class: 'muted', style: 'font-size:12px' }, lvl[2]);
      const r = h('input', { type: 'range', min: 0, max: 4, value: 2, 'aria-label': a.name, oninput: (e) => { vals[i] = +e.target.value; out.textContent = lvl[vals[i]]; draw(); } });
      sliders.append(h('div', {}, [h('label', { style: 'display:flex;justify-content:space-between' }, [h('span', {}, a.name), out]), r]));
    });
    root.append(h('div', { class: 'muted', style: 'margin-bottom:10px' }, 'Rate yourself on the eight sub-skills. This is the shape a standard AI-proficiency score would report.'),
      h('div', { class: 'grid2' }, [h('div', { class: 'panel' }, [svg, score, band]), h('div', { class: 'panel' }, [sliders])]));
    draw();
  };

  /* ---------- OpenStage: review rollup ---------- */
  V.review = (root, D) => {
    const steps = D.steps; // [{name, reviewers:[...]}]
    const state = steps.map((s) => s.reviewers.map(() => 'pending'));
    const col = { pending: 'var(--moon-2)', approved: '#11f590', changes: '#ff8a5c' };
    const canvas = h('div', { class: 'panel', style: 'position:relative;height:220px;background:linear-gradient(135deg,#1d2b3a,#2b1d3a);overflow:hidden;cursor:crosshair' }, [
      h('div', { style: 'position:absolute;left:8%;top:14%;width:52%;height:60%;border-radius:10px;background:linear-gradient(135deg,#ffcf6b,#ff7a59)' }),
      h('div', { style: 'position:absolute;left:66%;top:20%;width:26%;height:12px;border-radius:6px;background:rgba(255,255,255,.6)' }),
      h('div', { style: 'position:absolute;left:66%;top:34%;width:20%;height:10px;border-radius:5px;background:rgba(255,255,255,.35)' }),
      h('div', { style: 'position:absolute;left:8%;bottom:10%;font:700 22px var(--display);color:#fff' }, 'Spring campaign v3')]);
    let pins = 0;
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect(); pins++;
      canvas.append(h('span', { style: `position:absolute;left:${e.clientX - r.left - 12}px;top:${e.clientY - r.top - 12}px;width:24px;height:24px;border-radius:50% 50% 50% 0;background:#11f590;color:#001b0f;display:grid;place-items:center;font:700 12px var(--mono);box-shadow:0 4px 10px rgba(0,0,0,.4)` }, String(pins)));
    });
    const board = h('div', { style: 'display:grid;gap:10px;margin-top:12px' });
    const fileStatus = h('div', { class: 'big', style: 'font-size:24px' });
    const draw = () => {
      board.innerHTML = '';
      let fileS = 'approved';
      steps.forEach((s, i) => {
        const st = state[i].includes('changes') ? 'changes' : state[i].every((x) => x === 'approved') ? 'approved' : 'pending';
        if (st === 'changes') fileS = 'changes'; else if (st === 'pending' && fileS !== 'changes') fileS = 'pending';
        const locked = i > 0 && steps.slice(0, i).some((_, j) => !state[j].every((x) => x === 'approved'));
        const rev = s.reviewers.map((r, k) => {
          const b = h('button', { disabled: locked ? '' : null, style: `padding:6px 10px;border-radius:999px;border:1px solid ${col[state[i][k]]};color:${col[state[i][k]]};font-size:12px;opacity:${locked ? .4 : 1}`, onclick: () => { if (locked) return; const o = ['pending', 'approved', 'changes']; state[i][k] = o[(o.indexOf(state[i][k]) + 1) % 3]; draw(); } }, `${r} · ${state[i][k]}`);
          if (locked) b.removeAttribute('onclick'); return b;
        });
        board.append(h('div', { class: 'panel', style: `display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-color:${col[st]}` }, [h('b', { style: 'min-width:110px;color:#fff' }, `Step ${i + 1}: ${s.name}`), ...rev, h('span', { class: 'muted', style: 'margin-left:auto;font-size:12px' }, locked ? 'waiting on earlier step' : st)]));
      });
      fileStatus.innerHTML = `File: <span style="color:${col[fileS]}">${fileS === 'changes' ? 'changes requested' : fileS}</span>`;
    };
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Click the artwork to drop comment pins. Click a reviewer to cycle pending → approved → changes. Status rolls up from reviewer to step to file.'), canvas, board, h('div', { class: 'detail' }, [fileStatus]));
    draw();
  };

  /* ---------- Transfer ladder (neutral) ---------- */
  V.ladder = (root, D) => {
    const rungs = D.rungs, srcs = D.sources;
    const on = new Set(document.documentElement.classList.contains('thumb') ? [0, 2, 3] : [0]);
    const lad = h('div', { style: 'display:grid;gap:6px' });
    const rungEls = rungs.slice().reverse().map((r, idx) => { const el = h('div', { class: 'panel', style: 'display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:center;padding:10px 12px;transition:all .3s' }, [h('b', { style: 'font:700 18px var(--display);color:#fff' }, 'L' + (rungs.length - idx)), h('span', {}, r)]); lad.append(el); return el; }).reverse();
    const btns = h('div', { class: 'ctl' });
    const why = h('div', { class: 'detail muted' });
    srcs.forEach((s, i) => { const b = h('button', { 'aria-pressed': String(on.has(i)), onclick: () => { on.has(i) ? on.delete(i) : on.add(i); b.classList.toggle('on', on.has(i)); b.setAttribute('aria-pressed', on.has(i)); draw(); } }, s.name); if (on.has(i)) b.classList.add('on'); btns.append(b); });
    const draw = () => {
      const capSrc = [...on].map((i) => srcs[i]).sort((a, b) => b.cap - a.cap)[0];
      const lvl = capSrc ? capSrc.cap : 0;
      rungEls.forEach((el, i) => { const lit = i < lvl; el.style.borderColor = lit ? '#11f590' : ''; el.style.background = lit ? 'rgba(17,245,144,.08)' : ''; el.style.opacity = lit ? 1 : .45; });
      why.innerHTML = capSrc ? `Highest proof available: <b>L${lvl}</b>, from <b>${escapeHTML(capSrc.name.toLowerCase())}</b>. ${escapeHTML(capSrc.why)}` : 'Pick at least one kind of evidence.';
    };
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Pick the evidence you have about one seller\'s skill. Each kind of evidence can only prove so much — the ladder shows how high it gets you.'), btns, h('div', { class: 'grid2' }, [lad, why]));
    draw();
  };

  /* ---------- Context graphs: two clocks ---------- */
  V.clocks = (root, D) => {
    const evs = D.events;
    const lab = h('label', {}, ''); const rng = h('input', { type: 'range', min: 0, max: evs.length - 1, value: evs.length - 1, 'aria-label': 'Point in time' });
    const state = h('div', { class: 'panel' }); const trace = h('div', { class: 'panel', style: 'display:grid;gap:6px' });
    const draw = () => {
      const k = +rng.value; lab.textContent = `As of ${evs[k].when}`;
      const s = {}; evs.slice(0, k + 1).forEach((e) => Object.assign(s, e.set));
      state.innerHTML = '<div class="muted" style="margin-bottom:8px">State clock — what the CRM stores</div>' + Object.entries(s).map(([a, b]) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-top:1px solid var(--night-line)"><span class="muted">${escapeHTML(a)}</span><b style="color:#fff">${escapeHTML(b)}</b></div>`).join('');
      trace.innerHTML = '<div class="muted">Event clock — why it became true</div>';
      evs.slice(0, k + 1).forEach((e, i) => trace.append(h('div', { style: `display:grid;grid-template-columns:70px 1fr;gap:8px;padding:6px 8px;border-radius:8px;background:${i === k ? 'rgba(17,245,144,.1)' : 'rgba(255,255,255,.03)'}` }, [h('span', { style: 'font:500 11px var(--mono);color:var(--moon-2)' }, e.when), h('span', {}, [h('b', { style: 'color:#fff' }, e.who + ' '), e.what])])));
    };
    rng.oninput = draw;
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Slide through one deal. The left side is all a system of record keeps. The right side is the decision trace an AI agent needs to learn from precedent.'), lab, rng, h('div', { class: 'grid2', style: 'margin-top:12px' }, [state, trace]));
    draw();
  };

  /* ---------- Softbox: colour temperature ---------- */
  V.softbox = (root) => {
    const k2rgb = (k) => { k /= 100; let r, g, b; r = k <= 66 ? 255 : 329.7 * Math.pow(k - 60, -0.1332); g = k <= 66 ? 99.47 * Math.log(k) - 161.12 : 288.12 * Math.pow(k - 60, -0.0755); b = k >= 66 ? 255 : k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04; const c = (x) => Math.max(0, Math.min(255, Math.round(x))); return [c(r), c(g), c(b)]; };
    const screen = h('div', { style: 'height:220px;border-radius:14px;display:grid;place-items:end center;transition:background .2s;box-shadow:0 0 80px rgba(255,255,255,.15) inset' });
    const face = h('div', { style: 'width:120px;height:150px;border-radius:60px 60px 40px 40px;margin-bottom:-1px;transition:box-shadow .2s;background:#2a2a2a' });
    screen.append(face);
    const kl = h('label', {}); const k = h('input', { type: 'range', min: 3200, max: 7500, step: 50, value: 5200, 'aria-label': 'Colour temperature' });
    const bl = h('label', {}); const br = h('input', { type: 'range', min: 20, max: 100, value: 85, 'aria-label': 'Brightness' });
    const draw = () => {
      const [r, g, b] = k2rgb(+k.value), a = +br.value / 100;
      screen.style.background = `rgba(${r},${g},${b},${a})`;
      face.style.boxShadow = `inset 0 30px 50px rgba(${r},${g},${b},${a * .55}), 0 0 60px rgba(${r},${g},${b},${a * .3})`;
      kl.textContent = `Colour temperature: ${k.value} K ${+k.value < 4200 ? '(warm)' : +k.value > 6200 ? '(cool daylight)' : '(neutral)'}`; bl.textContent = `Brightness: ${br.value}%`;
    };
    k.oninput = br.oninput = draw;
    const presets = tabs(['Warm 3200K', 'Daylight 5600K', 'Cool 7000K'], (i) => { k.value = [3200, 5600, 7000][i]; draw(); }, 1);
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Your monitor, used as a key light for video calls. Drag the sliders.'), presets, screen, h('div', { class: 'grid2', style: 'margin-top:12px' }, [h('div', {}, [kl, k]), h('div', {}, [bl, br])]));
    draw();
  };

  /* ---------- Coverage map (grounding doc) ---------- */
  V.coverage = (root, D) => {
    const pillars = D.pillars; const files = D.files;
    const st = pillars.map(() => 0);
    const col = ['#ff6b6b', '#f5c542', '#11f590'], lbl = ['Missing', 'Partial', 'Complete'];
    const fileRow = h('div', { class: 'ctl' });
    const grid = h('div', { class: 'grid2' });
    const cells = pillars.map((p) => { const s = h('span', { style: 'font-size:11px;padding:2px 9px;border-radius:999px;border:1px solid' }); const c = h('div', { style: 'font-size:12px;color:var(--moon-2);margin-top:6px;min-height:18px' }); const el = h('div', { class: 'panel' }, [h('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, [h('b', { style: 'color:#fff' }, p), s]), c]); grid.append(el); return { s, c }; });
    const draw = () => cells.forEach((c, i) => { c.s.textContent = lbl[st[i]]; c.s.style.color = col[st[i]]; c.s.style.borderColor = col[st[i]]; c.c.textContent = st[i] < 2 ? 'Word comment: “' + D.asks[i] + '”' : 'Ready for review'; });
    const isThumb = document.documentElement.classList.contains('thumb');
    files.forEach((f, fi) => { if (isThumb && fi < files.length - 1) f.fills.forEach(([i, v]) => { st[i] = Math.max(st[i], v); }); const b = h('button', { onclick: () => { if (b.classList.contains('on')) return; b.classList.add('on'); f.fills.forEach(([i, v]) => { st[i] = Math.max(st[i], v); }); draw(); } }, '+ ' + f.name); fileRow.append(b); });
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Add a customer\'s files. Each one fills part of the four pillars; whatever stays thin becomes a margin comment in the Word draft.'), fileRow, grid);
    draw();
  };

  /* ---------- Launch loop (content controller, neutral) ---------- */
  V.loop = (root, D) => {
    const modes = D.modes;
    const flow = h('div', { class: 'flow' }); const det = h('div', { class: 'detail panel' });
    let cur = 0, mode = 0, timer;
    const render = () => {
      flow.innerHTML = '';
      const S2 = modes[mode].steps;
      S2.forEach((s, i) => { if (i) flow.append(h('span', { class: 'arrow' }, '→')); flow.append(h('button', { class: 'node' + (i === cur ? ' on' : ''), onclick: () => { clearInterval(timer); cur = i; render(); } }, [h('small', {}, s.where), h('b', {}, s.t)])); });
      det.innerHTML = `<b>${escapeHTML(modes[mode].name)} · ${escapeHTML(S2[cur].t)}.</b> ${escapeHTML(S2[cur].d)}`;
    };
    root.append(tabs(modes.map((m) => m.name), (i) => { mode = i; cur = 0; render(); }), flow, det);
    visibleStart(root, () => { if (reduced || timer) return; timer = setInterval(() => { cur = (cur + 1) % modes[mode].steps.length; render(); }, 2400); }, () => { clearInterval(timer); timer = null; });
  };

  /* ---------- Before / after (navigation morph) ---------- */
  V.beforeafter = (root, D) => {
    const a = D.before, b = D.after;
    const col = (title, items, accent) => h('div', { class: 'panel', style: accent ? 'border-color:rgba(17,245,144,.4)' : '' }, [h('div', { class: 'muted', style: 'margin-bottom:8px' }, title), ...items.map((x) => h('div', { style: `padding:7px 10px;border-radius:8px;margin-bottom:5px;background:${accent ? 'rgba(17,245,144,.07)' : 'rgba(255,255,255,.04)'}` }, [h('b', { style: 'color:#fff;font-size:13px' }, x.t), x.d ? h('div', { class: 'muted', style: 'font-size:12px' }, x.d) : null]))]);
    const wrap = h('div', {});
    root.append(tabs(['Before: organised by settings', 'After: organised by outcomes', 'Side by side'], (i) => { wrap.innerHTML = ''; wrap.append(i === 2 ? h('div', { class: 'grid2' }, [col(D.beforeTitle, a), col(D.afterTitle, b, true)]) : i === 0 ? col(D.beforeTitle, a) : col(D.afterTitle, b, true)); }, 2), wrap);
  };

  /* ---------- Funnel walkthrough (onboarding teardown) ---------- */
  V.funnel = (root, D) => {
    const st = D.steps; let i = 0;
    const phone = h('div', { style: 'width:190px;height:360px;border-radius:30px;border:6px solid #2a2a2a;background:#111;margin:0 auto;padding:22px 14px;display:flex;flex-direction:column;gap:10px;transition:all .3s' });
    const note = h('div', { class: 'panel' }); const prog = h('div', { class: 'bar' }, [h('i', { style: 'width:0' })]);
    const prev = h('button', { onclick: () => { i = Math.max(0, i - 1); draw(); } }, '◂ Back'); const next = h('button', { onclick: () => { i = Math.min(st.length - 1, i + 1); draw(); } }, 'Next ▸');
    const draw = () => {
      const s = st[i];
      phone.innerHTML = `<div style="font:500 10px var(--mono);color:var(--moon-2)">${i + 1}/${st.length}</div><div style="font:700 17px/1.15 var(--display);color:#fff">${escapeHTML(s.screen)}</div>` + (s.ui || []).map((u) => `<div style="padding:9px;border-radius:10px;background:${u.p ? '#11f590' : 'rgba(255,255,255,.07)'};color:${u.p ? '#001b0f' : '#ddd'};font-size:12px;text-align:center;font-weight:600">${escapeHTML(u.t)}</div>`).join('');
      note.innerHTML = `<div class="muted" style="font-size:12px">Conversion device</div><b style="color:#fff;font-size:16px">${escapeHTML(s.device)}</b><p class="muted" style="margin-top:6px">${escapeHTML(s.why)}</p>`;
      prog.firstChild.style.width = ((i + 1) / st.length * 100) + '%';
    };
    root.append(h('div', { class: 'ctl' }, [prev, next]), h('div', { class: 'grid2' }, [phone, h('div', { style: 'display:grid;gap:12px;align-content:start' }, [note, prog])]));
    draw();
  };

  /* ---------- Constellation (skill library) ---------- */
  V.constellation = (root, D) => {
    const groups = D.groups; const W = 640, H = 340;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Map of skills grouped by stage' });
    const det = h('div', { class: 'detail panel' }, 'Hover or tap a star.');
    const cols = ['#11f590', '#1395a1', '#7aa2ff', '#f5c542', '#ff8a5c'];
    groups.forEach((g, gi) => {
      const cx = 80 + gi * ((W - 160) / (groups.length - 1)), cy = H / 2 + (gi % 2 ? 40 : -40);
      const lt = S('text', { x: cx, y: cy + (gi % 2 ? 110 : -100), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600 }); lt.textContent = g.name; lt.style.fill = '#fff'; svg.append(lt);
      g.skills.forEach((s, si) => {
        const a = si / g.skills.length * Math.PI * 2, r = 30 + (si % 2) * 26;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        svg.append(S('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: 'rgba(255,255,255,.12)' }));
        const c = S('circle', { cx: x, cy: y, r: 6, fill: cols[gi % 5], tabindex: 0, style: 'cursor:pointer' });
        const show = () => { det.innerHTML = `<b>${escapeHTML(s[0])}</b> <span class="muted">· ${escapeHTML(g.name)}</span><br>${escapeHTML(s[1])}`; };
        c.addEventListener('mouseenter', show); c.addEventListener('click', show); c.addEventListener('focus', show);
        svg.append(c);
      });
      svg.append(S('circle', { cx, cy, r: 10, fill: 'none', stroke: cols[gi % 5], 'stroke-width': 2 }));
    });
    root.append(h('div', { class: 'panel' }, [svg]), det);
  };

  /* ---------- Quiz (sample questions) ---------- */
  V.quiz = (root, D) => {
    const qs = D.questions; let i = 0, score = 0;
    const box = h('div', { class: 'panel' });
    const draw = () => {
      const q = qs[i]; box.innerHTML = '';
      box.append(h('div', { class: 'muted', style: 'font-size:12px' }, `Question ${i + 1} of ${qs.length} · ${q.topic}`), h('div', { style: 'color:#fff;font-weight:600;margin:6px 0 12px' }, q.q));
      const fb = h('div', { class: 'detail' });
      q.opts.forEach((o, k) => box.append(h('button', { class: 'node', style: 'display:block;width:100%;margin-bottom:6px;min-width:0', onclick: (e) => {
        if (fb.textContent) return;
        const right = k === q.a; if (right) score++;
        e.currentTarget.style.borderColor = right ? '#11f590' : '#ff6b6b';
        box.querySelectorAll('.node')[q.a].style.borderColor = '#11f590';
        fb.innerHTML = `${right ? '✓ Right.' : '✗ Not quite.'} ${escapeHTML(q.why)}`;
        box.append(h('button', { style: 'margin-top:8px;padding:7px 13px;border-radius:999px;border:1px solid var(--accent);color:var(--accent)', onclick: () => { i = (i + 1) % qs.length; if (!i) score = 0; draw(); } }, i === qs.length - 1 ? `Score ${score}/${qs.length} · restart` : 'Next question'));
      } }, o)));
      box.append(fb);
    };
    root.append(box); draw();
  };
})();

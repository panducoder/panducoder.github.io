/* More bespoke visualizations. */
(() => {
  const { V, h, escapeHTML, visibleStart, reduced } = window.VZ;
  const NS = 'http://www.w3.org/2000/svg';
  const S = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };

  /* ---------- IRT: which items you pass matters, not just how many ---------- */
  V.irt = (root, D) => {
    const items = D.items; // [{name, b}]
    const pass = items.map((_, i) => i < 3);
    const W = 600, H = 170, x = (t) => 40 + (t + 3) / 6 * (W - 80);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Estimated skill on a scale' });
    svg.append(S('line', { x1: 40, y1: 110, x2: W - 40, y2: 110, stroke: 'rgba(255,255,255,.25)' }));
    ['Opportunity area', 'Developing', 'Proficient', 'Standout'].forEach((l, i) => { const t = S('text', { x: 40 + (i + 0.5) * (W - 80) / 4, y: 140, 'text-anchor': 'middle', 'font-size': 11 }); t.textContent = l; svg.append(t); });
    items.forEach((it) => { svg.append(S('line', { x1: x(it.b), y1: 104, x2: x(it.b), y2: 116, stroke: 'rgba(255,255,255,.4)' })); });
    const band = S('rect', { y: 92, height: 36, rx: 8, fill: 'rgba(17,245,144,.15)' }); svg.append(band);
    const dot = S('circle', { cy: 110, r: 9, fill: '#11f590' }); svg.append(dot);
    const lab = S('text', { y: 80, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600 }); lab.style.fill = '#fff'; svg.append(lab);
    const row = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px' });
    const btns = items.map((it, i) => { const b = h('button', { class: 'node', style: 'min-width:0', onclick: () => { pass[i] = !pass[i]; draw(); } }); row.append(b); return b; });
    const note = h('div', { class: 'detail panel' });
    const est = () => { // 1PL maximum a posteriori with a N(0,1) prior, grid search
      let best = 0, bl = -1e9, info = 0;
      for (let t = -3; t <= 3.001; t += 0.01) {
        let ll = -t * t / 2;
        items.forEach((it, i) => { const p = 1 / (1 + Math.exp(-(t - it.b))); ll += pass[i] ? Math.log(p) : Math.log(1 - p); });
        if (ll > bl) { bl = ll; best = t; }
      }
      items.forEach((it) => { const p = 1 / (1 + Math.exp(-(best - it.b))); info += p * (1 - p); });
      return { t: best, se: 1 / Math.sqrt(info + 1) };
    };
    const draw = () => {
      btns.forEach((b, i) => { b.classList.toggle('on', pass[i]); b.innerHTML = `<small>${items[i].level}</small><b>${escapeHTML(items[i].name)}</b><span style="font-size:12px;color:${pass[i] ? '#11f590' : 'var(--moon-2)'}">${pass[i] ? '✓ passed' : '✗ not passed'}</span>`; });
      const { t, se } = est(); const n = pass.filter(Boolean).length;
      dot.setAttribute('cx', x(t)); lab.setAttribute('x', x(t)); lab.textContent = `${n}/${items.length} passed → skill ${(((t + 3) / 6)).toFixed(2)}`;
      band.setAttribute('x', x(Math.max(-3, t - se))); band.setAttribute('width', x(Math.min(3, t + se)) - x(Math.max(-3, t - se)));
      note.innerHTML = `Same number of passes can land in different places. Passing the hard items moves the estimate more than passing easy ones, and the shaded band shows how sure the model is. <span class="muted">Try passing only the two hardest items, then only the two easiest.</span>`;
    };
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Five role-play moments, easiest to hardest. An AI grader marks each one pass or not. Click to change the result.'), row, h('div', { class: 'panel' }, [svg]), note);
    draw();
  };

  /* ---------- 13-week sprint ---------- */
  V.sprint = (root, D) => {
    const stages = D.stages, focus = D.focus; let f = 0, wk = 1, timer;
    const W = 600, H = 190, x = (w) => 30 + (w - 1) / 12 * (W - 60);
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Thirteen-week sprint timeline' });
    const g = S('g'); svg.append(g);
    const lab = h('label', {}); const rng = h('input', { type: 'range', min: 1, max: 13, value: 1, 'aria-label': 'Week' });
    const det = h('div', { class: 'detail panel' });
    const ctl = h('div', { class: 'ctl' }, focus.map((fo, i) => h('button', { onclick: (e) => { f = i; ctl.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); draw(); } }, fo.name)));
    ctl.firstChild.classList.add('on');
    const draw = () => {
      wk = +rng.value; lab.textContent = `Week ${wk} of 13`;
      g.innerHTML = '';
      stages.forEach((s) => {
        const on = wk >= s.from;
        g.append(S('rect', { x: x(s.from), y: 18, width: Math.max(8, x(s.to) - x(s.from) + 8), height: 24, rx: 6, fill: on ? 'rgba(17,245,144,.25)' : 'rgba(255,255,255,.06)', stroke: on ? '#11f590' : 'none' }));
        const t = S('text', { x: x(s.from) + 6, y: 34, 'font-size': 11 }); t.textContent = s.name; t.style.fill = on ? '#fff' : ''; g.append(t);
      });
      const base = focus[f].base, gain = focus[f].gain;
      const val = (w) => base + gain * (1 - Math.exp(-(Math.max(0, w - 2)) / 3.2)) - (w > 10 ? 0 : 0);
      let d = '', fade = '';
      for (let w = 1; w <= 13; w += 0.25) { const y = 170 - val(w) * 1.1; d += (w === 1 ? 'M' : 'L') + x(w) + ' ' + y; const y2 = 170 - (base + gain * 0.6 * Math.exp(-(Math.max(0, w - 3)) / 2.5) * (w > 2 ? 1 : (w - 1))) * 1.1; fade += (w === 1 ? 'M' : 'L') + x(w) + ' ' + y2; }
      g.append(S('path', { d: fade, fill: 'none', stroke: 'rgba(255,255,255,.3)', 'stroke-dasharray': '4 4', 'stroke-width': 2 }));
      g.append(S('path', { d, fill: 'none', stroke: '#11f590', 'stroke-width': 3 }));
      g.append(S('line', { x1: x(wk), y1: 50, x2: x(wk), y2: 172, stroke: 'rgba(255,255,255,.5)' }));
      g.append(S('circle', { cx: x(wk), cy: 170 - val(wk) * 1.1, r: 6, fill: '#11f590' }));
      const l1 = S('text', { x: W - 34, y: 170 - val(13) * 1.1 - 8, 'text-anchor': 'end', 'font-size': 11 }); l1.textContent = 'sprint, reinforced weekly'; g.append(l1);
      const l2 = S('text', { x: W - 34, y: 166, 'text-anchor': 'end', 'font-size': 11 }); l2.textContent = 'one-off workshop (fades)'; g.append(l2);
      const cur = stages.filter((s) => wk >= s.from && wk <= s.to).map((s) => `<b>${escapeHTML(s.name)}:</b> ${escapeHTML(s.d)}`).join('<br>') || 'Between stages: reps practise in their own deals.';
      det.innerHTML = `<span class="muted">Focus: ${escapeHTML(focus[f].name)} · illustrative curve, not real data</span><br>${cur}`;
    };
    rng.oninput = draw;
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Pick a focus skill, then drag through the 13 weeks. The green line is the skill signal measured from real calls.'), ctl, lab, rng, h('div', { class: 'panel', style: 'margin-top:10px' }, [svg]), det);
    draw();
    visibleStart(root, () => { if (reduced || timer) return; timer = setInterval(() => { if (+rng.value >= 13) return clearInterval(timer); rng.value = +rng.value + 1; draw(); }, 700); }, () => { clearInterval(timer); timer = null; });
    rng.addEventListener('pointerdown', () => { clearInterval(timer); timer = -1; });
  };

  /* ---------- Entitlement checker: deny by default ---------- */
  V.entitle = (root, D) => {
    const users = D.users, folders = D.folders;
    let u = 0, fo = 0;
    const out = h('div', { class: 'panel', style: 'margin-top:12px' });
    const sel = (opts, on) => { const s = h('select', { style: 'width:100%;padding:9px;border-radius:10px;background:#111;color:#fff;border:1px solid var(--night-line)', onchange: (e) => on(+e.target.value) }); opts.forEach((o, i) => s.append(h('option', { value: i }, o))); return s; };
    const draw = () => {
      const us = users[u], f = folders[fo];
      const checks = [
        ['Signed in', !!us.active, us.active ? 'Active account' : 'Account disabled'],
        ['Has a contract', !!us.contract, us.contract ? `Contract: ${us.contract}` : 'No contract on record'],
        ['Contract in date', !!us.inDate, us.inDate ? 'Within term' : 'Contract expired'],
        ['Product is licensed', us.products.includes(f.product), us.products.includes(f.product) ? `${f.product} is on the contract` : `${f.product} is not on the contract`],
        ['Folder granted to this company', !f.company || f.company === us.company, f.company ? (f.company === us.company ? 'Customer-specific folder: theirs' : 'Customer-specific folder: belongs to another company') : 'Shared folder'],
      ];
      let allowed = true; out.innerHTML = '';
      checks.forEach(([n, ok, why]) => {
        const reached = allowed; if (reached && !ok) allowed = false;
        out.append(h('div', { style: `display:grid;grid-template-columns:24px 1fr;gap:8px;padding:6px 0;opacity:${reached ? 1 : .35}` }, [h('span', { style: `color:${!reached ? 'var(--moon-2)' : ok ? '#11f590' : '#ff6b6b'}` }, !reached ? '·' : ok ? '✓' : '✗'), h('span', {}, [h('b', { style: 'color:#fff' }, n + ' '), h('span', { class: 'muted' }, '— ' + why)])]));
      });
      out.append(h('div', { class: 'big', style: `margin-top:8px;font-size:26px;color:${allowed ? '#11f590' : '#ff6b6b'}` }, allowed ? 'Allowed' : 'Denied'));
      out.append(h('div', { class: 'muted', style: 'font-size:12px' }, 'Every request goes through this one function. Anything it cannot prove is a no.'));
    };
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Pick a person and a folder. The portal asks one question — is this allowed? — and answers no unless every check passes.'),
      h('div', { class: 'grid2' }, [h('div', {}, [h('label', {}, 'Person'), sel(users.map((x) => x.name), (i) => { u = i; draw(); })]), h('div', {}, [h('label', {}, 'Folder'), sel(folders.map((x) => x.name), (i) => { fo = i; draw(); })])]), out);
    draw();
  };

  /* ---------- Ripple: change one fact, find the contradictions ---------- */
  V.ripple = (root, D) => {
    const doc = D.sentences; let changed = document.documentElement.classList.contains('thumb');
    const box = h('div', { class: 'panel', style: 'display:grid;gap:6px;line-height:1.5' });
    const btn = h('button', {}, D.change.label);
    const reset = h('button', {}, 'Reset');
    const sum = h('div', { class: 'detail muted' });
    const draw = () => {
      box.innerHTML = '';
      doc.forEach((s, i) => {
        const text = changed && s.edit ? s.after : s.text;
        const flag = changed && !s.edit ? s.flag : null;
        const col = { conflict: '#ff6b6b', review: '#f5c542' }[flag && flag.label];
        const el = h('div', { style: `padding:8px 10px;border-radius:8px;border-left:3px solid ${s.edit && changed ? '#11f590' : col || 'transparent'};background:${col ? 'rgba(255,255,255,.04)' : 'transparent'}` });
        el.innerHTML = escapeHTML(text);
        if (flag) {
          const tag = h('div', { style: `font:500 11px var(--mono);color:${col};margin-top:4px` }, `${flag.label === 'conflict' ? 'likely conflict' : 'worth reviewing'} · p=${flag.p.toFixed(2)}`);
          const fix = h('div', { style: 'font-size:13px;margin-top:4px;color:#cfd' }, [h('span', { class: 'muted' }, 'Suggested: '), flag.fix]);
          const ok = h('button', { style: 'margin-top:6px;padding:4px 10px;border-radius:999px;border:1px solid #11f590;color:#11f590;font-size:12px', onclick: () => { s.text = flag.fixText || s.text; s.flag = null; draw(); } }, 'Apply');
          const keep = h('button', { style: 'margin:6px 0 0 6px;padding:4px 10px;border-radius:999px;border:1px solid var(--night-line);color:var(--moon-2);font-size:12px', onclick: () => { s.flag = null; draw(); } }, 'Keep');
          el.append(tag, fix, ok, keep);
        }
        box.append(el);
      });
      const n = doc.filter((s) => changed && !s.edit && s.flag).length;
      sum.innerHTML = changed ? (n ? `<b>${n}</b> sentences no longer agree. Nothing changes until a person clicks Apply.` : 'All clear — the document agrees with itself again.') : 'Click the button to change one fact in this brochure.';
    };
    const orig = JSON.parse(JSON.stringify(doc));
    btn.onclick = () => { changed = true; draw(); };
    reset.onclick = () => { changed = false; orig.forEach((o, i) => Object.assign(doc[i], JSON.parse(JSON.stringify(o)))); draw(); };
    root.append(h('div', { class: 'ctl' }, [btn, reset]), box, sum); draw();
  };

  /* ---------- Recommendation waterfall ---------- */
  V.waterfall = (root, D) => {
    const reps = D.reps, rules = D.rules; let r = 0;
    const flow = h('div', { style: 'display:grid;gap:8px' }); const pick = h('div', { class: 'panel', style: 'border-color:rgba(17,245,144,.4)' });
    const sig = h('div', { class: 'panel' });
    const draw = () => {
      const rep = reps[r]; flow.innerHTML = '';
      sig.innerHTML = '<div class="muted" style="margin-bottom:6px">Signals this week</div>' + rep.signals.map((s) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0"><span>${escapeHTML(s[0])}</span><b style="color:${s[2] || '#fff'}">${escapeHTML(s[1])}</b></div>`).join('');
      let hit = -1;
      rules.forEach((ru, i) => {
        const fires = hit < 0 && rep.fires === i; if (fires) hit = i;
        flow.append(h('div', { class: 'node' + (fires ? ' on' : ''), style: `cursor:default;min-width:0;opacity:${hit >= 0 && !fires ? .35 : 1}` }, [h('small', {}, `Rule ${i + 1}`), h('b', {}, ru.name), h('div', { class: 'muted', style: 'font-size:12px' }, fires ? rep.why : ru.test)]));
      });
      pick.innerHTML = `<div class="muted">Next best action</div><b style="color:#fff;font-size:17px">${escapeHTML(rep.pick)}</b><div class="muted" style="font-size:13px;margin-top:4px">${escapeHTML(rep.detail)}</div>`;
    };
    const ctl = h('div', { class: 'ctl' }, reps.map((rp, i) => h('button', { onclick: () => { r = i; ctl.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); draw(); } }, rp.name)));
    ctl.firstChild.classList.add('on');
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Pick a seller. Their signals fall through the rules in order; the first rule that fires picks the practice.'), ctl, h('div', { class: 'grid2' }, [sig, flow]), h('div', { style: 'margin-top:12px' }, [pick]));
    draw();
  };

  /* ---------- Cue: voice-following teleprompter ---------- */
  V.prompter = (root, D) => {
    const words = D.script.split(' '); let i = 0, state = 'reading', timer;
    const panel = h('div', { style: 'background:#050505;border-radius:14px;border:1px solid var(--night-line);padding:16px 18px;font:600 22px/1.45 var(--display);letter-spacing:-.01em;max-height:150px;overflow:hidden;position:relative' });
    const cam = h('div', { style: 'width:10px;height:10px;border-radius:50%;background:#333;margin:0 auto 8px;box-shadow:0 0 0 3px #1a1a1a' });
    const spans = words.map((w) => { const s = h('span', { style: 'transition:color .15s' }, w + ' '); panel.append(s); return s; });
    const wave = h('div', { style: 'display:flex;gap:3px;height:34px;align-items:center;margin:12px 0' });
    const bars = Array.from({ length: 40 }, () => { const b = h('i', { style: 'flex:1;background:#11f590;border-radius:2px;height:4px;transition:height .1s' }); wave.append(b); return b; });
    const st = h('div', { class: 'detail muted' });
    const pause = h('button', {}, 'Stop talking'); const retake = h('button', {}, 'Say "take"'); const back = h('button', {}, 'Retake last line');
    const paint = () => { spans.forEach((s, j) => { s.style.color = j < i ? 'rgba(255,255,255,.35)' : j === i ? '#11f590' : '#fff'; }); const cur = spans[i]; if (cur) panel.scrollTop = Math.max(0, cur.offsetTop - 40); st.innerHTML = state === 'reading' ? 'Listening — the prompter follows your voice word by word.' : state === 'paused' ? 'Silence detected — paused. Say <b>“take”</b> to resume.' : ''; };
    const tick = () => {
      bars.forEach((b) => { b.style.height = state === 'reading' ? (4 + Math.random() * 28) + 'px' : '3px'; });
      if (state === 'reading') { i = Math.min(words.length, i + 1); if (i >= words.length) i = 0; }
      paint();
    };
    pause.onclick = () => { state = 'paused'; paint(); };
    retake.onclick = () => { state = 'reading'; paint(); };
    back.onclick = () => { let j = i - 1; while (j > 0 && !/[.!?]$/.test(words[j - 1])) j--; i = Math.max(0, j); state = 'reading'; paint(); };
    root.append(cam, panel, wave, h('div', { class: 'ctl' }, [pause, retake, back]), st);
    paint();
    visibleStart(root, () => { if (reduced || timer) return; timer = setInterval(tick, 260); }, () => { clearInterval(timer); timer = null; });
  };

  /* ---------- Stem mixer ---------- */
  V.mixer = (root, D) => {
    const secs = D.sections, stems = D.stems; // stems: [{name, w, plan:[0/1 per section]}]
    const on = stems.map((s) => s.plan.slice());
    const W = 600, H = 150;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Energy across the song' });
    const grid = h('div', { style: `display:grid;grid-template-columns:100px repeat(${secs.length},1fr);gap:4px;font-size:12px` });
    const draw = () => {
      grid.innerHTML = ''; grid.append(h('span'));
      secs.forEach((s) => grid.append(h('span', { class: 'muted', style: 'text-align:center' }, s)));
      stems.forEach((st, i) => {
        grid.append(h('b', { style: 'color:#fff;align-self:center' }, st.name));
        secs.forEach((_, j) => grid.append(h('button', { 'aria-pressed': String(!!on[i][j]), 'aria-label': `${st.name} in ${secs[j]}`, style: `height:26px;border-radius:6px;background:${on[i][j] ? '#11f590' : 'rgba(255,255,255,.06)'};transition:background .2s`, onclick: () => { on[i][j] = on[i][j] ? 0 : 1; draw(); } })));
      });
      svg.innerHTML = '';
      const e = secs.map((_, j) => stems.reduce((a, st, i) => a + (on[i][j] ? st.w : 0), 0));
      const mx = stems.reduce((a, s) => a + s.w, 0);
      const px = (j) => 30 + j / (secs.length - 1) * (W - 60), py = (v) => 130 - v / mx * 110;
      let d = `M${px(0)} ${py(e[0])}`; for (let j = 1; j < secs.length; j++) { const xm = (px(j - 1) + px(j)) / 2; d += ` C${xm} ${py(e[j - 1])} ${xm} ${py(e[j])} ${px(j)} ${py(e[j])}`; }
      svg.append(S('path', { d: d + ` L${px(secs.length - 1)} 130 L${px(0)} 130 Z`, fill: 'rgba(17,245,144,.15)' }));
      svg.append(S('path', { d, fill: 'none', stroke: '#11f590', 'stroke-width': 3 }));
      secs.forEach((s, j) => { const t = S('text', { x: px(j), y: 146, 'text-anchor': 'middle', 'font-size': 11 }); t.textContent = s; svg.append(t); });
      const flat = Math.max(...e) - Math.min(...e) < mx * 0.25;
      note.innerHTML = flat ? 'The energy is flat — every section sounds the same. A directed mix leaves room: quiet opening, space in the bridge, choir only in choruses.' : 'Good shape: the song breathes. Sections build and release instead of everything playing at once.';
    };
    const note = h('div', { class: 'detail muted' });
    const all = h('button', { onclick: () => { on.forEach((r) => r.fill(1)); draw(); } }, 'Everything on (first take)');
    const dir = h('button', { onclick: () => { stems.forEach((s, i) => { on[i] = s.plan.slice(); }); draw(); } }, 'Directed mix');
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Toggle each instrument per section and watch the energy curve. First AI takes tend to have everything on, all the time.'), h('div', { class: 'ctl' }, [all, dir]), h('div', { class: 'panel', style: 'overflow-x:auto' }, [grid]), h('div', { class: 'panel', style: 'margin-top:10px' }, [svg]), note);
    draw();
  };

  /* ---------- Easing playground ---------- */
  V.easing = (root) => {
    const W = 220, P = 20;
    let c = [0.25, 0.1, 0.25, 1];
    const svg = S('svg', { viewBox: `0 0 ${W + P * 2} ${W + P * 2}`, style: 'max-width:260px;touch-action:none', role: 'img', 'aria-label': 'Bezier curve editor' });
    const X = (v) => P + v * W, Y = (v) => P + (1 - v) * W;
    svg.append(S('rect', { x: P, y: P, width: W, height: W, fill: 'none', stroke: 'rgba(255,255,255,.15)' }));
    const l1 = S('line', { stroke: 'rgba(255,255,255,.4)' }), l2 = S('line', { stroke: 'rgba(255,255,255,.4)' }), path = S('path', { fill: 'none', stroke: '#11f590', 'stroke-width': 3 });
    const h1 = S('circle', { r: 9, fill: '#1395a1', style: 'cursor:grab' }), h2 = S('circle', { r: 9, fill: '#1537b3', style: 'cursor:grab' });
    svg.append(l1, l2, path, h1, h2);
    const presets = [['Linear', [0, 0, 1, 1]], ['Easy ease', [0.33, 0, 0.67, 1]], ['Snappy out', [0.16, 1, 0.3, 1]], ['Overshoot', [0.34, 1.56, 0.64, 1]]];
    const lanes = h('div', { style: 'display:grid;gap:10px;align-content:center' });
    const mk = (name) => { const dot = h('div', { style: 'width:26px;height:26px;border-radius:8px;background:#11f590;position:absolute;top:2px;left:0' }); lanes.append(h('div', {}, [h('div', { class: 'muted', style: 'font-size:12px;margin-bottom:4px' }, name), h('div', { style: 'position:relative;height:30px;border-radius:8px;background:rgba(255,255,255,.05)' }, [dot])])); return dot; };
    const dLin = mk('Linear (robotic)'), dCur = mk('Your curve'), dEase = mk('Easy ease');
    const bez = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
    const solve = (x, cc) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; bez(m, cc[0], cc[2]) < x ? lo = m : hi = m; } return bez((lo + hi) / 2, cc[1], cc[3]); };
    const draw = () => { path.setAttribute('d', `M${X(0)} ${Y(0)} C${X(c[0])} ${Y(c[1])} ${X(c[2])} ${Y(c[3])} ${X(1)} ${Y(1)}`); l1.setAttribute('x1', X(0)); l1.setAttribute('y1', Y(0)); l1.setAttribute('x2', X(c[0])); l1.setAttribute('y2', Y(c[1])); l2.setAttribute('x1', X(1)); l2.setAttribute('y1', Y(1)); l2.setAttribute('x2', X(c[2])); l2.setAttribute('y2', Y(c[3])); h1.setAttribute('cx', X(c[0])); h1.setAttribute('cy', Y(c[1])); h2.setAttribute('cx', X(c[2])); h2.setAttribute('cy', Y(c[3])); code.textContent = `cubic-bezier(${c.map((v) => v.toFixed(2)).join(', ')})`; };
    let drag = null;
    const pt = (e) => { const r = svg.getBoundingClientRect(), s = (W + P * 2) / r.width; return [((e.clientX - r.left) * s - P) / W, 1 - ((e.clientY - r.top) * s - P) / W]; };
    [h1, h2].forEach((hd, i) => hd.addEventListener('pointerdown', (e) => { drag = i; svg.setPointerCapture(e.pointerId); }));
    svg.addEventListener('pointermove', (e) => { if (drag == null) return; const [x, y] = pt(e); c[drag * 2] = Math.max(0, Math.min(1, x)); c[drag * 2 + 1] = Math.max(-0.6, Math.min(1.6, y)); draw(); });
    svg.addEventListener('pointerup', () => { drag = null; });
    const code = h('code', { style: 'font:500 12px var(--mono);color:var(--moon-2)' });
    const ctl = h('div', { class: 'ctl' }, presets.map(([n, v]) => h('button', { onclick: () => { c = v.slice(); draw(); } }, n)));
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'Drag the two handles. The same one-second move feels completely different depending on the curve — this is most of what makes motion look professional.'), ctl, h('div', { class: 'grid2' }, [h('div', { class: 'panel', style: 'display:grid;justify-items:center;gap:6px' }, [svg, code]), h('div', { class: 'panel' }, [lanes])]));
    draw();
    let t0 = performance.now(), raf;
    const loop = (now) => { const t = ((now - t0) / 1400) % 1.6; const p = Math.min(1, t); const w = lanes.firstChild.lastChild.clientWidth - 28; dLin.style.transform = `translateX(${p * w}px)`; dCur.style.transform = `translateX(${solve(p, c) * w}px)`; dEase.style.transform = `translateX(${solve(p, [0.33, 0, 0.67, 1]) * w}px)`; raf = requestAnimationFrame(loop); };
    visibleStart(root, () => { if (!raf && !reduced) raf = requestAnimationFrame(loop); }, () => { cancelAnimationFrame(raf); raf = null; });
  };
})();

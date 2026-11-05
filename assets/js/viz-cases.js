/* Visualizations for the past-employer case studies. */
(() => {
  const { V, h, escapeHTML } = window.VZ;
  const NS = 'http://www.w3.org/2000/svg';
  const S = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
  const isThumb = () => document.documentElement.classList.contains('thumb');

  /* ---------- Two pipelines compared, scaled by a slider ---------- */
  V.compare = (root, D) => {
    const lanes = D.lanes; // [{name, fixed:[{t,d}], per:[{t,d}], parallel:bool}]
    const lab = h('label', {}); const rng = h('input', { type: 'range', min: 1, max: D.max || 12, value: isThumb() ? 8 : 3, 'aria-label': D.unit });
    const box = h('div', { style: 'display:grid;gap:14px;margin-top:12px' });
    const unitDays = (x) => x >= 1 ? `${Math.round(x * 10) / 10} days` : `${Math.round(x * 24)} hours`;
    const draw = () => {
      const n = +rng.value; lab.textContent = `${n} ${D.unit}`;
      const totals = lanes.map((l) => l.fixed.reduce((a, s) => a + s.d, 0) + (l.parallel ? Math.max(...l.per.map((s) => s.d)) : l.per.reduce((a, s) => a + s.d, 0) * n));
      const mx = Math.max(...totals);
      box.innerHTML = '';
      lanes.forEach((l, i) => {
        const bar = h('div', { style: 'display:flex;height:30px;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.05)' });
        const segs = [...l.fixed, ...(l.parallel ? l.per : Array.from({ length: n }, () => l.per).flat())];
        const col = i ? ['#11f590', '#1395a1', '#62ecb5', '#7fe3ec'] : ['#7a7a7a', '#5a5a5a', '#8d8d8d', '#666'];
        const segTotal = l.parallel ? totals[i] : segs.reduce((a, s) => a + s.d, 0);
        segs.forEach((s, k) => bar.append(h('i', { title: s.t, style: `width:${(s.d / mx) * 100 * (totals[i] / segTotal)}%;background:${col[k % col.length]};border-right:1px solid rgba(0,0,0,.4);transition:width .4s` })));
        box.append(h('div', {}, [h('div', { style: 'display:flex;justify-content:space-between;margin-bottom:6px' }, [h('b', { style: 'color:#fff' }, l.name), h('span', { style: `font:600 14px var(--mono);color:${i ? '#11f590' : 'var(--moon-2)'}` }, unitDays(totals[i]))]), bar,
          h('div', { class: 'muted', style: 'font-size:12px;margin-top:4px' }, [...l.fixed, ...l.per].map((s) => s.t).join(' → '))]));
      });
      note.innerHTML = `At ${n} ${escapeHTML(D.unit)}: <b>${unitDays(totals[0])}</b> the old way vs <b style="color:#11f590">${unitDays(totals[1])}</b> with the AI pipeline. <span class="muted">${escapeHTML(D.caveat)}</span>`;
    };
    const note = h('div', { class: 'detail panel' });
    rng.oninput = draw;
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, D.intro), lab, rng, box, note);
    draw();
  };

  /* ---------- Eval grid: checks × scenarios, with blind spots ---------- */
  V.evalgrid = (root, D) => {
    const sc = D.scenarios, ck = D.checks; let showGaps = isThumb();
    const grid = h('div', { style: `display:grid;grid-template-columns:minmax(150px,1.4fr) repeat(${sc.length},1fr);gap:4px;font-size:13px;overflow-x:auto` });
    const det = h('div', { class: 'detail panel' }, 'Click a cell to see the check.');
    const toggle = h('button', { onclick: () => { showGaps = !showGaps; toggle.classList.toggle('on', showGaps); toggle.textContent = showGaps ? 'Hide the audit findings' : 'Show what the audit found'; draw(); } }, 'Show what the audit found');
    if (showGaps) toggle.classList.add('on');
    const draw = () => {
      grid.innerHTML = ''; grid.append(h('span'));
      sc.forEach((s) => grid.append(h('b', { style: 'color:#fff;text-align:center;font-size:12px' }, s)));
      ck.forEach((c) => {
        grid.append(h('span', { style: 'align-self:center' }, [c.name, c.gap && showGaps ? h('span', { style: 'color:#f5c542' }, ' ⚠') : null]));
        sc.forEach((s, j) => {
          const v = c.cells[j]; const gap = showGaps && c.gap;
          const col = gap ? '#f5c542' : v === 1 ? '#11f590' : v === 0 ? '#ff6b6b' : 'rgba(255,255,255,.15)';
          grid.append(h('button', { 'aria-label': `${c.name}, ${s}`, style: `height:30px;border-radius:7px;border:1px solid ${col};color:${col};font:600 12px var(--mono);background:${gap ? 'rgba(245,197,66,.08)' : 'transparent'}`, onclick: () => { det.innerHTML = `<b>${escapeHTML(c.name)} · ${escapeHTML(s)}.</b> ${escapeHTML(c.what)}` + (c.gap ? `<br><span style="color:#f5c542">Audit finding:</span> ${escapeHTML(c.gap)}` : ''); } }, v === 1 ? 'pass' : v === 0 ? 'fail' : '—'));
        });
      });
    };
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, D.intro), h('div', { class: 'ctl' }, [toggle]), h('div', { class: 'panel' }, [grid]), det);
    draw();
  };

  /* ---------- Price estimator (illustrative model) ---------- */
  V.pricing = (root, D) => {
    const P = D.params; const vals = {};
    const out = h('div', { class: 'big' }); const band = h('div', { class: 'muted' }); const why = h('div', { style: 'display:grid;gap:6px;margin-top:10px' });
    const sl = h('div', { style: 'display:grid;gap:10px' });
    const fmt = (x) => '₹' + Math.round(x / 1000).toLocaleString('en-IN') + 'k';
    P.forEach((p) => {
      vals[p.k] = p.v;
      const val = h('span', { class: 'muted', style: 'font-size:12px' });
      const r = h('input', { type: 'range', min: p.min, max: p.max, step: p.step || 1, value: p.v, 'aria-label': p.l, oninput: (e) => { vals[p.k] = +e.target.value; draw(); } });
      p._val = val; sl.append(h('div', {}, [h('label', { style: 'display:flex;justify-content:space-between' }, [h('span', {}, p.l), val]), r]));
    });
    const draw = () => {
      let price = D.base; why.innerHTML = '';
      P.forEach((p) => {
        const f = p.f(vals[p.k]); price *= f;
        p._val.textContent = p.fmt(vals[p.k]);
        const pct = Math.round((f - 1) * 100);
        why.append(h('div', { style: 'display:grid;grid-template-columns:120px 1fr 52px;gap:8px;align-items:center;font-size:12px' }, [h('span', { class: 'muted' }, p.l), h('div', { class: 'bar' }, [h('i', { style: `width:${Math.min(100, Math.abs(pct) * 2)}%;background:${pct < 0 ? '#ff8a5c' : '#11f590'}` })]), h('b', { style: `color:${pct < 0 ? '#ff8a5c' : '#11f590'};text-align:right` }, (pct > 0 ? '+' : '') + pct + '%')]));
      });
      const spread = 0.03 + (vals.km > 90000 ? 0.03 : 0) + (vals.cond < 3 ? 0.02 : 0);
      out.textContent = fmt(price); band.textContent = `fair range ${fmt(price * (1 - spread))} – ${fmt(price * (1 + spread))} · ±${Math.round(spread * 100)}%`;
    };
    P.forEach((p) => { p.f = new Function('v', 'return ' + p.expr); p.fmt = new Function('v', 'return ' + p.show); });
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, D.intro), h('div', { class: 'grid2' }, [h('div', { class: 'panel' }, [sl]), h('div', { class: 'panel' }, [h('div', { class: 'muted', style: 'font-size:12px' }, D.car), out, band, why])]));
    draw();
  };
})();

/* ---------- Partner roll-up: org → tier → channel ---------- */
(() => {
  const { V, h, escapeHTML } = window.VZ;
  V.partners = (root, D) => {
    const tiers = D.tiers; let t = 0;
    const sum = h('div', { class: 'grid3', style: 'margin-bottom:12px' });
    const list = h('div', { class: 'panel', style: 'display:grid;gap:8px' });
    const det = h('div', { class: 'detail muted' });
    const draw = () => {
      const orgs = tiers[t].orgs; const reps = orgs.reduce((a, o) => a + o.reps, 0); const cert = orgs.reduce((a, o) => a + o.reps * o.cert, 0) / reps;
      sum.innerHTML = '';
      [['Partner orgs', orgs.length], ['Partner reps', reps.toLocaleString('en-IN')], ['Certified', Math.round(cert * 100) + '%']].forEach(([l, v]) => sum.append(h('div', { class: 'panel' }, [h('div', { class: 'muted', style: 'font-size:12px' }, l), h('div', { class: 'big', style: 'font-size:28px' }, String(v))])));
      list.innerHTML = '';
      orgs.forEach((o) => {
        const pct = Math.round(o.cert * 100);
        list.append(h('button', { style: 'display:grid;grid-template-columns:150px 1fr 44px;gap:10px;align-items:center;text-align:left', onclick: () => { det.innerHTML = `<b style="color:#fff">${escapeHTML(o.name)}</b> · ${o.reps} reps · ${pct}% certified. Their own admin sees this view for their reps; the channel team sees every partner rolled up by tier.`; } },
          [h('span', { style: 'color:#fff' }, o.name), h('div', { class: 'bar' }, [h('i', { style: `width:${pct}%;background:${pct < 50 ? '#f5c542' : ''}` })]), h('b', { style: 'font:600 13px var(--mono);color:#fff;text-align:right' }, pct + '%')]));
      });
      det.textContent = 'Click a partner. (Illustrative data.)';
    };
    const ctl = h('div', { class: 'ctl' }, tiers.map((x, i) => h('button', { onclick: () => { t = i; ctl.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); draw(); } }, x.name)));
    ctl.firstChild.classList.add('on');
    root.append(h('div', { class: 'muted', style: 'margin-bottom:8px' }, 'The channel team\'s view: every partner organisation, its reps and certification, rolled up by tier.'), ctl, sum, list, det);
    draw();
  };
})();

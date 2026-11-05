/* Project visualizations. Each project page has <div class="vz" data-viz="type">
   and window.VIZDATA = {how:[...], ...extra}. Types register in V below. */
(() => {
  const V = {};
  const D = window.VIZDATA || {};
  const h = (tag, attrs = {}, kids = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => c != null && el.append(c.nodeType ? c : document.createTextNode(c)));
    return el;
  };
  const steps = () => (D.how || []).map((s, i) => typeof s === 'string'
    ? { t: s.split(/[:.—–-]\s/)[0].slice(0, 46), d: s, k: String(i + 1).padStart(2, '0') }
    : { k: String(i + 1).padStart(2, '0'), ...s });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- flow: clickable pipeline with auto-play ---------- */
  V.flow = (root) => {
    const S = steps();
    let cur = 0, timer;
    const flow = h('div', { class: 'flow', role: 'tablist' });
    const detail = h('div', { class: 'detail panel', 'aria-live': 'polite' });
    const nodes = S.map((s, i) => {
      const n = h('button', { class: 'node', role: 'tab', onclick: () => { stop(); go(i); } }, [h('small', {}, s.k), h('b', {}, s.t)]);
      if (i) flow.append(h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'));
      flow.append(n); return n;
    });
    const play = h('button', { onclick: () => (timer ? stop() : start()) }, 'Pause');
    const go = (i) => {
      cur = i; nodes.forEach((n, j) => { n.classList.toggle('on', j === i); n.setAttribute('aria-selected', j === i); });
      detail.innerHTML = `<b>Step ${S[i].k}.</b> ${escapeHTML(S[i].d)}`;
      nodes[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    };
    function start() { if (reduced) return; timer = setInterval(() => go((cur + 1) % S.length), 2600); play.textContent = 'Pause'; }
    function stop() { clearInterval(timer); timer = null; play.textContent = 'Play'; }
    root.append(h('div', { class: 'ctl' }, [play]), flow, detail);
    go(0); visibleStart(root, start, stop);
  };

  /* helpers */
  function escapeHTML(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function visibleStart(el, start, stop) {
    if (!('IntersectionObserver' in window)) return start();
    new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? start() : stop())), { threshold: 0.3 }).observe(el);
  }
  window.VZ = { V, h, D, steps, escapeHTML, visibleStart, reduced };

  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.vz[data-viz]').forEach((el) => {
      const fn = V[el.dataset.viz] || V.flow;
      try { fn(el, D); } catch (err) { console.error(err); el.innerHTML = ''; V.flow(el, D); }
    });
  });
})();

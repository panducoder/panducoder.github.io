(() => {
  if (location.hash === '#thumb') { document.documentElement.classList.add('thumb'); document.querySelectorAll('.rv').forEach((e) => e.classList.add('in')); }
  const nav = document.getElementById('nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // reveal on scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.rv').forEach((el) => io ? io.observe(el) : el.classList.add('in'));

  // active nav link by section
  const links = [...document.querySelectorAll('.nav a.link[href*="#"]')];
  const secs = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  if (secs.length && io) {
    const so = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.hash === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => so.observe(s));
  }

  // accordion + dial
  const dial = document.querySelector('#dial .knob');
  document.querySelectorAll('.acc .item').forEach((item, i, all) => {
    item.querySelector('button').addEventListener('click', () => {
      all.forEach((x) => { x.classList.toggle('open', x === item); x.querySelector('button').setAttribute('aria-expanded', x === item); });
      if (dial) dial.style.transform = `rotate(${-120 + i * 80}deg)`;
    });
  });
  if (dial) dial.style.transform = 'rotate(-120deg)';

  // project filters + show all
  const grid = document.getElementById('grid');
  const more = document.getElementById('moreBtn');
  if (more) more.addEventListener('click', () => grid.classList.add('all'));
  document.querySelectorAll('#filters button').forEach((b, _, all) => b.addEventListener('click', () => {
    all.forEach((x) => x.classList.toggle('on', x === b));
    if (b.dataset.f !== '*') grid.classList.add('all');
    grid.querySelectorAll('.card').forEach((c) => { c.style.display = (b.dataset.f === '*' || c.dataset.cat === b.dataset.f) ? '' : 'none'; });
  }));

  // lightbox for screenshots
  const lb = document.getElementById('lb');
  if (lb) {
    document.querySelectorAll('.shot img').forEach((img) => img.addEventListener('click', () => { lb.querySelector('img').src = img.src; lb.classList.add('on'); }));
    lb.addEventListener('click', () => lb.classList.remove('on'));
    addEventListener('keydown', (ev) => { if (ev.key === 'Escape') lb.classList.remove('on'); });
  }
})();

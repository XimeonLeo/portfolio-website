/* Live chatbot demo, opened in a window on top of the portfolio (no new tab). */
(() => {
  const ov = document.getElementById('demoOv'), frame = document.getElementById('demoFrame');
  let mode = '', lastFocus = null;
  function open(m) {
    lastFocus = document.activeElement;
    if (m !== mode) { mode = m; frame.src = 'chatbot-demo/?embed=1' + (m === 'voice' ? '&mode=voice' : ''); }
    ov.hidden = false;
    requestAnimationFrame(() => ov.classList.add('on'));
    document.documentElement.classList.add('demo-open');
    document.getElementById('demoOvX').focus();
  }
  function close() {
    ov.classList.remove('on');
    document.documentElement.classList.remove('demo-open');
    // unload so a live voice call or animation stops; next open starts fresh
    frame.src = 'about:blank'; mode = '';
    setTimeout(() => { ov.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-demo]');
    if (!t) return;
    e.preventDefault();
    open(t.dataset.demo);
  });
  document.getElementById('demoOvX').addEventListener('click', close);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  addEventListener('message', e => { if (e.origin === location.origin && e.data === 'demo:close' && !ov.hidden) close(); });
})();

/* Work: play the recording only while it's on screen */
(() => {
  const v = document.querySelector('.case-video'); if (!v) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: .35 }).observe(v);
})();

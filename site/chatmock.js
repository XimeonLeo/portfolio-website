/* "Try it yourself" phone: realistic chat replays on WhatsApp, Instagram, Messenger, Telegram and a website widget.
   All businesses and data are made up. The real, live demo opens from the buttons (data-demo). */
(() => {
  const root = document.getElementById('chatMock'); if (!root) return;
  const app = root.querySelector('.cm-app'), tabsEl = root.querySelector('.cm-tabs'), phone = root.querySelector('.iphone');
  const tg1 = root.querySelector('.try-tag.tg1'), tg2 = root.querySelector('.try-tag.tg2');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const L = (s, n = 18, mode) => (window.logo ? window.logo(s, n, mode) : '');

  /* small UI icons */
  const I = {
    back: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    video: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="2.5" y="6" width="13" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6.6 3.5l2.6.4 1.3 4-1.9 1.6a12 12 0 0 0 5.9 5.9l1.6-1.9 4 1.3.4 2.6c.1.9-.6 1.6-1.5 1.6A16.5 16.5 0 0 1 3 5c0-.9.7-1.6 1.6-1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13.3" r="3.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M3.4 20.4l17.4-8.4L3.4 3.6 3.4 10l12 2-12 2z" fill="currentColor"/></svg>',
    clip: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    smile: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/><circle cx="15" cy="10" r="1.1" fill="currentColor"/><path d="M8.3 14.2a4.3 4.3 0 0 0 7.4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    img: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.7" fill="currentColor"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    like: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 10v10H4V10zm2 10h8.2a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 18.4 10H14V6a2 2 0 0 0-2-2l-3 6z" fill="currentColor"/></svg>',
    tick: '<svg viewBox="0 0 18 12" width="16" height="11"><path d="M1 6.5l3.2 3.2L11 2.8M7 9.7l.8.8L15.8 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tick1: '<svg viewBox="0 0 18 12" width="16" height="11"><path d="M3 6.5l3.2 3.2L13 2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    verified: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3L2.6 15.8l1-3-1-3 2.6-1.9 1-3 3.2.1z" fill="#25D366"/><path d="M8 12.2l2.7 2.7L16.2 9.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ---------- the five conversations (fictional businesses, sample data) ---------- */
  const P = [
    { id: 'whatsapp', label: 'WhatsApp', biz: 'Brightsmile Dental', av: 'BS', avc: '#1f8a70', start: [23, 48],
      tags: [['Replied in 2 seconds', 'at 11:48 pm'], ['Booking added', 'Thu · 10:30 am']],
      steps: [
        { u: 'Hi, do you have anything this week for a check-up?' },
        { b: 'Hi! 👋 Yes, we do. These are the next free slots:', btns: ['Thu · 10:30 am', 'Thu · 2:15 pm', 'Fri · 9:00 am'], tag: 0 },
        { tap: 'Thu · 10:30 am' },
        { b: 'Booked ✅ Thursday at 10:30 am with Dr. Adams. I\'ll send you a reminder the day before.', tag: 1 },
        { u: 'Perfect, thank you!' },
        { b: 'You\'re welcome! See you Thursday 😊' },
      ] },
    { id: 'instagram', label: 'Instagram', biz: 'glowstudio', full: 'Glow Studio', av: 'GS', avc: '#c13584', start: [1, 12],
      tags: [['Answered a DM at 1:12 am', 'while the team slept'], ['Booking added', 'Sat · 1:30 pm']],
      steps: [
        { u: 'hey! do you do lash lifts on saturdays? 👀' },
        { b: 'Hey! Yes we do 💫 This Saturday we have 11:00 am or 1:30 pm free. Want one?', tag: 0 },
        { u: '1:30 please!' },
        { b: 'Done! You\'re booked 🎉', card: { k: 'Booking confirmed', t: 'Lash lift', s: 'Saturday · 1:30 pm' }, tag: 1 },
        { b: 'I\'ve sent your aftercare tips too. See you Saturday!' },
      ] },
    { id: 'messenger', label: 'Messenger', biz: 'Harbor Realty', av: 'HR', avc: '#0866FF', start: [19, 6],
      tags: [['New lead answered', 'in 3 seconds'], ['Viewing booked', 'and added to the CRM']],
      steps: [
        { u: 'Is the 3-bed on Oak Street still available?' },
        { b: 'It is! 🏡 Here are the details:', listing: { t: '3-bed house, Oak Street', s: '2 bath · garden · near schools', btn: 'View listing' }, tag: 0 },
        { b: 'Would you like to see it this weekend?', quick: ['Sat morning', 'Sat afternoon', 'Call me'] },
        { tap: 'Sat morning' },
        { b: 'Great, you\'re booked for Saturday at 10:00 am. An agent will text you to confirm.', tag: 1 },
      ] },
    { id: 'telegram', label: 'Telegram', biz: 'Nova Store', av: 'NS', avc: '#2AABEE', bot: 1, start: [16, 20],
      tags: [['Order looked up', 'in the store, in 1 second'], ['Support ticket avoided', 'no human needed']],
      steps: [
        { u: 'Where is my order #1092?' },
        { b: '📦 Order #1092 has shipped! It arrives tomorrow between 9 am and 1 pm.', kb: [['🚚 Track parcel', '✏️ Change address'], ['💬 Talk to a person']], tag: 0 },
        { tap: '🚚 Track parcel' },
        { b: 'Left the warehouse at 4:12 pm, next stop: your city hub. I\'ll message you when it\'s out for delivery.', tag: 1 },
        { u: 'Amazing, thanks 🙏' },
      ] },
    { id: 'web', label: 'Website', biz: 'Ashford Legal', av: 'AL', avc: '#15140F', start: [21, 34],
      tags: [['Lead captured', 'name + email'], ['Consultation booked', 'Tue · 3:00 pm']],
      steps: [
        { b: 'Hi! I\'m the virtual assistant for Ashford Legal. How can I help today?', chips: ['Buying a home', 'Selling a home', 'Something else'] },
        { tap: 'Selling a home' },
        { b: 'We can help with that. What\'s your name and the best email to reach you?' },
        { u: 'Dana Reyes, dana.reyes@email.com', tag: 0 },
        { b: 'Thanks, Dana! I\'ve booked a free consultation for Tuesday at 3:00 pm. The confirmation is on its way to your inbox.', tag: 1 },
      ] },
  ];

  /* ---------- app chrome per platform ---------- */
  const avatar = (p, cls = '') => `<span class="cm-av ${cls}" style="--avc:${p.avc}">${p.av}</span>`;
  const HEAD = {
    whatsapp: p => `<div class="cm-head"><span class="ic">${I.back}</span>${avatar(p)}<div class="hn"><b>${p.biz} ${I.verified}</b><small class="cm-st">online</small></div><span class="ic">${I.video}</span><span class="ic">${I.call}</span></div>`,
    instagram: p => `<div class="cm-head"><span class="ic">${I.back}</span>${avatar(p, 'ring')}<div class="hn"><b>${p.biz}</b><small>${p.full}</small></div><span class="ic">${I.call}</span><span class="ic">${I.video}</span></div>`,
    messenger: p => `<div class="cm-head"><span class="ic">${I.back}</span>${avatar(p, 'dot')}<div class="hn"><b>${p.biz}</b><small class="cm-st">Active now</small></div><span class="ic">${I.call}</span><span class="ic">${I.video}</span></div>`,
    telegram: p => `<div class="cm-head"><span class="tback">${I.back}<span>Chats</span></span><div class="hn"><b>${p.biz}</b><small class="cm-st">bot</small></div>${avatar(p)}</div>`,
    web: p => `<div class="cm-site"><span class="site-logo">${p.av}</span><span class="site-bars"><i></i><i></i><i></i></span></div><div class="cm-head"><span class="cm-av" style="--avc:#FF4F1A">AI</span><div class="hn"><b>${p.biz}</b><small class="cm-st">Typically replies instantly</small></div><span class="ic x">×</span></div>`,
  };
  const INPUT = {
    whatsapp: () => `<div class="cm-in"><span class="ic">${I.plus}</span><span class="cm-field"><span class="ph">Message</span><span class="tx"></span><span class="ic sm">${I.smile}</span></span><span class="ic cm-cam">${I.cam}</span><span class="cm-send ic">${I.mic}</span></div>`,
    instagram: () => `<div class="cm-in"><span class="cm-field"><span class="camb">${I.cam}</span><span class="ph">Message...</span><span class="tx"></span><span class="ic sm">${I.mic}</span><span class="ic sm">${I.img}</span></span><span class="cm-send txt">Send</span></div>`,
    messenger: () => `<div class="cm-in"><span class="ic">${I.plus}</span><span class="ic">${I.cam}</span><span class="ic">${I.img}</span><span class="cm-field"><span class="ph">Aa</span><span class="tx"></span><span class="ic sm">${I.smile}</span></span><span class="cm-send ic">${I.like}</span></div>`,
    telegram: () => `<div class="cm-in"><span class="ic">${I.clip}</span><span class="cm-field"><span class="ph">Message</span><span class="tx"></span><span class="ic sm">${I.smile}</span></span><span class="cm-send ic">${I.mic}</span></div>`,
    web: () => `<div class="cm-in"><span class="cm-field"><span class="ph">Write a message…</span><span class="tx"></span></span><span class="cm-send ic">${I.send}</span></div><div class="cm-powered">Powered by AI · replies 24/7</div>`,
  };

  /* ---------- engine ---------- */
  let cur = 0, run = 0, visible = false, started = false, userPicked = false;
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const fmt = (h, m) => { const ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return `${hh}:${String(m).padStart(2, '0')} ${ap}`; };
  const waitVisible = async id => { while (!visible && id === run) await new Promise(r => setTimeout(r, 300)); };

  tabsEl.innerHTML = P.map((p, i) => `<button type="button" role="tab" data-i="${i}" aria-label="${p.label}">${p.id === 'web' ? '<span class="web-ic">🌐</span>' : L(p.id, 18)}<span>${p.label}</span></button>`).join('');
  tabsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); userPicked = true; started = true; play(+b.dataset.i); });

  function setTag(el, t) {
    if (!el || !t) return;
    el.querySelector('b').textContent = t[0]; el.querySelector('small').textContent = t[1];
    el.classList.remove('pop', 'dim'); void el.offsetWidth; el.classList.add('pop');
  }
  const presetTags = p => [tg1, tg2].forEach((el, k) => { if (!el) return; el.querySelector('b').textContent = p.tags[k][0]; el.querySelector('small').textContent = p.tags[k][1]; el.classList.remove('pop'); el.classList.add('dim'); });

  function play(i) {
    cur = i; const id = ++run, p = P[i];
    $$tabs(i);
    phone.dataset.p = p.id; root.dataset.p = p.id;
    app.innerHTML = `${HEAD[p.id](p)}<div class="cm-body"><div class="cm-day">${p.id === 'telegram' ? 'Today' : p.id === 'web' ? '' : 'Today'}</div></div>${INPUT[p.id](p)}`;
    app.classList.remove('fade'); void app.offsetWidth; app.classList.add('fade');
    presetTags(p);
    converse(p, id);
  }
  function $$tabs(i) { [...tabsEl.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); }); }

  async function converse(p, id) {
    const body = app.querySelector('.cm-body'), field = app.querySelector('.cm-field'), tx = app.querySelector('.tx'), st = app.querySelector('.cm-st'), send = app.querySelector('.cm-send');
    let [h, m] = p.start; const tick = () => { m += Math.random() < .5 ? 0 : 1; if (m > 59) { m = 0; h = (h + 1) % 24; } return fmt(h, m); };
    const alive = () => id === run;
    const scroll = () => body.scrollTo({ top: body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    let lastOut = null;
    const addMsg = (who, html, extra = '') => {
      const row = document.createElement('div'); row.className = `cm-row ${who}`;
      row.innerHTML = html + extra; body.appendChild(row); scroll(); return row;
    };
    const meta = (who) => {
      const t = tick();
      if (who === 'out') {
        if (p.id === 'whatsapp') return `<span class="mt">${t}<span class="tk">${I.tick}</span></span>`;
        if (p.id === 'telegram') return `<span class="mt">${t}<span class="tk">${I.tick1}</span></span>`;
        return '';
      }
      return (p.id === 'whatsapp' || p.id === 'telegram') ? `<span class="mt">${t}</span>` : '';
    };
    const markRead = () => {
      if (!lastOut) return;
      if (p.id === 'whatsapp') lastOut.classList.add('read');
      if (p.id === 'telegram') { const tk = lastOut.querySelector('.tk'); if (tk) tk.innerHTML = I.tick; lastOut.classList.add('read'); }
      if (p.id === 'instagram' || p.id === 'messenger') { body.querySelectorAll('.seen').forEach(s => s.remove()); lastOut.insertAdjacentHTML('afterend', p.id === 'instagram' ? '<div class="seen">Seen</div>' : `<div class="seen sav">${avatar(p)}</div>`); scroll(); }
    };
    const userSay = async text => {
      if (!reduce) {
        field.classList.add('typing'); send.classList.add('go'); if (p.id === 'whatsapp' || p.id === 'telegram') send.innerHTML = I.send;
        for (let k = 1; k <= text.length; k++) { if (!alive()) return; tx.textContent = (k > 24 ? '…' : '') + text.slice(Math.max(0, k - 24), k); await sleep(28 + Math.random() * 40); }
        await sleep(250);
      }
      tx.textContent = ''; field.classList.remove('typing'); send.classList.remove('go');
      if (p.id === 'whatsapp' || p.id === 'telegram') send.innerHTML = I.mic;
      lastOut = addMsg('out', `<div class="bub">${esc(text)}${meta('out')}</div>`);
    };
    const botTyping = async ms => {
      markRead(); if (!reduce) await sleep(500);
      if (!alive()) return;
      let dots = null;
      if (st && (p.id === 'whatsapp' || p.id === 'telegram' || p.id === 'messenger')) st.textContent = 'typing…';
      if (p.id !== 'whatsapp' && p.id !== 'telegram') dots = addMsg('in', `${p.id === 'messenger' ? avatar(p, 'mini') : ''}<div class="bub dots"><i></i><i></i><i></i></div>`);
      await sleep(ms);
      if (dots) dots.remove();
      if (st) st.textContent = p.id === 'whatsapp' ? 'online' : p.id === 'messenger' ? 'Active now' : p.id === 'telegram' ? 'bot' : 'Typically replies instantly';
    };
    const press = async label => {
      const btn = [...body.querySelectorAll('[data-opt]')].reverse().find(b => b.dataset.opt === label);
      if (btn) { btn.classList.add('press'); await sleep(450); }
      body.querySelectorAll('.cm-quick').forEach(q => q.remove());
      lastOut = addMsg('out', `<div class="bub">${esc(label)}${meta('out')}</div>`);
    };

    await waitVisible(id); await sleep(700);
    for (const s of p.steps) {
      if (!alive()) return;
      await waitVisible(id);
      if (s.u) { await userSay(s.u); if (s.tag != null) setTag(s.tag ? tg2 : tg1, p.tags[s.tag]); await sleep(300); }
      else if (s.tap) { await sleep(900); await press(s.tap); await sleep(300); }
      else if (s.b) {
        await botTyping(Math.min(2200, 700 + s.b.length * 18));
        if (!alive()) return;
        const av = p.id === 'messenger' ? avatar(p, 'mini') : '';
        let extra = '';
        if (s.btns) extra = `<div class="wa-btns">${s.btns.map(b => `<span data-opt="${esc(b)}">${esc(b)}</span>`).join('')}</div>`;
        if (s.kb) extra = `<div class="tg-kb">${s.kb.map(r => `<div>${r.map(b => `<span data-opt="${esc(b)}">${esc(b)}</span>`).join('')}</div>`).join('')}</div>`;
        let inner = `<div class="bub">${esc(s.b)}${meta('in')}</div>`;
        if (s.card) inner += `<div class="ig-card"><small>${esc(s.card.k)}</small><b>${esc(s.card.t)}</b><span>${esc(s.card.s)}</span></div>`;
        if (s.listing) inner += `<div class="ms-card"><div class="ms-img"><span>🏡</span></div><div class="ms-tx"><b>${esc(s.listing.t)}</b><small>${esc(s.listing.s)}</small></div><span class="ms-btn">${esc(s.listing.btn)}</span></div>`;
        addMsg('in', `${av}<div class="col">${inner}${extra}</div>`);
        if (s.quick) addMsg('quick-row', `<div class="cm-quick ms-q">${s.quick.map(q => `<span data-opt="${esc(q)}">${esc(q)}</span>`).join('')}</div>`);
        if (s.chips) addMsg('quick-row', `<div class="cm-quick web-q">${s.chips.map(q => `<span data-opt="${esc(q)}">${esc(q)}</span>`).join('')}</div>`);
        if (s.tag != null) setTag(s.tag ? tg2 : tg1, p.tags[s.tag]);
        await sleep(600);
      }
    }
    if (reduce) return;
    await sleep(4200);
    if (alive()) play((cur + 1) % P.length);
  }

  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !started) { started = true; play(0); } }, { threshold: .25 }).observe(root);
  if (reduce) { started = true; play(0); }
})();

// NIMBUS · 交互脚本（无依赖）
(() => {
  // 静态托管（GitHub Pages / OSS 等）没有后端时，填上邮箱就会把表单转成 mailto
  const FALLBACK_MAIL = '';

  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('mobileMenu');

  /* ---------- 导航：滚过首屏变白 ---------- */
  const onScroll = () => {
    const solid = window.scrollY > window.innerHeight * 0.55;
    nav.classList.toggle('solid', solid);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ---------- 移动端菜单 ---------- */
  const closeMenu = () => {
    mobile.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger?.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    if (open) nav.classList.add('solid');
    else onScroll();
  });
  mobile?.addEventListener('click', (e) => { if (e.target.tagName === 'A') closeMenu(); });

  /* ---------- 入场动画 ---------- */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, i) => {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = `${Math.min(i * 70, 240)}ms`;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 年份 ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- 订阅表单 ---------- */
  const form = document.getElementById('signup');
  const note = document.getElementById('formNote');
  const btn = document.getElementById('submitBtn');

  const say = (msg, kind = '') => {
    if (!note) return;
    note.textContent = msg;
    note.className = `form-note ${kind}`;
  };

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return say('邮箱格式看起来不对，检查一下？', 'err');

    btn.disabled = true;
    say('正在提交…');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, site: 'NIMBUS X Pro 首发通知' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      say(data.message || '订阅成功，首发通知会第一时间发到你邮箱。', 'ok');
      form.reset();
    } catch (err) {
      if (FALLBACK_MAIL) {
        const sub = encodeURIComponent('NIMBUS 首发通知订阅');
        const body = encodeURIComponent(`邮箱: ${email}\n时间: ${new Date().toLocaleString()}`);
        location.href = `mailto:${FALLBACK_MAIL}?subject=${sub}&body=${body}`;
        say('已打开邮件客户端，直接发送即完成订阅。', 'ok');
      } else {
        say('这个版本是纯静态托管，没有表单接口 —— 换成 Formspree 或用 Cloudflare 版即可。', 'err');
      }
      console.warn('[contact]', err);
    } finally {
      btn.disabled = false;
    }
  });
})();

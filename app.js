// Nimbus landing · 交互脚本（无依赖）
(() => {
  // 静态托管（GitHub Pages / OSS 等）没有后端时，填上邮箱就会把表单转成 mailto
  const FALLBACK_MAIL = '';
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const links = document.getElementById('links');

  // 滚动后导航加毛玻璃
  const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 8);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // 移动端菜单
  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  // 入场动画
  const targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = `${Math.min(i * 60, 180)}ms`;
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('in'));
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  // 表单：优先打 /api/contact（Worker 接口），无接口时退化为本地提示
  const form = document.getElementById('signup');
  const note = document.getElementById('formNote');
  const btn = document.getElementById('submitBtn');

  const say = (msg, kind = '') => {
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
        body: JSON.stringify({ email, site: form.site.value.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      say(data.message || '收到了，我们会尽快联系你。', 'ok');
      form.reset();
    } catch (err) {
      // 静态托管（GitHub Pages 等）没有后端：填了 FALLBACK_MAIL 就转邮件
      if (FALLBACK_MAIL) {
        const sub = encodeURIComponent('来自 nimbus 站点的新订阅');
        const body = encodeURIComponent(`邮箱: ${email}\n想部署: ${form.site.value.trim()}\n时间: ${new Date().toLocaleString()}`);
        location.href = `mailto:${FALLBACK_MAIL}?subject=${sub}&body=${body}`;
        say('已打开邮件客户端，直接发送就完成订阅。', 'ok');
      } else {
        say('这个版本是纯静态托管，没有表单接口。要收订阅换成 Formspree，或用 Cloudflare 版自带 /api/contact。', 'err');
      }
      console.warn('[contact]', err);
    } finally {
      btn.disabled = false;
    }
  });
})();

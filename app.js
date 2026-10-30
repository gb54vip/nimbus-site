// Nimbus landing · 交互脚本（无依赖）
(() => {
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
      say('提交没成功（接口未部署或网络异常）。可以直接跑 nimbus deploy 自己上线。', 'err');
      console.warn('[contact]', err);
    } finally {
      btn.disabled = false;
    }
  });
})();

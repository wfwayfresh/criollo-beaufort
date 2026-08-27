/* CRIOLLO — interactions */
(function () {
  'use strict';

  /* sticky header */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var onScroll = function () {
      hdr.classList.toggle('solid', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* mobile drawer */
  var burger = document.querySelector('.burger');
  var drawer = document.querySelector('.drawer');
  if (burger && drawer) {
    var setOpen = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* scroll reveal */
  var rv = document.querySelectorAll('.rv');
  if (rv.length) {
    if (!('IntersectionObserver' in window)) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var el = en.target;
            var d = parseInt(el.dataset.delay || '0', 10);
            setTimeout(function () { el.classList.add('in'); }, d);
            io.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }

  /* gallery lightbox */
  var figs = Array.prototype.slice.call(document.querySelectorAll('.gal figure'));
  var lb = document.querySelector('.lb');
  if (figs.length && lb) {
    var lbImg = lb.querySelector('img');
    var i = 0;
    var srcs = figs.map(function (f) {
      var im = f.querySelector('img');
      return { src: im.dataset.full || im.currentSrc || im.src, alt: im.alt };
    });
    var show = function (n) {
      i = (n + srcs.length) % srcs.length;
      lbImg.src = srcs[i].src;
      lbImg.alt = srcs[i].alt;
    };
    var open = function (n) {
      show(n);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    };
    figs.forEach(function (f, n) {
      f.addEventListener('click', function () { open(n); });
    });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
    lb.querySelector('.nx').addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
  }

  /* demo-only forms */
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = f.querySelector('[type="submit"]');
      if (!b) return;
      var t = b.textContent;
      b.textContent = 'Demo only — not sent';
      b.disabled = true;
      setTimeout(function () { b.textContent = t; b.disabled = false; }, 2600);
    });
  });
})();

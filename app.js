(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // rok w stopce
  $$('.rok').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  // menu mobilne i wyszukiwarka
  var panel = $('#panel'), burger = $('.burger'), szukaj = $('#szukaj'), sBtn = $('.szukaj-btn'), q = $('#q');
  function closeAll() {
    panel.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
    szukaj.classList.remove('open'); sBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    var open = !panel.classList.contains('open'); closeAll();
    if (open) { panel.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  });
  sBtn.addEventListener('click', function () {
    var open = !szukaj.classList.contains('open'); closeAll();
    if (open) { szukaj.classList.add('open'); sBtn.setAttribute('aria-expanded', 'true'); q.focus(); szukajWyniki(); }
  });
  $$('#panel a').forEach(function (a) { a.addEventListener('click', closeAll); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  // indeks wyszukiwania z treści strony
  var idx = [], seen = {};
  function dodaj(t, href, kat, podglad) {
    t = t.replace(/\s+/g, ' ').trim(); if (!t || seen[t.toLowerCase()]) return;
    seen[t.toLowerCase()] = 1; idx.push({ t: t, href: href, kat: kat, p: podglad });
  }
  dodaj('Koronka do Miłosierdzia Bożego', 'koronka.html', 'Modlitwy', false);
  $$('.lista-modl a').forEach(function (a) { dodaj(a.textContent, '#', 'Modlitwy', true); });
  $$('.wpis a').forEach(function (a) { dodaj($('strong', a).textContent, '#', 'Dziś', true); });
  $$('.dzien li a').forEach(function (a) { if (a.querySelector('img')) dodaj(a.textContent, '#', 'Kalendarz', true); });
  $$('.dzial').forEach(function (d) { var g = $('summary', d).textContent; $$('a', d).forEach(function (a) { dodaj(a.textContent, '#', g, true); }); });
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); };
  var wyn = $('#wyniki');
  function szukajWyniki() {
    var v = norm(q.value.trim());
    if (!v) { wyn.innerHTML = ''; return; }
    var r = idx.filter(function (x) { return norm(x.t).indexOf(v) > -1; }).slice(0, 12);
    wyn.innerHTML = r.length ? r.map(function (x, i) {
      return '<li><a href="' + x.href + '" data-i="' + i + '"' + (x.p ? ' data-podglad' : '') + '>' + x.t.replace(/</g, '&lt;') + '<small>' + x.kat + '</small></a></li>';
    }).join('') : '<li class="brak">Brak wyników dla tej frazy.</li>';
  }
  q.addEventListener('input', szukajWyniki);

  // toast dla linków, których nie ma w podglądzie
  var toast = $('#toast'), tt;
  function pokaz(html) {
    toast.innerHTML = html; toast.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('on'); }, 3800);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-podglad]');
    if (!a) return;
    e.preventDefault(); closeAll();
    pokaz('W podglądzie otwiera się przykładowa podstrona: <a href="koronka.html">Koronka do Miłosierdzia Bożego</a>');
  });

  // działy: na telefonie zwinięte, na komputerze rozwinięte
  var mq = window.matchMedia('(min-width:760px)');
  function dz() { $$('.dzial').forEach(function (d) { d.open = mq.matches; }); }
  dz(); if (mq.addEventListener) mq.addEventListener('change', dz);
  $$('.dzial summary').forEach(function (s) { s.addEventListener('click', function (e) { if (mq.matches) e.preventDefault(); }); });

  // karuzela dni: palec (natywnie), mysz (przeciąganie), strzałki, kropki
  var dni = $('.dni');
  if (dni) {
    var karty = $$('.dzien', dni), kropki = $('.kropki'), prev = $('.strz .prev'), next = $('.strz .next');
    karty.forEach(function () { kropki.appendChild(document.createElement('i')); });
    var krok = function () { return karty[0].getBoundingClientRect().width + 16; };
    function stan() {
      var max = dni.scrollWidth - dni.clientWidth - 2;
      if (prev) { prev.disabled = dni.scrollLeft < 2; next.disabled = dni.scrollLeft >= max; }
      var i = Math.round(dni.scrollLeft / krok());
      $$('i', kropki).forEach(function (k, j) { k.classList.toggle('on', j === i); });
    }
    dni.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    if (prev) {
      prev.addEventListener('click', function () { dni.scrollBy({ left: -krok(), behavior: 'smooth' }); });
      next.addEventListener('click', function () { dni.scrollBy({ left: krok(), behavior: 'smooth' }); });
    }
    var down = false, sx = 0, sl = 0, moved = false;
    dni.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = dni.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; dni.classList.add('drag'); }
      if (moved) dni.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        var i = Math.round(dni.scrollLeft / krok());
        dni.classList.remove('drag');
        dni.scrollTo({ left: i * krok(), behavior: 'smooth' });
        setTimeout(function () { moved = false; }, 0);
      }
    });
    dni.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    dni.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { dni.scrollBy({ left: krok(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { dni.scrollBy({ left: -krok(), behavior: 'smooth' }); e.preventDefault(); }
    });
    stan(); window.addEventListener('resize', stan);
  }

  // formularz pokazowy
  var f = $('#form-int');
  if (f) f.addEventListener('submit', function (e) { e.preventDefault(); $('#form-ok').style.display = 'block'; });

  // aktywna pozycja menu = sekcja na ekranie (tylko strona główna)
  var linki = $$('.nav a[href^="#"], #panel a[href^="#"]');
  if (linki.length && 'IntersectionObserver' in window) {
    var ust = function (id) {
      linki.forEach(function (a) { if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) ust(x.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['dzis', 'modlitwy', 'kalendarz', 'dzialy', 'intencje', 'o-stronie'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    var hero = $('.hero');
    if (hero) new IntersectionObserver(function (en) { if (en[0].isIntersecting) ust('-'); }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
  }
})();

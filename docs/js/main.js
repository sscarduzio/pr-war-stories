(function () {
  // ===== GitHub star count =====
  var fmt = function (n) {
    return n >= 1000
      ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k'
      : String(n);
  };
  var starEl = document.querySelector('#starCount .btn-count-num');
  if (starEl) {
    fetch('https://api.github.com/repos/sscarduzio/pr-war-stories', {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.stargazers_count === 'number') {
          starEl.textContent = fmt(d.stargazers_count);
        }
      })
      .catch(function () {});
  }

  // ===== Copy-install button (wired via data-copy-target) =====
  var copyBtns = document.querySelectorAll('[data-copy-target]');
  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('data-copy-target'));
      if (!target) return;
      var text = target.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        // Fallback for very old browsers
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      }
      var original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = original; }, 2000);
    });
  });

  // ===== Mobile hamburger toggle =====
  var toggle = document.querySelector('.topnav-toggle');
  var sections = document.querySelector('.topnav-sections');
  if (toggle && sections) {
    toggle.addEventListener('click', function () {
      var isOpen = sections.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close menu when a link inside it is clicked
    sections.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        sections.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== Scroll-spy: highlight the active section's nav link =====
  var navLinks = document.querySelectorAll('.topnav-sections a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var linkById = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) linkById[id] = a;
    });

    var currentlyActive = null;
    var setActive = function (id) {
      if (currentlyActive === id) return;
      currentlyActive = id;
      navLinks.forEach(function (a) { a.classList.remove('active'); });
      if (linkById[id]) linkById[id].classList.add('active');
    };

    // Pick the section closest to the top that is intersecting.
    var visible = new Map();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.set(entry.target.id, entry.intersectionRatio);
        } else {
          visible.delete(entry.target.id);
        }
      });
      if (visible.size > 0) {
        // Among visible, pick the one with the greatest intersection ratio;
        // ties broken by DOM order.
        var best = null;
        visible.forEach(function (ratio, id) {
          if (!best || ratio > best.ratio) best = { id: id, ratio: ratio };
        });
        if (best) setActive(best.id);
      }
    }, {
      rootMargin: '-80px 0px -55% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    Object.keys(linkById).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
})();

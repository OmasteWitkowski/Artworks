/* The Gallery Walk: one hall per collection, its best pieces hung on a lit wall. Choose a piece, see it in one of the
   rooms (wall.js), and keep it for that room. A visitor's picks stay in their own browser (localStorage), nowhere else.
   <div class="faasc-walk" data-walk='{"halls":[{name,slug,intro,url,items:[{id,title,img,story,buy,max_in,ar,why}]}],"rooms":[...],"cta":"...","mine":"#selector"}'></div>
   The page gives the walk its heading; "mine" names where "Your rooms" is shown (otherwise below the walk). */
(function () {
  function lead(t) { t = String(t || '').trim(); var m = t.match(/^.{20,220}?[.!?](\s|$)/); return m ? m[0].trim() : t.slice(0, 200); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var KEY = 'walk-picks';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function store(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-walk')), halls = cfg.halls || [], rooms = cfg.rooms || [], at = 0, picks = load();
    var byId = {}; halls.forEach(function (h) { h.items.forEach(function (it) { byId[it.id] = it; }); });
    var roomName = function (slug) { var r = rooms.filter(function (x) { return x.slug === slug; })[0]; return r ? r.name : slug; };

    // each visit hangs every hall in a new order, so each hall opens on a different piece every time
    halls.forEach(function (h) { for (var i = h.items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = h.items[i]; h.items[i] = h.items[j]; h.items[j] = t; } });
    root.innerHTML = '<div class="walk-hall"><div class="walk-sign" aria-live="polite"></div>' +
      '<button type="button" class="walk-go walk-prev" aria-label="Previous piece">&#8249;</button><button type="button" class="walk-go walk-next" aria-label="Next piece">&#8250;</button>' +
      '<div class="walk-wall" tabindex="0" aria-label="The wall of this hall"></div>' +
      (cfg.head ? '<header class="g-head walk-head2"><h2 class="g-rule"><span>' + esc(cfg.head.label) + '</span></h2><p class="g-cap">' + esc(cfg.head.text) + '</p></header>' : '') +
      '<nav class="walk-halls" aria-label="' + esc(cfg.head ? cfg.head.label : 'Halls') + '">' + halls.map(function (h, i) { return '<button type="button" data-h="' + i + '">' + esc(h.name) + '</button>'; }).join('') + '</nav><div class="walk-floor"></div></div>';
    var wall = root.querySelector('.walk-wall'), sign = root.querySelector('.walk-sign');
    var mine = (cfg.mine && document.querySelector(cfg.mine)) || root.appendChild(document.createElement('div'));
    mine.classList.add('walk-mine'); mine.setAttribute('aria-live', 'polite');

    function hall(i) {
      at = (i + halls.length) % halls.length;
      var h = halls[at];
      var label = cfg.head ? cfg.head.label : 'Hall ' + (at + 1) + ' of ' + halls.length;
      sign.textContent = label + ': ' + h.name;      // read out when the collection changes; the title itself lies over each picture
      wall.innerHTML = h.items.map(function (it) {
        return '<figure class="walk-piece" style="--ar:' + (it.ar || 1.33) + '"><button type="button" class="walk-art" data-id="' + esc(it.id) + '" aria-label="' + esc(it.title) + ': see it in a room">' +
          '<img src="' + esc(it.img) + '" alt="' + esc(it.title) + '" loading="lazy">' +
          '<span class="walk-over" aria-hidden="true"><small>' + esc(h.name) + '</small><b>' + esc(it.title) + '</b>' + (lead(it.why) ? '<span>' + esc(lead(it.why)) + '</span>' : '') + '</span></button></figure>';      // the collection, then this piece: its title and the first line of its description      // the piece's name is in its button's label; no placard under the picture
      }).join('') + '<a class="walk-more" href="' + esc(h.url) + '"><span>Every piece in this hall</span>&#8250;</a>';
      wall.scrollLeft = 0;
      [].forEach.call(root.querySelectorAll('[data-h]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-h') === at ? 'true' : 'false'); });
      [].forEach.call(wall.querySelectorAll('.walk-art'), function (b) { b.onclick = function () { open(byId[b.getAttribute('data-id')], null, h.items); }; });
    }

    // a piece taken off the wall: hang it in one of the rooms, and keep it for that room. The arrows walk on along
    // the same wall (or the same room of yours), keeping the room you chose.
    function open(it, room, list, back) {
      back = back || document.activeElement; list = list || [it];
      var rs = rooms.length ? rooms : [{ slug: 'wall', name: 'A wall', kind: 'none' }], k = Math.max(0, list.indexOf(it));
      var ri = Math.max(0, rs.map(function (r) { return r.slug; }).indexOf(room));
      var ov = document.createElement('div'); ov.className = 'walk-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', it.title);
      ov.innerHTML = (list.length > 1 ? '<button type="button" class="walk-step walk-step-p" aria-label="Previous piece">&#8249;</button><button type="button" class="walk-step walk-step-n" aria-label="Next piece">&#8250;</button>' : '') +
        '<div class="walk-card"><button type="button" class="walk-x" aria-label="Close">&times;</button>' +
        '<div class="walk-card-room"></div><div class="walk-card-text"><p class="walk-eyebrow">' + esc(halls[at] ? halls[at].name : '') + (list.length > 1 ? '<span class="walk-count"> · ' + (k + 1) + ' of ' + list.length + '</span>' : '') + '</p><h2>' + esc(it.title) + '</h2>' +
        (it.why ? '<p>' + esc(it.why) + '</p>' : '') +
        (rooms.length ? '<p class="walk-ask">Hang it in:</p><div class="walk-rooms">' + rs.map(function (r, i) { return '<button type="button" data-r="' + i + '">' + esc(r.name) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="walk-acts">' + (rooms.length ? '<button type="button" class="walk-keep"></button>' : '') +
        (it.story ? '<a href="' + esc(it.story) + '">Its story</a>' : '') + (it.buy ? '<a class="walk-buy" href="' + esc(it.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta || 'Buy on Fine Art America') + '</a>' : '') + '</div></div></div>';
      document.body.appendChild(ov);
      var host = ov.querySelector('.walk-card-room'), keep = ov.querySelector('.walk-keep');
      function draw() {
        window.FAASCWall.render(host, { piece: it, rooms: [rs[ri]], room: rs[ri].slug });
        [].forEach.call(ov.querySelectorAll('[data-r]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-r') === ri ? 'true' : 'false'); });
        if (keep) { var has = (picks[rs[ri].slug] || []).indexOf(it.id) >= 0; keep.textContent = has ? 'Kept for the ' + rs[ri].name.toLowerCase() + ' ✓' : 'Keep it for the ' + rs[ri].name.toLowerCase(); keep.setAttribute('aria-pressed', has ? 'true' : 'false'); }
      }
      [].forEach.call(ov.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { ri = +b.getAttribute('data-r'); draw(); }; });
      if (keep) keep.onclick = function () {
        var s = rs[ri].slug, l = picks[s] || [], i = l.indexOf(it.id);
        if (i >= 0) l.splice(i, 1); else l.push(it.id);
        picks[s] = l; if (!l.length) delete picks[s]; store(picks); draw(); yours();
      };
      function close() { document.removeEventListener('keydown', key); ov.remove(); if (back && back.focus) back.focus(); }
      function step(d) { document.removeEventListener('keydown', key); ov.remove(); open(list[(k + d + list.length) % list.length], rs[ri].slug, list, back);
        var b = document.querySelector('.walk-ov .walk-step-' + (d > 0 ? 'n' : 'p')); if (b) b.focus(); }
      function key(ev) { if (ev.key === 'Escape') close();
        else if (list.length > 1 && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !/^(INPUT|TEXTAREA|SELECT)$/.test((ev.target || {}).tagName || '')) { ev.preventDefault(); step(ev.key === 'ArrowRight' ? 1 : -1); } }
      document.addEventListener('keydown', key);
      ov.onclick = function (ev) { if (ev.target === ov) close(); };
      if (list.length > 1) {
        ov.querySelector('.walk-step-p').onclick = function () { step(-1); }; ov.querySelector('.walk-step-n').onclick = function () { step(1); };
        var x0 = null; ov.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
        ov.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
          if (Math.abs(dx) > 70 && !(e.target.closest && e.target.closest('.fw-strip, .fw-pick, .walk-rooms'))) step(dx < 0 ? 1 : -1); }, { passive: true });
      }
      ov.querySelector('.walk-x').onclick = close; ov.querySelector('.walk-x').focus();
      draw();
    }

    // the visitor's rooms and the pieces they kept for each
    function yours() {
      var slugs = Object.keys(picks).filter(function (s) { return (picks[s] || []).some(function (id) { return byId[id]; }); });
      if (!slugs.length) { mine.innerHTML = rooms.length ? '<p class="walk-empty">Your rooms are empty so far. Choose a piece on the wall and keep it for a room: it waits here.</p>' : ''; return; }
      mine.innerHTML = slugs.map(function (s) {
        var its = picks[s].filter(function (id) { return byId[id]; });
        return '<div class="walk-myroom"><h3>' + esc(roomName(s)) + ' <small>' + its.length + (its.length === 1 ? ' piece' : ' pieces') + '</small></h3><div class="walk-picks">' + its.map(function (id) {
          var it = byId[id];
          return '<div class="walk-pick"><button type="button" data-see="' + esc(id) + '" data-room="' + esc(s) + '" aria-label="See ' + esc(it.title) + ' in the ' + esc(roomName(s)) + '"><img src="' + esc(it.img) + '" alt=""></button>' +
            '<span>' + esc(it.title) + '</span><span class="walk-pick-acts">' + (it.buy ? '<a href="' + esc(it.buy) + '" target="_blank" rel="noopener">Buy</a>' : '') +
            '<button type="button" data-drop="' + esc(id) + '" data-room="' + esc(s) + '">Remove</button></span></div>';
        }).join('') + '</div></div>';
      }).join('');
      [].forEach.call(mine.querySelectorAll('[data-see]'), function (b) { b.onclick = function () { var s = b.getAttribute('data-room');
        open(byId[b.getAttribute('data-see')], s, (picks[s] || []).filter(function (id) { return byId[id]; }).map(function (id) { return byId[id]; })); }; });
      [].forEach.call(mine.querySelectorAll('[data-drop]'), function (b) {
        b.onclick = function () { var s = b.getAttribute('data-room'), l = picks[s] || []; l.splice(l.indexOf(b.getAttribute('data-drop')), 1); if (!l.length) delete picks[s]; store(picks); yours(); };
      });
    }

    // the arrows step one piece at a time; past the last piece of a hall they walk on into the next hall
    function step(d) {
      var w = wall.clientWidth, end = wall.scrollWidth - w - 4;
      if (d > 0 && wall.scrollLeft >= end) { hall(at + 1); return; }
      if (d < 0 && wall.scrollLeft <= 4) { hall(at - 1); wall.scrollLeft = wall.scrollWidth; return; }
      wall.scrollBy({ left: d * w, behavior: 'smooth' });
    }
    root.querySelector('.walk-prev').onclick = function () { step(-1); };
    root.querySelector('.walk-next').onclick = function () { step(1); };
    [].forEach.call(root.querySelectorAll('[data-h]'), function (b) { b.onclick = function () { hall(+b.getAttribute('data-h')); }; });
    wall.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight') { ev.preventDefault(); step(1); } if (ev.key === 'ArrowLeft') { ev.preventDefault(); step(-1); } });
    if (!halls.length) { root.innerHTML = '<p>The gallery opens as soon as the first artworks are published.</p>'; return; }
    hall(0); yours();
    // a slide of the entrance opens its hall here, at the first piece
    document.addEventListener('faasc-walk-hall', function (ev) { var i = +ev.detail; if (i >= 0 && i < halls.length) { hall(i); wall.scrollLeft = 0; var first = wall.querySelector('.walk-art'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 600); } });
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-walk[data-walk]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

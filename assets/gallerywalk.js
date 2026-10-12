/* The Gallery Walk: one hall per collection, its best pieces hung on a lit wall. Choose a piece, see it in one of the
   rooms (wall.js), and keep it for that room. A visitor's picks stay in their own browser (localStorage), nowhere else.
   <div class="faasc-walk" data-walk='{"halls":[{name,slug,intro,url,items:[{id,title,img,story,buy,max_in,ar,why}]}],"rooms":[...],"cta":"..."}'></div> */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var KEY = 'walk-picks';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function store(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-walk')), halls = cfg.halls || [], rooms = cfg.rooms || [], at = 0, picks = load();
    var byId = {}; halls.forEach(function (h) { h.items.forEach(function (it) { byId[it.id] = it; }); });
    var roomName = function (slug) { var r = rooms.filter(function (x) { return x.slug === slug; })[0]; return r ? r.name : slug; };

    root.innerHTML = '<div class="walk-head"><p class="walk-eyebrow">The Gallery</p><h1>Walk the gallery</h1>' +
      '<p>' + halls.length + ' halls, one for each collection. Choose a piece, see it in one of your rooms at its real size, and keep the ones you love for the room they belong in.</p>' +
      '<nav class="walk-halls" aria-label="Halls">' + halls.map(function (h, i) { return '<button type="button" data-h="' + i + '">' + esc(h.name) + '</button>'; }).join('') + '</nav></div>' +
      '<div class="walk-hall"><div class="walk-sign" aria-live="polite"></div>' +
      '<button type="button" class="walk-go walk-prev" aria-label="Previous hall">&#8249;</button><button type="button" class="walk-go walk-next" aria-label="Next hall">&#8250;</button>' +
      '<div class="walk-wall" tabindex="0" aria-label="The wall of this hall"></div><div class="walk-floor"></div></div>' +
      '<section class="walk-mine" aria-live="polite"></section>';
    var wall = root.querySelector('.walk-wall'), sign = root.querySelector('.walk-sign'), mine = root.querySelector('.walk-mine');

    function hall(i) {
      at = (i + halls.length) % halls.length;
      var h = halls[at];
      sign.innerHTML = '<span class="walk-plaque">Hall ' + (at + 1) + ' of ' + halls.length + '</span><b>' + esc(h.name) + '</b><span>' + esc(h.intro || '') + '</span>';
      wall.innerHTML = h.items.map(function (it) {
        return '<figure class="walk-piece" style="--ar:' + (it.ar || 1.33) + '"><button type="button" class="walk-art" data-id="' + esc(it.id) + '" aria-label="' + esc(it.title) + ': see it in a room">' +
          '<img src="' + esc(it.img) + '" alt="' + esc(it.title) + '" loading="lazy"></button><figcaption class="walk-label"><b>' + esc(it.title) + '</b><span>Omaste Witkowski</span></figcaption></figure>';
      }).join('') + '<a class="walk-more" href="' + esc(h.url) + '"><span>Every piece in this hall</span>&#8250;</a>';
      wall.scrollLeft = 0;
      [].forEach.call(root.querySelectorAll('[data-h]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-h') === at ? 'true' : 'false'); });
      [].forEach.call(wall.querySelectorAll('.walk-art'), function (b) { b.onclick = function () { open(byId[b.getAttribute('data-id')]); }; });
    }

    // a piece taken off the wall: hang it in one of the rooms, and keep it for that room
    function open(it, room) {
      var back = document.activeElement, rs = rooms.length ? rooms : [{ slug: 'wall', name: 'A wall', kind: 'none' }];
      var ri = Math.max(0, rs.map(function (r) { return r.slug; }).indexOf(room));
      var ov = document.createElement('div'); ov.className = 'walk-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', it.title);
      ov.innerHTML = '<div class="walk-card"><button type="button" class="walk-x" aria-label="Close">&times;</button>' +
        '<div class="walk-card-room"></div><div class="walk-card-text"><p class="walk-eyebrow">' + esc(halls[at] ? halls[at].name : '') + '</p><h2>' + esc(it.title) + '</h2>' +
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
      function key(ev) { if (ev.key === 'Escape') close(); }
      document.addEventListener('keydown', key);
      ov.onclick = function (ev) { if (ev.target === ov) close(); };
      ov.querySelector('.walk-x').onclick = close; ov.querySelector('.walk-x').focus();
      draw();
    }

    // the visitor's rooms and the pieces they kept for each
    function yours() {
      var slugs = Object.keys(picks).filter(function (s) { return (picks[s] || []).some(function (id) { return byId[id]; }); });
      if (!slugs.length) { mine.innerHTML = rooms.length ? '<p class="walk-empty">Your rooms are empty so far. Choose a piece on the wall and keep it for a room: it waits here.</p>' : ''; return; }
      mine.innerHTML = '<header><h2>Your rooms</h2><span>The pieces you kept, room by room. They stay in this browser only.</span></header>' + slugs.map(function (s) {
        var its = picks[s].filter(function (id) { return byId[id]; });
        return '<div class="walk-myroom"><h3>' + esc(roomName(s)) + ' <small>' + its.length + (its.length === 1 ? ' piece' : ' pieces') + '</small></h3><div class="walk-picks">' + its.map(function (id) {
          var it = byId[id];
          return '<div class="walk-pick"><button type="button" data-see="' + esc(id) + '" data-room="' + esc(s) + '" aria-label="See ' + esc(it.title) + ' in the ' + esc(roomName(s)) + '"><img src="' + esc(it.img) + '" alt=""></button>' +
            '<span>' + esc(it.title) + '</span><span class="walk-pick-acts">' + (it.buy ? '<a href="' + esc(it.buy) + '" target="_blank" rel="noopener">Buy</a>' : '') +
            '<button type="button" data-drop="' + esc(id) + '" data-room="' + esc(s) + '">Remove</button></span></div>';
        }).join('') + '</div></div>';
      }).join('');
      [].forEach.call(mine.querySelectorAll('[data-see]'), function (b) { b.onclick = function () { open(byId[b.getAttribute('data-see')], b.getAttribute('data-room')); }; });
      [].forEach.call(mine.querySelectorAll('[data-drop]'), function (b) {
        b.onclick = function () { var s = b.getAttribute('data-room'), l = picks[s] || []; l.splice(l.indexOf(b.getAttribute('data-drop')), 1); if (!l.length) delete picks[s]; store(picks); yours(); };
      });
    }

    root.querySelector('.walk-prev').onclick = function () { hall(at - 1); };
    root.querySelector('.walk-next').onclick = function () { hall(at + 1); };
    [].forEach.call(root.querySelectorAll('[data-h]'), function (b) { b.onclick = function () { hall(+b.getAttribute('data-h')); }; });
    wall.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight') wall.scrollBy({ left: 300, behavior: 'smooth' }); if (ev.key === 'ArrowLeft') wall.scrollBy({ left: -300, behavior: 'smooth' }); });
    if (!halls.length) { root.innerHTML = '<p>The gallery opens as soon as the first artworks are published.</p>'; return; }
    hall(0); yours();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-walk[data-walk]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

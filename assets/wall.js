/* A piece on a wall, at true scale. No server, no AI.
   Each room is either a photo of a real room, measured so we know how many inches the photo spans at the wall,
   or a drawn room 150 inches wide with furniture at its real width (an 84-inch sofa, a 64-inch queen headboard...).
   Use it inline:  <div class="faasc-wall" data-wall='{"piece":{...},"rooms":[...],"room":"bedroom"}'></div>
   or as a pop-up: FAASCWall.open({piece, rooms, room, cta}).
   piece = {title, img, max_in (largest good print, long side, 0 if unknown), story, buy}
   room  = {slug, name, kind, furniture, furniture_in, span_in, x, y, [img, ratio]} */
(function () {
  if (window.FAASCWall) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var W = 150, H = 106, CEIL = 96, FLOOR = H - CEIL;          // drawn room, inches: 8-foot ceiling plus a strip of floor
  // furniture height (inches) and the gap left above it before the art starts
  var FURN = { sofa: [32, 9], bed: [46, 9], sideboard: [34, 8], counter: [36, 18], desk: [30, 14], console: [32, 10], bench: [18, 22], none: [0, 0] };
  // each piece of furniture drawn from parts, in inches: [from its left edge, above the floor, width, height, colour, corner rounding]
  var LEG = '#3e2c1e', PARTS = {
    sofa: [[0, 16, 84, 16, '#6f7c76', '12px 12px 3px 3px'], [0, 0, 84, 18, '#7d8a84', '4px'], [-4, 0, 10, 24, '#66736d', '9px 9px 3px 3px'], [78, 0, 10, 24, '#66736d', '9px 9px 3px 3px']],
    bed: [[0, 0, 64, 46, '#8b6b4e', '10px 10px 0 0'], [-6, 0, 76, 22, '#ebe6dc', '6px 6px 2px 2px'], [5, 21, 25, 8, '#f8f5ef', '8px'], [34, 21, 25, 8, '#f8f5ef', '8px']],
    sideboard: [[0, 6, 66, 27, '#6e4f36', '2px'], [-1, 32, 68, 2, '#5b412c', '1px'], [3, 0, 2, 6, LEG], [61, 0, 2, 6, LEG], [16.4, 9, .4, 21, '#4f3725'], [32.8, 9, .4, 21, '#4f3725'], [49.2, 9, .4, 21, '#4f3725']],
    counter: [[0, 0, 96, 34, '#ebe5d9'], [0, 0, 96, 4, '#cfc8ba'], [24, 4, .4, 30, '#c4bcad'], [48, 4, .4, 30, '#c4bcad'], [72, 4, .4, 30, '#c4bcad'], [-1, 34, 98, 2, '#3d3c3a', '1px']],
    desk: [[0, 28, 60, 2, '#5a4632', '1px'], [2, 0, 2, 28, LEG], [56, 0, 2, 28, LEG], [36, 20, 20, 8, '#6a5440', '1px']],
    console: [[0, 30, 42, 2, '#5a4632', '1px'], [1.5, 0, 1.5, 30, LEG], [39, 0, 1.5, 30, LEG], [1.5, 6, 39, 1.5, '#5a4632'], [2, 32, 4, 7, '#3d6f73', '3px 3px 1px 1px']],
    bench: [[0, 14, 72, 4, '#6b5440', '2px'], [3, 0, 2.5, 14, LEG], [66.5, 0, 2.5, 14, LEG]]
  };
  function furniture(kind, fw) {
    var left = W / 2 - fw / 2;
    return (PARTS[kind] || []).map(function (q) {
      return '<i style="left:' + ((left + q[0]) / W * 100) + '%;bottom:' + ((FLOOR + q[1]) / H * 100) + '%;width:' + (q[2] / W * 100) + '%;height:' + (q[3] / H * 100) +
        '%;background:' + q[4] + (q[5] ? ';border-radius:' + q[5] : '') + '"></i>';
    }).join('');
  }
  var SIZES = [12, 16, 20, 24, 30, 36, 40, 48, 60, 72];
  var CSS = '.fw{font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#2a2520;text-align:center}' +
    '.fw-room{position:relative;width:100%;aspect-ratio:150/106;overflow:hidden;border-radius:3px;background:radial-gradient(ellipse 65% 75% at 50% 25%,#efeadf,#d3cdbf)}' +
    '.fw-photo{background:#ccc center/100% 100% no-repeat}' +
    '.fw-floor{position:absolute;left:0;right:0;bottom:0;height:' + (FLOOR / H * 100) + '%;background:linear-gradient(#8f6f4c,#6b4a2e)}' +
    '.fw-photo .fw-floor,.fw-photo .fw-f{display:none}' +
    '.fw-art{position:absolute;transform:translate(-50%,-50%);height:auto;max-width:none;box-shadow:0 8px 16px rgba(0,0,0,.35);outline:3px solid #1b1713;transition:width .3s,top .3s}' +
    '.fw-f{position:absolute;inset:0;pointer-events:none}.fw-f i{position:absolute;display:block}' +
    '.fw .fw-dim{margin:10px 0 6px;color:#6a6258;font:13.5px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}.fw .fw-dim b{color:#8a3a14}' +
    '.fw-pick{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;margin:0 0 8px;font-size:13.5px}' +
    '.fw-pick button{background:#fff;color:#2a2520;border:1px solid #c9c2b4;border-radius:999px;padding:6px 12px;cursor:pointer;font:inherit}' +
    '.fw-pick button[aria-pressed=true]{background:#2a2520;color:#fff;border-color:#2a2520}' +
    '.fw-ov{position:fixed;inset:0;background:rgba(15,13,11,.82);z-index:1000;display:grid;place-items:center;padding:16px;overflow:auto}' +
    '.fw-ovin{background:#fffdf8;max-width:880px;width:100%;padding:20px 22px 18px;border-radius:4px;position:relative}' +
    '.fw-ov h3{font:400 22px Georgia,serif;margin:0 34px 12px;color:#2a2520}' +
    '.fw-x{position:absolute;top:8px;right:10px;background:none;border:0;font-size:30px;line-height:1;cursor:pointer;color:#2a2520;padding:4px 8px}' +
    '.fw .fw-links{display:flex;gap:14px;justify-content:center;align-items:center;margin:10px 0 0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}.fw-links a{color:#8a4a1c}' +
    '.fw-buy{background:#8a4a1c;color:#fff!important;text-decoration:none;padding:6px 11px;border-radius:3px;font-weight:600}' +
    '@media(prefers-reduced-motion:reduce){.fw-art{transition:none}}';
  function style() {
    if (document.getElementById('fw-css')) return;
    var s = document.createElement('style'); s.id = 'fw-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  function sizesFor(p) {
    var l = SIZES.filter(function (s) { return !p.max_in || s <= p.max_in; });
    return l.length ? l : [Math.round(p.max_in) || 20];
  }

  /* Draw one piece into `host`. Returns nothing; the controls redraw in place. */
  function render(host, cfg) {
    style();
    var p = cfg.piece || {}, rooms = cfg.rooms || [], sizes = sizesFor(p), ratio = 0, chosen = false;
    var ri = Math.max(0, rooms.map(function (r) { return r.slug; }).indexOf(cfg.room));
    var size = sizes[Math.min(sizes.length - 1, 2)];
    host.innerHTML = '<div class="fw"><div class="fw-room"><div class="fw-floor"></div><div class="fw-f"></div>' +
      '<img class="fw-art" alt="' + esc(p.title) + (rooms.length ? ' on a wall' : '') + '"></div>' +
      '<p class="fw-dim" aria-live="polite"></p>' +
      (rooms.length > 1 ? '<div class="fw-pick" role="group" aria-label="Room"><span>Room:</span>' + rooms.map(function (r, i) { return '<button type="button" data-r="' + i + '">' + esc(r.name) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="fw-pick" role="group" aria-label="Size"><span>Size:</span>' + sizes.map(function (s) { return '<button type="button" data-s="' + s + '">' + s + '″</button>'; }).join('') + '</div>' +
      (cfg.links ? '<p class="fw-links">' + (p.story ? '<a href="' + esc(p.story) + '">Its story</a>' : '') + (p.buy ? '<a class="fw-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta || 'Buy on Fine Art America') + '</a>' : '') + '</p>' : '') + '</div>';
    var box = host.querySelector('.fw-room'), art = host.querySelector('.fw-art'), furn = host.querySelector('.fw-f');
    function room() { return rooms[ri] || { name: 'Wall', kind: 'none', span_in: W, x: 50, y: 42 }; }
    function artIn() { var r = ratio || 1.5; var w = r >= 1 ? size : size * r; return [w, w / r]; }
    // the size a designer would start with: about two-thirds the width of the furniture under it
    function sensible() {
      var r = room(), f = !r.img && r.furniture_in, best = sizes[0];
      sizes.forEach(function (s) { var w = (ratio || 1.5) >= 1 ? s : s * (ratio || 1.5); if (w <= (f ? f * 0.7 : 40)) best = s; });
      return best;
    }
    function draw() {
      var r = room(), d = artIn(), wIn = d[0], hIn = d[1], note = '';
      if (r.img) {
        var hSpan = r.span_in / (r.ratio || 1.5);
        box.className = 'fw-room fw-photo'; box.style.backgroundImage = 'url("' + r.img + '")'; box.style.aspectRatio = String(r.ratio || 1.5);
        art.style.width = (wIn / r.span_in * 100) + '%'; art.style.left = (r.x || 50) + '%'; art.style.top = (r.y || 40) + '%';
        if ((r.y || 40) / 100 * hSpan < hIn / 2) note = 'At this size it runs past the top of the photo.';
      } else {
        var k = FURN[r.kind] || FURN.none, fw = r.furniture_in || 0, top;
        box.className = 'fw-room'; box.style.backgroundImage = ''; box.style.aspectRatio = '';
        if (furn.getAttribute('data-k') !== r.kind + fw) { furn.innerHTML = fw ? furniture(r.kind, fw) : ''; furn.setAttribute('data-k', r.kind + fw); }
        // the art's centre, in inches from the top of the picture
        var centre = fw ? CEIL - (k[0] + k[1] + hIn / 2) : CEIL - 57;
        top = centre - hIn / 2;
        if (fw && top < 2) note = 'At this size it would not fit between the ' + r.furniture + ' and an 8-foot ceiling.';
        if (!fw && top < 2) { centre = hIn / 2 + 2; if (centre + hIn / 2 > CEIL) note = 'At this size it is taller than an 8-foot wall.'; }
        art.style.width = wIn / W * 100 + '%'; art.style.left = '50%'; art.style.top = centre / H * 100 + '%';
      }
      host.querySelector('.fw-dim').innerHTML = esc(Math.round(wIn) + ' × ' + Math.round(hIn) + ' inches') +
        (r.img ? '' : (r.furniture_in ? ' · the ' + esc(r.furniture) + ' is ' + r.furniture_in + ' inches wide' : '')) + (note ? '<br><b>' + esc(note) + '</b>' : '');
      [].forEach.call(host.querySelectorAll('[data-s]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-s') === size ? 'true' : 'false'); });
      [].forEach.call(host.querySelectorAll('[data-r]'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-r') === ri ? 'true' : 'false'); });
    }
    function loaded() { if (art.naturalWidth) { ratio = art.naturalWidth / art.naturalHeight; if (!chosen) size = sensible(); draw(); } }
    art.onload = loaded; art.src = p.img || '';
    [].forEach.call(host.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { size = +b.getAttribute('data-s'); chosen = true; draw(); }; });
    [].forEach.call(host.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { ri = +b.getAttribute('data-r'); if (!chosen) size = sensible(); draw(); }; });
    size = sensible(); draw(); loaded();
  }

  function open(cfg) {
    var back = document.activeElement, ov = document.createElement('div');
    ov.className = 'fw-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', (cfg.piece || {}).title + ' on a wall');
    ov.innerHTML = '<div class="fw-ovin"><button type="button" class="fw-x" aria-label="Close">×</button><h3>' + esc((cfg.piece || {}).title) + '</h3><div class="fw-host"></div></div>';
    document.body.appendChild(ov);
    render(ov.querySelector('.fw-host'), Object.assign({ links: true }, cfg));
    function close() { document.removeEventListener('keydown', key); ov.remove(); if (back && back.focus) back.focus(); }
    function key(ev) { if (ev.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    ov.onclick = function (ev) { if (ev.target === ov) close(); };
    ov.querySelector('.fw-x').onclick = close; ov.querySelector('.fw-x').focus();
  }

  function mount() {
    [].forEach.call(document.querySelectorAll('.faasc-wall[data-wall]'), function (el) {
      if (!el._fw) { el._fw = 1; render(el, JSON.parse(el.getAttribute('data-wall'))); }
    });
    // buttons that open the pop-up: <button data-wall-open='{"piece":..., "room":"bedroom"}'> with the rooms on the page's .faasc-rooms
    var shared = document.querySelector('[data-wall-rooms]'), rooms = shared ? JSON.parse(shared.getAttribute('data-wall-rooms')) : [];
    [].forEach.call(document.querySelectorAll('[data-wall-open]'), function (b) {
      b.onclick = function (ev) { ev.preventDefault(); var c = JSON.parse(b.getAttribute('data-wall-open')); open(Object.assign({ rooms: rooms }, c)); };
    });
  }
  window.FAASCWall = { render: render, open: open, mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

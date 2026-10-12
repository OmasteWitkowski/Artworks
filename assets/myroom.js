/* Your own room: a virtual interior, made in the visitor's browser. No server and no AI, and the photo is never uploaded.
   1. a photo of the wall with painter's tape where the art would go
   2. two clicks on the corners of the tape, and its size in inches: that gives the scale of the photo and the space to fill
   3. the subjects and colours they like (optional)
   4. five pieces that suit the shape and size of the space, each hung in their photo at real size (wall.js), and five more on request
   <div class="faasc-myroom" data-myroom='{"items":[...], "cta":"..."}'></div> */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function shapeOf(r) { return r >= 0.95 && r <= 1.05 ? 'square' : r >= 2 ? 'panoramic horizontal' : r <= 0.5 ? 'panoramic vertical' : r > 1 ? 'horizontal' : 'vertical'; }
  var NEAR = { 'horizontal': ['panoramic horizontal', 'square'], 'panoramic horizontal': ['horizontal'], 'vertical': ['panoramic vertical', 'square'], 'panoramic vertical': ['vertical'], 'square': ['horizontal', 'vertical'] };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-myroom')), ALL = cfg.items || [];
    var st = { img: '', ratio: 1.5, pts: [], tape: null, subjects: [], colors: [], shown: 0, picks: [] };
    root.innerHTML =
      '<section class="mr-step"><h2><span>1</span> A photo of your wall</h2>' +
      '<p>Put painter\'s tape on the wall where the art would go, the size you have in mind, and measure it. Then take a photo of the wall from straight in front, with the tape up.</p>' +
      '<label class="mr-file">Choose the photo<input type="file" accept="image/*" hidden></label><p class="mr-small">Your photo stays on your device. Nothing is uploaded.</p></section>' +
      '<section class="mr-step" data-s="2" hidden><h2><span>2</span> Mark the tape</h2><p class="mr-say">Click one corner of the tape, then the opposite corner.</p>' +
      '<div class="mr-photo"><img alt="Your wall"><span class="mr-box" hidden></span></div>' +
      '<div class="mr-size" hidden><label>The tape is <input type="number" min="6" max="240" data-w aria-label="Width of the tape in inches"> inches wide</label>' +
      '<label>and <input type="number" min="6" max="240" data-h aria-label="Height of the tape in inches"> inches high <small>(optional)</small></label>' +
      '<button type="button" class="mr-go" data-next>Next</button><button type="button" class="mr-link" data-redo>Mark it again</button></div></section>' +
      '<section class="mr-step" data-s="3" hidden><h2><span>3</span> What do you like?</h2><p>Choose as many as you like, or none.</p><div class="mr-chips" data-subject></div><div class="mr-chips" data-color></div>' +
      '<button type="button" class="mr-go" data-show>Show me five pieces on my wall</button></section>' +
      '<section class="mr-step" data-s="4" hidden><h2><span>4</span> Your wall, five ways</h2><p class="mr-say" data-sum></p><div class="mr-grid"></div>' +
      '<div class="mr-more"><button type="button" class="mr-go" data-more>Show five more</button> <button type="button" class="mr-link" data-again>Change what I like</button></div></section>';
    var $ = function (s) { return root.querySelector(s); }, step = function (n) { var el = $('[data-s="' + n + '"]'); el.hidden = false; return el; };
    var photo = $('.mr-photo'), img = $('.mr-photo img'), box = $('.mr-box'), say = $('[data-s="2"] .mr-say');

    // 1. the photo, read in the browser only
    $('.mr-file input').onchange = function (ev) {
      var f = ev.target.files[0]; if (!f) return;
      if (st.img) URL.revokeObjectURL(st.img);
      st.img = URL.createObjectURL(f); img.onload = function () { st.ratio = img.naturalWidth / img.naturalHeight; reset(); step(2).scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      img.src = st.img; $('.mr-file').firstChild.textContent = 'Choose a different photo';
    };
    function reset() { st.pts = []; st.tape = null; box.hidden = true; $('.mr-size').hidden = true; say.textContent = 'Click one corner of the tape, then the opposite corner.'; }
    // 2. the two corners of the tape
    photo.onclick = function (ev) {
      if (st.pts.length >= 2) return;
      var b = photo.getBoundingClientRect(); st.pts.push([(ev.clientX - b.left) / b.width * 100, (ev.clientY - b.top) / b.height * 100]);
      if (st.pts.length === 1) { say.textContent = 'Now click the opposite corner.'; return; }
      var a = st.pts[0], c = st.pts[1], l = Math.min(a[0], c[0]), t = Math.min(a[1], c[1]), w = Math.abs(a[0] - c[0]), h = Math.abs(a[1] - c[1]);
      if (w < 2 || h < 2) { reset(); say.textContent = 'Those two clicks were too close together. Click one corner of the tape, then the opposite corner.'; return; }
      box.style.left = l + '%'; box.style.top = t + '%'; box.style.width = w + '%'; box.style.height = h + '%'; box.hidden = false;
      st.tape = { l: l, t: t, w: w, h: h }; say.textContent = 'How big is the tape?'; $('.mr-size').hidden = false; $('[data-w]').focus();
    };
    $('[data-redo]').onclick = reset;
    $('[data-next]').onclick = function () {
      var w = +$('[data-w]').value; if (!(w >= 6 && w <= 240)) { $('[data-w]').focus(); say.textContent = 'Type the width of the tape in inches (between 6 and 240).'; return; }
      var tp = st.tape, span = w / (tp.w / 100);          // inches across the whole photo, at the wall
      var hIn = +$('[data-h]').value || w * (tp.h * img.naturalHeight) / (tp.w * img.naturalWidth);
      st.space = { w: w, h: hIn, long: Math.max(w, hIn), shape: shapeOf(w / hIn) };
      st.room = { slug: 'yours', name: 'Your room', kind: 'none', scenes: [{ img: st.img, span_in: span, x: tp.l + tp.w / 2, y: tp.t + tp.h / 2, ratio: st.ratio }] };
      chips(); step(3).scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // 3. what they like, from what the collection actually contains
    function chips() {
      var subs = {}, cols = {};
      ALL.forEach(function (p) { if (p.subject) subs[p.subject] = 1; (p.color || []).forEach(function (c) { cols[c] = 1; }); });
      function row(el, label, vals, key) {
        el.innerHTML = '<b>' + label + '</b>' + Object.keys(vals).sort().map(function (v) { return '<button type="button" aria-pressed="' + (st[key].indexOf(v) >= 0) + '" data-v="' + esc(v) + '">' + esc(v) + '</button>'; }).join('');
        [].forEach.call(el.querySelectorAll('button'), function (b) { b.onclick = function () { var v = b.getAttribute('data-v'), i = st[key].indexOf(v); if (i >= 0) st[key].splice(i, 1); else st[key].push(v); b.setAttribute('aria-pressed', i < 0); }; });
      }
      row($('[data-subject]'), 'Subjects', subs, 'subjects'); row($('[data-color]'), 'Colours', cols, 'colors');
    }
    // 4. five pieces that fit the space: the right shape, printable at that size, closest to what they like
    function choose() {
      var sp = st.space, ok = function (p) { return !p.max_in || p.max_in >= sp.long * 0.95; };
      var scored = ALL.filter(function (p) { return p.img; }).map(function (p) {
        var s = 0;
        if (p.shape === sp.shape) s += 4; else if ((NEAR[sp.shape] || []).indexOf(p.shape) >= 0) s += 1; else s -= 6;
        if (ok(p)) s += p.max_in ? 2 : 0; else s -= 5;
        if (st.subjects.length) s += st.subjects.indexOf(p.subject) >= 0 ? 4 : -2;
        if (st.colors.length) s += (p.color || []).some(function (c) { return st.colors.indexOf(c) >= 0; }) ? 3 : -1;
        return { p: p, s: s, r: hash(p.title + sp.long) };
      }).sort(function (a, b) { return b.s - a.s || a.r - b.r; });
      // keep the picks varied: each time a subject is used, its next piece counts for a little less (only when no subject was chosen)
      var out = [], used = {}, vary = st.subjects.length ? 0 : 1.5;
      while (scored.length && out.length < 60) {
        var bi = 0, bv = -1e9;
        for (var i = 0; i < Math.min(scored.length, 300); i++) { var v = scored[i].s - vary * (used[scored[i].p.subject] || 0); if (v > bv) { bv = v; bi = i; } }
        var x = scored.splice(bi, 1)[0]; out.push(x.p); used[x.p.subject] = (used[x.p.subject] || 0) + 1;
      }
      return out.concat(scored.map(function (x) { return x.p; }));
    }
    function more() {
      var grid = $('.mr-grid'), next = st.picks.slice(st.shown, st.shown + 5);
      next.forEach(function (p) {
        var card = document.createElement('figure'); card.className = 'mr-card';
        card.innerHTML = '<div class="mr-wall"></div><figcaption><b>' + esc(p.title) + '</b><span>' +
          (p.story ? '<a href="' + esc(p.story) + '">Its story</a>' : '') + (p.buy ? '<a class="mr-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta || 'Buy on Fine Art America') + '</a>' : '') + '</span></figcaption>';
        grid.appendChild(card);
        window.FAASCWall.render(card.querySelector('.mr-wall'), { piece: p, rooms: [st.room], size: st.space.long, compact: true });
        card.querySelector('.mr-wall').onclick = function () { window.FAASCWall.open({ piece: p, rooms: [st.room], size: st.space.long, cta: cfg.cta }); };
      });
      st.shown += next.length; $('[data-more]').hidden = st.shown >= st.picks.length;
    }
    $('[data-show]').onclick = function () {
      var sp = st.space; st.picks = choose(); st.shown = 0; $('.mr-grid').innerHTML = '';
      $('[data-sum]').textContent = 'A ' + Math.round(sp.w) + ' × ' + Math.round(sp.h) + ' inch space (' + sp.shape + ')' +
        (st.subjects.length || st.colors.length ? ', with what you like first.' : '.') + ' Each piece is shown at the size of your tape where it prints that large. Tap a picture to try other sizes.';
      more(); step(4).scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('[data-more]').onclick = more;
    $('[data-again]').onclick = function () { $('[data-s="3"]').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-myroom[data-myroom]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

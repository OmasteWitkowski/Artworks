/* See it finished: a piece drawn as each print it can be (framed, canvas, metal, acrylic, wood, art print), with the
   choices that change how it looks (frame colour, mat, canvas sides, acrylic mount). Buy goes to that product on FAA.
   <div class="faasc-finish" data-finish='{"img","title","buy","prices":{"framed-print":109}}'></div>
   Also steps the pictures on the Prints & Framing page: <span class="mk" data-imgs='["a.jpg","b.jpg"]'>. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var KINDS = [['framed-print', 'Framed'], ['canvas-print', 'Canvas'], ['metal-print', 'Metal'], ['acrylic-print', 'Acrylic'], ['wood-print', 'Wood'], ['art-print', 'Art print']];
  var FRAMES = [['Black', '#191716', '#2e2a27'], ['White', '#f2f0ea', '#d9d5cc'], ['Gold', '#b8913f', '#e3c77c'], ['Silver', '#9ea3a8', '#d9dde0'], ['Walnut', '#4a3222', '#6e4c34'], ['Natural wood', '#a57a4f', '#c99d6e']];
  var MATS = [['None', ''], ['White', '#f7f6f1'], ['Off-White', '#f1ede2'], ['Cream', '#efe5c9'], ['Pearl', '#e6e2d8'], ['Sand', '#d8c8a8'], ['French Blue', '#6f8fb4'], ['Indigo', '#2f3d66'], ['Smooth Black', '#111111']];
  var SIDES = [['Mirrored', 'mirror'], ['Black', '#111'], ['White', '#f5f5f2']];
  var MOUNTS = [['Hanging wire', 'wire'], ['Metal posts', 'posts']];

  function draw(img, k, o) {
    var i = '<img src="' + esc(img) + '" alt="">';
    if (k === 'framed-print') return '<span class="mk mk-frame" style="--fr:' + o.frame[1] + ';--fr2:' + o.frame[2] + '"><span style="' + (o.mat[1] ? 'background:' + o.mat[1] : 'padding:0') + '">' + i + '</span></span>';
    if (k === 'canvas-print') return '<span class="mk mk-canvas" style="--side:' + (o.side[1] === 'mirror' ? 'url(' + esc(img) + ')' : o.side[1]) + '">' + i + '</span>';
    if (k === 'metal-print') return '<span class="mk mk-metal">' + i + '</span>';
    if (k === 'acrylic-print') return '<span class="mk mk-acrylic">' + i + (o.mount[1] === 'posts' ? '<i></i><i></i><i></i><i></i>' : '') + '</span>';
    if (k === 'wood-print') return '<span class="mk mk-wood">' + i + '</span>';
    return '<span class="mk mk-paper">' + i + '</span>';
  }
  function chips(name, list, cur, sw) {
    return '<div class="fin-row"><b>' + name + '</b><span>' + list.map(function (x, n) {
      return '<button type="button" data-' + name.toLowerCase().replace(/\W/g, '') + '="' + n + '" aria-pressed="' + (x === cur) + '">' + (sw ? '<i style="background:' + (x[sw] && x[sw] !== 'mirror' ? x[sw] : 'linear-gradient(135deg,#ccc,#888)') + '"></i>' : '') + esc(x[0]) + '</button>'; }).join('') + '</span></div>';
  }
  function finish(root) {
    var cfg = JSON.parse(root.getAttribute('data-finish')), prices = cfg.prices || {};
    var st = { k: 'framed-print', frame: FRAMES[0], mat: MATS[1], side: SIDES[0], mount: MOUNTS[0] };
    function render() {
      var name = KINDS.filter(function (x) { return x[0] === st.k; })[0][1], pr = prices[st.k];
      root.innerHTML = '<div class="fin"><div class="fin-stage">' + draw(cfg.img, st.k, st) + '</div><div class="fin-side">' +
        '<div class="fin-kinds" role="group" aria-label="Print type">' + KINDS.map(function (x) { return '<button type="button" data-k="' + x[0] + '" aria-pressed="' + (x[0] === st.k) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
        (st.k === 'framed-print' ? chips('Frame', FRAMES, st.frame, 1) + chips('Mat', MATS, st.mat, 1) : '') +
        (st.k === 'canvas-print' ? chips('Sides', SIDES, st.side, 1) : '') +
        (st.k === 'acrylic-print' ? chips('Mount', MOUNTS, st.mount) : '') +
        '<p class="fin-note">A close guide to how it looks. Fine Art America has more than 250 frames and 12 mats, and shows your exact choice before you order.</p>' +
        (cfg.buy ? '<a class="faasc-btn" href="' + esc(cfg.buy.split('?')[0] + '?product=' + st.k) + '" target="_blank" rel="noopener">Choose this ' + esc(name.toLowerCase()) + (pr ? ' · from $' + Math.round(pr) : '') + '</a>' : '') +
        '</div></div>';
      [].forEach.call(root.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { st.k = b.getAttribute('data-k'); render(); }; });
      [['frame', FRAMES], ['mat', MATS], ['sides', SIDES, 'side'], ['mount', MOUNTS]].forEach(function (g) {
        [].forEach.call(root.querySelectorAll('[data-' + g[0] + ']'), function (b) { b.onclick = function () { st[g[2] || g[0]] = g[1][+b.getAttribute('data-' + g[0])]; render(); }; });
      });
    }
    render();
  }
  // the Prints & Framing page: each mock-up steps through several pieces
  function stepper(mk) {
    var imgs = JSON.parse(mk.getAttribute('data-imgs')), at = 0, box = mk.closest('.pr-mock');
    if (imgs.length < 2 || !box) return;
    box.insertAdjacentHTML('beforeend', '<button type="button" class="pr-step pr-prev" aria-label="Previous piece">&#8249;</button><button type="button" class="pr-step pr-next" aria-label="Next piece">&#8250;</button>');
    function go(d) { at = (at + d + imgs.length) % imgs.length; [].forEach.call(mk.querySelectorAll('img'), function (im) { im.src = imgs[at]; }); if (mk.style.getPropertyValue('--side')) mk.style.setProperty('--side', 'url(' + imgs[at] + ')'); }
    box.querySelector('.pr-prev').onclick = function () { go(-1); }; box.querySelector('.pr-next').onclick = function () { go(1); };
  }
  function init() {
    [].forEach.call(document.querySelectorAll('.faasc-finish[data-finish]'), finish);
    [].forEach.call(document.querySelectorAll('.mk[data-imgs]'), stepper);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

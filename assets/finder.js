(function () {
  var HEX = { red: '#c0392b', orange: '#e67e22', yellow: '#f1c40f', gold: '#c9a227', green: '#3e8e41', turquoise: '#1abc9c', teal: '#0f7c7c', blue: '#2e6fbf', purple: '#7d4bb3', pink: '#e58ab0', brown: '#7a5230', black: '#1b1b1b', white: '#f7f7f2', gray: '#8c8c8c' };
  var SCALE = [['Up to 24 inches', 0], ['Up to 40 inches', 40], ['Statement piece, 48 inches and up', 48]];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-finder')), DATA = cfg.items, sel = { subject: [], color: [], shape: [], scale: [] }, q = '';
    root.innerHTML = '<div class="owf-q"><b>What are you drawn to?</b><span data-f="subject"></span></div>' +
      '<div class="owf-q"><b>Which colors?</b><span data-f="color"></span></div>' +
      '<div class="owf-q"><b>What shape is the space?</b><span data-f="shape"></span></div>' +
      '<div class="owf-q"><b>How large does it need to go?</b><span data-f="scale"></span></div>' +
      '<div class="owf-q"><b>Or describe it</b><input type="search" placeholder="e.g. glowing abstract, mountain river, butterfly"></div>' +
      '<div class="owf-count" aria-live="polite"></div><div class="owf-grid"></div>';
    function vals(f) { var s = []; DATA.forEach(function (p) { [].concat(p[f] || []).forEach(function (v) { if (v && s.indexOf(v) < 0) s.push(v); }); }); return s.sort(); }
    function chips(f, list) {
      var box = root.querySelector('[data-f="' + f + '"]');
      if (!list.length) { box.parentNode.style.display = 'none'; return; }
      box.innerHTML = list.map(function (v) {
        var label = v.join ? v[0] : v, val = v.join ? v[1] : v;
        return '<span class="owf-chip" role="button" tabindex="0" data-v="' + esc(val) + '">' + (f === 'color' ? '<i class="owf-sw" style="background:' + (HEX[String(val).toLowerCase()] || '#999') + '"></i>' : '') + esc(label) + '</span>';
      }).join('');
      box.onclick = function (e) {
        var c = e.target.closest('.owf-chip'); if (!c) return;
        var v = c.getAttribute('data-v'), i = sel[f].indexOf(v);
        if (f === 'scale') { sel[f] = i < 0 ? [v] : []; [].forEach.call(box.children, function (x) { x.classList.remove('on'); }); if (i < 0) c.classList.add('on'); }
        else { if (i < 0) sel[f].push(v); else sel[f].splice(i, 1); c.classList.toggle('on'); }
        draw();
      };
      box.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); } };
    }
    function match(p) {
      if (sel.subject.length && sel.subject.indexOf(p.subject) < 0) return false;
      if (sel.color.length && !sel.color.some(function (c) { return p.color.indexOf(c) >= 0; })) return false;
      if (sel.shape.length && sel.shape.indexOf(p.shape) < 0) return false;
      if (sel.scale.length && p.max_in < +sel.scale[0]) return false;
      if (q) { var w = q.toLowerCase().split(/\s+/).filter(Boolean); if (!w.every(function (x) { return p.text.indexOf(x) >= 0; })) return false; }
      return true;
    }
    function draw() {
      var hits = DATA.filter(match), any = q || sel.subject.length || sel.color.length || sel.shape.length || sel.scale.length;
      root.querySelector('.owf-count').innerHTML = hits.length + (hits.length === 1 ? ' piece' : ' pieces') + (any ? ' match. <button class="owf-reset">Start over</button>' : '');
      var r = root.querySelector('.owf-reset');
      if (r) r.onclick = function () { sel = { subject: [], color: [], shape: [], scale: [] }; q = ''; root.querySelector('input').value = ''; [].forEach.call(root.querySelectorAll('.owf-chip.on'), function (x) { x.classList.remove('on'); }); draw(); };
      root.querySelector('.owf-grid').innerHTML = hits.map(function (p) {
        return '<div class="owf-card">' + (p.img ? '<a href="' + esc(p.story) + '"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>' : '') +
          '<div class="owf-b"><div class="owf-t">' + esc(p.title) + '</div><div class="owf-d">' + esc(p.why) + '</div><div class="owf-l">' +
          '<a class="owf-story" href="' + esc(p.story) + '">Read the story</a>' +
          (p.buy ? '<a class="owf-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') + '</div></div></div>';
      }).join('') || '<p>Nothing matches all of that yet. Try removing one choice.</p>';
    }
    chips('subject', vals('subject')); chips('color', vals('color')); chips('shape', vals('shape')); chips('scale', SCALE);
    root.querySelector('input').oninput = function (e) { q = e.target.value; draw(); };
    draw();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-finder[data-finder]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

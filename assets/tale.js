/* A Choose Your Own Adventure story written by the artist, read like a classic gamebook: a cover, then numbered pages
   that end in choices ("If you open the blue door, turn to page 4."), until a page ends the story with the art it found.
   <div class="faasc-tale" data-tale='{"title","line","cover","cta","pages":[{n,title,text,choices:[{label,to}],ending,art:[{title,img,story,buy}]}]}'></div> */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function paras(t) { return String(t || '').split(/\n\s*\n/).filter(function (x) { return x.trim(); }).map(function (x) { return '<p class="adv-scene">' + esc(x.trim()).replace(/\n/g, '<br>') + '</p>'; }).join(''); }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-tale')), pages = {}, path = [];
    (cfg.pages || []).forEach(function (p) { pages[p.n] = p; });
    function focus() { var t = root.querySelector('.adv-title, .adv-cover-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
      if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    function cover() {
      root.innerHTML = '<div class="adv-cover"><div class="adv-cover-in"><div class="adv-kicker">Choose your own adventure · a story by Omaste Witkowski</div>' +
        '<div class="adv-cover-title" role="heading" aria-level="2"><em>' + esc(cfg.title) + '</em></div>' +
        (cfg.cover ? '<div class="adv-plate"><img src="' + esc(cfg.cover) + '" alt=""></div>' : '') +
        (cfg.line ? '<p class="adv-cover-line">' + esc(cfg.line) + '</p>' : '') +
        '<p class="tale-rule">You are the one walking through this story. At the bottom of each page you choose what happens next, and turn to the page it names. There is more than one ending.</p>' +
        '<button type="button" class="adv-begin">Begin at page 1</button><div class="adv-byline">Omaste Witkowski</div></div></div>';
      root.querySelector('.adv-begin').onclick = function () { go(1); };
    }
    function go(n, back) { if (!back) path.push(n); draw(n); focus(); }
    function draw(n) {
      var p = pages[n];
      if (!p) { cover(); return; }
      var html = '<div class="adv-page tale-page"><div class="tale-no" aria-label="Page ' + n + '">' + n + '</div>' +
        (p.title ? '<h3 class="adv-title">' + esc(p.title) + '</h3>' : '') + paras(p.text);
      if (p.ending) {
        html += '<div class="tale-end">The End</div>' + ((p.art || []).length ? '<div class="adv-found">' + p.art.map(function (a) {
          return '<div class="adv-piece"><a href="' + esc(a.story) + '"><img loading="lazy" src="' + esc(a.img) + '" alt="' + esc(a.title) + '"></a><div class="adv-pb"><div class="adv-pt">' + esc(a.title) + '</div>' +
            '<a class="adv-story" href="' + esc(a.story) + '">See this piece</a>' + (a.buy ? '<a class="adv-buy" href="' + esc(a.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') + '</div></div>';
        }).join('') + '</div>' : '');
      } else {
        html += '<div class="tale-choices">' + (p.choices || []).map(function (c, k) {
          return '<button type="button" class="tale-choice" data-k="' + k + '">' + esc(c.label) + '</button>';
        }).join('') + '</div>';
      }
      html += '<div class="adv-ctl">' + (path.length > 1 ? '<button type="button" data-a="back">Turn back to page ' + path[path.length - 2] + '</button>' : '<button type="button" data-a="cover">Back to the cover</button>') +
        (p.ending ? '<button type="button" data-a="again">Read it again from page 1</button>' : '') + '</div></div>';
      root.innerHTML = html;
      [].forEach.call(root.querySelectorAll('.tale-choice'), function (b) { b.onclick = function () { go(p.choices[+b.getAttribute('data-k')].to); }; });
      [].forEach.call(root.querySelectorAll('[data-a]'), function (b) {
        b.onclick = function () { var a = b.getAttribute('data-a');
          if (a === 'back') { path.pop(); go(path[path.length - 1], true); } else if (a === 'again') { path = []; go(1); } else { path = []; cover(); focus(); } };
      });
    }
    cover();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-tale[data-tale]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

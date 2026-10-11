/* Choose Your Own Art Adventure. Every chapter is one dimension of the classification system
   (subject, color, shape, scale). Paths are built from the published artworks, so no choice dead-ends. */
(function () {
  var SUBJECT = {
    'Pacific Northwest Landscapes': ['Follow the river trail into the mountains', 'The trail climbs out of the valley. Snowmelt runs loud beside you, the air smells of pine and cold stone, and every bend opens a longer view.'],
    'Abstract Glass Macro': ['Lean in close to the glass until it becomes another world', 'You bring your eye right up to a piece of handblown glass. The object disappears. What is left is light bending through color, a landscape with no horizon.'],
    'Contemporary Abstract & Mixed Media': ['Walk into the studio where color has no subject', 'Nothing in this room is a picture of anything. Shape, layer and color do all the talking, and each canvas sets the mood of the wall it hangs on.'],
    'Botanical & Flowers': ['Open the garden gate', 'The gate swings in on petals and leaves seen closer than you usually stop to look. Every bloom is holding still for you.'],
    'Butterflies, Birds & Wildlife': ['Stay very still and wait for wings', 'You stop moving. After a moment something alive arrives: a flicker of wings, a bright eye, a creature that has decided you are safe.'],
    'Spiritual, Mandala & Symbolic': ['Step inside the circle', 'The pattern closes around you, turning on its own center. Symbols repeat like breath. It is a place made for looking inward.'],
    'Travel / Specialty / Projects': ['Take the road to somewhere else', 'You leave the valley behind for other light: warm sand, old buildings, places with their own weather.']
  };
  var COLOR = {
    red: 'toward the heat of red', orange: 'toward the ember glow of orange', yellow: 'into bright yellow sunlight', gold: 'toward warm gold',
    green: 'into deep green shade', turquoise: 'toward clear turquoise water', teal: 'into quiet teal', blue: 'toward cool blue distance',
    purple: 'into violet dusk', pink: 'toward soft pink bloom', brown: 'toward earth and wood browns', black: 'into dramatic dark',
    white: 'into pale, open light', gray: 'into silver mist'
  };
  var HEX = { red: '#c0392b', orange: '#e67e22', yellow: '#f1c40f', gold: '#c9a227', green: '#3e8e41', turquoise: '#1abc9c', teal: '#0f7c7c', blue: '#2e6fbf', purple: '#7d4bb3', pink: '#e58ab0', brown: '#7a5230', black: '#1b1b1b', white: '#f7f7f2', gray: '#8c8c8c' };
  var SHAPE = {
    horizontal: 'A wide wall, above a sofa, a bed or a sideboard', vertical: 'A tall, narrow space beside a door or window', square: 'A balanced spot that wants a square',
    'panoramic horizontal': 'A long stretch of wall that needs a panorama', 'panoramic vertical': 'A slim column of wall, floor to ceiling'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(list, f) { var s = []; list.forEach(function (p) { [].concat(p[f] || []).forEach(function (v) { if (v && s.indexOf(v) < 0) s.push(v); }); }); return s.sort(); }

  var CHAPTERS = [
    { key: 'subject', name: 'What it shows', title: 'Chapter one: the door',
      scene: 'You are standing in front of an empty wall. It has been empty for a while. Tonight you decide to go and find what belongs there. Several doors stand open.',
      options: function (pool) { return uniq(pool, 'subject').map(function (v) { return { v: v, label: (SUBJECT[v] || ['Explore ' + v])[0], after: (SUBJECT[v] || [0, 'You step through, curious about what you will find.'])[1] }; }); },
      test: function (p, v) { return p.subject === v; } },
    { key: 'color', name: 'Its color', title: 'Chapter two: the light',
      scene: 'As you go further the light begins to change, and the path divides by color. Which way do your feet want to go?',
      options: function (pool) { return uniq(pool, 'color').map(function (v) { var k = String(v).toLowerCase(); return { v: v, label: 'Walk ' + (COLOR[k] || 'toward ' + v), sw: HEX[k], after: 'The color settles around you like weather. You notice how it would change the room it lived in.' }; }); },
      test: function (p, v) { return p.color.indexOf(v) >= 0; } },
    { key: 'shape', name: 'Its shape', title: 'Chapter three: the wall',
      scene: 'For a moment you are back in your own room, looking at the wall that started all this. What kind of space is waiting there?',
      options: function (pool) { return uniq(pool, 'shape').map(function (v) { return { v: v, label: SHAPE[v] || 'A ' + v + ' space', after: 'You hold the shape of that space in your mind and carry it back with you.' }; }); },
      test: function (p, v) { return p.shape === v; } },
    { key: 'scale', name: 'Its scale', title: 'Chapter four: the presence',
      scene: 'One last question waits on the path. How much of the room should this piece claim?',
      options: function (pool) {
        var big = pool.filter(function (p) { return p.max_in >= 48; }).length, o = [];
        if (big && big < pool.length) {
          o.push({ v: 'statement', label: 'Let it command the room, four feet wide or more', after: 'You want to feel it from across the room. Only pieces that hold up at that size stay on the path.' });
          o.push({ v: 'any', label: 'Let it be a quiet companion at a smaller size', after: 'It does not need to shout. Every piece left can live happily at a modest size.' });
        }
        return o;
      },
      test: function (p, v) { return v === 'any' || p.max_in >= 48; } }
  ];

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-adventure')), ALL = cfg.items, JOURNAL = cfg.journal || [], steps = [];   // steps: [{chapter, option}]
    function pool(n) {
      var list = ALL;
      steps.slice(0, n == null ? steps.length : n).forEach(function (s) { if (s.option) list = list.filter(function (p) { return CHAPTERS[s.chapter].test(p, s.option.v); }); });
      return list;
    }
    function nextChapter() {
      var from = steps.length ? steps[steps.length - 1].chapter + 1 : 0, left = pool();
      for (var i = from; i < CHAPTERS.length; i++) {
        if (left.length <= 1) break;                       // the adventure has already found its piece
        var opts = CHAPTERS[i].options(left);
        if (opts.length > 1) return { i: i, opts: opts };  // a real fork; single-option chapters are walked past
      }
      return null;
    }
    /* A published story that belongs on the path just chosen. Every post you publish adds passages here. */
    function passage() {
      var seen = {}, pick = null;
      steps.forEach(function (s, n) {
        if (!s.option) return;
        var key = CHAPTERS[s.chapter].key, v = s.option.v, field = { subject: 'subjects', color: 'colors', shape: 'shapes' }[key];
        var hit = null;
        if (field) for (var i = 0; i < JOURNAL.length; i++) { var j = JOURNAL[i]; if (!seen[j.url] && (j[field] || []).indexOf(v) >= 0) { hit = j; break; } }
        if (hit) seen[hit.url] = 1;
        if (n === steps.length - 1) pick = hit;
      });
      if (!pick) return '';
      return '<aside class="adv-journal"><span>From the artist\u2019s journal</span><a href="' + esc(pick.url) + '">' + esc(pick.title) + '</a>' + (pick.excerpt ? '<p>' + esc(pick.excerpt) + '</p>' : '') + '</aside>';
    }
    function trail() {
      var parts = steps.filter(function (s) { return s.option; }).map(function (s) { return '<span><b>' + esc(CHAPTERS[s.chapter].name) + ':</b> ' + esc(s.option.v === 'statement' ? 'statement size' : s.option.v === 'any' ? 'any size' : s.option.v) + '</span>'; });
      return parts.length ? '<div class="adv-trail" aria-label="Your path so far">' + parts.join('') + '</div>' : '';
    }
    function controls() {
      return '<div class="adv-ctl">' + (steps.length ? '<button type="button" data-a="back">Go back one step</button><button type="button" data-a="restart">Start a new adventure</button>' : '') + '</div>';
    }
    function draw() {
      if (!ALL.length) { root.innerHTML = '<p>The adventure opens as soon as the first artworks are published.</p>'; return; }
      var last = steps.length ? steps[steps.length - 1] : null, nx = nextChapter(), html = trail();
      if (last && last.option) html += '<p class="adv-after">' + esc(last.option.after) + '</p>' + passage();
      if (nx) {
        var ch = CHAPTERS[nx.i], left = pool().length;
        html += '<h3 class="adv-title">' + esc(ch.title) + '</h3><p class="adv-scene">' + esc(ch.scene) + '</p><div class="adv-choices">' +
          nx.opts.map(function (o, k) { return '<button type="button" class="adv-choice" data-k="' + k + '">' + (o.sw ? '<i style="background:' + o.sw + '"></i>' : '') + esc(o.label) + '</button>'; }).join('') +
          '<button type="button" class="adv-choice adv-skip" data-k="skip">I have no preference. Keep walking.</button></div>' +
          '<p class="adv-left">' + left + (left === 1 ? ' piece is' : ' pieces are') + ' still on your path.</p>';
        root.innerHTML = html + controls();
        [].forEach.call(root.querySelectorAll('.adv-choice'), function (b) {
          b.onclick = function () { steps.push({ chapter: nx.i, option: b.getAttribute('data-k') === 'skip' ? null : nx.opts[+b.getAttribute('data-k')] }); draw(); focus(); };
        });
      } else {
        var found = pool();
        html += '<h3 class="adv-title">' + (found.length === 1 ? 'The end of the path: you found it' : 'The end of the path: ' + found.length + ' pieces were waiting for you') + '</h3>' +
          '<p class="adv-scene">' + (found.length === 1 ? 'The path narrows to a single frame, lit as if it had been expecting you.' : 'The path opens into a small room. Everything here answers the choices you made. One of them is yours.') + '</p><div class="adv-found">' +
          found.map(function (p) {
            return '<div class="adv-piece">' + (p.img ? '<a href="' + esc(p.story) + '"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>' : '') +
              '<div class="adv-pb"><div class="adv-pt">' + esc(p.title) + '</div><div class="adv-pd">' + esc(p.why) + '</div>' +
              ((p.posts && p.posts.length) ? p.posts.map(function (s) { return '<a class="adv-story" href="' + esc(s.url) + '">Read: ' + esc(s.title) + '</a>'; }).join('') : '<a class="adv-story" href="' + esc(p.story) + '">See this piece</a>') +
              (p.buy ? '<a class="adv-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') + '</div></div>';
          }).join('') + '</div>';
        root.innerHTML = html + controls();
      }
      [].forEach.call(root.querySelectorAll('[data-a]'), function (b) {
        b.onclick = function () { if (b.getAttribute('data-a') === 'back') steps.pop(); else steps = []; draw(); focus(); };
      });
    }
    function focus() { var t = root.querySelector('.adv-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } if (root.scrollIntoView && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' }); }
    draw();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-adventure[data-adventure]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Choose Your Own Art Adventure.
   Opens on a book cover, then four short chapters. Each chapter is one dimension of the classification
   system (the wall's shape, the subject, the colour family, the scale), asked the way a person with a
   blank wall would think about it. Paths are built from the published artworks, so no choice dead-ends.
   One book can tell one part of the collection: cfg.book = {em, line} titles its cover (a question with a single
   answer is skipped, so a book of one collection goes straight to the questions that still divide it). */
(function () {
  var SUBJECT = {
    'Pacific Northwest Landscapes': ['Go back to a place you have stood', 'River, trail and ridge in the Methow Valley and North Cascades', 'The trail climbs out of the valley. Snowmelt runs loud beside you, the air smells of pine and cold stone, and every bend opens a longer view.'],
    'Abstract Glass Macro': ['Look closer, until glass becomes another world', 'A few inches of handblown glass, opened into colour', 'You bring your eye right up to a piece of handblown glass. The object disappears. What is left is light bending through colour, a landscape with no horizon.'],
    'Contemporary Abstract & Mixed Media': ['Walk into colour that has no subject', 'Layered abstracts, painted by hand', 'Nothing in this room is a picture of anything. Shape, layer and colour do all the talking, and each piece sets the mood of the wall it hangs on.'],
    'Botanical & Flowers': ['Open the garden gate', 'Flowers and leaves, closer than you usually look', 'The gate swings in on petals and leaves seen closer than you usually stop to look. Every bloom is holding still for you.'],
    'Butterflies, Birds & Wildlife': ['Stay very still and wait for wings', 'Butterflies, birds and wild company', 'You stop moving. After a moment something alive arrives: a flicker of wings, a bright eye, a creature that has decided you are safe.'],
    'Spiritual, Mandala & Symbolic': ['Step inside the circle', 'Mandalas, symbols and patterns that turn', 'The pattern closes around you, turning on its own centre. Symbols repeat like breath. It is a place made for looking inward.'],
    'Travel / Specialty / Projects': ['Take the road to somewhere else', 'Other light: sand, old buildings, far places', 'You leave the valley behind for other light: warm sand, old buildings, places with their own weather.']
  };
  var WALL = {
    'horizontal': ['The wide wall over the sofa or the bed', 'It wants something broad that holds the room together.'],
    'panoramic horizontal': ['A long run of wall: a hallway, above a headboard', 'It wants a panorama, wider than you think.'],
    'vertical': ['A tall, narrow wall: beside a door, in the entry, up the stairs', 'It wants height more than width.'],
    'panoramic vertical': ['A slim column of wall, floor to ceiling', 'It wants one long, quiet vertical.'],
    'square': ['A balanced spot: a nook, a bath, a pair side by side', 'It wants a square.']
  };
  var MOODS = [
    { v: 'Warm and glowing', colors: ['red', 'orange', 'gold', 'yellow'], sw: ['#c0392b', '#e67e22', '#c9a227'], label: 'Warm and glowing', sub: 'Ember, amber, gold: the room feels lit from inside', after: 'Warmth settles around you. This is colour that changes how a room feels when you walk in.' },
    { v: 'Cool and clear', colors: ['blue', 'turquoise', 'teal', 'green'], sw: ['#2e6fbf', '#1abc9c', '#3e8e41'], label: 'Cool and clear', sub: 'River, sky and leaf: the room breathes out', after: 'The air cools. Blue and green open the wall like a window.' },
    { v: 'Jewel and dusk', colors: ['purple', 'pink'], sw: ['#7d4bb3', '#e58ab0', '#4b2a7a'], label: 'Jewel and dusk', sub: 'Violet, plum and rose: rich, a little dramatic', after: 'The light goes violet. This is the bold choice, and you are not sorry.' },
    { v: 'Earth and quiet', colors: ['brown', 'black', 'white', 'gray'], sw: ['#7a5230', '#8c8c8c', '#f7f7f2'], label: 'Earth and quiet', sub: 'Stone, wood, snow and shadow: calm that lasts', after: 'Everything goes quiet. Stone and shadow, nothing shouting.' }
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uniq(list, f) { var s = []; list.forEach(function (p) { [].concat(p[f] || []).forEach(function (v) { if (v && s.indexOf(v) < 0) s.push(v); }); }); return s.sort(); }
  function has(p, mood) { return (p.color || []).some(function (c) { return mood.colors.indexOf(String(c).toLowerCase()) >= 0; }); }
  function sample(pool, test) { for (var i = 0; i < pool.length; i++) if (pool[i].img && test(pool[i])) return pool[i].img; return ''; }
  var NUM = ['one', 'two', 'three', 'four', 'five'];
  var ABSTRACT = ['Abstract Glass Macro', 'Contemporary Abstract & Mixed Media', 'Spiritual, Mandala & Symbolic'];
  function isAbstract(s) { return ABSTRACT.indexOf(s) >= 0; }
  // each piece says whether it is abstract (p.abs, from what it shows); older data falls back to its collection
  function absOf(p) { return typeof p.abs === 'boolean' ? p.abs : isAbstract(p.subject); }
  function pickImg(pool, test) { var c = pool.filter(function (p) { return p.img && test(p); }); return c.length ? c[Math.floor(Math.random() * c.length)].img : ''; }
  var WORLDS = [
    { v: 'Abstract', abs: true, door: 'abstract', label: 'Abstract', sub: 'Open this one if you want colour that makes a guest stop and ask, what is that?', after: 'The door gives, and the world you know falls away. What is left is colour and light, and it is yours to read.' },
    { v: 'Reality', abs: false, door: 'reality', label: 'Reality', sub: 'Open this one if you want a place you can step back into every time you walk past.', after: 'The old door swings on its hinges. Beyond it the world is as it is, only sharper, as if someone had wiped the glass.' }
  ];

  var CHAPTERS = [
    { key: 'world', name: 'The threshold', title: 'welcome', scene: '',
      options: function (pool, book) {
        if (book && book.doors) {      // this book's own two doors: each piece knows which one it is behind (p.door)
          return book.doors.map(function (d, i) { return { v: d.label, label: d.label, sub: d.sub, after: d.after, i: i, abs: i === 1, door: 'reality',
            img: pickImg(pool, function (p) { return p.door === i; }) }; }).filter(function (o) { return pool.filter(function (p) { return p.door === o.i; }).length >= 3; });
        } return WORLDS.filter(function (w) { return pool.some(function (p) { return absOf(p) === w.abs; }); }).map(function (w) { var o = {}; for (var k in w) o[k] = w[k]; o.img = (w.abs ? '' : pickImg(pool, function (p) { return p.subject === 'Pacific Northwest Landscapes'; }) || pickImg(pool, function (p) { return p.subject === 'Travel / Specialty / Projects'; })) || pickImg(pool, function (p) { return absOf(p) === w.abs; }); return o; }); },
      test: function (p, o) { return typeof o.i === 'number' ? p.door === o.i : absOf(p) === o.abs; },
      journal: function (j, o) { return typeof o.i === 'number' ? false : (j.subjects || []).some(function (s) { return isAbstract(s) === o.abs; }); } },
    { key: 'subject', name: 'Further in', title: 'further in',
      scene: 'You are through, and the passage draws you further in. It divides again. You do not need to know anything about art to choose: only which way you want to walk.',
      options: function (pool) { return uniq(pool, 'subject').map(function (v) { var s = SUBJECT[v] || ['Explore ' + v, '', 'You step through, curious about what you will find.']; return { v: v, label: s[0], sub: s[1], img: sample(pool, function (p) { return p.subject === v; }), after: s[2] }; }); },
      test: function (p, o) { return p.subject === o.v; }, journal: function (j, o) { return (j.subjects || []).indexOf(o.v) >= 0; } },
    { key: 'shape', name: 'The wall', title: 'the wall',
      scene: 'Somewhere in your home a wall is waiting for what you find here. You know the one. The room is finished, the furniture is in, and it has been bare long enough to start bothering you. Which wall is it?',
      options: function (pool, book, cfg) { return uniq(pool, 'shape').map(function (v) { var w = WALL[v] || ['A ' + v + ' space', '']; return { v: v, label: w[0], sub: w[1], img: (cfg && cfg.walls && cfg.walls[v]) || sample(pool, function (p) { return p.shape === v; }), after: 'You hold the shape of that wall in your mind and carry it with you.' }; }); },
      test: function (p, o) { return p.shape === o.v; }, journal: function (j, o) { return (j.shapes || []).indexOf(o.v) >= 0; } },
    { key: 'color', name: 'The light', title: 'the light',
      scene: 'As you go further the light begins to change. Think of the room the wall lives in, and how you want it to feel when you walk in each morning.',
      options: function (pool) { return MOODS.filter(function (m) { return pool.some(function (p) { return has(p, m); }); }).map(function (m) { return { v: m.v, mood: m, label: m.label, sub: m.sub, sw: m.sw, img: sample(pool, function (p) { return has(p, m); }), after: m.after }; }); },
      test: function (p, o) { return has(p, o.mood); }, journal: function (j, o) { return (j.colors || []).some(function (c) { return o.mood.colors.indexOf(c) >= 0; }); } },
    { key: 'scale', name: 'The presence', title: 'the presence',
      scene: 'One last question waits on the path. When a guest walks in, how much of the room should this piece claim?',
      options: function (pool) {
        var big = pool.filter(function (p) { return p.max_in >= 48; }).length, o = [];
        if (big && big < pool.length) {
          o.push({ v: 'A statement piece', big: true, label: 'Let it command the room', sub: 'Four feet wide or more. Only pieces that hold up at that size stay.', after: 'You want to feel it from across the room.' });
          o.push({ v: 'Any size', big: false, label: 'Let it be a quiet companion', sub: 'A smaller piece you notice a little more each day.', after: 'It does not need to shout.' });
        }
        return o;
      },
      test: function (p, o) { return !o.big || p.max_in >= 48; }, journal: function () { return false; } }
  ];

  // The art waits for the last page: until then the story shows only empty walls (cfg.walls, real rooms from the
  // room photos): the cover, behind each door, and each kind of wall. The other choices are words and colour.
  function blank(cfg, key, opts) {
    var w = cfg.walls; if (!w) return opts;
    opts.forEach(function (o, k) { if (key === 'world') o.img = (w.behind || [])[k] || '';
      else if (key === 'color') o.img = (w.moods || {})[['warm', 'cool', 'jewel', 'earth'][MOODS.indexOf(o.mood)]] || '';
      else if (key !== 'shape') o.img = ''; });
    return opts;
  }
  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-adventure')), book = cfg.book || {}, ALL = cfg.items, JOURNAL = cfg.journal || [], steps = [], begun = false, shownEnd = 10;
    function pool() { var list = ALL; steps.forEach(function (s) { if (s.option) list = list.filter(function (p) { return CHAPTERS[s.chapter].test(p, s.option); }); }); return list; }
    function nextChapter() {
      var from = steps.length ? steps[steps.length - 1].chapter + 1 : 0, left = pool();
      for (var i = from; i < CHAPTERS.length; i++) {
        if (left.length <= 1) break;
        var opts = blank(cfg, CHAPTERS[i].key, CHAPTERS[i].options(left, book, cfg));
        if (opts.length > 1) return { i: i, opts: opts };
      }
      return null;
    }
    function passage() {
      var seen = {}, pick = null;
      steps.forEach(function (s, n) {
        if (!s.option) return;
        var hit = null;
        for (var i = 0; i < JOURNAL.length; i++) { if (!seen[JOURNAL[i].url] && CHAPTERS[s.chapter].journal(JOURNAL[i], s.option)) { hit = JOURNAL[i]; break; } }
        if (hit) seen[hit.url] = 1;
        if (n === steps.length - 1) pick = hit;
      });
      return pick ? '<aside class="adv-journal"><span>From the artist’s journal</span><a href="' + esc(pick.url) + '">' + esc(pick.title) + '</a>' + (pick.excerpt ? '<p>' + esc(pick.excerpt) + '</p>' : '') + '</aside>' : '';
    }
    function trail() {
      var parts = steps.filter(function (s) { return s.option; }).map(function (s) { return '<span><b>' + esc(CHAPTERS[s.chapter].name) + ':</b> ' + esc(s.option.v) + '</span>'; });
      return parts.length ? '<div class="adv-trail" aria-label="Your path so far">' + parts.join('') + '</div>' : '';
    }
    function controls() { return '<div class="adv-ctl"><button type="button" data-a="back">' + (steps.length ? 'Turn back one page' : 'Back to the cover') + '</button>' + (steps.length ? '<button type="button" data-a="restart">Start a new adventure</button>' : '') + '</div>'; }
    function cover() {
      var withStory = ALL.filter(function (p) { return p.img && p.posts && p.posts.length; }), any = ALL.filter(function (p) { return p.img; });
      var from = withStory.length >= 3 ? withStory : any, art = from.length ? from[Math.floor(Math.random() * from.length)] : null;
      root.innerHTML = '<div class="adv-cover"><div class="adv-cover-in">' +
        '<div class="adv-kicker">An interactive story · about two minutes</div>' +
        '<div class="adv-cover-title" role="heading" aria-level="2">Choose Your Own<br><em>' + esc(book.em || 'Art Adventure') + '</em></div>' +
        (cfg.walls && cfg.walls.cover ? '<div class="adv-plate"><img src="' + esc(cfg.walls.cover) + '" alt="An empty wall, waiting"></div>'
          : art ? '<div class="adv-plate"><img src="' + esc(art.img) + '" alt="' + esc(art.title) + '"></div>' : '') +
        '<p class="adv-cover-line">That wall has been bare for months.<br>' + esc(book.line || 'Behind one of two doors is the piece that ends the wait.') + '</p>' +
        '<button type="button" class="adv-begin">Open the book and find yours</button>' +
        '<div class="adv-cover-meta">' + ALL.length + ' pieces' + (JOURNAL.length ? ' · ' + JOURNAL.length + (JOURNAL.length === 1 ? ' story' : ' stories') : '') + ' · five small questions · nothing to sign up for</div>' +
        '<div class="adv-byline">Omaste Witkowski</div></div></div>';
      root.querySelector('.adv-begin').onclick = function () { begun = true; draw(); focus(); };
    }
    function bg(u) { return u ? ' style="background-image:url(\'' + esc(u).replace(/'/g, '%27') + '\')"' : ''; }
    function welcome() {
      var opts = blank(cfg, 'world', CHAPTERS[0].options(ALL, book, cfg)), doors = cfg.doors || {}, pics = ALL.filter(function (p) { return p.img; }).sort(function () { return Math.random() - .5; }).slice(0, 3);
      root.innerHTML = '<div class="adv-page adv-welcome"><div class="adv-chap">Chapter one</div><h3 class="adv-title">Welcome</h3>' +
        '<p class="adv-scene">You finished the room. The sofa is in, the paint is dry, and one wall is still bare. All you wanted was for the house to finally feel like yours. So you went looking. You scrolled, you saved a few, you nearly bought the one everybody has. Somewhere past the thousandth picture they all began to look the same, and you started to wonder whether you are just not an art person.</p>' +
        (pics.length === 3 && !cfg.walls ? '<div class="adv-strip">' + pics.map(function (p) { return '<img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '">'; }).join('') + '</div>' : '') +
        '<p class="adv-plain">I am Omaste Witkowski. I used to photograph rooms for architects and builders. One long winter day I turned a wide-angle lens around backwards and held it a thumb’s width from a piece of handblown glass made by my friend Garth Mudge at Glassworks in Winthrop, Washington. What came through the lens was not glass any more. It was light moving through colour, a whole world in a few inches. That was the day I understood why searching never works. Nobody finds their piece by typing it into a box. You know it when it stops you. Art is felt, not seen, and you are exactly as qualified to feel it as anyone.' + (cfg.about ? ' <a class="adv-more-story" href="' + esc(cfg.about) + '">Read how it began</a>' : '') + '</p>' +
        '<p class="adv-plain">So I did not build you a gallery to scroll. I built a short story, and you are the one walking through it. Five small questions. Nothing to know about art, no wrong answers, nothing to sign up for. Every answer opens a door, and the last door opens onto the piece, or the handful of pieces, that fits the wall you have in mind.</p>' +
        '<p class="adv-ask">' + (opts.length > 1 ? 'Two doors are in front of you. Your piece is behind one of them. Which do you open?' : 'A door stands in front of you.') + '</p>' +
        '<div class="adv-gates">' + opts.map(function (o, k) {
          return '<button type="button" class="adv-gate" data-k="' + k + '"><span class="adv-frame"><span class="adv-behind"' + (o.img ? ' style="background-image:url(\'' + esc(o.img).replace(/'/g, '%27') + '\')"' : '') + '></span>' +
            (o.abs ? '<span class="adv-leaf adv-half adv-l"' + bg(doors[o.door]) + '></span><span class="adv-leaf adv-half adv-r"' + bg(doors[o.door]) + '></span>' : '<span class="adv-leaf"' + bg(doors[o.door]) + '></span>') + '</span>' +
            '<b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></button>';
        }).join('') + '</div>' +
        (opts.length > 1 ? '<button type="button" class="adv-choice adv-skip" data-k="skip">I cannot choose. Open both.</button>' : '') + controls() + '</div>';
      [].forEach.call(root.querySelectorAll('.adv-gate, .adv-skip'), function (b) {
        b.onclick = function () { steps.push({ chapter: 0, option: b.getAttribute('data-k') === 'skip' ? null : opts[+b.getAttribute('data-k')] }); draw(); focus(); };
      });
      wire();
    }
    function wire() {
      [].forEach.call(root.querySelectorAll('[data-a]'), function (b) {
        b.onclick = function () { if (b.getAttribute('data-a') === 'restart') { steps = []; } else if (steps.length) steps.pop(); else begun = false; draw(); focus(); };
      });
    }
    function draw(keep) {
      if (keep !== true) shownEnd = 10;
      if (!ALL.length) { root.innerHTML = '<p>The adventure opens as soon as the first artworks are published.</p>'; return; }
      if (!begun) { cover(); return; }
      var last = steps.length ? steps[steps.length - 1] : null, nx = nextChapter(), left = pool();
      var asked = steps.length, html = '<div class="adv-page">' + trail();
      if (last && last.option) html += '<p class="adv-after">' + esc(last.option.after) + '</p>' + passage();
      if (!steps.length) { welcome(); return; }
      if (nx) {
        var ch = CHAPTERS[nx.i];
        html += '<div class="adv-chap">Chapter ' + (NUM[asked] || asked + 1) + '</div><h3 class="adv-title">' + esc(ch.title.charAt(0).toUpperCase() + ch.title.slice(1)) + '</h3><p class="adv-scene">' + esc(ch.scene) + '</p>' +
          '<div class="adv-choices' + (nx.opts.some(function (o) { return o.img; }) ? ' adv-doors' : '') + '">' +
          nx.opts.map(function (o, k) {
            return '<button type="button" class="adv-choice" data-k="' + k + '">' + (o.img ? '<span class="adv-thumb" style="background-image:url(\'' + esc(o.img).replace(/'/g, '%27') + '\')"></span>' : '') +
              '<span class="adv-txt">' + (o.sw ? '<span class="adv-sws">' + o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' : '') + '<b>' + esc(o.label) + '</b>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span></button>';
          }).join('') + '</div>' +
          '<button type="button" class="adv-choice adv-skip" data-k="skip">I have no preference. Keep walking.</button>' +
          '<p class="adv-left">' + left.length + (left.length === 1 ? ' piece is' : ' pieces are') + ' still on your path.</p>';
      } else {
        // the wall the reader chose (or, without one, the room of the light they chose): every piece hangs there
        var room = null, w = cfg.walls || {};
        if (window.FAASCWall && w.rooms) {
          var pickedWall = steps.filter(function (s) { return s.option && CHAPTERS[s.chapter].key === 'shape'; })[0];
          var pickedMood = steps.filter(function (s) { return s.option && CHAPTERS[s.chapter].key === 'color'; })[0];
          var im = (pickedWall && w[pickedWall.option.v]) || (pickedMood && (w.moods || {})[['warm', 'cool', 'jewel', 'earth'][MOODS.indexOf(pickedMood.option.mood)]]) || w.cover;
          room = w.rooms[im] || null;
        }
        html += '<div class="adv-chap">The last page</div><h3 class="adv-title">' + (left.length === 1 ? 'You found it' : left.length + ' pieces were waiting for you') + '</h3>' +
          '<p class="adv-scene">' + (left.length === 1 ? 'The path narrows to a single frame, lit as if it had been expecting you.' : 'The path opens into a small room. Everything here answers the choices you made. You will know yours when you see it.') + (room ? ' Here ' + (left.length === 1 ? 'it hangs' : 'they hang') + ' on the wall you chose, at ' + (left.length === 1 ? 'its' : 'their') + ' real size.' : '') + '</p><div class="adv-found">' +
          left.slice(0, shownEnd).map(function (p, k) {
            return '<div class="adv-piece">' + (room ? '<div class="adv-inroom" data-k="' + k + '" role="button" tabindex="0" aria-label="See ' + esc(p.title) + ' larger, on the wall you chose"></div>'
              : p.img ? '<a href="' + esc(p.story) + '"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>' : '') +
              '<div class="adv-pb"><div class="adv-pt">' + esc(p.title) + '</div><div class="adv-pd">' + esc(p.why) + '</div>' +
              ((p.posts && p.posts.length) ? p.posts.map(function (s) { return '<a class="adv-story" href="' + esc(s.url) + '">Read: ' + esc(s.title) + '</a>'; }).join('') : '<a class="adv-story" href="' + esc(p.story) + '">See this piece</a>') +
              (p.buy ? '<a class="adv-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') + '</div></div>';
          }).join('') + '</div>' + (left.length > shownEnd ? '<button type="button" class="adv-more">Show ' + Math.min(10, left.length - shownEnd) + ' more (' + (left.length - shownEnd) + ' left)</button>' : '') +
          (room && w.myroom ? '<div class="adv-ownwall"><div><b>Now picture them on your own wall</b><span>Take a photo of your wall, mark where the art would go, and every piece hangs in it at its real size.</span></div><a href="' + esc(w.myroom) + '">Try it with your wall</a></div>' : '') +
          '<div class="adv-doubt"><b>One last doubt usually shows up about now.</b> What if it is too small, or wrong for the room? Two things settle it.' +
          (cfg.gallery ? ' You can <a href="' + esc(cfg.gallery) + '">see any piece at true size over a sofa in the Gallery</a>.' : ' Mark the size on your wall with painter’s tape and live with it for a day.') +
          ' And Fine Art America makes each print to order, with a 30-day money-back guarantee.</div>' +
          '<p class="adv-turn">Now picture walking in tomorrow. The wall is finished. The room finally reads as yours, and when a guest asks where you found it, you have the story.</p>';
      }
      root.innerHTML = html + controls() + '</div>';
      if (nx) [].forEach.call(root.querySelectorAll('.adv-choice'), function (b) {
        b.onclick = function () { steps.push({ chapter: nx.i, option: b.getAttribute('data-k') === 'skip' ? null : nx.opts[+b.getAttribute('data-k')] }); draw(); focus(); };
      });
      var mb = root.querySelector('.adv-more'); if (mb) mb.onclick = function () { shownEnd += 10; draw(true); };
      if (!nx && room) [].forEach.call(root.querySelectorAll('.adv-inroom'), function (el) {
        var p = left[+el.getAttribute('data-k')], piece = { title: p.title, img: p.img, buy: p.buy, max_in: p.max_in, story: p.story };
        window.FAASCWall.render(el, { piece: piece, rooms: [room], room: room.slug, compact: true });
        var big = function () { window.FAASCWall.open({ piece: piece, rooms: [room], room: room.slug, cta: cfg.cta }); };
        el.onclick = big; el.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); big(); } };
      });
      wire();
    }
    function focus() { var t = root.querySelector('.adv-title, .adv-cover-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } if (root.scrollIntoView && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' }); }
    draw();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-adventure[data-adventure]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

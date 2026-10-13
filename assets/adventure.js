/* Choose Your Own Art Adventure: five quick choices that move the reader through a place, down to one piece.
     1 What are you into?   a subject, or all of it (a subject's own book page starts at 2)
     2 Pick a door          the subject's story, then Abstract, Reality or Black & White, or open them all;
                            each door shows a piece of that subject that looks like a way in
     3 Go deeper            the scene behind the door; the subject's subsections (for all of it, its collections): words only
     4 Where's it going?    the rooms the pieces still on the path are approved for, as room photos
     5 Which one stops you? a few pieces of different colours, each with its own palette
     The reveal             the room goes dark and the lights come up on the one piece the reader tapped, hanging on
                            their wall; who they turned out to be ("the Wandering Trail Seeker"), with a page to share;
                            and, if it is not quite right, three more like it, each revealed the same way
   Each step shows where the reader is (the door they opened, the path they took, the room they chose) and a word from
   the artist. Every result answers every choice. An answer that would leave fewer than MIN pieces is not offered, and a
   step with fewer than two answers is skipped, so every path ends in art.
   cfg = {items, cta, book: {subject, em, line}, words: {text, doors, subs},
          quiz: {bw, hook_all, subjects: [{key, label, hook, img, href}], doors: {subject: {abstract, reality, bw}},
                 rooms: [{name, img, wall}], subs: {name: line}, myroom, guide: {name, img},
                 personas: {subject: {noun, line, pages: {"": href, abstract: href, ...}}}}}
   item = {title, img, story, buy, why, posts, subject, sections, sub, rooms, abs, bw, color, sw, max_in, pop}
   Without quiz data the subjects come from the items, and the deeper and room steps are skipped. */
(function () {
  var T = {"kicker": "Find the art for your wall", "q1_title": "What are you into?", "q1_ask": "Pick a world. Five taps, and your piece finds you.",
    "all_label": "Show me everything", "all_sub": "All {n} pieces. I like surprises.", "doors_title": "Pick a door", "doors_ask": "One of them hides your piece.",
    "open_all": "Open them all", "scene_deeper": "{after} The path splits ahead.", "deeper_title": "Go deeper", "deeper_ask": "Which way pulls you in?",
    "deeper_skip": "Surprise me", "sub_default": "{n} pieces down this path", "scene_room": "{x}. You can feel it already. Now, where's this going to live?",
    "scene_room_plain": "You keep walking until the path opens out. Now, where's this going to live?", "room_title": "Where's it going?",
    "room_ask": "Pick the room. Your piece will hang right there, at its real size.", "room_skip": "Somewhere else",
    "scene_palette": "You step into your {x}. One wall is bare. A few pieces are leaning against it, waiting.",
    "scene_palette_plain": "The path ends at a bare wall. A few pieces are leaning against it, waiting.", "palette_title": "Which one stops you?",
    "palette_ask": "Don't think. Tap the one you can't stop looking at.", "reveal_dim": "The lights go down…", "reveal_title": "This one's yours.",
    "reveal_you": "You're the {persona}.", "reveal_share": "Share my result", "reveal_shared": "Link copied. Paste it anywhere.",
    "reveal_more": "Not quite? Show me 3 more like it", "more_title": "Three more down the same path",
    "end_note": "Every print is made to order by Fine Art America, with a 30-day money-back guarantee.", "again": "Start over", "back": "Back",
    "guide_subject": "", "guide_door": "", "guide_deeper": "", "guide_room": "", "guide_palette": ""};
  var DOORS = { abstract: { label: 'Abstract', sub: 'Colour and shape that make guests ask, what is that?', after: 'The door gives, and the world you know melts into colour.', adj: 'Dreaming' },
    reality: { label: 'Reality', sub: 'A real place or thing, only sharper.', after: 'Cold air, real light. Everything here is real, only sharper.', adj: 'Wandering' },
    bw: { label: 'Black & White', sub: 'Light, shadow, nothing else.', after: 'The colour drains away. Only light and shadow are left.', adj: 'Timeless' } };
  var HEX = { red: '#c0392b', orange: '#e67e22', yellow: '#f1c40f', gold: '#c9a227', green: '#3e8e41', turquoise: '#1abc9c', teal: '#008080',
    blue: '#2e6fbf', purple: '#7d4bb3', pink: '#e58ab0', brown: '#7a5230', black: '#191919', white: '#f7f7f2', gray: '#8c8c8c' };
  var MIN = 3;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fill(s, o) { return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  function pieces(k) { return k + (k === 1 ? ' piece' : ' pieces'); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function bg(u) { return u ? ' style="background-image:url(\'' + esc(u).replace(/'/g, '%27') + '\')"' : ''; }
  function swatches(p) { return p.sw && p.sw.length ? p.sw.slice(0, 4) : (p.color || []).slice(0, 4).map(function (c) { return HEX[c] || '#999'; }); }
  function rgb(h) { var x = parseInt(String(h).slice(1), 16); return [x >> 16 & 255, x >> 8 & 255, x & 255]; }
  function dist(a, b) {     // how far apart two colours look (a weighted RGB distance, close to what the eye sees)
    var p = rgb(a), q = rgb(b), r = (p[0] + q[0]) / 2, d0 = p[0] - q[0], d1 = p[1] - q[1], d2 = p[2] - q[2];
    return Math.sqrt((2 + r / 256) * d0 * d0 + 4 * d1 * d1 + (2 + (255 - r) / 256) * d2 * d2);
  }
  function words(w) {        // the words as changed in the Studio, laid over these
    if (!w) return;
    var t = w.text || {}; for (var k in t) if (t[k]) T[k] = t[k];
    var d = w.doors || {}; for (var c in d) if (DOORS[c]) for (var f in d[c]) if (d[c][f]) DOORS[c][f] = d[c][f];
  }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-adventure')), Q = cfg.quiz || {}, book = cfg.book || {}, ALL = (cfg.items || []).filter(function (p) { return p.img; });
    words(cfg.words);
    var BW = Q.bw || 'Black & White', SUBS = Q.subs || {}, guide = Q.guide || null;
    var subjects = Q.subjects || uniq(ALL.map(function (p) { return p.subject; })).map(function (s) { return { key: s, label: s }; });
    var picks = [], aside = '', revealed = null, more = false;
    function inSubject(p, key) { return !key || (p.sections ? p.sections.indexOf(key) >= 0 : p.subject === key); }
    function subjectKey() { var s = pick('subject'); return book.subject || (s ? s.v : ''); }
    function catOf(p) { return subjectKey() !== BW && p.bw ? 'bw' : (p.abs ? 'abstract' : 'reality'); }
    function pick(key) { for (var i = 0; i < picks.length; i++) if (picks[i].key === key) return picks[i].opt; return null; }
    function pool() { return picks.reduce(function (list, s) { return s.opt && s.opt.test ? list.filter(s.opt.test) : list; }, book.subject ? ALL.filter(function (p) { return inSubject(p, book.subject); }) : ALL); }
    function uniq(xs) { var o = []; xs.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
    function count(list, f) { var c = {}; list.forEach(function (p) { [].concat(f(p) || []).forEach(function (v) { if (v) c[v] = (c[v] || 0) + 1; }); }); return c; }
    function top(list) { return list.slice().sort(function (a, b) { return (b.pop || 0) - (a.pop || 0); })[0]; }
    function shuffle(xs) { xs = xs.slice(); for (var i = xs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = xs[i]; xs[i] = xs[j]; xs[j] = t; } return xs; }
    function oneOf(lines, x) { var l = String(lines || '').split('\n').filter(Boolean); return l.length ? fill(l[Math.floor(Math.random() * l.length)], { x: x }) : ''; }

    // the five steps; each returns its answers for the pieces still on the path, or null when it has nothing to ask
    var STEPS = [
      { key: 'subject', kind: 'tiles', title: function () { return T.q1_title; }, ask: function () { return T.q1_ask; }, scene: function () { return ''; },
        options: function (left) {
          if (book.subject) return null;
          var o = subjects.map(function (s) { var k = left.filter(function (p) { return inSubject(p, s.key); }).length;
            return k >= MIN ? { v: s.key, label: s.label, sub: pieces(k), img: s.img, test: function (p) { return inSubject(p, s.key); } } : null; }).filter(Boolean);
          return o.length > 1 ? o.concat([{ v: '', label: T.all_label, sub: fill(T.all_sub, { n: left.length }), all: true }]) : null;
        } },
      { key: 'door', kind: 'doors', title: function () { return T.doors_title; }, ask: function () { return T.doors_ask; },
        scene: function () { var s = subjectKey(), sj = subjects.filter(function (x) { return x.key === s; })[0]; return (sj && sj.hook) || (s ? book.line : Q.hook_all) || ''; },
        options: function (left) {
          var pics = (Q.doors || {})[subjectKey()] || {}, c = count(left, catOf);
          var o = ['abstract', 'reality', 'bw'].filter(function (k) { return c[k] >= MIN; }).map(function (k) {
            var own = left.filter(function (p) { return catOf(p) === k; });
            return { v: DOORS[k].label, cat: k, label: DOORS[k].label, sub: DOORS[k].sub, img: pics[k] || top(own).img, test: function (p) { return catOf(p) === k; } };
          });
          return o.length > 1 ? o : null;
        }, skip: function () { return T.open_all; } },
      { key: 'deeper', kind: 'words', title: function () { return T.deeper_title; }, ask: function () { return T.deeper_ask; },
        scene: function () { var d = pick('door'); return d ? fill(T.scene_deeper, { after: DOORS[d.cat].after }) : ''; },
        options: function (left) {
          var o;
          if (subjectKey()) {        // the subject's subsections
            var c = count(left, function (p) { return p.sub; });
            o = Object.keys(c).filter(function (s) { return c[s] >= MIN; }).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 6).map(function (s) {
              var own = left.filter(function (p) { return p.sub === s; });
              return { v: s, label: s, sub: SUBS[s] || fill(T.sub_default, { n: c[s] }), scene: top(own).img, test: function (p) { return p.sub === s; } }; });
          } else {                   // everything: its collections
            o = subjects.map(function (s) { var own = left.filter(function (p) { return inSubject(p, s.key); });
              return own.length >= MIN ? { v: s.label, label: s.label, sub: s.hook ? s.hook.split('. ')[0].replace(/\.$/, '') + '.' : fill(T.sub_default, { n: own.length }), scene: s.img || top(own).img,
                test: function (p) { return inSubject(p, s.key); } } : null; }).filter(Boolean);
          }
          return o.length > 1 ? o : null;
        }, skip: function () { return T.deeper_skip; } },
      { key: 'room', kind: 'rooms', title: function () { return T.room_title; }, ask: function () { return T.room_ask; },
        scene: function () { var d = pick('deeper'); return d ? fill(T.scene_room, { x: d.label }) : T.scene_room_plain; },
        options: function (left) {
          var c = count(left, function (p) { return p.rooms; });
          var o = (Q.rooms || []).filter(function (r) { return c[r.name] >= MIN; }).map(function (r) {
            return { v: r.name, label: r.name, sub: pieces(c[r.name]) + ' made for it', img: r.img, room: r, test: function (p) { return (p.rooms || []).indexOf(r.name) >= 0; } }; });
          return o.length > 1 ? o : null;
        }, skip: function () { return T.room_skip; } },
      { key: 'palette', kind: 'palette', title: function () { return T.palette_title; }, ask: function () { return T.palette_ask; },
        scene: function () { var r = pick('room'); return r ? fill(T.scene_palette, { x: r.label.toLowerCase() }) : T.scene_palette_plain; },
        options: function (left) {
          if (left.length < 2) return null;
          // a piece for each main colour still on the path, the rarest colours first, a different handful each time
          var by = {}; left.forEach(function (p) { var c = (p.color || [])[0] || 'other'; (by[c] = by[c] || []).push(p); });
          var fams = Object.keys(by).sort(function (a, b) { return by[a].length - by[b].length; });
          var chosen = shuffle(fams.slice(0, 6)).slice(0, 4).map(function (f) { return by[f][Math.floor(Math.random() * Math.min(3, by[f].length))]; });
          if (chosen.length < 3) chosen = uniq(chosen.concat(shuffle(left))).slice(0, Math.min(4, left.length));
          return chosen.map(function (p) { return { v: p.title, label: (p.color || []).slice(0, 3).join(', '), piece: p, img: p.img, sw: swatches(p) }; });
        } }
    ];
    var GUIDE = { subject: 'guide_subject', door: 'guide_door', deeper: 'guide_deeper', room: 'guide_room', palette: 'guide_palette' };

    function next() {          // the next step with something to ask
      var left = pool(), from = picks.length ? STEPS.map(function (s) { return s.key; }).indexOf(picks[picks.length - 1].key) + 1 : 0;
      if (left.length < 2) return null;
      for (var i = from; i < STEPS.length; i++) { var o = STEPS[i].options(left); if (o) return { i: i, opts: o }; }
      return null;
    }
    function similar(first, list) {      // the pieces most like the one the reader picked, among those that answer every choice
      var fc = first.color || [], fs = (first.sw || []).slice(0, 3);
      function score(p) {
        var s = 0, pc = p.color || [];
        if (fs.length && p.sw && p.sw.length) {
          fs.forEach(function (c, i) { var d = Math.min.apply(null, p.sw.slice(0, 4).map(function (x) { return dist(c, x); })); s += Math.max(0, 1 - d / 300) * (i ? 3 : 5); });
        } else {
          if (pc[0] && pc[0] === fc[0]) s += 4;
          pc.forEach(function (c) { if (fc.indexOf(c) >= 0) s += 1.5; });
        }
        if (p.sub && p.sub === first.sub) s += 2;
        if (p.subject === first.subject) s += 1;
        if (!!p.abs === !!first.abs) s += 1;
        if (p.shape && p.shape === first.shape) s += .5;
        return s;
      }
      return list.filter(function (p) { return p !== first; }).map(function (p) { return [score(p), p]; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
    }
    function backdrop() {      // where the reader is standing: the last thing they chose that has a picture
      for (var i = picks.length - 1; i >= 0; i--) { var o = picks[i].opt; if (o && (o.scene || o.img) && !o.piece) return o.scene || o.img; }
      return '';
    }
    function persona() {
      var ps = Q.personas || {}, p = ps[subjectKey()] || ps[''], d = pick('door');
      if (!p) return null;
      var who = [d ? DOORS[d.cat].adj : '', p.noun].filter(Boolean).join(' ');
      return { who: who, line: p.line, page: (p.pages || {})[d ? d.cat : ''] || '' };
    }

    function trail() {         // the path so far: tap any step to go back to it
      return '<div class="qz-top"><div class="qz-trail">' + picks.map(function (s, k) {
        return s.opt && !s.opt.all ? '<button type="button" class="qz-crumb" data-to="' + k + '" title="Go back to this choice">' + esc(s.opt.piece ? 'Your piece' : s.opt.label) + '</button>' : '';
      }).join('') + '</div>' + (picks.length ? '<button type="button" class="qz-back" data-a="back">&larr; ' + esc(T.back) + '</button>' : '') + '</div>';
    }
    function said() {
      return aside ? '<div class="qz-guide">' + (guide && guide.img ? '<img src="' + esc(guide.img) + '" alt="">' : '') + '<p><b>' + esc(guide ? guide.name : '') + '</b>' + esc(aside) + '</p></div>' : '';
    }
    function option(o, k, kind) {
      if (kind === 'words') return '<button type="button" class="qz-opt qz-word" data-k="' + k + '"><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></button>';
      if (kind === 'doors') return '<button type="button" class="qz-opt qz-door" data-k="' + k + '"><span class="qz-arch"' + bg(o.img) + '></span><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></button>';
      if (kind === 'palette') return '<button type="button" class="qz-opt qz-pal" data-k="' + k + '"><span class="qz-img"' + bg(o.img) + '></span><span class="qz-sw">' +
        o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><small>' + esc(cap(o.label)) + '</small></button>';
      return '<button type="button" class="qz-opt qz-tile' + (o.all ? ' qz-all' : '') + '" data-k="' + k + '">' + (o.img ? '<span class="qz-img"' + bg(o.img) + '></span>' : '<span class="qz-img qz-noimg">&#10022;</span>') +
        '<span class="qz-tx"><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></span></button>';
    }

    function draw() {
      if (!ALL.length) { root.innerHTML = '<p>The adventure opens as soon as the first artworks are published.</p>'; return; }
      var nx = next();
      if (!nx) return reveal();
      var st = STEPS[nx.i], opts = nx.opts, scene = st.scene(), back = backdrop(), first = !picks.length;
      root.innerHTML = '<div class="qz">' + trail() +
        (back ? '<div class="qz-scene"' + bg(back) + '><p>' + esc(scene) + '</p></div>' : scene ? '<p class="qz-hook">' + esc(scene) + '</p>' : '') + said() +
        (first && !book.subject ? '<p class="qz-kicker">' + esc(T.kicker) + '</p>' : '') + (first && book.subject && book.em ? '<p class="qz-kicker">Choose your own ' + esc(book.em.toLowerCase()) + '</p>' : '') +
        '<h3 class="adv-title qz-title">' + esc(st.title()) + '</h3><p class="qz-ask">' + esc(st.ask()) + '</p>' +
        '<div class="qz-opts qz-' + st.kind + '">' + opts.map(function (o, k) { return option(o, k, st.kind); }).join('') + '</div>' +
        (st.skip ? '<button type="button" class="qz-skip" data-k="skip">' + esc(st.skip()) + '</button>' : '') + '</div>';
      [].forEach.call(root.querySelectorAll('[data-k]'), function (b) {
        b.onclick = function () {
          var k = b.getAttribute('data-k'), o = k === 'skip' ? null : opts[+k];
          picks.push({ key: st.key, opt: o });
          aside = o && !o.all && guide ? oneOf(T[GUIDE[st.key]], o.label) : '';
          revealed = null; more = false; draw(); focus();
        };
      });
      wire();
    }

    // the reveal: one piece, on the reader's wall, as the lights come up
    function reveal() {
      var left = pool(), chosen = pick('palette'), roomPick = pick('room'), room = roomPick && roomPick.room && roomPick.room.wall;
      var lead = chosen ? chosen.piece : top(left), list = lead ? [lead].concat(similar(lead, left)) : [];
      var p = revealed || list[0], others = list.filter(function (x) { return x !== p; }).slice(0, 3), me = persona();
      if (!p) { root.innerHTML = '<p>Nothing is on this path yet.</p>'; return; }
      root.innerHTML = '<div class="qz qz-reveal">' + trail() +
        '<div class="qz-stage"><div class="qz-hang">' + (room && window.FAASCWall ? '<div class="adv-inroom qz-room" role="button" tabindex="0" aria-label="See ' + esc(p.title) + ' larger, in the room"></div>'
          : '<a class="qz-solo" href="' + esc(p.story) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>') + '</div>' +
        '<div class="qz-lights" aria-hidden="true"><span>' + esc(T.reveal_dim) + '</span></div></div>' +
        '<div class="qz-card"><p class="qz-kicker">' + esc(T.reveal_title) + '</p><h3 class="adv-title qz-title">' + esc(p.title) + '</h3>' +
        (p.why ? '<p class="qz-why">' + esc(p.why) + '</p>' : '') +
        '<div class="qz-buy">' + (p.buy ? '<a class="adv-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') +
        '<a class="adv-story" href="' + esc((p.posts && p.posts[0] && p.posts[0].url) || p.story) + '">' + esc(p.posts && p.posts[0] ? 'Read its story' : 'See this piece') + '</a></div>' +
        (me ? '<div class="qz-you"><b>' + esc(fill(T.reveal_you, { persona: me.who })) + '</b><span>' + esc(me.line) + '</span>' +
          (me.page ? '<button type="button" class="qz-share" data-share>' + esc(T.reveal_share) + '</button>' : '') + '</div>' : '') +
        (others.length ? (more ? '<h4 class="qz-more-t">' + esc(T.more_title) + '</h4><div class="qz-more">' + others.map(function (o, k) {
            return '<button type="button" class="qz-opt qz-tile" data-o="' + k + '"><span class="qz-img"' + bg(o.img) + '></span><span class="qz-tx"><b>' + esc(o.title) + '</b></span></button>'; }).join('') + '</div>'
          : '<button type="button" class="qz-skip" data-more>' + esc(T.reveal_more) + '</button>') : '') +
        '<p class="qz-note">' + esc(T.end_note) + (room && Q.myroom ? ' <a href="' + esc(Q.myroom) + '">Try it on a photo of your own wall.</a>' : '') + '</p>' +
        '<button type="button" class="qz-skip" data-a="again">' + esc(T.again) + '</button></div></div>';
      if (room && window.FAASCWall) {
        var el = root.querySelector('.qz-room'), piece = { title: p.title, img: p.img, buy: p.buy, max_in: p.max_in, story: p.story };
        window.FAASCWall.render(el, { piece: piece, rooms: [room], room: room.slug, compact: true });
        var big = function () { window.FAASCWall.open({ piece: piece, rooms: [room], room: room.slug, cta: cfg.cta }); };
        el.onclick = big; el.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); big(); } };
      }
      var mb = root.querySelector('[data-more]'); if (mb) mb.onclick = function () { more = true; reveal(); };
      [].forEach.call(root.querySelectorAll('[data-o]'), function (b) { b.onclick = function () { revealed = others[+b.getAttribute('data-o')]; more = false; reveal(); focus(); }; });
      var sh = root.querySelector('[data-share]');
      if (sh) sh.onclick = function () {
        var url = new URL(me.page, location.href).href, text = fill(T.reveal_you, { persona: me.who }).replace(/^You're/, "I'm") + ' ' + me.line;
        if (navigator.share) navigator.share({ title: text, text: text, url: url }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(function () { sh.textContent = T.reveal_shared; });
        else window.open(url, '_blank');
      };
      wire();
    }

    function wire() {
      [].forEach.call(root.querySelectorAll('[data-a]'), function (b) {
        b.onclick = function () { if (b.getAttribute('data-a') === 'again') picks = []; else picks.pop(); aside = ''; revealed = null; more = false; draw(); focus(); };
      });
      [].forEach.call(root.querySelectorAll('[data-to]'), function (b) {
        b.onclick = function () { picks = picks.slice(0, +b.getAttribute('data-to')); aside = ''; revealed = null; more = false; draw(); focus(); };
      });
    }
    function focus() { var t = root.querySelector('.qz-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' }); }
    draw();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-adventure[data-adventure]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

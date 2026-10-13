/* Choose Your Own Art Adventure: a quick quiz that adapts as you answer, told as a very short story.
     1 What are you into?  a subject, or all of it (a subject's own book page starts at 2)
     2 Pick a door         the subject's story in two lines, then Abstract, Reality or Black & White, or open them all;
                           each door shows a piece of that subject that looks like a way in
     3 Go deeper           the subject's subsections (for all of it, its collections): words only
     4 Where's it going?   the rooms the pieces still on the path are approved for, as room photos
     5 Which one stops you? a few pieces of different colours, each with its palette; the one tapped comes first
                           in the results, then the pieces most like it, hung in the chosen room at true size
   A step with fewer than two answers left is skipped, so every path ends in art.
   cfg = {items, cta, book: {subject, em, line}, words: {text, doors, subs},
          quiz: {bw, hook_all, subjects: [{key, label, hook, img, href}], doors: {subject: {abstract, reality, bw}},
                 rooms: [{name, img, wall}], subs: {name: line}, myroom}}
   item = {title, img, story, buy, why, posts, subject, sections, sub, rooms, abs, bw, color, max_in}
   Without quiz data (the WordPress plugin) the subjects come from the items and the deeper and room steps are skipped. */
(function () {
  var T = {"kicker": "Find the art for your wall", "title": "Choose your own art adventure", "q1_title": "What are you into?",
    "q1_ask": "Pick a world. Five taps, and your piece finds you.", "all_label": "Show me everything", "all_sub": "All {n} pieces. I like surprises.",
    "doors_title": "Pick a door", "doors_ask": "One of them hides your piece.", "open_all": "Open them all",
    "deeper_title": "Go deeper", "deeper_ask": "Which way pulls you in?", "deeper_skip": "Surprise me", "sub_default": "{n} pieces down this path",
    "room_title": "Where's it going?", "room_ask": "Pick the room. Your piece will hang right there, at its real size.", "room_skip": "Somewhere else",
    "palette_title": "Which one stops you?", "palette_ask": "Don't think. Tap the one you can't stop looking at.",
    "end_one_title": "This one's yours.", "end_many_title": "Your top {n}", "end_line": "The one you picked, then the ones most like it.",
    "end_inroom": "Hanging in your {room}, at their real size.", "end_note": "Every print is made to order by Fine Art America, with a 30-day money-back guarantee.",
    "more": "Show me more", "again": "Start over", "back": "Back",
    "react": "Good eye.\nOoh, nice.\nYes. That one.\nBold. We like it.\nNow we're getting somewhere.\nStrong pick.\nYou've done this before."};
  var DOORS = { abstract: { label: 'Abstract', sub: 'Colour and shape that make guests ask, what is that?' },
    reality: { label: 'Reality', sub: 'A real place or thing, only sharper.' }, bw: { label: 'Black & White', sub: 'Light, shadow, nothing else.' } };
  var HEX = { red: '#c0392b', orange: '#e67e22', yellow: '#f1c40f', gold: '#c9a227', green: '#3e8e41', turquoise: '#1abc9c', teal: '#008080',
    blue: '#2e6fbf', purple: '#7d4bb3', pink: '#e58ab0', brown: '#7a5230', black: '#191919', white: '#f7f7f2', gray: '#8c8c8c' };
  var SHOW = 8;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(s, k) { return String(s).replace('{n}', k); }
  function pieces(k) { return k + (k === 1 ? ' piece' : ' pieces'); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function bg(u) { return u ? ' style="background-image:url(\'' + esc(u).replace(/'/g, '%27') + '\')"' : ''; }
  function words(w) {        // the words as changed in the Studio, laid over these
    if (!w) return;
    var t = w.text || {}; for (var k in t) if (t[k]) T[k] = t[k];
    var d = w.doors || {}; for (var c in d) if (DOORS[c]) { DOORS[c].label = d[c].label || DOORS[c].label; DOORS[c].sub = d[c].sub || DOORS[c].sub; }
  }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-adventure')), Q = cfg.quiz || {}, book = cfg.book || {}, ALL = (cfg.items || []).filter(function (p) { return p.img; });
    words(cfg.words);
    var BW = Q.bw || 'Black & White', SUBS = Q.subs || {}, reacts = String(T.react || '').split('\n').filter(Boolean);
    var subjects = Q.subjects || uniq(ALL.map(function (p) { return p.subject; })).map(function (s) { return { key: s, label: s }; });
    var picks = [], shown = SHOW, reaction = '';
    // where the reader is: each answer narrows the pieces on the path
    function inSubject(p, key) { return !key || (p.sections ? p.sections.indexOf(key) >= 0 : p.subject === key); }
    function subjectKey() { var s = pick('subject'); return book.subject || (s ? s.v : ''); }
    function catOf(p) { return subjectKey() !== BW && p.bw ? 'bw' : (p.abs ? 'abstract' : 'reality'); }
    function pick(key) { for (var i = 0; i < picks.length; i++) if (picks[i].key === key) return picks[i].opt; return null; }
    function pool() { return picks.reduce(function (list, s) { return s.opt && s.opt.test ? list.filter(s.opt.test) : list; }, book.subject ? ALL.filter(function (p) { return inSubject(p, book.subject); }) : ALL); }
    function uniq(xs) { var o = []; xs.forEach(function (x) { if (x && o.indexOf(x) < 0) o.push(x); }); return o; }
    function count(list, f) { var c = {}; list.forEach(function (p) { [].concat(f(p) || []).forEach(function (v) { if (v) c[v] = (c[v] || 0) + 1; }); }); return c; }
    function shuffle(xs) { xs = xs.slice(); for (var i = xs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = xs[i]; xs[i] = xs[j]; xs[j] = t; } return xs; }

    // the five steps; each returns its options for the pieces still on the path, or null when it has nothing to ask
    var STEPS = [
      { key: 'subject', kind: 'tiles', title: function () { return T.q1_title; }, ask: function () { return T.q1_ask; },
        options: function (left) {
          if (book.subject) return null;
          var o = subjects.map(function (s) { var k = left.filter(function (p) { return inSubject(p, s.key); }).length;
            return k ? { v: s.key, label: s.label, sub: pieces(k), img: s.img, test: function (p) { return inSubject(p, s.key); } } : null; }).filter(Boolean);
          return o.length > 1 ? o.concat([{ v: '', label: T.all_label, sub: n(T.all_sub, left.length), all: true }]) : null;
        } },
      { key: 'door', kind: 'doors', title: function () { return T.doors_title; },
        ask: function () { var s = subjectKey(), sj = subjects.filter(function (x) { return x.key === s; })[0];
          return '<span class="qz-hook">' + esc(sj && sj.hook || (s ? book.line : Q.hook_all) || '') + '</span> ' + esc(T.doors_ask); },
        options: function (left) {
          var pics = (Q.doors || {})[subjectKey()] || {}, c = count(left, catOf);
          var o = ['abstract', 'reality', 'bw'].filter(function (k) { return c[k]; }).map(function (k) {
            var own = left.filter(function (p) { return catOf(p) === k; });
            return { v: DOORS[k].label, label: DOORS[k].label, sub: DOORS[k].sub, img: pics[k] || own[0].img, test: function (p) { return catOf(p) === k; } };
          });
          return o.length > 1 ? o : null;
        }, skip: function () { return T.open_all; } },
      { key: 'deeper', kind: 'words', title: function () { return T.deeper_title; }, ask: function () { return T.deeper_ask; },
        options: function (left) {
          var o;
          if (subjectKey()) {        // the subject's subsections
            var c = count(left, function (p) { return p.sub; });
            o = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 6).map(function (s) {
              return { v: s, label: s, sub: SUBS[s] || n(T.sub_default, c[s]).replace(/^1 pieces/, '1 piece'), test: function (p) { return p.sub === s; } }; });
          } else {                   // everything: its collections
            o = subjects.map(function (s) { var k = left.filter(function (p) { return inSubject(p, s.key); }).length;
              return k ? { v: s.label, label: s.label, sub: s.hook ? s.hook.split('. ')[0].replace(/\.$/, '') + '.' : n(T.sub_default, k), test: function (p) { return inSubject(p, s.key); } } : null; }).filter(Boolean);
          }
          return o.length > 1 ? o : null;
        }, skip: function () { return T.deeper_skip; } },
      { key: 'room', kind: 'rooms', title: function () { return T.room_title; }, ask: function () { return T.room_ask; },
        options: function (left) {
          var c = count(left, function (p) { return p.rooms; });
          var o = (Q.rooms || []).filter(function (r) { return c[r.name]; }).map(function (r) {
            return { v: r.name, label: r.name, sub: pieces(c[r.name]) + ' made for it', img: r.img, room: r, test: function (p) { return (p.rooms || []).indexOf(r.name) >= 0; } }; });
          return o.length > 1 ? o : null;
        }, skip: function () { return T.room_skip; } },
      { key: 'palette', kind: 'palette', title: function () { return T.palette_title; }, ask: function () { return T.palette_ask; },
        options: function (left) {
          if (left.length < 2) return null;
          // a piece for each main colour still on the path, the strongest of each, the rarest colours first
          var by = {}; left.forEach(function (p) { var c = (p.color || [])[0] || 'other'; (by[c] = by[c] || []).push(p); });
          var fams = Object.keys(by).sort(function (a, b) { return by[a].length - by[b].length; });
          var o = shuffle(fams.slice(0, 6)).slice(0, 4).map(function (f) { var p = by[f][Math.floor(Math.random() * Math.min(3, by[f].length))];
            return { v: p.title, label: (p.color || []).slice(0, 3).join(', '), piece: p, img: p.img, sw: (p.color || []).slice(0, 4).map(function (c) { return HEX[c] || '#999'; }) }; });
          if (o.length < 2) o = left.slice(0, 4).map(function (p) { return { v: p.title, label: (p.color || []).slice(0, 3).join(', '), piece: p, img: p.img, sw: (p.color || []).slice(0, 4).map(function (c) { return HEX[c] || '#999'; }) }; });
          return o.length > 1 ? o : null;
        } }
    ];

    function next() {          // the next step with something to ask
      var left = pool(), from = picks.length ? STEPS.map(function (s) { return s.key; }).indexOf(picks[picks.length - 1].key) + 1 : 0;
      if (left.length < 2) return null;
      for (var i = from; i < STEPS.length; i++) { var o = STEPS[i].options(left); if (o) return { i: i, opts: o }; }
      return null;
    }
    function ahead(i) {        // how many steps could still come, for the progress bar
      var k = 0; for (var j = i + 1; j < STEPS.length; j++) if (STEPS[j].key !== 'subject' || !book.subject) k++; return k;
    }
    function similar(first, list) {      // the pieces most like the one the reader picked
      var fc = first.color || [];
      function score(p) {
        var s = 0, pc = p.color || [];
        if (pc[0] && pc[0] === fc[0]) s += 4;
        pc.forEach(function (c) { if (fc.indexOf(c) >= 0) s += 1.5; });
        if (p.sub && p.sub === first.sub) s += 2;
        if (p.subject === first.subject) s += 1;
        if (!!p.abs === !!first.abs) s += 1;
        if (!!p.bw === !!first.bw) s += 1;
        if (p.shape && p.shape === first.shape) s += .5;
        return s;
      }
      return list.filter(function (p) { return p !== first; }).map(function (p) { return [score(p), p]; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
    }

    function bar(done, total) {
      return '<div class="qz-top"><div class="qz-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '"><i style="width:' + Math.round(100 * done / Math.max(1, total)) + '%"></i></div>' +
        (picks.length ? '<button type="button" class="qz-back" data-a="back">&larr; ' + esc(T.back) + '</button>' : '') + '</div>';
    }
    function option(o, k, kind) {
      if (kind === 'words') return '<button type="button" class="qz-opt qz-word" data-k="' + k + '"><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></button>';
      if (kind === 'doors') return '<button type="button" class="qz-opt qz-door" data-k="' + k + '"><span class="qz-arch"' + bg(o.img) + '></span><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></button>';
      if (kind === 'palette') return '<button type="button" class="qz-opt qz-pal" data-k="' + k + '"><span class="qz-img"' + bg(o.img) + '></span><span class="qz-sw">' +
        o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><small>' + esc(cap(o.label)) + '</small></button>';
      return '<button type="button" class="qz-opt qz-tile' + (o.all ? ' qz-all' : '') + '" data-k="' + k + '">' + (o.img ? '<span class="qz-img"' + bg(o.img) + '></span>' : '<span class="qz-img qz-noimg">&#10022;</span>') +
        '<span class="qz-tx"><b>' + esc(o.label) + '</b><small>' + esc(o.sub) + '</small></span></button>';
    }

    function draw(keep) {
      if (keep !== true) shown = SHOW;
      if (!ALL.length) { root.innerHTML = '<p>The adventure opens as soon as the first artworks are published.</p>'; return; }
      var nx = next(), done = picks.length, total = done + (nx ? 1 + ahead(nx.i) : 0), html = '<div class="qz">';
      if (nx) {
        var st = STEPS[nx.i], opts = nx.opts;
        html += bar(done, total) + (reaction ? '<p class="qz-react">' + esc(reaction) + '</p>' : '') +
          (!done && !book.subject ? '<p class="qz-kicker">' + esc(T.kicker) + '</p>' : '') +
          (!done && book.subject && book.em ? '<p class="qz-kicker">Choose your own ' + esc(book.em.toLowerCase()) + '</p>' : '') +
          '<h3 class="adv-title qz-title">' + esc(st.title()) + '</h3><p class="qz-ask">' + (st.key === 'door' ? st.ask() : esc(st.ask())) + '</p>' +
          '<div class="qz-opts qz-' + st.kind + '">' + opts.map(function (o, k) { return option(o, k, st.kind); }).join('') + '</div>' +
          (st.skip ? '<button type="button" class="qz-skip" data-k="skip">' + esc(st.skip()) + '</button>' : '');
        root.innerHTML = html + '</div>';
        [].forEach.call(root.querySelectorAll('[data-k]'), function (b) {
          b.onclick = function () {
            var k = b.getAttribute('data-k');
            picks.push({ key: st.key, opt: k === 'skip' ? null : opts[+k] });
            reaction = k === 'skip' ? '' : reacts[Math.floor(Math.random() * reacts.length)] || '';
            draw(); focus();
          };
        });
      } else {
        // the results: the piece the reader picked first, then the pieces most like it, in the room they chose
        var chosen = pick('palette'), roomPick = pick('room'), room = roomPick && roomPick.room && roomPick.room.wall, left = pool(), list;
        if (chosen) {
          var wider = left.length >= SHOW ? left : uniq(left.concat(ALL.filter(function (p) { return inSubject(p, subjectKey()); })).concat(ALL));
          list = [chosen.piece].concat(similar(chosen.piece, wider));
        } else list = left;
        html += bar(total, total) + (reaction ? '<p class="qz-react">' + esc(reaction) + '</p>' : '') +
          '<h3 class="adv-title qz-title">' + esc(list.length === 1 ? T.end_one_title : n(T.end_many_title, Math.min(shown, list.length))) + '</h3>' +
          '<p class="qz-ask">' + esc(chosen ? T.end_line : '') + (room ? ' ' + esc(n(T.end_inroom, '').replace('{room}', roomPick.label.toLowerCase())) : '') + '</p>' +
          '<div class="adv-found qz-found">' + list.slice(0, shown).map(function (p, k) {
            return '<div class="adv-piece' + (k === 0 && chosen ? ' qz-first' : '') + '">' + (room && window.FAASCWall ? '<div class="adv-inroom" data-r="' + k + '" role="button" tabindex="0" aria-label="See ' + esc(p.title) + ' larger, in the room"></div>'
              : '<a href="' + esc(p.story) + '"><img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"></a>') +
              '<div class="adv-pb"><div class="adv-pt">' + esc(p.title) + '</div>' + (p.why ? '<div class="adv-pd">' + esc(p.why) + '</div>' : '') +
              ((p.posts && p.posts.length) ? p.posts.map(function (s) { return '<a class="adv-story" href="' + esc(s.url) + '">Read: ' + esc(s.title) + '</a>'; }).join('') : '<a class="adv-story" href="' + esc(p.story) + '">See this piece</a>') +
              (p.buy ? '<a class="adv-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta) + '</a>' : '') + '</div></div>';
          }).join('') + '</div>' + (list.length > shown ? '<button type="button" class="adv-more">' + esc(T.more) + '</button>' : '') +
          (room && Q.myroom ? '<p class="qz-note"><a href="' + esc(Q.myroom) + '">Try them on a photo of your own wall</a></p>' : '') +
          '<p class="qz-note">' + esc(T.end_note) + '</p><div class="qz-end"><button type="button" class="qz-skip" data-a="again">' + esc(T.again) + '</button></div>';
        root.innerHTML = html + '</div>';
        var mb = root.querySelector('.adv-more'); if (mb) mb.onclick = function () { shown += SHOW; draw(true); };
        if (room && window.FAASCWall) [].forEach.call(root.querySelectorAll('.adv-inroom'), function (el) {
          var p = list[+el.getAttribute('data-r')], piece = { title: p.title, img: p.img, buy: p.buy, max_in: p.max_in, story: p.story };
          window.FAASCWall.render(el, { piece: piece, rooms: [room], room: room.slug, compact: true });
          var big = function () { window.FAASCWall.open({ piece: piece, rooms: [room], room: room.slug, cta: cfg.cta }); };
          el.onclick = big; el.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); big(); } };
        });
      }
      [].forEach.call(root.querySelectorAll('[data-a]'), function (b) {
        b.onclick = function () { if (b.getAttribute('data-a') === 'again') picks = []; else picks.pop(); reaction = ''; draw(); focus(); };
      });
    }
    function focus() { var t = root.querySelector('.qz-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' }); }
    draw();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-adventure[data-adventure]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* The Gallery curator. No AI and no server: it works from the classification each piece already carries
   (subject, colour families, shape, largest print size, the desire it answers).
   One main question, two or three follow-ups, results hung on a gallery wall with the reason each one fits,
   then "would you like to see anything else?". Also answers print, framing, size and hanging questions
   from a written guide, and can show a piece on a wall at true scale. */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ABSTRACT = ['Abstract Glass Macro', 'Contemporary Abstract & Mixed Media', 'Spiritual, Mandala & Symbolic'];
  var SHORT = { 'Pacific Northwest Landscapes': 'Pacific Northwest landscape', 'Abstract Glass Macro': 'handblown glass, photographed up close', 'Contemporary Abstract & Mixed Media': 'layered abstract', 'Botanical & Flowers': 'flowers and leaves', 'Butterflies, Birds & Wildlife': 'butterflies, birds and wildlife', 'Spiritual, Mandala & Symbolic': 'mandala and symbol', 'Travel / Specialty / Projects': 'travel and far places' };
  var WALL = {
    'horizontal': ['The wide wall over a sofa or bed', 'Wide format, made for the wall over a sofa or bed'],
    'panoramic horizontal': ['A long run: hallway, above a headboard', 'A true panorama for a long run of wall'],
    'vertical': ['A tall, narrow wall: entry, stairs, beside a door', 'Tall format for a narrow wall'],
    'panoramic vertical': ['A slim floor-to-ceiling column', 'A slim vertical for a column of wall'],
    'square': ['A balanced spot: nook, bath, or a pair', 'Square, easy to pair or centre']
  };
  var MOODS = [
    { k: 'warm', label: 'Warm and glowing', sub: 'Ember, amber, gold', colors: ['red', 'orange', 'gold', 'yellow'], sw: ['#c0392b', '#e67e22', '#c9a227'], fit: 'warm, glowing colour' },
    { k: 'cool', label: 'Cool and clear', sub: 'River, sky and leaf', colors: ['blue', 'turquoise', 'teal', 'green'], sw: ['#2e6fbf', '#1abc9c', '#3e8e41'], fit: 'cool blues and greens' },
    { k: 'jewel', label: 'Jewel and dusk', sub: 'Violet, plum and rose', colors: ['purple', 'pink'], sw: ['#7d4bb3', '#e58ab0', '#4b2a7a'], fit: 'jewel tones' },
    { k: 'earth', label: 'Earth and quiet', sub: 'Stone, wood, snow, shadow', colors: ['brown', 'black', 'white', 'gray'], sw: ['#7a5230', '#8c8c8c', '#f7f7f2'], fit: 'quiet earth tones' }
  ];
  function hasMood(p, m) { return (p.color || []).some(function (c) { return m.colors.indexOf(String(c).toLowerCase()) >= 0; }); }
  function isAbs(p) { return ABSTRACT.indexOf(p.subject) >= 0; }
  function opt(label, sub, test, fit, extra) { var o = { label: label, sub: sub, test: test, fit: fit }; for (var k in (extra || {})) o[k] = extra[k]; return o; }

  /* ---- follow-up questions ---- */
  var Q = {
    wall: { ask: 'Which wall is it for?', tag: 'Wall', options: function (pool) { return Object.keys(WALL).map(function (v) { return opt(WALL[v][0], '', function (p) { return p.shape === v; }, WALL[v][1]); }); } },
    feel: { ask: 'How should the room feel when you walk in?', tag: 'Feeling', options: function () { return MOODS.map(function (m) { return opt(m.label, m.sub, function (p) { return hasMood(p, m); }, m.fit, { sw: m.sw }); }); } },
    palette: { ask: 'What palette is the room or project built on?', tag: 'Palette', options: function () { return MOODS.map(function (m) { return opt(m.label, m.sub, function (p) { return hasMood(p, m); }, m.fit, { sw: m.sw }); }); } },
    world: { ask: 'Do you want something you can name, or something you can only feel?', tag: 'Kind', options: function () { return [
      opt('Something real', 'A place, a flower, a creature', function (p) { return !isAbs(p); }, ''),
      opt('Something abstract', 'Colour, light and pattern', isAbs, '')]; } },
    place: { ask: 'What should the walls say about the place?', tag: 'Subject', options: function (pool) {
      var seen = []; pool.forEach(function (p) { if (seen.indexOf(p.subject) < 0) seen.push(p.subject); });
      return seen.sort().map(function (s) { var n = SHORT[s] || s; return opt(n.charAt(0).toUpperCase() + n.slice(1), '', function (p) { return p.subject === s; }, ''); }); } },
    scale: { ask: 'How large do the pieces need to go?', tag: 'Scale', options: function () { return [
      opt('Statement size', 'Four feet or more on the long side', function (p) { return p.max_in >= 48; }, 'holds up at statement size'),
      opt('Any size', 'Small and mid-size are fine', function () { return true; }, '')]; } },
    who: { ask: 'Who is it for?', tag: 'For', options: function () { return [
      opt('Someone who loves being outdoors', 'Trails, rivers, gardens, birds', function (p) { return !isAbs(p); }, 'for someone who loves the outdoors'),
      opt('Someone who loves colour', 'Bold rooms, bright things', function (p) { return p.subject === 'Abstract Glass Macro' || p.subject === 'Contemporary Abstract & Mixed Media'; }, 'for someone who loves colour'),
      opt('Someone thoughtful and inward', 'Pattern, symbol, stillness', function (p) { return p.subject === 'Spiritual, Mandala & Symbolic'; }, 'for someone reflective')]; } }
  };
  var PATHS = [
    { k: 'home', label: 'A piece for one wall', sub: 'I have a spot in mind at home', steps: ['wall', 'feel', 'world'], intro: 'One wall, one piece.' },
    { k: 'pro', label: 'Several pieces that belong together', sub: 'I am an interior designer, or furnishing a lodge, inn or rental', steps: ['palette', 'place', 'scale'], intro: 'A set for a project.' },
    { k: 'gift', label: 'A gift that means something', sub: 'For a person, not a wall I have seen', steps: ['who', 'feel'], intro: 'A gift.' },
    { k: 'look', label: 'I am just looking', sub: 'Walk me through the collection', steps: [], intro: 'A walk through the collection.' }
  ];

  /* ---- the written guide (no AI): print type, framing, size, hanging, sets, ordering ---- */
  var GUIDE = [
    { k: 'medium', title: 'Which print type should I choose?', words: ['medium', 'canvas', 'metal', 'acrylic', 'paper', 'wood', 'print type', 'material', 'poster', 'which print', 'glossy', 'matte', 'glare'],
      body: ['Fine Art America prints each piece to order in several materials. You choose on the product page after you press the buy button.',
        '<b>Canvas</b> has a soft, textured surface and no glass, so there is no glare. It arrives stretched and ready to hang, and it is the easiest choice for a large piece or a bright room.',
        '<b>Metal</b> is smooth and vivid, with deep saturated colour. It suits my glass macro and abstract work especially well, looks modern, and wipes clean, so it is a good choice for kitchens and baths.',
        '<b>Acrylic</b> has the most depth and glow, the look you see in galleries. It is reflective, so it is happiest on a wall without direct sun or a lamp pointed at it.',
        '<b>Framed print</b> is the classic: paper, a mat if you want one, and a frame. It suits traditional rooms and smaller walls.',
        '<b>Art print or poster</b> is the paper alone, the most affordable way in, for a frame you already own.'] },
    { k: 'framing', title: 'Does it need a frame?', words: ['frame', 'framing', 'framed', 'mat', 'matting', 'float'],
      body: ['Canvas, metal and acrylic do not need a frame. They hang as they are and look finished.',
        'If you want a frame, a framed print lets you pick the frame and mat on Fine Art America, and you see a preview before you order.',
        'A simple rule: match the frame to something already in the room, such as the wood of the furniture or the metal of the lamps and handles. Black, white and natural wood are safe with almost any piece.',
        'Remember that a mat and frame add to the outside size. If the wall is tight, check the finished size, not only the print size.'] },
    { k: 'size', title: 'What size should I order?', words: ['size', 'how big', 'how large', 'too small', 'too big', 'dimensions', 'inches', 'measure', 'large enough'],
      body: ['Over a sofa, bed or console, aim for a piece about two thirds to three quarters as wide as the furniture beneath it. Over a 7 foot sofa that is roughly 56 to 63 inches.',
        'The most common mistake is going too small. If you are between two sizes, the larger one is usually right.',
        'Test it before you buy: mark the outside size on the wall with painter\'s tape and live with it for a day.',
        'Each piece here shows the largest size it prints at well. Open a piece and choose "See it on a wall" to compare sizes over a sofa.'] },
    { k: 'hang', title: 'How high should I hang it?', words: ['hang', 'hanging', 'height', 'how high', 'eye level', 'above the sofa', 'above sofa'],
      body: ['Hang it so the centre of the piece is about 57 to 60 inches from the floor, which is eye level for most people.',
        'Above furniture, leave about 6 to 10 inches between the top of the furniture and the bottom of the piece, so the two read as one group.',
        'In a stairwell or hallway, where people are moving, you can go a little higher.'] },
    { k: 'sets', title: 'How do I hang several pieces together?', words: ['set', 'pair', 'group', 'together', 'triptych', 'several', 'gallery wall', 'multiple'],
      body: ['Choose pieces that share one thing: a colour family, a subject or a shape. The Gallery can find those for you: choose "Several pieces that belong together".',
        'Order them in the same material and the same frame, so the set reads as one.',
        'Hang them 2 to 3 inches apart and treat the whole group as a single piece when you centre it on the wall.'] },
    { k: 'order', title: 'How does ordering work?', words: ['order', 'ordering', 'ship', 'shipping', 'return', 'returns', 'guarantee', 'buy', 'price', 'cost', 'deliver', 'delivery', 'how long'],
      body: ['Every buy button here opens that piece on Fine Art America, where you choose the material, size and frame and see the price before you pay.',
        'Fine Art America makes the print, ships it and stands behind it. Their current prices, delivery times and return terms are shown on their site at checkout.'] }
  ];

  /* ---- reading a typed request ---- */
  var COLORWORDS = { red: 'red', crimson: 'red', scarlet: 'red', orange: 'orange', amber: 'orange', gold: 'gold', golden: 'gold', yellow: 'yellow', blue: 'blue', navy: 'blue', turquoise: 'turquoise', aqua: 'turquoise', teal: 'teal', green: 'green', purple: 'purple', violet: 'purple', plum: 'purple', pink: 'pink', rose: 'pink', brown: 'brown', tan: 'brown', black: 'black', white: 'white', gray: 'gray', grey: 'gray', neutral: 'gray' };
  var SUBJWORDS = [
    [['landscape', 'mountain', 'mountains', 'river', 'lake', 'trail', 'valley', 'methow', 'cascades', 'forest', 'trees', 'sky', 'sunset', 'sunrise', 'snow', 'nature', 'scenery', 'outdoors'], 'Pacific Northwest Landscapes'],
    [['glass', 'macro'], 'Abstract Glass Macro'],
    [['abstract', 'modern', 'contemporary', 'painting', 'layered'], 'Contemporary Abstract & Mixed Media'],
    [['flower', 'flowers', 'floral', 'botanical', 'leaf', 'leaves', 'garden', 'rose', 'bloom'], 'Botanical & Flowers'],
    [['butterfly', 'butterflies', 'bird', 'birds', 'wildlife', 'animal', 'animals', 'bluebird', 'owl', 'deer'], 'Butterflies, Birds & Wildlife'],
    [['mandala', 'spiritual', 'symbol', 'symbolic', 'meditation', 'yoga', 'zen', 'chakra', 'sacred'], 'Spiritual, Mandala & Symbolic'],
    [['travel', 'building', 'architecture', 'door', 'desert', 'beach', 'city'], 'Travel / Specialty / Projects']
  ];
  var SHAPEWORDS = [[['panoramic', 'panorama', 'hallway', 'headboard'], 'panoramic horizontal'], [['wide', 'horizontal', 'sofa', 'couch', 'bed', 'bedroom', 'mantel', 'fireplace'], 'horizontal'], [['tall', 'vertical', 'narrow', 'stairs', 'stairwell', 'entry', 'entryway', 'portrait'], 'vertical'], [['square'], 'square']];
  var STOP = 'a an the for of to in on my our i we me is are it that this with and or something some art piece pieces picture pictures print prints wall walls looking look want need would like find show have room please help can you do what which any'.split(' ');
  function readRequest(text, ALL) {
    var t = ' ' + text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ') + ' ', words = t.trim().split(/\s+/), filters = [], used = {};
    function score(g) { var n = 0; g.words.forEach(function (w) { if (t.indexOf(' ' + w + ' ') >= 0 || (w.indexOf(' ') > 0 && t.indexOf(w) >= 0)) n += w.length; }); return n; }
    var topics = GUIDE.filter(score).sort(function (x, y) { return score(y) - score(x); });
    var path = /designer|decorator|client|lodge|inn |rental|airbnb|hotel|office|staging/.test(t) ? 'pro' : /gift|present|birthday|wedding|anniversary|housewarming/.test(t) ? 'gift' : '';
    var cols = []; words.forEach(function (w) { if (COLORWORDS[w] && cols.indexOf(COLORWORDS[w]) < 0) { cols.push(COLORWORDS[w]); used[w] = 1; } });
    if (/\bwarm\b/.test(t)) { cols = cols.concat(MOODS[0].colors); used.warm = 1; } if (/\bcool\b|calm|serene|peaceful/.test(t)) { cols = cols.concat(MOODS[1].colors); used.cool = used.calm = used.serene = used.peaceful = 1; }
    if (cols.length) filters.push({ tag: 'Colour', label: cols.slice(0, 3).join(', '), fit: 'in the ' + cols.slice(0, 2).join(' and ') + ' you asked for', test: function (p) { return (p.color || []).some(function (c) { return cols.indexOf(String(c).toLowerCase()) >= 0; }); } });
    var subs = []; SUBJWORDS.forEach(function (r) { r[0].forEach(function (w) { if (words.indexOf(w) >= 0 && !(w === 'rose' && used.rose)) { if (subs.indexOf(r[1]) < 0) subs.push(r[1]); used[w] = 1; } }); });
    if (subs.length) filters.push({ tag: 'Subject', label: subs.map(function (s) { return SHORT[s]; }).join(' or '), fit: '', test: function (p) { return subs.indexOf(p.subject) >= 0; } });
    var shape = ''; SHAPEWORDS.forEach(function (r) { r[0].forEach(function (w) { if (!shape && words.indexOf(w) >= 0) { shape = r[1]; used[w] = 1; } }); });
    if (shape) filters.push({ tag: 'Wall', label: WALL[shape][0], fit: WALL[shape][1], test: function (p) { return p.shape === shape || (shape === 'horizontal' && p.shape === 'panoramic horizontal'); } });
    if (/\b(large|big|huge|oversize|oversized|statement)\b/.test(t)) { filters.push({ tag: 'Scale', label: 'Statement size', fit: 'holds up at statement size', test: function (p) { return p.max_in >= 48; } }); ['large', 'big', 'huge', 'oversize', 'oversized', 'statement'].forEach(function (w) { used[w] = 1; }); }
    var rest = words.filter(function (w) { return w.length > 2 && !used[w] && STOP.indexOf(w) < 0 && !topics.some(function (g) { return g.words.indexOf(w) >= 0; }) && !/designer|decorator|gift|present/.test(w); });
    rest.forEach(function (w) { if (ALL.some(function (p) { return ((p.text || '') + ' ' + p.title).toLowerCase().indexOf(w) >= 0; })) filters.push({ tag: 'Mentions', label: w, fit: '', test: function (p) { return ((p.text || '') + ' ' + p.title).toLowerCase().indexOf(w) >= 0; } }); });
    return { topics: topics, filters: filters, path: path };
  }

  function start(root) {
    var cfg = JSON.parse(root.getAttribute('data-curator')), ALL = cfg.items || [], ROOMS = cfg.rooms || [];
    var path = null, answers = [], stepAt = 0, shown = 6, note = '';
    function pool(upTo) { var l = ALL; answers.forEach(function (a, i) { if (a && (upTo == null || i < upTo)) l = l.filter(a.test); }); return l; }
    function nextStep() {
      while (path && stepAt < path.steps.length) {
        var q = Q[path.steps[stepAt]], left = pool(), opts = q.options(left).filter(function (o) { var n = left.filter(o.test).length; return n > 0; });
        if (left.length > 1 && opts.length > 1 && opts.some(function (o) { return left.filter(o.test).length < left.length; })) return { q: q, opts: opts, left: left };
        answers.push(null); stepAt++;
      }
      return null;
    }
    function crumbs() { var c = answers.filter(Boolean).map(function (a) { return '<span><b>' + esc(a.tag) + ':</b> ' + esc(a.label) + '</span>'; }); return c.length ? '<div class="cur-crumbs">' + c.join('') + '</div>' : ''; }
    function topicChips() { return '<div class="cur-topics"><span>Or ask about:</span>' + GUIDE.map(function (g) { return '<button type="button" data-topic="' + g.k + '">' + esc(g.title.replace(/\?$/, '')) + '</button>'; }).join('') + '</div>'; }
    function hall() {
      path = null; answers = []; stepAt = 0; shown = 6; note = '';
      root.innerHTML = '<div class="cur-wall cur-hall"><div class="cur-plaque">The Gallery</div><h2 class="cur-ask" tabindex="-1">What are you looking for?</h2>' +
        '<p class="cur-lead">Tell me in a few words, or choose a way in. I will pull the pieces that fit and tell you why.</p>' +
        '<form class="cur-form"><input type="text" class="cur-in" aria-label="What are you looking for?" placeholder="For example: something blue and wide for over the sofa" maxlength="140"><button type="submit">Show me</button></form>' +
        '<div class="cur-ways">' + PATHS.map(function (p, i) { return '<button type="button" class="cur-way" data-p="' + i + '"><b>' + esc(p.label) + '</b><small>' + esc(p.sub) + '</small></button>'; }).join('') + '</div>' + topicChips() + '</div>';
      bind();
    }
    function ask() {
      var nx = nextStep(); if (!nx) return results();
      var n = answers.length + 1;
      root.innerHTML = '<div class="cur-wall"><div class="cur-plaque">' + esc(path.intro) + '</div>' + crumbs() + '<h2 class="cur-ask" tabindex="-1">' + esc(nx.q.ask) + '</h2>' +
        '<div class="cur-opts">' + nx.opts.map(function (o, i) {
          var pic = ''; nx.left.some(function (p) { if (p.img && o.test(p)) { pic = p.img; return true; } });
          return '<button type="button" class="cur-opt" data-o="' + i + '">' + (pic ? '<span class="cur-pic"><img loading="lazy" src="' + esc(pic) + '" alt=""></span>' : '') +
            (o.sw ? '<span class="cur-sws">' + o.sw.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' : '') + '<b>' + esc(o.label) + '</b>' + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</button>';
        }).join('') + '</div><div class="cur-ctl"><button type="button" data-skip>No preference</button><button type="button" data-back>Back</button></div>' +
        '<p class="cur-count">' + nx.left.length + ' pieces so far</p></div>';
      [].forEach.call(root.querySelectorAll('[data-o]'), function (b) { b.onclick = function () { var o = nx.opts[+b.getAttribute('data-o')]; answers.push({ tag: nx.q.tag, label: o.label, test: o.test, fit: o.fit }); stepAt++; ask(); focus(); }; });
      root.querySelector('[data-skip]').onclick = function () { answers.push(null); stepAt++; ask(); focus(); };
      root.querySelector('[data-back]').onclick = back;
    }
    function back() { if (!answers.length) return hall(), focus(); do { answers.pop(); stepAt--; } while (false); if (stepAt < 0) stepAt = 0; shown = 6; if (path && path.steps.length && stepAt < path.steps.length) ask(); else hall(); focus(); }
    function why(p) {
      var parts = answers.filter(Boolean).map(function (a) { return a.fit; }).filter(Boolean);
      if (!answers.some(function (a) { return a && a.tag === 'Wall'; }) && WALL[p.shape]) parts.push(WALL[p.shape][1]);
      if (!answers.some(function (a) { return a && (a.tag === 'Subject'); }) && SHORT[p.subject]) parts.unshift(SHORT[p.subject].charAt(0).toUpperCase() + SHORT[p.subject].slice(1));
      if (p.max_in) parts.push('prints up to about ' + Math.round(p.max_in) + ' inches');
      var s = parts.join(' · '); return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function results() {
      var left = pool(), picked = answers.filter(Boolean), pro = path && path.k === 'pro';
      var head = !left.length ? 'Nothing in the collection fits all of that yet' : left.length === 1 ? 'One piece fits' : left.length + ' pieces fit';
      var say = note || (picked.length ? (pro ? 'These share the palette and subject you chose, so they can hang in the same project and read as a set.' : 'Each of these answers what you told me. The line under each one says how.') : 'Here is a walk through the collection. Tell me more and I will narrow it.');
      root.innerHTML = '<div class="cur-wall cur-res"><div class="cur-plaque">' + esc(path ? path.intro : 'Your request') + '</div>' + crumbs() + '<h2 class="cur-ask" tabindex="-1">' + head + '</h2><p class="cur-lead">' + esc(say) + '</p>' +
        (pro && cfg.club ? '<p class="cur-club">Buying for clients? <a href="' + esc(cfg.club) + '">The Discount Club gives trade pricing of 25% to 45% off retail.</a></p>' : '') + '<div class="cur-hang">' + left.slice(0, shown).map(function (p) { var i = ALL.indexOf(p);
          return '<figure class="cur-piece"><button type="button" class="cur-frame" data-see="' + i + '" aria-label="See ' + esc(p.title) + ' on a wall">' + (p.img ? '<img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.title) + '">' : '') + '</button>' +
            '<figcaption class="cur-card"><b>' + esc(p.title) + '</b><span class="cur-fit">' + esc(why(p)) + '</span>' + (p.why ? '<span class="cur-why">' + esc(p.why) + '</span>' : '') +
            '<span class="cur-links"><button type="button" data-see="' + i + '">See it on a wall</button>' + (p.story ? '<a href="' + esc(p.story) + '">Its story</a>' : '') + (p.buy ? '<a class="cur-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta || 'Buy on Fine Art America') + '</a>' : '') + '</span></figcaption></figure>';
        }).join('') + '</div>' + (left.length > shown ? '<button type="button" class="cur-more">Show ' + Math.min(6, left.length - shown) + ' more (' + (left.length - shown) + ' left)</button>' : '') +
        '<div class="cur-floor"></div></div>' +
        '<div class="cur-else"><h3>Would you like to see anything else?</h3><div class="cur-else-b">' +
        picked.map(function (a) { return '<button type="button" data-drop="' + answers.indexOf(a) + '">Without “' + esc(a.label) + '”</button>'; }).join('') +
        '<button type="button" data-new>Ask for something different</button>' + (path && path.k !== 'look' ? '' : '') + '</div>' +
        '<form class="cur-form cur-form2"><input type="text" class="cur-in" aria-label="Ask for something else" placeholder="Or tell me what to change: more blue, a flower, taller…" maxlength="140"><button type="submit">Show me</button></form>' + topicChips() + '</div>';
      var mb = root.querySelector('.cur-more'); if (mb) mb.onclick = function () { shown += 6; var y = window.pageYOffset; results(); window.scrollTo(0, y); };
      [].forEach.call(root.querySelectorAll('[data-drop]'), function (b) { b.onclick = function () { answers[+b.getAttribute('data-drop')] = null; shown = 6; note = ''; results(); focus(); }; });
      root.querySelector('[data-new]').onclick = function () { hall(); focus(); };
      [].forEach.call(root.querySelectorAll('[data-see]'), function (b) { b.onclick = function () { onWall(ALL[+b.getAttribute('data-see')]); }; });
      bind();
    }
    function guide(g, extra) {
      root.innerHTML = '<div class="cur-wall cur-guide"><div class="cur-plaque">From the curator</div><h2 class="cur-ask" tabindex="-1">' + esc(g.title) + '</h2>' + g.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        '<div class="cur-ctl"><button type="button" data-new>' + (extra ? 'Now show me the pieces' : 'Help me find a piece') + '</button></div>' + topicChips() + '</div>';
      root.querySelector('[data-new]').onclick = function () { if (extra) extra(); else hall(); focus(); };
      bind();
    }
    function typed(text, keep) {
      text = (text || '').trim(); if (!text) return;
      var r = readRequest(text, ALL), base = keep ? answers.filter(Boolean) : [];
      var go = function () {
        if (!keep) { path = null; answers = []; stepAt = 0; }
        var dropped = [];
        r.filters.forEach(function (f) {
          var same = -1; answers.forEach(function (a, i) { if (a && a.tag === f.tag && f.tag !== 'Mentions') same = i; });
          var prev = same >= 0 ? answers[same] : null; if (same >= 0) answers[same] = null;
          answers.push(f); if (!pool().length) { answers.pop(); if (prev) answers[same] = prev; dropped.push(f.label); }
        });
        shown = 6;
        if (!r.filters.length && r.path) { path = PATHS.filter(function (p) { return p.k === r.path; })[0]; answers = []; stepAt = 0; return ask(); }
        note = !r.filters.length ? 'I could not match “' + text + '” to anything specific, so here is where we were. Try a colour, a subject, or the kind of wall.' :
          dropped.length ? 'Nothing in the collection has all of that together, so I left out “' + dropped.join('”, “') + '”. Here is the closest.' : '';
        results();
      };
      if (r.topics.length) return guide(r.topics[0], r.filters.length ? go : null), focus();
      go(); focus();
    }
    function bind() {
      [].forEach.call(root.querySelectorAll('.cur-way'), function (b) { b.onclick = function () { path = PATHS[+b.getAttribute('data-p')]; answers = []; stepAt = 0; shown = 6; note = ''; ask(); focus(); }; });
      [].forEach.call(root.querySelectorAll('[data-topic]'), function (b) { b.onclick = function () { var had = answers.filter(Boolean).length || path; var g = GUIDE.filter(function (x) { return x.k === b.getAttribute('data-topic'); })[0]; guide(g, had ? function () { results(); } : null); focus(); }; });
      [].forEach.call(root.querySelectorAll('.cur-form'), function (f) { f.onsubmit = function (ev) { ev.preventDefault(); typed(f.querySelector('input').value, f.className.indexOf('cur-form2') >= 0); }; });
    }
    /* ---- a piece on a wall, at true scale ---- */
    function onWall(p) {
      var sizes = [20, 30, 40, 48, 60, 72].filter(function (s) { return !p.max_in || s <= p.max_in; }); if (!sizes.length) sizes = [Math.round(p.max_in) || 20];
      var size = sizes[Math.min(sizes.length - 1, 2)], room = 0, ratio = 1.4;
      var ov = document.createElement('div'); ov.className = 'cur-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', p.title + ' on a wall');
      function drawRoom() {
        var r = ROOMS[room - 1], span = r ? r.span_in : 150, cx = r ? r.x : 50, cy = r ? r.y : 36;
        var wIn = ratio >= 1 ? size : size * ratio, pct = wIn / span * 100;
        ov.querySelector('.cur-room').className = 'cur-room' + (r ? ' cur-photo' : '');
        ov.querySelector('.cur-room').style.backgroundImage = r ? 'url("' + r.img + '")' : '';
        ov.querySelector('.cur-room').style.aspectRatio = r && r.ratio ? r.ratio : '';
        var a = ov.querySelector('.cur-art'); a.style.width = pct + '%'; a.style.left = cx + '%'; a.style.top = cy + '%';
        ov.querySelector('.cur-dim').textContent = size + ' inches on the long side' + (r ? '' : ' · the sofa is 7 feet wide');
        [].forEach.call(ov.querySelectorAll('[data-s]'), function (b) { b.className = +b.getAttribute('data-s') === size ? 'on' : ''; });
        [].forEach.call(ov.querySelectorAll('[data-r]'), function (b) { b.className = +b.getAttribute('data-r') === room ? 'on' : ''; });
      }
      ov.innerHTML = '<div class="cur-ovin"><button type="button" class="cur-x" aria-label="Close">×</button><h3>' + esc(p.title) + '</h3>' +
        '<div class="cur-room"><img class="cur-art" src="' + esc(p.img) + '" alt="' + esc(p.title) + '"><div class="cur-sofa"></div><div class="cur-rfloor"></div></div>' +
        '<p class="cur-dim"></p><div class="cur-sizes"><span>Size:</span>' + sizes.map(function (s) { return '<button type="button" data-s="' + s + '">' + s + '″</button>'; }).join('') + '</div>' +
        (ROOMS.length ? '<div class="cur-sizes"><span>Room:</span><button type="button" data-r="0">Gallery wall</button>' + ROOMS.map(function (r, i) { return '<button type="button" data-r="' + (i + 1) + '">' + esc(r.name || 'Room ' + (i + 1)) + '</button>'; }).join('') + '</div>' : '') +
        '<p class="cur-links">' + (p.story ? '<a href="' + esc(p.story) + '">Its story</a>' : '') + (p.buy ? '<a class="cur-buy" href="' + esc(p.buy) + '" target="_blank" rel="noopener">' + esc(cfg.cta || 'Buy on Fine Art America') + '</a>' : '') + '</p></div>';
      document.body.appendChild(ov);
      var img = ov.querySelector('.cur-art'); function sized() { if (img.naturalWidth) { ratio = img.naturalWidth / img.naturalHeight; drawRoom(); } } img.onload = sized; sized(); drawRoom();
      function close() { document.removeEventListener('keydown', key); ov.remove(); }
      function key(ev) { if (ev.key === 'Escape') close(); }
      document.addEventListener('keydown', key);
      ov.onclick = function (ev) { if (ev.target === ov) close(); }; ov.querySelector('.cur-x').onclick = close; ov.querySelector('.cur-x').focus();
      [].forEach.call(ov.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { size = +b.getAttribute('data-s'); drawRoom(); }; });
      [].forEach.call(ov.querySelectorAll('[data-r]'), function (b) { b.onclick = function () { room = +b.getAttribute('data-r'); drawRoom(); }; });
    }
    function focus() { var t = root.querySelector('.cur-ask'); if (t) t.focus({ preventScroll: true }); if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth' }); }
    if (!ALL.length) { root.innerHTML = '<p>The gallery opens as soon as the first artworks are published.</p>'; return; }
    hall();
  }
  function init() { [].forEach.call(document.querySelectorAll('.faasc-curator[data-curator]'), start); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

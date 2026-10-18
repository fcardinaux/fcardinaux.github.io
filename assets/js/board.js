// The hero board on the home page. Needs assets/js/pieces.js first.

// The board opens on the first of these, always: the Immortal Game has two
// knights, and the knights blink. "Another position" steps through the rest in
// order. Add a position by adding an entry: a FEN (only the placement field is
// read) and a caption. Each final position here was checked by replaying the
// game's moves with a chess library, not copied by hand.
const POSITIONS = [
  {
    fen: 'r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 b - - 1 23',
    caption: '<b>Anderssen–Kieseritzky, London 1851</b>, the Immortal Game. White has given up a bishop, both rooks and the queen — and it is mate.',
  },
  {
    fen: '1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17',
    caption: '<b>Morphy against the Duke of Brunswick and Count Isouard, Paris 1858</b>, the Opera Game. Seventeen moves: quick development, a queen sacrifice, and mate with White\'s last two pieces.',
  },
  {
    fen: '1r3kr1/pbpBBp1p/1b3P2/8/8/2P2q2/P4PPP/3R2K1 b - - 0 24',
    caption: '<b>Anderssen–Dufresne, Berlin 1852</b>, the Evergreen Game. Black\'s queen is one move from mate on g2 — but White gets there first.',
  },
  {
    fen: '8/8/1KP5/3r4/8/8/8/k7 w - - 0 1',
    caption: '<b>The Saavedra position, 1895.</b> White to play and win. The pawn queens — no: a queen would be stalemate. It becomes a rook.',
  },
  {
    fen: '7K/8/k1P5/7p/8/8/8/8 w - - 0 1',
    caption: '<b>Richard Réti, 1921.</b> White to play and draw. The king looks hopelessly far from both pawns — and gets to both.',
  },
];

// Same geometry as the templates: 100-unit viewBox, 8-unit coordinate
// gutter, 10.5-unit squares.
const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('board');
const G = 8, S = 10.5;
const el = (name, attrs, parent = svg) => {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
};
const xy = (file, rank) => [G + (file - 1) * S, (8 - rank) * S];

// Pieces: kiwen-suwi by neverRare, CC BY 4.0 (credited in the caption),
// inlined by assets/js/pieces.js so the page can restyle them.
let pieceCount = 0;
function piece(key, x, y) {
  const g = el('g', { class: key[0] === 'w' ? 'pw' : 'pb' });
  const id = 'clip' + pieceCount++;
  g.innerHTML = `<svg x="${x}" y="${y}" width="${S}" height="${S}" viewBox="0 0 260 260">`
    + PIECE_SVG[key].replaceAll('__ID__', id) + '</svg>';
  return g;
}

// Each knight blinks on its own clock, every few seconds, so they never
// blink together for long. The class comes off again once the blink is over
// (it lasts 0.3 s, see .blink in site.css), so the next one starts afresh:
// re-adding a class that is still there restarts nothing.
const BLINK_MS = 350;
let blinkTimers = [];
function blinkKnights() {
  blinkTimers.forEach(clearTimeout);
  blinkTimers = [];
  svg.querySelectorAll('g').forEach((g, i) => {
    if (!g.querySelector('.lid')) return;
    const later = () => {
      blinkTimers[i] = setTimeout(() => {
        g.classList.add('blink');
        blinkTimers[i] = setTimeout(() => { g.classList.remove('blink'); later(); }, BLINK_MS);
      }, 4500 + Math.random() * 10500);
    };
    later();
  });
}

function draw(fen) {
  svg.replaceChildren();
  // A light border round a piece: its silhouette, grown and filled, beneath it.
  const defs = el('defs', {});
  const rim = el('filter', { id: 'rim', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
  el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 0.2, result: 'grown' }, rim);
  el('feFlood', { 'flood-color': '#b9c6c0', result: 'colour' }, rim);
  el('feComposite', { in: 'colour', in2: 'grown', operator: 'in', result: 'border' }, rim);
  const merge = el('feMerge', {}, rim);
  el('feMergeNode', { in: 'border' }, merge);
  el('feMergeNode', { in: 'SourceGraphic' }, merge);
  for (let f = 1; f <= 8; f++) for (let r = 1; r <= 8; r++) {
    const [x, y] = xy(f, r);
    el('rect', { x, y, width: S, height: S,
      fill: (f + r) % 2 === 0 ? 'var(--sq-dark)' : 'var(--sq-light)' });
  }
  el('rect', { x: G, y: 0, width: 84, height: 84, fill: 'none',
    stroke: 'var(--sq-dark)', 'stroke-width': 0.4 });
  const label = { 'text-anchor': 'middle', 'font-size': 3.2, fill: 'var(--coord)',
    'font-family': 'Inter, sans-serif' };
  for (let i = 1; i <= 8; i++) {
    el('text', { ...label, x: G + (i - 0.5) * S, y: 84 + 5.6 }).textContent = 'abcdefgh'[i - 1];
    el('text', { ...label, x: G / 2, y: (8 - i + 0.5) * S + 1.1 }).textContent = i;
  }

  // FEN placement: ranks 8 to 1, separated by '/'; digits are empty squares.
  fen.split(' ')[0].split('/').forEach((row, i) => {
    let file = 1;
    for (const c of row) {
      if (/\d/.test(c)) { file += Number(c); continue; }
      const white = c === c.toUpperCase();
      const [x, y] = xy(file, 8 - i);
      piece((white ? 'w' : 'b') + c.toUpperCase(), x, y);
      file++;
    }
  });
}

let current;
function show(index) {
  current = index;
  const p = POSITIONS[index];
  draw(p.fen);
  blinkKnights();
  const caption = document.getElementById('caption');
  caption.innerHTML = p.caption;
  // The same position on Lichess's analysis board, in a new tab so the page
  // stays open behind it. The FEN goes in the path with underscores for spaces.
  document.getElementById('lichess').href =
    'https://lichess.org/analysis/standard/' + p.fen.replaceAll(' ', '_');
  svg.setAttribute('aria-label', 'Chess position: ' + caption.textContent);
}
document.getElementById('another').addEventListener('click',
  () => show((current + 1) % POSITIONS.length));
// ?p=<index> shows a given position, for checking each one.
const forced = new URLSearchParams(location.search).get('p');
show(POSITIONS[forced] ? Number(forced) : 0);

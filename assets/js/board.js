// The hero board on the home page. Needs assets/js/pieces.js first.

// The board opens on the first of these, always: the Immortal Game has two
// knights, and the knights blink. "Another position" steps through the rest in
// order. Add a position by adding an entry: a FEN, a caption and, for a game,
// its moves. Each FEN and move list here came out of replaying the game with a
// chess library, which also checked that the moves end in that position; none
// was copied by hand.
const POSITIONS = [
  {
    fen: 'r1bk3r/p2pBpNp/n4n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 b - - 1 23',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0',
    caption: '<b>Anderssen–Kieseritzky, London 1851</b>, the Immortal Game. White has given up a bishop, both rooks and the queen — and it is mate.',
  },
  {
    fen: '1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0',
    caption: '<b>Morphy against the Duke of Brunswick and Count Isouard, Paris 1858</b>, the Opera Game. Seventeen moves: quick development, a queen sacrifice, and mate with White\'s last two pieces.',
  },
  {
    fen: '1r3kr1/pbpBBp1p/1b3P2/8/8/2P2q2/P4PPP/3R2K1 b - - 0 24',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7# 1-0',
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
  // Lichess's analysis board. A game goes there as its moves, and Lichess
  // opens a game passed that way at its last move, which is the position shown
  // here, with the whole game to step back through. A study goes as its
  // position only, so that the link does not give the solution away.
  // Underscores stand for spaces in both.
  document.getElementById('lichess').href = p.pgn
    ? 'https://lichess.org/analysis/pgn/' + encodeURIComponent(p.pgn).replaceAll('%20', '_')
    : 'https://lichess.org/analysis/standard/' + p.fen.replaceAll(' ', '_');
  svg.setAttribute('aria-label', 'Chess position: ' + caption.textContent);
}
// On a computer the link opens a new tab, so the page stays open behind it.
// Not on a touch screen: there, iOS Safari ignored the tap on a new-tab link
// to Lichess altogether, and Back returns to the page anyway.
if (matchMedia('(hover: hover) and (pointer: fine)').matches)
  document.getElementById('lichess').target = '_blank';
document.getElementById('another').addEventListener('click',
  () => show((current + 1) % POSITIONS.length));
// ?p=<index> shows a given position, for checking each one.
const forced = new URLSearchParams(location.search).get('p');
show(POSITIONS[forced] ? Number(forced) : 0);

/* Animated page background: soft colours, plus optional small maths graphs floating
   only in the left and right margins (never behind the text).
   Style: 'aurora' (colours only) or 'graphs'. Set window.BG_STYLE before loading this file. */
(function () {
  var css = document.createElement('style');
  css.textContent =
    'html{background:#f3f7fc}' +
    'body{background:transparent!important}' +
    '#bgcanvas{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}' +
    '.topbar{background:transparent!important;border-bottom-color:rgba(60,90,130,.14)!important}' +
    '.result-card{background:rgba(255,255,255,.62)!important}' +
    '.figs img{background:rgba(255,255,255,.9)!important}' +
    '@media(max-width:820px){.sidebar{position:static!important}}';
  document.head.appendChild(css);

  var c = document.createElement('canvas');
  c.id = 'bgcanvas';
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d');
  var W, H, dpr, cw, ch, bandL = 0, bandR = 0, style = window.BG_STYLE || 'graphs';

  function measure() {
    var l = document.querySelector('.layout');
    if (l) { var r = l.getBoundingClientRect(); bandL = r.left + 26; bandR = innerWidth - r.right + 26; }
    else { bandL = bandR = Math.max(0, (innerWidth - 900) / 2); }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cw = innerWidth; ch = innerHeight;
    W = c.width = Math.floor(cw * dpr);
    H = c.height = Math.floor(ch * dpr);
    measure();
  }
  resize(); addEventListener('resize', resize); addEventListener('load', measure);

  var blobs = [
    { x: .15, y: .20, r: .42, h: 205, sx: .00006, sy: .00005, p: 0 },
    { x: .85, y: .25, r: .38, h: 285, sx: .00005, sy: .00007, p: 2 },
    { x: .70, y: .85, r: .45, h: 170, sx: .00007, sy: .00004, p: 4 },
    { x: .20, y: .80, r: .36, h: 330, sx: .00005, sy: .00006, p: 1 }
  ];

  var kinds = ['lump3d', 'soliton', 'contour', 'kink', 'wave'];
  var items = [], n = 0;
  for (var side = 0; side < 2; side++)
    for (var k = 0; k < 5; k++, n++)
      items.push({ side: side, kind: kinds[(k + side * 2) % 5], y: (k / 5) + side * .1, v: 0.000018 + (n % 4) * .000004,
                   ph: n * 1.7, hue: [205, 275, 170, 320, 235][n % 5], sx: (n * 37 % 100) / 100 });

  function sech2(x) { var e = 1 / Math.cosh(x); return e * e; }

  function drawItem(it, t) {
    var band = it.side ? bandR : bandL;
    var peek = band < 60;               /* narrow screen: small graphs peeking in from the edge */
    var S = peek ? 54 : Math.min(96, band - 14);
    var cx = peek ? (it.side ? cw - S * .5 - 5 : S * .5 + 5)
                  : (it.side ? cw - band / 2 - 4 : band / 2 + 4);
    cx += Math.sin(t * .0003 + it.ph) * 3;
    cx = Math.max(S / 2 + 6, Math.min(cw - S / 2 - 6, cx));
    var cy = ch * (1.12 - ((it.y + t * it.v) % 1.25));
    var fade = Math.max(0, Math.min(1, cy / 90, (ch - cy) / 90)) * (peek ? .6 : 1);
    if (fade <= 0) return;
    var col = 'hsla(' + it.hue + ',65%,42%,' + (.55 * fade) + ')';
    var axc = 'hsla(' + it.hue + ',40%,40%,' + (.28 * fade) + ')';
    var x0 = cx - S / 2, y0 = cy - S / 2, x1 = cx + S / 2, y1 = cy + S / 2, i, u;
    ctx.lineWidth = 1.3; ctx.lineJoin = 'round';

    if (it.kind === 'lump3d') {
      var N = 12, s = S / 4.4, sxp = .9 * Math.sin(t * .0007 + it.ph), pts = [];
      for (i = 0; i <= N; i++) { pts[i] = []; for (var j = 0; j <= N; j++) {
        var x = -1.6 + 3.2 * i / N, y = -1.6 + 3.2 * j / N, z = sech2(2 * (x - sxp)) * sech2(2 * y);
        pts[i][j] = [cx + (x - y) * .866 * s, cy + (x + y) * .5 * s + S * .1 - z * S * .36]; } }
      ctx.strokeStyle = col; ctx.beginPath();
      for (i = 0; i <= N; i++) for (var j2 = 0; j2 <= N; j2++) { var p = pts[i][j2]; j2 ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      for (var j3 = 0; j3 <= N; j3++) for (i = 0; i <= N; i++) { var q = pts[i][j3]; i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
      ctx.stroke(); return;
    }
    ctx.strokeStyle = axc; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath();
    if (it.kind === 'contour') {
      var ox = Math.sin(t * .0006 + it.ph) * S * .12;
      for (i = 1; i <= 4; i++) { ctx.moveTo(cx + ox + S * .1 * i, cy); ctx.ellipse(cx + ox, cy, S * .1 * i, S * .065 * i, .45, 0, 6.2832); }
    } else {
      var pos = ((t * .00007 + it.sx) % 1.5) - .25;
      for (i = 0; i <= 40; i++) {
        u = i / 40; var y;
        if (it.kind === 'soliton') y = y1 - S * .78 * sech2((u - pos) * 9);
        else if (it.kind === 'kink') y = y1 - S * (.12 + .66 * (.5 + .5 * Math.tanh((u - pos) * 9)));
        else y = cy - S * .26 * Math.sin(u * 11 - t * .002 + it.ph);
        var X = x0 + u * S; i ? ctx.lineTo(X, y) : ctx.moveTo(X, y);
      }
    }
    ctx.stroke();
  }

  function frame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#eef5fb'); g.addColorStop(1, '#f7f1fb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    blobs.forEach(function (b) {
      var x = (b.x + .10 * Math.sin(t * b.sx * 6 + b.p)) * W;
      var y = (b.y + .10 * Math.cos(t * b.sy * 6 + b.p)) * H;
      var r = b.r * Math.max(W, H);
      var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'hsla(' + (b.h + 20 * Math.sin(t * .0001 + b.p)) + ',85%,72%,.34)');
      rg.addColorStop(1, 'hsla(' + b.h + ',85%,72%,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    });
    ctx.fillStyle = 'rgba(255,255,255,.30)'; ctx.fillRect(0, 0, W, H);
    if (style === 'graphs') { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); items.forEach(function (it) { drawItem(it, t); }); }
  }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setBgStyle = function (st) { style = st; if (reduce) frame(4000); };
  var raf, last = 0;
  function loop(t) { if (t - last > 33) { frame(t); last = t; } raf = requestAnimationFrame(loop); }
  if (reduce) { frame(4000); }
  else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(loop);
    });
  }
})();

/* Animated background: soft colour blobs + travelling soliton pulses (sech^2).
   Add a script tag with src="bg.js" and defer, before the closing body tag of every page. */
(function () {
  var css = document.createElement('style');
  css.textContent =
    'html{background:#f3f7fc}' +
    'body{background:transparent!important}' +
    '#bgcanvas{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}' +
    '.topbar{background:transparent!important;border-bottom-color:rgba(60,90,130,.14)!important}' +
    '.result-card{background:rgba(255,255,255,.62)!important}' +
    '.figs img{background:rgba(255,255,255,.9)!important}';
  document.head.appendChild(css);

  var c = document.createElement('canvas');
  c.id = 'bgcanvas';
  document.body.insertBefore(c, document.body.firstChild);
  var ctx = c.getContext('2d');
  var W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = c.width = Math.floor(innerWidth * dpr);
    H = c.height = Math.floor(innerHeight * dpr);
  }
  resize(); addEventListener('resize', resize);

  var blobs = [
    { x: .15, y: .20, r: .42, h: 205, sx: .00006, sy: .00005, p: 0 },
    { x: .85, y: .25, r: .38, h: 285, sx: .00005, sy: .00007, p: 2 },
    { x: .70, y: .85, r: .45, h: 170, sx: .00007, sy: .00004, p: 4 },
    { x: .20, y: .80, r: .36, h: 330, sx: .00005, sy: .00006, p: 1 }
  ];
  var pulses = [
    { y: .30, amp: .07, k: 9, v: .00006, h: 215, o: .0, w: 2 },
    { y: .55, amp: .09, k: 7, v: -.00004, h: 275, o: .35, w: 2.2 },
    { y: .78, amp: .06, k: 11, v: .00005, h: 170, o: .7, w: 1.8 }
  ];

  function frame(t) {
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

    pulses.forEach(function (p, i) {
      var pos = ((t * Math.abs(p.v) * 6 + p.o) % 1.4) - .2;
      if (p.v < 0) pos = 1 - pos;
      ctx.beginPath();
      for (var px = 0; px <= W; px += 6) {
        var x = px / W;
        var s = 1 / Math.cosh(p.k * (x - pos));
        var y = (p.y - p.amp * s * s) * H + Math.sin(x * 9 + t * .0006 + i) * H * .006;
        if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = 'hsla(' + p.h + ',80%,55%,.30)';
      ctx.lineWidth = p.w * dpr;
      ctx.stroke();
    });
  }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf, last = 0;
  function loop(t) {
    if (t - last > 33) { frame(t); last = t; }
    raf = requestAnimationFrame(loop);
  }
  if (reduce) { frame(4000); }
  else {
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(loop);
    });
  }
})();

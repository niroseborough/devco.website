(function () {
  var canvas = document.getElementById("grid");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var glowEl = document.getElementById("glow");
  var contentEl = document.getElementById("content");

  var dpr = window.devicePixelRatio || 1;
  var spacing = 34;
  var baseRadius = 1 * dpr;
  var influenceRadius = 200;
  var lineMaxDist = 75;

  var width, height;
  var dots = [];
  var mouse = { x: -1000, y: -1000 };
  var smooth = { x: -1000, y: -1000 };

  var canvasOpacity = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseRadius = 1;
    buildGrid();
  }

  function buildGrid() {
    dots = [];
    var cols = Math.ceil(width / spacing) + 2;
    var rows = Math.ceil(height / spacing) + 2;
    var ox = (width - (cols - 1) * spacing) / 2;
    var oy = (height - (rows - 1) * spacing) / 2;

    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var bx = ox + i * spacing;
        var by = oy + j * spacing;
        dots.push({ x: bx, y: by, bx: bx, by: by, col: i, row: j });
      }
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    if (canvasOpacity < 1) {
      canvasOpacity = Math.min(1, canvasOpacity + 0.012);
      canvas.style.opacity = canvasOpacity;
    }

    smooth.x = lerp(smooth.x, mouse.x, 0.12);
    smooth.y = lerp(smooth.y, mouse.y, 0.12);

    if (glowEl) {
      glowEl.style.left = smooth.x + "px";
      glowEl.style.top = smooth.y + "px";
    }

    if (contentEl) {
      var cx = (smooth.x - width * 0.5) / width;
      var cy = (smooth.y - height * 0.5) / height;
      contentEl.style.transform =
        "translate(" + cx * -14 + "px," + cy * -14 + "px)";
    }

    var active = [];

    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];
      var dx = smooth.x - d.bx;
      var dy = smooth.y - d.by;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var r = baseRadius;
      var alpha = 0.06;
      var cr = 255,
        cg = 255,
        cb = 255;

      if (dist < influenceRadius) {
        var t = 1 - dist / influenceRadius;
        var ease = t * t * t;

        var tx = d.bx + dx * ease * 0.1;
        var ty = d.by + dy * ease * 0.1;
        d.x = lerp(d.x, tx, 0.1);
        d.y = lerp(d.y, ty, 0.1);

        r = baseRadius + ease * 2.5;
        alpha = 0.06 + ease * 0.85;

        var angle = Math.atan2(dy, dx);
        var norm = (angle + Math.PI) / (2 * Math.PI);

        if (norm < 0.33) {
          var p = norm / 0.33;
          cr = lerp(110, 80, p * ease);
          cg = lerp(155, 210, p * ease);
          cb = lerp(255, 220, p * ease);
        } else if (norm < 0.66) {
          var p = (norm - 0.33) / 0.33;
          cr = lerp(80, 167, p * ease);
          cg = lerp(210, 139, p * ease);
          cb = lerp(220, 250, p * ease);
        } else {
          var p = (norm - 0.66) / 0.34;
          cr = lerp(167, 110, p * ease);
          cg = lerp(139, 155, p * ease);
          cb = lerp(250, 255, p * ease);
        }

        if (ease > 0.03) {
          active.push(d);
        }
      } else {
        d.x = lerp(d.x, d.bx, 0.06);
        d.y = lerp(d.y, d.by, 0.06);
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, 6.2832);
      ctx.fillStyle =
        "rgba(" +
        (cr | 0) +
        "," +
        (cg | 0) +
        "," +
        (cb | 0) +
        "," +
        alpha +
        ")";
      ctx.fill();
    }

    if (active.length > 1) {
      ctx.lineWidth = 0.5;
      for (var i = 0; i < active.length; i++) {
        for (var j = i + 1; j < active.length; j++) {
          var a = active[i];
          var b = active[j];
          var lx = a.x - b.x;
          var ly = a.y - b.y;
          var ld = Math.sqrt(lx * lx + ly * ly);

          if (ld < lineMaxDist) {
            var lt = 1 - ld / lineMaxDist;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(140,170,255," + lt * 0.18 + ")";
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);

  document.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener("mouseleave", function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener("touchend", function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  canvas.style.opacity = 0;
  resize();
  draw();
})();

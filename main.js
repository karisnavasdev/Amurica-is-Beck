// Fireworks canvas
window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  cw = window.innerWidth,
  ch = window.innerHeight,
  fireworks = [],
  particles = [],
  hue = 0,
  limiterTotal = 5,
  limiterTick = 0,
  timerTotal = 25,
  timerTick = 0,
  mousedown = false,
  mx,
  my;

// Patriotic hue cycle: red → white → blue
var patrioticHues = [0, 220, 60];
var hueIndex = 0;

function resizeCanvas() {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw;
  canvas.height = ch;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function calculateDistance(p1x, p1y, p2x, p2y) {
  var xDistance = p1x - p2x,
    yDistance = p1y - p2y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function Firework(sx, sy, tx, ty) {
  this.x = sx;
  this.y = sy;
  this.sx = sx;
  this.sy = sy;
  this.tx = tx;
  this.ty = ty;
  this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
  this.distanceTraveled = 0;
  this.coordinates = [];
  this.coordinateCount = 3;
  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }
  this.angle = Math.atan2(ty - sy, tx - sx);
  this.speed = 2;
  this.acceleration = 1.05;
  this.brightness = random(50, 80);
  this.targetRadius = 1;
  this.hue = patrioticHues[hueIndex % patrioticHues.length];
}

Firework.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);

  if (this.targetRadius < 8) {
    this.targetRadius += 0.3;
  } else {
    this.targetRadius = 1;
  }

  this.speed *= this.acceleration;

  var vx = Math.cos(this.angle) * this.speed,
    vy = Math.sin(this.angle) * this.speed;
  this.distanceTraveled = calculateDistance(
    this.sx,
    this.sy,
    this.x + vx,
    this.y + vy
  );

  if (this.distanceTraveled >= this.distanceToTarget) {
    createParticles(this.tx, this.ty, this.hue);
    fireworks.splice(index, 1);
  } else {
    this.x += vx;
    this.y += vy;
  }
};

Firework.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle = "hsl(" + this.hue + ", 100%, " + this.brightness + "%)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
  ctx.stroke();
};

function Particle(x, y, baseHue) {
  this.x = x;
  this.y = y;
  this.coordinates = [];
  this.coordinateCount = 5;
  while (this.coordinateCount--) {
    this.coordinates.push([this.x, this.y]);
  }
  this.angle = random(0, Math.PI * 2);
  this.speed = random(1, 10);
  this.friction = 0.95;
  this.gravity = 1;
  this.hue = random(baseHue - 15, baseHue + 15);
  this.brightness = random(50, 90);
  this.alpha = 1;
  this.decay = random(0.015, 0.03);
}

Particle.prototype.update = function (index) {
  this.coordinates.pop();
  this.coordinates.unshift([this.x, this.y]);
  this.speed *= this.friction;
  this.x += Math.cos(this.angle) * this.speed;
  this.y += Math.sin(this.angle) * this.speed + this.gravity;
  this.alpha -= this.decay;

  if (this.alpha <= this.decay) {
    particles.splice(index, 1);
  }
};

Particle.prototype.draw = function () {
  ctx.beginPath();
  ctx.moveTo(
    this.coordinates[this.coordinates.length - 1][0],
    this.coordinates[this.coordinates.length - 1][1]
  );
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle =
    "hsla(" +
    this.hue +
    ", 100%, " +
    this.brightness +
    "%, " +
    this.alpha +
    ")";
  ctx.stroke();
};

function createParticles(x, y, baseHue) {
  var particleCount = 35;
  while (particleCount--) {
    particles.push(new Particle(x, y, baseHue));
  }
}

function loop() {
  requestAnimFrame(loop);

  hueIndex = Math.floor(Date.now() / 3000) % patrioticHues.length;

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = "lighter";

  var i = fireworks.length;
  while (i--) {
    fireworks[i].draw();
    fireworks[i].update(i);
  }

  i = particles.length;
  while (i--) {
    particles[i].draw();
    particles[i].update(i);
  }

  if (timerTick >= timerTotal) {
    if (!mousedown) {
      fireworks.push(
        new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2))
      );
      timerTick = 0;
    }
  } else {
    timerTick++;
  }

  if (limiterTick >= limiterTotal) {
    if (mousedown) {
      fireworks.push(new Firework(cw / 2, ch, mx, my));
      limiterTick = 0;
    }
  } else {
    limiterTick++;
  }
}

canvas.addEventListener("mousemove", function (e) {
  mx = e.pageX - canvas.offsetLeft;
  my = e.pageY - canvas.offsetTop;
});

canvas.addEventListener("mousedown", function (e) {
  e.preventDefault();
  mousedown = true;
});

canvas.addEventListener("mouseup", function (e) {
  e.preventDefault();
  mousedown = false;
});

window.onload = loop;

// ── UI interactions ──

var song = new Audio("./rockandroll.mp3");
song.volume = 0.025;
song.currentTime = 47.5;

var agreeModal = document.getElementById("agree-modal");
var yesBtn = document.getElementById("yes");

if (yesBtn) {
  yesBtn.addEventListener("click", function () {
    agreeModal.classList.add("hide");
    setTimeout(function () {
      song.play().catch(function () {});
    }, 1000);
  });
}

// Copy contract address
var copyBtn = document.getElementById("copy-contract");
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    var value = copyBtn.querySelector(".contract-value").textContent;
    navigator.clipboard.writeText(value).then(function () {
      copyBtn.classList.add("copied");
      copyBtn.querySelector(".copy-hint").textContent = "Copied!";
      setTimeout(function () {
        copyBtn.classList.remove("copied");
        copyBtn.querySelector(".copy-hint").textContent = "Click to copy";
      }, 2000);
    });
  });
}

// Scroll reveal with Intersection Observer
var revealEls = document.querySelectorAll(
  ".reveal, .reveal-left, .reveal-right, .reveal-scale"
);

if ("IntersectionObserver" in window) {
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach(function (el) {
    revealObserver.observe(el);
  });
} else {
  revealEls.forEach(function (el) {
    el.classList.add("visible");
  });
}

// Staggered meme gallery reveal
var memeItems = document.querySelectorAll(".meme-item");
if ("IntersectionObserver" in window) {
  var memeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var items = entry.target.querySelectorAll(".meme-item");
          items.forEach(function (item, i) {
            setTimeout(function () {
              item.classList.add("visible");
            }, i * 80);
          });
          memeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  var gallery = document.querySelector(".meme-gallery");
  if (gallery) memeObserver.observe(gallery);
}

// Header scroll state
var header = document.querySelector(".site-header");
if (header) {
  window.addEventListener(
    "scroll",
    function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true }
  );
}

// Parallax on hero decorative images
var parallaxEls = document.querySelectorAll(".parallax-slow");
if (parallaxEls.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener(
    "scroll",
    function () {
      var scrollY = window.scrollY;
      parallaxEls.forEach(function (el, i) {
        var speed = i === 0 ? 0.08 : 0.05;
        el.style.transform = "translateY(" + scrollY * speed + "px)";
      });
    },
    { passive: true }
  );
}

// Trigger hero reveals immediately on load
window.addEventListener("load", function () {
  document.querySelectorAll(".hero-stuff .reveal").forEach(function (el) {
    el.classList.add("visible");
  });
});

(() => {
  'use strict';

  const canvas = document.getElementById('drone-field');
  const context = canvas.getContext('2d');
  if (!context) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let drones = [];
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(44, Math.max(15, Math.floor(width * height / 30000)));
    drones = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      angle: Math.random() * Math.PI * 2,
      speed: 3 + Math.random() * 7,
      size: 4 + Math.random() * 9,
      phase: Math.random() * Math.PI * 2,
      opacity: .16 + Math.random() * .3,
    }));
    draw(0);
  }

  function draw(delta) {
    elapsed += delta;
    context.clearRect(0, 0, width, height);

    for (const drone of drones) {
      drone.angle += Math.sin(elapsed * .15 + drone.phase) * delta * .055;
      drone.x += Math.cos(drone.angle) * drone.speed * delta;
      drone.y += Math.sin(drone.angle) * drone.speed * delta;
      const margin = 20;
      if (drone.x < -margin) drone.x = width + margin;
      if (drone.x > width + margin) drone.x = -margin;
      if (drone.y < -margin) drone.y = height + margin;
      if (drone.y > height + margin) drone.y = -margin;
    }

    const reach = Math.min(230, width * .42);
    for (let i = 0; i < drones.length; i++) {
      for (let j = i + 1; j < drones.length; j++) {
        const a = drones[i];
        const b = drones[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > reach) continue;
        // Nearby aircraft establish a link, then let it fade again.
        const pulse = Math.pow(Math.max(0, Math.sin(elapsed * .35 + a.phase + b.phase)), 2);
        const opacity = (1 - distance / reach) * pulse * .24;
        context.strokeStyle = `rgba(34, 186, 187, ${opacity})`;
        context.lineWidth = .7;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }

    for (const drone of drones) {
      context.save();
      context.translate(drone.x, drone.y);
      context.rotate(drone.angle);
      context.beginPath();
      context.moveTo(drone.size, 0);
      context.lineTo(-drone.size * .7, drone.size * .6);
      context.lineTo(-drone.size * .7, -drone.size * .6);
      context.closePath();
      context.fillStyle = `rgba(34, 186, 187, ${drone.opacity * .13})`;
      context.strokeStyle = `rgba(34, 186, 187, ${drone.opacity})`;
      context.lineWidth = .8;
      context.fill();
      context.stroke();
      context.restore();
    }

    // Keep the wordmark clear while the swarm travels behind it.
    context.globalCompositeOperation = 'destination-out';
    const veil = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width * .55, 460));
    veil.addColorStop(0, 'rgba(0,0,0,.95)');
    veil.addColorStop(.55, 'rgba(0,0,0,.8)');
    veil.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = veil;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  }

  function animate(time) {
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    draw(delta);
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    else draw(0);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', syncMotion);
  motion.addEventListener('change', syncMotion);
  resize();
  syncMotion();
})();

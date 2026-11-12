import { useEffect, useRef } from 'react';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function createShard(w, h, color, accent) {
  const depth = 0.3 + Math.random() * 0.7;
  const size = (8 + Math.random() * 28) * depth;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3 * depth,
    vy: (Math.random() - 0.5) * 0.2 * depth - 0.1,
    size,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.005,
    depth,
    alpha: (0.15 + Math.random() * 0.45) * depth,
    color: Math.random() > 0.4 ? color : accent,
    aspect: 0.3 + Math.random() * 0.5,
  };
}

export default function AeroShardsFallback({
  shardColor = '#891a1a',
  accentColor = '#a92a4a',
  backgroundColor = 'transparent',
  count = 120,
  speed = 0.6,
  glow = 0.3,
  className,
  style,
}) {
  const containerRef = useRef(null);
  const propsRef = useRef({ shardColor, accentColor, backgroundColor, count, speed, glow });
  propsRef.current = { shardColor, accentColor, backgroundColor, count, speed, glow };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const shards = [];

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initShards() {
      const p = propsRef.current;
      const n = Math.min(p.count, 400);
      const c = hexToRgb(p.shardColor);
      const a = hexToRgb(p.accentColor);
      shards.length = 0;
      for (let i = 0; i < n; i++) shards.push(createShard(w, h, c, a));
    }

    resize();
    initShards();
    const ro = new ResizeObserver(() => { resize(); initShards(); });
    ro.observe(container);

    function draw() {
      const p = propsRef.current;
      if (p.backgroundColor === 'transparent') ctx.clearRect(0, 0, w, h);
      else { ctx.fillStyle = p.backgroundColor; ctx.fillRect(0, 0, w, h); }

      for (const s of shards) {
        s.x += s.vx * p.speed;
        s.y += s.vy * p.speed;
        s.rotation += s.rotSpeed * p.speed;
        if (s.x < -s.size) s.x = w + s.size;
        if (s.x > w + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = h + s.size;
        if (s.y > h + s.size) s.y = -s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = s.alpha;
        const [cr, cg, cb] = s.color;
        if (p.glow > 0) {
          ctx.shadowColor = `rgba(${cr},${cg},${cb},${0.6 * p.glow})`;
          ctx.shadowBlur = s.size * 1.5 * p.glow;
        }
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${s.alpha})`;
        ctx.beginPath();
        const hw = s.size * 0.5, hh = hw * s.aspect;
        ctx.moveTo(0, -hh);
        ctx.lineTo(hw, 0);
        ctx.lineTo(0, hh);
        ctx.lineTo(-hw, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
  }, []);

  useEffect(() => {
    const color = hexToRgb(shardColor);
    const accent = hexToRgb(accentColor);
    // live-update colors on existing shards handled via propsRef in draw loop
  }, [shardColor, accentColor]);

  return <div ref={containerRef} className={className} style={style} />;
}

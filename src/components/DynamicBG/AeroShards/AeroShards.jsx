'use client';

import { useEffect, useRef } from 'react';
import './AeroShards.css';

const ROOT = 'aero-shards';

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

export default function AeroShards({
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
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const shardsRef = useRef([]);
  const propsRef = useRef({ shardColor, accentColor, backgroundColor, count, speed, glow });

  propsRef.current = { shardColor, accentColor, backgroundColor, count, speed, glow };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'aero-shards-canvas';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initShards() {
      const p = propsRef.current;
      const c = Math.min(p.count, 400);
      const color = hexToRgb(p.shardColor);
      const accent = hexToRgb(p.accentColor);
      shardsRef.current = [];
      for (let i = 0; i < c; i++) {
        shardsRef.current.push(createShard(w, h, color, accent));
      }
    }

    resize();
    initShards();

    const ro = new ResizeObserver(() => {
      resize();
      initShards();
    });
    ro.observe(container);

    function draw() {
      const p = propsRef.current;
      const spd = p.speed;
      const glw = p.glow;

      if (p.backgroundColor === 'transparent') {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.fillStyle = p.backgroundColor;
        ctx.fillRect(0, 0, w, h);
      }

      const shards = shardsRef.current;
      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        s.x += s.vx * spd;
        s.y += s.vy * spd;
        s.rotation += s.rotSpeed * spd;

        if (s.x < -s.size) s.x = w + s.size;
        if (s.x > w + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = h + s.size;
        if (s.y > h + s.size) s.y = -s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = s.alpha;

        const [cr, cg, cb] = s.color;

        if (glw > 0) {
          ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${0.6 * glw})`;
          ctx.shadowBlur = s.size * 1.5 * glw;
        }

        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${s.alpha})`;
        ctx.beginPath();
        const hw = s.size * 0.5;
        const hh = hw * s.aspect;
        ctx.moveTo(0, -hh);
        ctx.lineTo(hw, 0);
        ctx.lineTo(0, hh);
        ctx.lineTo(-hw, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    const shards = shardsRef.current;
    if (!shards.length) return;
    const color = hexToRgb(shardColor);
    const accent = hexToRgb(accentColor);
    for (const s of shards) {
      s.color = Math.random() > 0.4 ? color : accent;
    }
  }, [shardColor, accentColor]);

  return <div ref={containerRef} className={[ROOT, className].filter(Boolean).join(' ')} style={style} />;
}

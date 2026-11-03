/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface RadarMinimapProps {
  playerPos: { x: number; y: number; angle: number };
  enemies: { x: number; y: number; isBoss: boolean }[];
  asteroids: { x: number; y: number }[];
  gems: { x: number; y: number }[];
}

export const RadarMinimap: React.FC<RadarMinimapProps> = ({
  playerPos,
  enemies,
  asteroids,
  gems,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    const range = 900; // Radar range radius in world units
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Radar Background Disc
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    // Radar Concentric Circles
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    [center * 0.35, center * 0.7, center - 4].forEach((r) => {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(center, 4);
    ctx.lineTo(center, size - 4);
    ctx.moveTo(4, center);
    ctx.lineTo(size - 4, center);
    ctx.stroke();

    // Radar Sweep Line (animated rotating beam)
    const sweepAngle = (Date.now() / 800) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(sweepAngle) * (center - 4), center + Math.sin(sweepAngle) * (center - 4));
    ctx.stroke();

    // Helper to transform world delta into radar coordinate
    const toRadar = (wx: number, wy: number) => {
      const dx = wx - playerPos.x;
      const dy = wy - playerPos.y;
      const scale = (center - 8) / range;
      const rx = center + dx * scale;
      const ry = center + dy * scale;
      const dist = Math.hypot(dx, dy);
      return { rx, ry, inRange: dist < range };
    };

    // Draw Asteroids (Grey dots)
    ctx.fillStyle = '#64748b';
    for (const a of asteroids) {
      const { rx, ry, inRange } = toRadar(a.x, a.y);
      if (inRange) {
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }
    }

    // Draw Starlight Gems (Cyan dots)
    ctx.fillStyle = '#38bdf8';
    for (const g of gems) {
      const { rx, ry, inRange } = toRadar(g.x, g.y);
      if (inRange) {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Enemies (Red / Crimson blips, Bosses large pulsing)
    for (const e of enemies) {
      const { rx, ry, inRange } = toRadar(e.x, e.y);
      if (inRange) {
        ctx.fillStyle = e.isBoss ? '#ef4444' : '#f43f5e';
        const blipRadius = e.isBoss ? 4.5 : 2;
        ctx.beginPath();
        ctx.arc(rx, ry, blipRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player Marker in center (Bright arrow pointing along player's heading)
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(playerPos.angle);

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-4, 3.5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-4, -3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Outer Neon Ring
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [playerPos, enemies, asteroids, gems]);

  return (
    <div className="absolute top-16 right-3 sm:top-20 sm:right-5 z-20 pointer-events-none select-none">
      <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl border border-cyan-800/60 shadow-xl">
        <canvas ref={canvasRef} width={110} height={110} className="rounded-xl block" />
        <div className="text-[9px] text-cyan-400 font-mono text-center tracking-wider pt-0.5">
          RADAR 900M
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Bomb, Flame, Zap } from 'lucide-react';

interface TouchControls360Props {
  onJoystickMove: (x: number, y: number) => void;
  onBoost: (boosting: boolean) => void;
  onTriggerBomb: () => void;
  bombsAvailable: number;
  boostAvailable: number;
  autoFire: boolean;
  onToggleAutoFire: () => void;
}

export const TouchControls360: React.FC<TouchControls360Props> = ({
  onJoystickMove,
  onBoost,
  onTriggerBomb,
  bombsAvailable,
  boostAvailable,
  autoFire,
  onToggleAutoFire,
}) => {
  const joystickAreaRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 40;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickAreaRef.current) return;
    const rect = joystickAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      onJoystickMove(dx / maxRadius, dy / maxRadius);
    } else {
      const nx = (dx / dist) * maxRadius;
      const ny = (dy / dist) * maxRadius;
      setKnobPos({ x: nx, y: ny });
      onJoystickMove(nx / maxRadius, ny / maxRadius);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 sm:hidden">
      {/* Left Bottom: Floating 360 Flight Joystick */}
      <div
        ref={joystickAreaRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-slate-900/60 border border-slate-700/80 backdrop-blur-sm pointer-events-auto flex items-center justify-center touch-none"
      >
        <div
          className={`w-12 h-12 rounded-full border-2 transition-transform duration-75 shadow-lg ${
            isDragging
              ? 'bg-cyan-500/80 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'bg-slate-700/80 border-slate-500'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Right Bottom: Action Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Auto Fire Toggle */}
        <button
          onClick={onToggleAutoFire}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold backdrop-blur-md border ${
            autoFire
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          사격 {autoFire ? 'AUTO' : 'MANUAL'}
        </button>

        <div className="flex items-center gap-3">
          {/* Boost Afterburner Button */}
          <button
            onTouchStart={() => onBoost(true)}
            onTouchEnd={() => onBoost(false)}
            onMouseDown={() => onBoost(true)}
            onMouseUp={() => onBoost(false)}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-amber-600/90 active:bg-amber-500 text-white border-2 border-amber-300 shadow-lg active:scale-95"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[9px] font-bold">부스트</span>
          </button>

          {/* EMP Bomb Trigger Button */}
          <button
            onClick={onTriggerBomb}
            disabled={bombsAvailable <= 0}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-transform active:scale-95 shadow-xl ${
              bombsAvailable > 0
                ? 'bg-rose-600/90 hover:bg-rose-500 border-rose-300 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-0.5">EMP ({bombsAvailable})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

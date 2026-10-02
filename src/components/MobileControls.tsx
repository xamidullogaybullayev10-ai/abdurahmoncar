import React, { useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ControlInputs } from '../types/game';

interface MobileControlsProps {
  onControlChange: (key: keyof ControlInputs, value: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onControlChange }) => {
  const handleTouch = useCallback(
    (key: keyof ControlInputs, isPressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onControlChange(key, isPressed);
    },
    [onControlChange]
  );

  return (
    <div className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none px-4 select-none touch-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4 pointer-events-auto">
        {/* Left Side: Steering D-Pad (◀ and ▶) */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={handleTouch('left', true)}
            onTouchEnd={handleTouch('left', false)}
            onTouchCancel={handleTouch('left', false)}
            onMouseDown={handleTouch('left', true)}
            onMouseUp={handleTouch('left', false)}
            onMouseLeave={handleTouch('left', false)}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-neutral-900/90 active:bg-amber-600/80 border-2 border-neutral-700/80 active:border-amber-400 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95 touch-none"
            aria-label="Turn Left"
          >
            <ChevronLeft className="w-8 h-8 pointer-events-none" />
          </button>

          <button
            onTouchStart={handleTouch('right', true)}
            onTouchEnd={handleTouch('right', false)}
            onTouchCancel={handleTouch('right', false)}
            onMouseDown={handleTouch('right', true)}
            onMouseUp={handleTouch('right', false)}
            onMouseLeave={handleTouch('right', false)}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-neutral-900/90 active:bg-amber-600/80 border-2 border-neutral-700/80 active:border-amber-400 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95 touch-none"
            aria-label="Turn Right"
          >
            <ChevronRight className="w-8 h-8 pointer-events-none" />
          </button>
        </div>

        {/* Center: Handbrake Button */}
        <button
          onTouchStart={handleTouch('brake', true)}
          onTouchEnd={handleTouch('brake', false)}
          onTouchCancel={handleTouch('brake', false)}
          onMouseDown={handleTouch('brake', true)}
          onMouseUp={handleTouch('brake', false)}
          onMouseLeave={handleTouch('brake', false)}
          className="h-16 px-4 sm:px-6 rounded-2xl bg-red-950/85 active:bg-red-600 border-2 border-red-700/80 active:border-red-400 text-red-200 active:text-white shadow-2xl flex flex-col items-center justify-center font-black tracking-wider text-xs sm:text-sm uppercase transition-transform active:scale-95 touch-none"
          aria-label="Brake"
        >
          <span>BRAKE</span>
        </button>

        {/* Right Side: Throttle (▲ Accelerate and ▼ Reverse) */}
        <div className="flex flex-col items-center gap-2">
          <button
            onTouchStart={handleTouch('up', true)}
            onTouchEnd={handleTouch('up', false)}
            onTouchCancel={handleTouch('up', false)}
            onMouseDown={handleTouch('up', true)}
            onMouseUp={handleTouch('up', false)}
            onMouseLeave={handleTouch('up', false)}
            className="w-16 h-14 sm:w-18 sm:h-16 rounded-2xl bg-emerald-950/85 active:bg-emerald-600 border-2 border-emerald-700/80 active:border-emerald-400 text-emerald-200 active:text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95 touch-none"
            aria-label="Accelerate"
          >
            <ChevronUp className="w-8 h-8 pointer-events-none" />
          </button>

          <button
            onTouchStart={handleTouch('down', true)}
            onTouchEnd={handleTouch('down', false)}
            onTouchCancel={handleTouch('down', false)}
            onMouseDown={handleTouch('down', true)}
            onMouseUp={handleTouch('down', false)}
            onMouseLeave={handleTouch('down', false)}
            className="w-16 h-14 sm:w-18 sm:h-16 rounded-2xl bg-neutral-900/90 active:bg-amber-600/80 border-2 border-neutral-700/80 active:border-amber-400 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95 touch-none"
            aria-label="Reverse"
          >
            <ChevronDown className="w-8 h-8 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};

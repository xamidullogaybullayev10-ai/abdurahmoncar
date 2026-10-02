import React from 'react';
import { Volume2, VolumeX, Pause, RotateCcw } from 'lucide-react';

interface HUDProps {
  levelNumber: number;
  timeLeft: number;
  score: number;
  accuracy: number;
  isMuted: boolean;
  statusMessage?: string;
  isParkedHolding?: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  levelNumber,
  timeLeft,
  score,
  accuracy,
  isMuted,
  statusMessage,
  isParkedHolding,
  onToggleSound,
  onPause,
  onReset,
}) => {
  const isTimeCritical = timeLeft <= 10;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Level badge & Quick Reset */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">LEVEL</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono tabular-nums leading-none">
              {levelNumber}
            </span>
          </div>

          <button
            onClick={onReset}
            title="Reset Level (R)"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-neutral-400" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>

        {/* Center: Timer & Status Alert */}
        <div className="flex flex-col items-center">
          <div
            className={`px-4 py-1.5 rounded-xl border backdrop-blur-md shadow-xl transition-all flex items-center gap-2 ${
              isTimeCritical
                ? 'bg-red-950/90 border-red-500/80 text-red-200 animate-pulse'
                : 'bg-neutral-900/90 border-neutral-700/60 text-neutral-100'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">TIME</span>
            <span className="text-lg sm:text-xl font-black font-mono tabular-nums tracking-wider">
              {Math.max(0, timeLeft)}s
            </span>
          </div>

          {statusMessage && (
            <div
              className={`mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md transition-all ${
                isParkedHolding
                  ? 'bg-emerald-500 text-neutral-950 animate-bounce'
                  : 'bg-neutral-900/85 text-amber-300 border border-amber-500/30'
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right: Score, Accuracy, Sound & Pause */}
        <div className="flex items-center gap-2">
          {/* Score & Accuracy box */}
          <div className="hidden md:flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-bold uppercase tracking-wider">SCORE</span>
              <span className="text-white font-mono tabular-nums">{score.toString().padStart(4, '0')}</span>
            </div>
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-bold uppercase tracking-wider">ACCURACY</span>
              <span className={`font-mono tabular-nums ${accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors shadow-lg active:scale-95"
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            title="Pause Game (ESC / P)"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shadow-lg active:scale-95"
            aria-label="Pause game"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">PAUSE</span>
          </button>
        </div>
      </div>
    </header>
  );
};

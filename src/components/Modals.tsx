import React from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  CheckCircle2,
  Star,
  ChevronRight,
  Home,
  Award,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import { LevelDef, LevelProgressMap } from '../types/game';

// ---------------- 1. MAIN MENU ----------------
interface MainMenuProps {
  onPlay: () => void;
  onOpenLevels: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const MainMenuModal: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenLevels,
  isMuted,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Title Lockup */}
        <div className="relative mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-xs font-semibold text-amber-400 mb-3 tracking-widest uppercase">
            <span>Precision Driving Simulator</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-3">
            <span>🚗</span>
            <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
              PARKING MASTER
            </span>
          </h1>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
            10 challenging courses with realistic car physics, obstacles, and precision parking zones.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto mb-6">
          <button
            onClick={onPlay}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] text-neutral-950 font-black text-lg tracking-wide uppercase shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY GAME</span>
          </button>

          <button
            onClick={onOpenLevels}
            className="w-full py-3.5 px-6 rounded-2xl bg-neutral-800 hover:bg-neutral-750 active:scale-[0.98] border border-neutral-700 text-white font-bold text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2"
          >
            <span>SELECT LEVEL</span>
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-3 px-6 rounded-2xl bg-neutral-850 hover:bg-neutral-800 active:scale-[0.98] border border-neutral-700/70 text-neutral-300 font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>SOUND OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>SOUND ON</span>
              </>
            )}
          </button>
        </div>

        {/* Controls Cheatsheet */}
        <div className="border-t border-neutral-800/80 pt-4 text-xs text-neutral-400 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">W</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">S</kbd>
            <span>Drive / Reverse</span>
          </div>
          <span className="text-neutral-700">·</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">D</kbd>
            <span>Steer</span>
          </div>
          <span className="text-neutral-700">·</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-neutral-300">SPACE</kbd>
            <span>Brake</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- 2. LEVEL SELECTION ----------------
interface LevelSelectProps {
  levels: LevelDef[];
  progress: LevelProgressMap;
  onSelectLevel: (levelId: number) => void;
  onBackToMenu: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectProps> = ({
  levels,
  progress,
  onSelectLevel,
  onBackToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              SELECT LEVEL
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              10 Levels of increasing precision and difficulty
            </p>
          </div>
          <button
            onClick={onBackToMenu}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">MENU</span>
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 my-6 overflow-y-auto py-1 pr-1">
          {levels.map((lvl) => {
            const p = progress[lvl.id] || {
              unlocked: lvl.id === 1,
              completed: false,
              stars: 0,
              bestScore: 0,
              bestTime: 0,
              bestAccuracy: 0,
            };

            const isLocked = !p.unlocked;

            return (
              <button
                key={lvl.id}
                disabled={isLocked}
                onClick={() => onSelectLevel(lvl.id)}
                className={`group relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all aspect-[4/3] ${
                  isLocked
                    ? 'bg-neutral-950/50 border-neutral-800/60 opacity-50 cursor-not-allowed'
                    : p.completed
                    ? 'bg-neutral-850/80 hover:bg-neutral-800 border-amber-500/40 hover:border-amber-400 shadow-md cursor-pointer hover:scale-[1.02]'
                    : 'bg-neutral-850/90 hover:bg-neutral-800 border-neutral-700 hover:border-white/50 shadow-md cursor-pointer hover:scale-[1.02]'
                }`}
              >
                {/* Level Number & Status Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    LVL {lvl.id}
                  </span>
                  <div>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-neutral-500" />
                    ) : p.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    )}
                  </div>
                </div>

                {/* Level Title */}
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {lvl.title.replace(/LEVEL \d+ — /, '')}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono mt-0.5">
                    <Clock className="w-3 h-3 opacity-70" />
                    <span>{lvl.timeLimit}s</span>
                  </div>
                </div>

                {/* Stars earned */}
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        !isLocked && p.stars >= starIdx
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-700'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-500" /> Locked
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Earn Stars
            </span>
          </div>
          <span className="font-mono text-neutral-400">
            {Object.values(progress).filter((x) => x.completed).length} / 10 Completed
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------- 3. PAUSE MODAL ----------------
interface PauseModalProps {
  onResume: () => void;
  onReset: () => void;
  onOpenLevels: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onReset,
  onOpenLevels,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
          ⏸ PAUSED
        </h2>
        <p className="text-xs text-neutral-400 mb-6">Game is currently paused</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onReset}
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-[0.98] border border-neutral-700 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET LEVEL</span>
          </button>

          <button
            onClick={onOpenLevels}
            className="w-full py-3 px-4 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-[0.98] border border-neutral-700/60 text-neutral-400 hover:text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>LEVELS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- 4. GAME OVER MODAL ----------------
interface GameOverModalProps {
  reason: 'crash' | 'timeout';
  levelNumber: number;
  score: number;
  timeLeft: number;
  onReset: () => void;
  onOpenLevels: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  levelNumber,
  score,
  timeLeft,
  onReset,
  onOpenLevels,
}) => {
  const isCrash = reason === 'crash';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-red-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
        {/* Red Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-36 bg-red-600/20 blur-3xl pointer-events-none rounded-full" />

        <div className="text-4xl mb-2">{isCrash ? '💥' : '⏰'}</div>

        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
          {isCrash ? 'GAME OVER' : "TIME'S UP!"}
        </h2>

        <p className="text-sm font-semibold text-red-400 mt-1 mb-5">
          {isCrash ? 'Your car crashed!' : 'You ran out of time!'}
        </p>

        {/* Stats card */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">LEVEL</div>
            <div className="text-lg font-black text-white font-mono">{levelNumber}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">SCORE</div>
            <div className="text-lg font-black text-amber-400 font-mono">{score}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-neutral-400">TIME</div>
            <div className="text-lg font-black text-white font-mono">{Math.max(0, timeLeft)}s</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onReset}
            className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET LEVEL</span>
          </button>

          <button
            onClick={onOpenLevels}
            className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-[0.98] border border-neutral-700 text-neutral-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>BACK TO LEVELS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- 5. LEVEL COMPLETE MODAL ----------------
interface LevelCompleteModalProps {
  levelNumber: number;
  score: number;
  timeLeft: number;
  accuracy: number;
  stars: number;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevels: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelNumber,
  score,
  timeLeft,
  accuracy,
  stars,
  isLastLevel,
  onNextLevel,
  onReplay,
  onOpenLevels,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
      <div className="w-full max-w-md bg-neutral-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Emerald Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-44 bg-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        <div className="text-4xl mb-2">🎉</div>

        <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          LEVEL COMPLETE!
        </h2>

        <p className="text-xs font-semibold text-emerald-400 mt-1 mb-4 uppercase tracking-widest">
          Level {levelNumber} Mastered
        </p>

        {/* Stars Banner */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-2xl border transition-all duration-500 ${
                stars >= starIdx
                  ? 'bg-amber-500/20 border-amber-400/80 scale-110 shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-800/40 border-neutral-700/50 opacity-40'
              }`}
            >
              <Star
                className={`w-7 h-7 sm:w-8 sm:h-8 ${
                  stars >= starIdx
                    ? 'fill-amber-400 text-amber-400 animate-bounce'
                    : 'text-neutral-600'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Performance Breakdown Table */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 my-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
              <Award className="w-3 h-3" /> SCORE
            </div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5 tabular-nums">
              {score}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
              <Clock className="w-3 h-3" /> TIME REMAINING
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5 tabular-nums">
              {timeLeft}s
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 uppercase">
              <Target className="w-3 h-3" /> ACCURACY
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5 tabular-nums">
              {accuracy}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {!isLastLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-neutral-950 font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>NEXT LEVEL</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onNextLevel}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] text-neutral-950 font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>CLAIM CHAMPION TROPHY</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-3 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-[0.98] border border-neutral-700 text-neutral-200 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={onOpenLevels}
              className="py-3 px-3 rounded-xl bg-neutral-850 hover:bg-neutral-800 active:scale-[0.98] border border-neutral-700/70 text-neutral-400 hover:text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>LEVELS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- 6. GAME COMPLETE CELEBRATION MODAL ----------------
interface GameCompleteModalProps {
  totalScore: number;
  totalStars: number;
  onReplayLevel10: () => void;
  onOpenLevels: () => void;
}

export const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
  totalScore,
  totalStars,
  onReplayLevel10,
  onOpenLevels,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-500">
      <div className="w-full max-w-lg bg-neutral-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Gold Glow */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-56 bg-amber-400/25 blur-3xl pointer-events-none rounded-full" />

        <div className="text-5xl sm:text-6xl mb-3 animate-bounce">🏆</div>

        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 uppercase tracking-tight">
          PARKING MASTER COMPLETE!
        </h1>

        <p className="text-sm font-semibold text-neutral-300 mt-2 max-w-md mx-auto">
          Congratulations! You conquered all 10 intense obstacle courses and proved exceptional precision driving skills.
        </p>

        {/* Grand stats box */}
        <div className="bg-neutral-950/80 border border-amber-500/30 rounded-2xl p-5 my-6 grid grid-cols-2 gap-4">
          <div className="border-r border-neutral-800 pr-3">
            <div className="text-xs uppercase font-bold text-neutral-400">TOTAL SCORE</div>
            <div className="text-3xl font-black text-amber-400 font-mono tabular-nums mt-1">
              {totalScore}
            </div>
          </div>
          <div className="pl-3">
            <div className="text-xs uppercase font-bold text-neutral-400">TOTAL STARS</div>
            <div className="text-3xl font-black text-yellow-300 font-mono tabular-nums mt-1 flex items-center justify-center gap-1.5">
              <span>{totalStars}</span>
              <span className="text-sm text-neutral-500 font-sans">/ 30</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReplayLevel10}
            className="flex-1 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY LEVEL 10</span>
          </button>

          <button
            onClick={onOpenLevels}
            className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 active:scale-[0.98] border border-neutral-700 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>VIEW ALL LEVELS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

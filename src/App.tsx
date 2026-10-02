import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, LevelProgressMap, ControlInputs, CarState, Particle, SkidMark } from './types/game';
import { LEVELS } from './services/levels';
import {
  evaluateParking,
  getCarCorners,
  getObstacleCorners,
  testPolygonCircleCollision,
  testPolygonCollision,
  updateCarPhysics,
} from './services/physics';
import { audioSystem } from './services/audio';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import {
  MainMenuModal,
  LevelSelectModal,
  PauseModal,
  GameOverModal,
  LevelCompleteModal,
  GameCompleteModal,
} from './components/Modals';

const PROGRESS_STORAGE_KEY = 'parking_master_progress_v1';

function loadInitialProgress(): LevelProgressMap {
  const initial: LevelProgressMap = {};
  for (let i = 1; i <= 10; i++) {
    initial[i] = {
      unlocked: i === 1,
      completed: false,
      stars: 0,
      bestScore: 0,
      bestTime: 0,
      bestAccuracy: 0,
    };
  }

  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      for (let i = 1; i <= 10; i++) {
        if (parsed[i]) {
          initial[i] = { ...initial[i], ...parsed[i] };
        }
      }
    }
  } catch {
    // fallback
  }

  return initial;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [progress, setProgress] = useState<LevelProgressMap>(loadInitialProgress);
  const [isMuted, setIsMuted] = useState<boolean>(() => audioSystem.isMuted());

  // Level Gameplay State
  const currentLevel = LEVELS[currentLevelIndex] || LEVELS[0];
  const [timeLeft, setTimeLeft] = useState<number>(currentLevel.timeLimit);
  const [score, setScore] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [gameOverReason, setGameOverReason] = useState<'crash' | 'timeout'>('crash');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isParkedHolding, setIsParkedHolding] = useState<boolean>(false);

  // FX & Animation States
  const [particles, setParticles] = useState<Particle[]>([]);
  const [skidMarks, setSkidMarks] = useState<SkidMark[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState<number>(0);

  // Active inputs
  const inputsRef = useRef<ControlInputs>({
    up: false,
    down: false,
    left: false,
    right: false,
    brake: false,
  });

  // Car State ref for smooth 60fps physics
  const carRef = useRef<CarState>({
    x: currentLevel.carStart.x,
    y: currentLevel.carStart.y,
    angle: currentLevel.carStart.angle,
    speed: 0,
    steerAngle: 0,
    width: 36,
    length: 68,
    wheelbase: 42,
    isBraking: false,
    isAccelerating: false,
    isReversing: false,
  });

  // State mirror for rendering
  const [renderedCar, setRenderedCar] = useState<CarState>(carRef.current);

  // References to keep loop state clean
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const currentLevelRef = useRef(currentLevel);
  currentLevelRef.current = currentLevel;

  const parkHoldTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const timerIntervalRef = useRef<number | null>(null);

  // Save progress helper
  const saveProgress = (newProgress: LevelProgressMap) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    } catch {
      // ignore
    }
  };

  // Reset current level function
  const resetLevel = useCallback(() => {
    const lvl = currentLevelRef.current;
    carRef.current = {
      x: lvl.carStart.x,
      y: lvl.carStart.y,
      angle: lvl.carStart.angle,
      speed: 0,
      steerAngle: 0,
      width: 36,
      length: 68,
      wheelbase: 42,
      isBraking: false,
      isAccelerating: false,
      isReversing: false,
    };
    setRenderedCar({ ...carRef.current });

    inputsRef.current = {
      up: false,
      down: false,
      left: false,
      right: false,
      brake: false,
    };

    parkHoldTimerRef.current = 0;
    setTimeLeft(lvl.timeLimit);
    setScore(0);
    setAccuracy(100);
    setStatusMessage('');
    setIsParkedHolding(false);
    setParticles([]);
    setSkidMarks([]);
    setShakeIntensity(0);

    audioSystem.startEngine();
    setGameState('PLAYING');
  }, []);

  // Start specific level
  const startLevel = useCallback((levelId: number) => {
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    if (idx !== -1) {
      setCurrentLevelIndex(idx);
      const lvl = LEVELS[idx];
      currentLevelRef.current = lvl;

      carRef.current = {
        x: lvl.carStart.x,
        y: lvl.carStart.y,
        angle: lvl.carStart.angle,
        speed: 0,
        steerAngle: 0,
        width: 36,
        length: 68,
        wheelbase: 42,
        isBraking: false,
        isAccelerating: false,
        isReversing: false,
      };
      setRenderedCar({ ...carRef.current });

      inputsRef.current = {
        up: false,
        down: false,
        left: false,
        right: false,
        brake: false,
      };

      parkHoldTimerRef.current = 0;
      setTimeLeft(lvl.timeLimit);
      setScore(0);
      setAccuracy(100);
      setStatusMessage('');
      setIsParkedHolding(false);
      setParticles([]);
      setSkidMarks([]);
      setShakeIntensity(0);

      audioSystem.startEngine();
      setGameState('PLAYING');
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle pause with ESC or P
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameStateRef.current === 'PLAYING') {
          audioSystem.stopEngine();
          setGameState('PAUSED');
        } else if (gameStateRef.current === 'PAUSED') {
          audioSystem.startEngine();
          setGameState('PLAYING');
        }
        return;
      }

      // Quick reset with R
      if ((e.key === 'r' || e.key === 'R') && (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'GAME_OVER')) {
        audioSystem.playButtonClick();
        resetLevel();
        return;
      }

      if (gameStateRef.current !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputsRef.current.up = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputsRef.current.down = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputsRef.current.left = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputsRef.current.right = true;
          break;
        case ' ':
          inputsRef.current.brake = true;
          audioSystem.playBrake();
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputsRef.current.up = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          inputsRef.current.down = false;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputsRef.current.left = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputsRef.current.right = false;
          break;
        case ' ':
          inputsRef.current.brake = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetLevel]);

  // Handle Mobile Touch Controls
  const handleControlChange = useCallback((key: keyof ControlInputs, value: boolean) => {
    if (gameStateRef.current !== 'PLAYING') return;
    inputsRef.current[key] = value;
    if (key === 'brake' && value) {
      audioSystem.playBrake();
    }
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time is up!
            audioSystem.playGameOver();
            setGameOverReason('timeout');
            setGameState('GAME_OVER');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameState]);

  // Main 60FPS Game Physics & Collision Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Update shake intensity decay
      setShakeIntensity((prev) => (prev > 0.01 ? prev * 0.88 : 0));

      // Update active particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - dt,
            alpha: Math.max(0, p.life / p.maxLife),
          }))
          .filter((p) => p.life > 0)
      );

      if (gameStateRef.current === 'PLAYING') {
        const car = carRef.current;
        const level = currentLevelRef.current;
        const inputs = inputsRef.current;

        // Perform 2 physics sub-steps for smooth trajectory and tunnel prevention
        const subSteps = 2;
        let lastSkidding = false;
        let activeCar = car;

        for (let i = 0; i < subSteps; i++) {
          const { newCar, skidding } = updateCarPhysics(activeCar, inputs, 1.0 / subSteps);
          activeCar = newCar;
          if (skidding) lastSkidding = true;
        }

        carRef.current = activeCar;
        setRenderedCar({ ...activeCar });

        // Update engine audio pitch & rumble
        audioSystem.updateEngine(activeCar.speed, activeCar.isAccelerating);

        // Emit skid marks if skidding or hard braking
        if (lastSkidding && Math.abs(activeCar.speed) > 1.2) {
          const corners = getCarCorners(activeCar);
          const rearRight = corners[3];
          const rearLeft = corners[2];
          setSkidMarks((prev) => {
            const next = [
              ...prev,
              { x1: rearRight.x, y1: rearRight.y, x2: rearRight.x + 1, y2: rearRight.y + 1, alpha: 0.35 },
              { x1: rearLeft.x, y1: rearLeft.y, x2: rearLeft.x + 1, y2: rearLeft.y + 1, alpha: 0.35 },
            ];
            // Keep up to 100 skid segments
            return next.length > 100 ? next.slice(next.length - 100) : next;
          });
        }

        // 1. COLLISION DETECTION
        const carCorners = getCarCorners(activeCar);
        let hasCollided = false;

        for (const obs of level.obstacles) {
          if (obs.type === 'cone') {
            if (testPolygonCircleCollision(carCorners, { x: obs.x, y: obs.y, radius: obs.radius || 9 })) {
              hasCollided = true;
              break;
            }
          } else {
            const obsCorners = getObstacleCorners(obs);
            if (testPolygonCollision(carCorners, obsCorners)) {
              hasCollided = true;
              break;
            }
          }
        }

        if (hasCollided) {
          // CRASH SEQUENCE!
          audioSystem.playCollision();
          setShakeIntensity(1.0);
          carRef.current.speed = 0;

          // Spawn crash sparks and smoke
          const crashParticles: Particle[] = [];
          for (let p = 0; p < 24; p++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 4;
            crashParticles.push({
              x: activeCar.x,
              y: activeCar.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 0.6 + Math.random() * 0.4,
              maxLife: 1.0,
              color: Math.random() > 0.5 ? '#F59E0B' : '#EF4444',
              size: 3 + Math.random() * 4,
              alpha: 1.0,
              shape: Math.random() > 0.4 ? 'spark' : 'circle',
            });
          }
          setParticles((prev) => [...prev, ...crashParticles]);

          setGameOverReason('crash');
          setGameState('GAME_OVER');
          return;
        }

        // 2. PARKING EVALUATION
        const evalResult = evaluateParking(activeCar, level.parkingZone);
        setStatusMessage(evalResult.statusMessage);
        setAccuracy(evalResult.accuracy);

        if (evalResult.isParked) {
          setIsParkedHolding(true);
          parkHoldTimerRef.current += dt;

          // Require stable hold for 0.35s to confirm parking intention
          if (parkHoldTimerRef.current >= 0.35) {
            // LEVEL COMPLETED!
            audioSystem.playLevelComplete();

            // Calculate final scores and stars
            const timeRemaining = timeLeft;
            const finalScore = Math.max(100, Math.round(1000 + timeRemaining * 35 + evalResult.accuracy * 12));
            setScore(finalScore);

            // 3 stars condition: high accuracy and plenty of time left
            let stars = 1;
            if (evalResult.accuracy >= 75 && timeRemaining >= level.timeLimit * 0.25) {
              stars = 2;
            }
            if (evalResult.accuracy >= 85 && timeRemaining >= level.timeLimit * 0.4) {
              stars = 3;
            }
            setEarnedStars(stars);

            // Spawn celebration confetti
            const confetti: Particle[] = [];
            const colors = ['#22C55E', '#EAB308', '#3B82F6', '#EC4899', '#A855F7', '#F97316'];
            for (let c = 0; c < 50; c++) {
              const a = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 5;
              confetti.push({
                x: level.parkingZone.x,
                y: level.parkingZone.y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd - 2,
                life: 1.5 + Math.random() * 1.0,
                maxLife: 2.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 5,
                alpha: 1.0,
                shape: 'rect',
              });
            }
            setParticles((prev) => [...prev, ...confetti]);

            // Update level progression
            const nextLvlId = level.id + 1;
            const updated = { ...progress };

            // Update current level
            const curP = updated[level.id] || {
              unlocked: true,
              completed: false,
              stars: 0,
              bestScore: 0,
              bestTime: 0,
              bestAccuracy: 0,
            };
            updated[level.id] = {
              unlocked: true,
              completed: true,
              stars: Math.max(curP.stars, stars),
              bestScore: Math.max(curP.bestScore, finalScore),
              bestTime: Math.max(curP.bestTime, timeRemaining),
              bestAccuracy: Math.max(curP.bestAccuracy, evalResult.accuracy),
            };

            // Unlock next level if exists
            if (nextLvlId <= 10) {
              updated[nextLvlId] = {
                ...(updated[nextLvlId] || {}),
                unlocked: true,
                completed: updated[nextLvlId]?.completed || false,
                stars: updated[nextLvlId]?.stars || 0,
                bestScore: updated[nextLvlId]?.bestScore || 0,
                bestTime: updated[nextLvlId]?.bestTime || 0,
                bestAccuracy: updated[nextLvlId]?.bestAccuracy || 0,
              };
            }

            saveProgress(updated);
            setGameState('LEVEL_COMPLETE');
            return;
          }
        } else {
          setIsParkedHolding(false);
          parkHoldTimerRef.current = 0;
        }
      } else if (gameStateRef.current === 'MENU') {
        // Subtle ambient moving demonstration in background for Main Menu
        const t = time * 0.001;
        const lvl = currentLevelRef.current;
        const demoX = lvl.carStart.x + Math.sin(t * 0.8) * 80;
        const demoY = lvl.carStart.y + Math.cos(t * 0.8) * 35;
        const demoAngle = lvl.carStart.angle + Math.sin(t * 0.8) * 0.25;

        setRenderedCar((prev) => ({
          ...prev,
          x: demoX,
          y: demoY,
          angle: demoAngle,
          speed: 1.2,
          steerAngle: Math.sin(t * 1.2) * 0.2,
          isAccelerating: true,
          isBraking: false,
        }));
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [timeLeft, progress]);

  // Sound toggle handler
  const handleToggleSound = useCallback(() => {
    const enabled = audioSystem.toggleSound();
    setIsMuted(!enabled);
    if (enabled && gameStateRef.current === 'PLAYING') {
      audioSystem.startEngine();
    }
  }, []);

  // UI Flow Handlers
  const handleStartPlay = () => {
    audioSystem.playButtonClick();
    setGameState('LEVEL_SELECT');
  };

  const handleOpenLevels = () => {
    audioSystem.playButtonClick();
    audioSystem.stopEngine();
    setGameState('LEVEL_SELECT');
  };

  const handleBackToMenu = () => {
    audioSystem.playButtonClick();
    audioSystem.stopEngine();
    setGameState('MENU');
  };

  const handlePause = () => {
    if (gameState === 'PLAYING') {
      audioSystem.playButtonClick();
      audioSystem.stopEngine();
      setGameState('PAUSED');
    }
  };

  const handleResume = () => {
    audioSystem.playButtonClick();
    audioSystem.startEngine();
    setGameState('PLAYING');
  };

  const handleNextLevel = () => {
    audioSystem.playButtonClick();
    if (currentLevel.id === 10) {
      // Completed last level! Show Grand Champion Celebration!
      setGameState('GAME_COMPLETE');
    } else {
      startLevel(currentLevel.id + 1);
    }
  };

  // Grand stats calculation for level 10 victory
  const totalScore = Object.values(progress).reduce((acc, p) => acc + (p.bestScore || 0), 0);
  const totalStars = Object.values(progress).reduce((acc, p) => acc + (p.stars || 0), 0);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none touch-none">
      {/* Game Canvas Viewport */}
      <GameCanvas
        level={currentLevel}
        car={renderedCar}
        isGameOver={gameState === 'GAME_OVER'}
        isLevelComplete={gameState === 'LEVEL_COMPLETE'}
        isParkedHolding={isParkedHolding}
        accuracy={accuracy}
        particles={particles}
        skidMarks={skidMarks}
        shakeIntensity={shakeIntensity}
      />

      {/* In-Game Heads Up Display (HUD) */}
      {gameState === 'PLAYING' && (
        <HUD
          levelNumber={currentLevel.id}
          timeLeft={timeLeft}
          score={score}
          accuracy={accuracy}
          isMuted={isMuted}
          statusMessage={statusMessage}
          isParkedHolding={isParkedHolding}
          onToggleSound={handleToggleSound}
          onPause={handlePause}
          onReset={resetLevel}
        />
      )}

      {/* On-Screen Mobile Touch Controls */}
      {gameState === 'PLAYING' && (
        <MobileControls onControlChange={handleControlChange} />
      )}

      {/* 1. Main Menu Screen */}
      {gameState === 'MENU' && (
        <MainMenuModal
          onPlay={handleStartPlay}
          onOpenLevels={handleOpenLevels}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. Level Select Screen */}
      {gameState === 'LEVEL_SELECT' && (
        <LevelSelectModal
          levels={LEVELS}
          progress={progress}
          onSelectLevel={startLevel}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {/* 3. Pause Screen */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onReset={resetLevel}
          onOpenLevels={handleOpenLevels}
        />
      )}

      {/* 4. Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          reason={gameOverReason}
          levelNumber={currentLevel.id}
          score={score}
          timeLeft={timeLeft}
          onReset={resetLevel}
          onOpenLevels={handleOpenLevels}
        />
      )}

      {/* 5. Level Complete Screen */}
      {gameState === 'LEVEL_COMPLETE' && (
        <LevelCompleteModal
          levelNumber={currentLevel.id}
          score={score}
          timeLeft={timeLeft}
          accuracy={accuracy}
          stars={earnedStars}
          isLastLevel={currentLevel.id === 10}
          onNextLevel={handleNextLevel}
          onReplay={resetLevel}
          onOpenLevels={handleOpenLevels}
        />
      )}

      {/* 6. Game Complete Celebration Screen */}
      {gameState === 'GAME_COMPLETE' && (
        <GameCompleteModal
          totalScore={totalScore}
          totalStars={totalStars}
          onReplayLevel10={() => startLevel(10)}
          onOpenLevels={handleOpenLevels}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { CarState, LevelDef, Obstacle, Particle, SkidMark, Vector2D } from '../types/game';
import { getCarCorners, getObstacleCorners, getParkingCorners } from '../services/physics';

interface GameCanvasProps {
  level: LevelDef;
  car: CarState;
  isGameOver: boolean;
  isLevelComplete: boolean;
  isParkedHolding: boolean;
  accuracy: number;
  particles: Particle[];
  skidMarks: SkidMark[];
  shakeIntensity: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  car,
  isGameOver,
  isLevelComplete,
  isParkedHolding,
  particles,
  skidMarks,
  shakeIntensity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<{ x: number; y: number; zoom: number }>({
    x: car.x,
    y: car.y,
    zoom: 1.1,
  });

  // Track wheel roll angle for animation
  const wheelRollRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Update Camera position (smooth follow)
    const cam = cameraRef.current;
    const targetZoom = isLevelComplete ? 1.35 : 1.1;
    cam.zoom += (targetZoom - cam.zoom) * 0.05;

    cam.x += (car.x - cam.x) * 0.1;
    cam.y += (car.y - cam.y) * 0.1;

    // Camera shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * shakeIntensity * 14;
      shakeY = (Math.random() - 0.5) * shakeIntensity * 14;
    }

    // Wheel roll accumulation
    wheelRollRef.current += car.speed * 0.15;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Center camera on car
    ctx.save();
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // 1. Draw Map Asphalt Surface
    drawAsphalt(ctx, level);

    // 2. Draw Road Markings & Decor
    drawRoadMarkings(ctx, level);

    // 3. Draw Skid Marks
    drawSkidMarks(ctx, skidMarks);

    // 4. Draw Parking Zone
    drawParkingZone(ctx, level, isParkedHolding, isLevelComplete);

    // 5. Draw Obstacles (walls, curbs, parked cars, cones)
    drawObstacles(ctx, level.obstacles);

    // 6. Draw Player's Car
    drawPlayerCar(ctx, car, wheelRollRef.current, isGameOver);

    // 7. Draw Particles (smoke, sparks, confetti)
    drawParticles(ctx, particles);

    ctx.restore(); // restore camera
    ctx.restore(); // restore dpr
  }, [level, car, isGameOver, isLevelComplete, isParkedHolding, skidMarks, particles, shakeIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block bg-neutral-950 cursor-grab active:cursor-grabbing"
    />
  );
};

// ---------------- Helper Render Functions ----------------

function drawAsphalt(ctx: CanvasRenderingContext2D, level: LevelDef) {
  const { mapWidth: w, mapHeight: h, theme } = level;

  // Primary asphalt color based on level theme
  let asphaltColor = '#1e293b';
  let curbColor = '#334155';
  if (theme === 'garage') {
    asphaltColor = '#27272a';
    curbColor = '#3f3f46';
  } else if (theme === 'night') {
    asphaltColor = '#0f172a';
    curbColor = '#1e293b';
  } else if (theme === 'rooftop') {
    asphaltColor = '#18181b';
    curbColor = '#27272a';
  }

  // Draw ground
  ctx.fillStyle = asphaltColor;
  ctx.fillRect(0, 0, w, h);

  // Subtle asphalt grid pattern / paving joints
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Perimeter border curb
  ctx.strokeStyle = curbColor;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, w - 12, h - 12);
}

function drawRoadMarkings(ctx: CanvasRenderingContext2D, level: LevelDef) {
  const { mapWidth: w, mapHeight: h } = level;

  ctx.save();

  // Draw decorative arrows and dashed guide lanes based on level
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);

  // Center dashed guidance line across the road
  ctx.beginPath();
  if (level.id === 1) {
    ctx.moveTo(120, 350);
    ctx.lineTo(700, 350);
  } else if (level.id === 4) {
    ctx.moveTo(100, 350);
    ctx.lineTo(880, 350);
  }
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Draw road arrows pointing towards destination
  drawArrow(ctx, level.carStart.x + 80, level.carStart.y, level.carStart.angle);

  // Zebra pedestrian crossing or speed bumps if appropriate
  if (level.theme === 'suburban' || level.theme === 'plaza') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const zebraX = w * 0.45;
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(zebraX + i * 16, h * 0.4, 8, 80);
    }
  }

  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(12, -4);
  ctx.lineTo(4, -4);
  ctx.lineTo(4, 16);
  ctx.lineTo(-4, 16);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-12, -4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawSkidMarks(ctx: CanvasRenderingContext2D, skidMarks: SkidMark[]) {
  if (skidMarks.length === 0) return;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  for (const s of skidMarks) {
    ctx.strokeStyle = `rgba(10, 10, 15, ${Math.min(0.4, s.alpha)})`;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParkingZone(
  ctx: CanvasRenderingContext2D,
  level: LevelDef,
  isParkedHolding: boolean,
  isLevelComplete: boolean
) {
  const zone = level.parkingZone;
  const corners = getParkingCorners(zone);

  ctx.save();

  // Glow fill
  let glowColor = 'rgba(234, 179, 8, 0.08)'; // yellow
  let borderColor = '#EAB308'; // yellow
  if (isLevelComplete || isParkedHolding) {
    glowColor = 'rgba(34, 197, 94, 0.2)'; // bright green
    borderColor = '#22C55E';
  }

  // Draw ground highlight
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Draw dashed parking boundary lines
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw bright corner brackets
  const bracketSize = 14;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';

  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const prev = corners[(i + 3) % 4];
    const next = corners[(i + 1) % 4];

    const vPrev = normalizeVec({ x: prev.x - c.x, y: prev.y - c.y });
    const vNext = normalizeVec({ x: next.x - c.x, y: next.y - c.y });

    ctx.beginPath();
    ctx.moveTo(c.x + vPrev.x * bracketSize, c.y + vPrev.y * bracketSize);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x + vNext.x * bracketSize, c.y + vNext.y * bracketSize);
    ctx.stroke();
  }

  // Draw "PARK" or "REVERSE" text in center
  ctx.save();
  ctx.translate(zone.x, zone.y);
  ctx.rotate(zone.angle);

  // Direction chevron
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, -18);
  ctx.lineTo(0, -28);
  ctx.lineTo(10, -18);
  ctx.stroke();

  ctx.fillStyle = borderColor;
  ctx.font = 'bold 16px "Teko", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText(zone.label || 'PARK', 0, 4);

  ctx.restore();

  ctx.restore();
}

function normalizeVec(v: Vector2D): Vector2D {
  const len = Math.hypot(v.x, v.y);
  return len > 0.0001 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
}

function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) {
  for (const obs of obstacles) {
    if (obs.type === 'cone') {
      drawCone(ctx, obs);
    } else if (obs.type === 'car') {
      drawParkedCar(ctx, obs);
    } else if (obs.type === 'barrier') {
      drawBarrier(ctx, obs);
    } else if (obs.type === 'planter') {
      drawPlanter(ctx, obs);
    } else {
      drawWallOrCurb(ctx, obs);
    }
  }
}

function drawCone(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius || 10;

  ctx.save();
  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(obs.x + 3, obs.y + 3, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Square base
  ctx.fillStyle = '#EA580C'; // Dark orange base
  ctx.fillRect(obs.x - r, obs.y - r, r * 2, r * 2);

  // Cone round body
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.arc(obs.x, obs.y, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // White reflective ring
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(obs.x, obs.y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Orange top tip
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.arc(obs.x, obs.y, r * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBarrier(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  if (obs.angle) ctx.rotate(obs.angle);

  const w = obs.width;
  const h = obs.height;

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);

  // Barrier body
  ctx.fillStyle = '#FBBF24'; // Warning yellow
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Diagonal black caution stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();

  ctx.fillStyle = '#18181B';
  const stripeW = 12;
  const total = w + h + 20;
  for (let s = -total; s < total; s += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(s, -h / 2);
    ctx.lineTo(s + stripeW, -h / 2);
    ctx.lineTo(s + stripeW - h, h / 2);
    ctx.lineTo(s - h, h / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Border outline
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  ctx.restore();
}

function drawWallOrCurb(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const corners = getObstacleCorners(obs);

  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(corners[0].x + 3, corners[0].y + 3);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x + 3, corners[i].y + 3);
  }
  ctx.closePath();
  ctx.fill();

  // Solid concrete body
  ctx.fillStyle = obs.color || '#475569';
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Bevel top highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawPlanter(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  if (obs.angle) ctx.rotate(obs.angle);

  const w = obs.width;
  const h = obs.height;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);

  // Border box
  ctx.fillStyle = '#334155';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Foliage
  ctx.fillStyle = '#15803D';
  ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);

  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(-w * 0.2, 0, Math.min(w, h) * 0.25, 0, Math.PI * 2);
  ctx.arc(w * 0.2, 0, Math.min(w, h) * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParkedCar(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  ctx.save();
  ctx.translate(obs.x, obs.y);
  ctx.rotate(obs.angle || 0);

  const w = obs.width || 36;
  const l = obs.height || 68;
  const carColor = obs.details?.carColor || '#2563EB';

  // 1. Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -l / 2 + 4, w, l, 6);
  ctx.fill();

  // 2. Wheels
  ctx.fillStyle = '#18181B';
  const wheelW = 5;
  const wheelL = 13;
  // Front left / right
  ctx.fillRect(-w / 2 - wheelW + 1, -l / 2 + 10, wheelW, wheelL);
  ctx.fillRect(w / 2 - 1, -l / 2 + 10, wheelW, wheelL);
  // Rear left / right
  ctx.fillRect(-w / 2 - wheelW + 1, l / 2 - 23, wheelW, wheelL);
  ctx.fillRect(w / 2 - 1, l / 2 - 23, wheelW, wheelL);

  // 3. Car Body
  ctx.fillStyle = carColor;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -l / 2, w, l, 8);
  ctx.fill();

  // Subtle metallic gradient overlay
  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(0.5, 'transparent');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -l / 2, w, l, 8);
  ctx.fill();

  // 4. Windshield & Windows (dark tinted glass)
  ctx.fillStyle = '#0F172A';
  // Front windshield
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -l / 2 + 16);
  ctx.lineTo(w / 2 - 4, -l / 2 + 16);
  ctx.lineTo(w / 2 - 6, -l / 2 + 25);
  ctx.lineTo(-w / 2 + 6, -l / 2 + 25);
  ctx.closePath();
  ctx.fill();

  // Rear windshield
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, l / 2 - 22);
  ctx.lineTo(w / 2 - 6, l / 2 - 22);
  ctx.lineTo(w / 2 - 4, l / 2 - 14);
  ctx.lineTo(-w / 2 + 4, l / 2 - 14);
  ctx.closePath();
  ctx.fill();

  // Roof
  ctx.fillStyle = carColor;
  ctx.fillRect(-w / 2 + 6, -l / 2 + 25, w - 12, l - 47);

  // 5. Headlights & Taillights
  // Front headlights
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-w / 2 + 3, -l / 2, 7, 3);
  ctx.fillRect(w / 2 - 10, -l / 2, 7, 3);

  // Rear taillights
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-w / 2 + 3, l / 2 - 3, 7, 3);
  ctx.fillRect(w / 2 - 10, l / 2 - 3, 7, 3);

  ctx.restore();
}

function drawPlayerCar(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  wheelRoll: number,
  isGameOver: boolean
) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const w = car.width;
  const l = car.length;

  // Dynamic tilt/pitch offset based on acceleration/braking
  let pitchY = 0;
  if (car.isAccelerating) pitchY = 1.5;
  if (car.isBraking || (car.speed > 0.5 && car.isReversing)) pitchY = -2.0;

  // 1. Drop shadow with blur effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 5, -l / 2 + 5 + pitchY, w, l, 7);
  ctx.fill();

  // 2. Wheels
  const wheelW = 6;
  const wheelL = 14;
  const wheelOffsetY = -l / 2 + 14;
  const rearWheelOffsetY = l / 2 - 16;

  // Front Wheels with active steering angle!
  // Front Left
  drawWheel(ctx, -w / 2 - 2, wheelOffsetY, wheelW, wheelL, car.steerAngle, wheelRoll);
  // Front Right
  drawWheel(ctx, w / 2 + 2, wheelOffsetY, wheelW, wheelL, car.steerAngle, wheelRoll);

  // Rear Wheels (fixed angle 0)
  drawWheel(ctx, -w / 2 - 2, rearWheelOffsetY, wheelW, wheelL, 0, wheelRoll);
  drawWheel(ctx, w / 2 + 2, rearWheelOffsetY, wheelW, wheelL, 0, wheelRoll);

  // 3. Headlight Beams (casting forward on road)
  ctx.save();
  const beamGrad = ctx.createLinearGradient(0, -l / 2, 0, -l / 2 - 120);
  beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
  beamGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.12)');
  beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = beamGrad;

  // Left headlight beam
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -l / 2);
  ctx.lineTo(-w / 2 - 35, -l / 2 - 120);
  ctx.lineTo(-w / 2 + 20, -l / 2 - 120);
  ctx.closePath();
  ctx.fill();

  // Right headlight beam
  ctx.beginPath();
  ctx.moveTo(w / 2 - 6, -l / 2);
  ctx.lineTo(w / 2 - 20, -l / 2 - 120);
  ctx.lineTo(w / 2 + 35, -l / 2 - 120);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Car Chassis / Body (Vibrant sports red / cherry with gloss)
  ctx.fillStyle = isGameOver ? '#78350F' : '#DC2626';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -l / 2 + pitchY, w, l, 9);
  ctx.fill();

  // Subtle metallic shine highlight
  const carShine = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  carShine.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  carShine.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
  carShine.addColorStop(0.7, 'transparent');
  carShine.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = carShine;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -l / 2 + pitchY, w, l, 9);
  ctx.fill();

  // Hood vents / racing stripes
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-3, -l / 2 + 5 + pitchY, 6, 18);

  // 5. Cabin Glass & Windows
  ctx.fillStyle = '#0F172A';
  // Front Windshield
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -l / 2 + 22 + pitchY);
  ctx.lineTo(w / 2 - 4, -l / 2 + 22 + pitchY);
  ctx.lineTo(w / 2 - 6, -l / 2 + 32 + pitchY);
  ctx.lineTo(-w / 2 + 6, -l / 2 + 32 + pitchY);
  ctx.closePath();
  ctx.fill();

  // Glass reflection sheen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 8, -l / 2 + 24 + pitchY);
  ctx.lineTo(-w / 2 + 14, -l / 2 + 30 + pitchY);
  ctx.stroke();

  // Rear Windshield
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, l / 2 - 20 + pitchY);
  ctx.lineTo(w / 2 - 6, l / 2 - 20 + pitchY);
  ctx.lineTo(w / 2 - 4, l / 2 - 12 + pitchY);
  ctx.lineTo(-w / 2 + 4, l / 2 - 12 + pitchY);
  ctx.closePath();
  ctx.fill();

  // Roof panel
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(-w / 2 + 6, -l / 2 + 32 + pitchY, w - 12, l - 52);

  // Side mirrors
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(-w / 2 - 4, -l / 2 + 22 + pitchY, 4, 6);
  ctx.fillRect(w / 2, -l / 2 + 22 + pitchY, 4, 6);

  // 6. Headlights (front)
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -l / 2 + pitchY, 8, 3, 2);
  ctx.roundRect(w / 2 - 12, -l / 2 + pitchY, 8, 3, 2);
  ctx.fill();

  // 7. Taillights & Active Brake Lights
  const isBrakingOrReversing = car.isBraking || car.isReversing;
  if (isBrakingOrReversing) {
    // Intense brake glow halos
    ctx.save();
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FF2222';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 3, l / 2 - 4 + pitchY, 9, 4, 2);
    ctx.roundRect(w / 2 - 12, l / 2 - 4 + pitchY, 9, 4, 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Normal red taillights
    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 3, l / 2 - 4 + pitchY, 8, 3, 2);
    ctx.roundRect(w / 2 - 11, l / 2 - 4 + pitchY, 8, 3, 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  steerAngle: number,
  wheelRoll: number
) {
  ctx.save();
  ctx.translate(x, y);
  if (steerAngle !== 0) {
    ctx.rotate(steerAngle);
  }

  // Black tire rubber
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2);
  ctx.fill();

  // Silver alloy rim
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(-w / 2 + 1, -h / 2 + 3, w - 2, h - 6);

  // Rolling tread lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  const rollOffset = (wheelRoll % 6) - 3;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 1, rollOffset);
  ctx.lineTo(w / 2 - 1, rollOffset);
  ctx.stroke();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  if (particles.length === 0) return;

  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    if (p.shape === 'rect') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 1.5);
    } else if (p.shape === 'spark') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 3, p.y + p.vy * 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

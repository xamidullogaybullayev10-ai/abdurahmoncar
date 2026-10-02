export type GameState = 
  | 'MENU' 
  | 'LEVEL_SELECT' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'GAME_OVER' 
  | 'LEVEL_COMPLETE' 
  | 'GAME_COMPLETE';

export interface Vector2D {
  x: number;
  y: number;
}

export interface CarState {
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  steerAngle: number;
  width: number;
  length: number;
  wheelbase: number;
  isBraking: boolean;
  isAccelerating: boolean;
  isReversing: boolean;
}

export interface ControlInputs {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

export type ObstacleType = 'wall' | 'cone' | 'car' | 'barrier' | 'curb' | 'planter';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number; // radians
  radius?: number; // for circular obstacles
  color?: string;
  details?: {
    carColor?: string;
    carType?: 'sedan' | 'suv' | 'coupe';
  };
}

export interface ParkingZone {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // radians
  targetAngle: number; // desired heading
  requireReverse?: boolean;
  label?: string;
}

export type MapTheme = 'plaza' | 'garage' | 'suburban' | 'industrial' | 'night' | 'rooftop';

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  timeLimit: number;
  carStart: {
    x: number;
    y: number;
    angle: number;
  };
  parkingZone: ParkingZone;
  obstacles: Obstacle[];
  mapWidth: number;
  mapHeight: number;
  theme: MapTheme;
  description: string;
  hint: string;
}

export interface LevelProgressItem {
  unlocked: boolean;
  completed: boolean;
  stars: number;
  bestScore: number;
  bestTime: number;
  bestAccuracy: number;
}

export type LevelProgressMap = Record<number, LevelProgressItem>;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
  shape?: 'circle' | 'rect' | 'spark';
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

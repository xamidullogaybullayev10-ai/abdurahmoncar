import { CarState, ControlInputs, Obstacle, ParkingZone, Vector2D } from '../types/game';

export interface BoundingBox {
  corners: Vector2D[];
  axes: Vector2D[];
}

export function getCarCorners(car: CarState): Vector2D[] {
  const halfL = car.length / 2;
  const halfW = car.width / 2;

  const sin = Math.sin(car.angle);
  const cos = Math.cos(car.angle);

  // Forward vector: (sin, -cos), Right vector: (cos, sin)
  const fx = sin * halfL;
  const fy = -cos * halfL;
  const rx = cos * halfW;
  const ry = sin * halfW;

  return [
    { x: car.x + fx + rx, y: car.y + fy + ry }, // Front-Right
    { x: car.x + fx - rx, y: car.y + fy - ry }, // Front-Left
    { x: car.x - fx - rx, y: car.y - fy - ry }, // Rear-Left
    { x: car.x - fx + rx, y: car.y - fy + ry }, // Rear-Right
  ];
}

export function getObstacleCorners(obs: Obstacle): Vector2D[] {
  const angle = obs.angle || 0;
  const halfL = (obs.height || 40) / 2;
  const halfW = (obs.width || 40) / 2;

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  const fx = sin * halfL;
  const fy = -cos * halfL;
  const rx = cos * halfW;
  const ry = sin * halfW;

  return [
    { x: obs.x + fx + rx, y: obs.y + fy + ry },
    { x: obs.x + fx - rx, y: obs.y + fy - ry },
    { x: obs.x - fx - rx, y: obs.y - fy - ry },
    { x: obs.x - fx + rx, y: obs.y - fy + ry },
  ];
}

export function getParkingCorners(zone: ParkingZone): Vector2D[] {
  const angle = zone.angle || 0;
  const halfL = zone.height / 2;
  const halfW = zone.width / 2;

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  const fx = sin * halfL;
  const fy = -cos * halfL;
  const rx = cos * halfW;
  const ry = sin * halfW;

  return [
    { x: zone.x + fx + rx, y: zone.y + fy + ry },
    { x: zone.x + fx - rx, y: zone.y + fy - ry },
    { x: zone.x - fx - rx, y: zone.y - fy - ry },
    { x: zone.x - fx + rx, y: zone.y - fy + ry },
  ];
}

function projectPolygon(corners: Vector2D[], axis: Vector2D): { min: number; max: number } {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;

  for (let i = 1; i < corners.length; i++) {
    const proj = corners[i].x * axis.x + corners[i].y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

function getAxesFromCorners(corners: Vector2D[]): Vector2D[] {
  const axes: Vector2D[] = [];
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
    // Normal vector
    const len = Math.hypot(edge.x, edge.y);
    if (len > 0.0001) {
      axes.push({ x: -edge.y / len, y: edge.x / len });
    }
  }
  return axes;
}

// Separating Axis Theorem (SAT) collision test between two convex polygons
export function testPolygonCollision(cornersA: Vector2D[], cornersB: Vector2D[]): boolean {
  const axesA = getAxesFromCorners(cornersA);
  const axesB = getAxesFromCorners(cornersB);
  const axes = [...axesA, ...axesB];

  for (const axis of axes) {
    const projA = projectPolygon(cornersA, axis);
    const projB = projectPolygon(cornersB, axis);

    // If there is an axis with a gap, they cannot be colliding
    if (projA.max < projB.min || projB.max < projA.min) {
      return false;
    }
  }
  return true;
}

// SAT between polygon and circle (e.g. Traffic Cone)
export function testPolygonCircleCollision(corners: Vector2D[], circle: { x: number; y: number; radius: number }): boolean {
  const axes = getAxesFromCorners(corners);

  // Also test axis between circle center and closest polygon vertex
  let closestVertex = corners[0];
  let minDistSq = Infinity;
  for (const c of corners) {
    const distSq = (c.x - circle.x) ** 2 + (c.y - circle.y) ** 2;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      closestVertex = c;
    }
  }

  const circleToVertex = { x: closestVertex.x - circle.x, y: closestVertex.y - circle.y };
  const len = Math.hypot(circleToVertex.x, circleToVertex.y);
  if (len > 0.0001) {
    axes.push({ x: circleToVertex.x / len, y: circleToVertex.y / len });
  }

  for (const axis of axes) {
    const projPoly = projectPolygon(corners, axis);
    const circleCenterProj = circle.x * axis.x + circle.y * axis.y;
    const projCircle = {
      min: circleCenterProj - circle.radius,
      max: circleCenterProj + circle.radius,
    };

    if (projPoly.max < projCircle.min || projCircle.max < projPoly.min) {
      return false;
    }
  }

  return true;
}

// Check point inside rotated rectangle
export function isPointInPolygon(point: Vector2D, corners: Vector2D[]): boolean {
  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const xi = corners[i].x;
    const yi = corners[i].y;
    const xj = corners[j].x;
    const yj = corners[j].y;

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if player car is fully contained in parking zone
export function isCarFullyInParking(carCorners: Vector2D[], parkingCorners: Vector2D[]): boolean {
  for (const corner of carCorners) {
    if (!isPointInPolygon(corner, parkingCorners)) {
      return false;
    }
  }
  return true;
}

// Calculate angle difference in range [-PI, PI]
export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleDifference(a1: number, a2: number): number {
  return Math.abs(normalizeAngle(a1 - a2));
}

export interface ParkingAccuracyResult {
  isParked: boolean;
  accuracy: number; // 0 - 100%
  angleScore: number;
  centerScore: number;
  statusMessage: string;
}

export function evaluateParking(
  car: CarState,
  zone: ParkingZone
): ParkingAccuracyResult {
  const carCorners = getCarCorners(car);
  const parkingCorners = getParkingCorners(zone);

  const fullyInside = isCarFullyInParking(carCorners, parkingCorners);
  const stopped = Math.abs(car.speed) < 0.08;

  // Heading check
  const targetAngle = zone.targetAngle ?? zone.angle;
  const requireReverse = zone.requireReverse ?? false;

  let angleDiff = angleDifference(car.angle, targetAngle);

  // If reverse is allowed or standard parking allows either forward or reverse, check both
  if (!requireReverse) {
    const reverseDiff = angleDifference(car.angle, targetAngle + Math.PI);
    angleDiff = Math.min(angleDiff, reverseDiff);
  }

  const angleDiffDeg = (angleDiff * 180) / Math.PI;
  // Maximum tolerance for valid parking alignment: 16 degrees
  const angleAligned = angleDiffDeg <= 16;

  // Calculate distance from center
  const distFromCenter = Math.hypot(car.x - zone.x, car.y - zone.y);
  const maxAllowableDist = Math.max(zone.width, zone.height) * 0.45;

  // Accuracy calculation (0 to 100)
  const angleScore = Math.max(0, Math.min(100, Math.round(100 - (angleDiffDeg / 16) * 40)));
  const centerScore = Math.max(0, Math.min(100, Math.round(100 - (distFromCenter / maxAllowableDist) * 40)));
  const totalAccuracy = Math.round(angleScore * 0.5 + centerScore * 0.5);

  const isParked = fullyInside && stopped && angleAligned;

  let statusMessage = 'Approach parking bay';
  if (fullyInside) {
    if (!stopped) {
      statusMessage = 'Stop the car completely!';
    } else if (!angleAligned) {
      statusMessage = requireReverse ? 'Reverse alignment required!' : 'Straighten your car!';
    } else {
      statusMessage = 'Perfect parking!';
    }
  }

  return {
    isParked,
    accuracy: totalAccuracy,
    angleScore,
    centerScore,
    statusMessage,
  };
}

export function updateCarPhysics(
  car: CarState,
  inputs: ControlInputs,
  dtFactor: number = 1.0
): {
  newCar: CarState;
  skidding: boolean;
} {
  const ACCEL = 0.14 * dtFactor;
  const REVERSE_ACCEL = 0.09 * dtFactor;
  const BRAKE_DECEL = 0.32 * dtFactor;
  const HANDBRAKE_DECEL = 0.55 * dtFactor;
  const FRICTION = Math.pow(0.978, dtFactor);
  const MAX_FORWARD_SPEED = 4.2;
  const MAX_REVERSE_SPEED = -2.2;
  const MAX_STEER = 0.58; // ~33 degrees
  const STEER_SPEED = 0.09 * dtFactor;
  const STEER_RETURN = 0.12 * dtFactor;

  let { speed, steerAngle, angle, x, y } = car;
  let skidding = false;

  // Steering update
  let targetSteer = 0;
  if (inputs.left) targetSteer -= MAX_STEER;
  if (inputs.right) targetSteer += MAX_STEER;

  if (targetSteer !== 0) {
    if (steerAngle < targetSteer) {
      steerAngle = Math.min(targetSteer, steerAngle + STEER_SPEED);
    } else if (steerAngle > targetSteer) {
      steerAngle = Math.max(targetSteer, steerAngle - STEER_SPEED);
    }
  } else {
    // Return steer to center
    if (Math.abs(steerAngle) < STEER_RETURN) {
      steerAngle = 0;
    } else if (steerAngle > 0) {
      steerAngle -= STEER_RETURN;
    } else {
      steerAngle += STEER_RETURN;
    }
  }

  const isBraking = inputs.brake;
  let isAccelerating = false;
  let isReversing = false;

  // Handbrake
  if (isBraking) {
    if (Math.abs(speed) > 1.2) {
      skidding = true;
    }
    if (speed > 0) {
      speed = Math.max(0, speed - HANDBRAKE_DECEL);
    } else if (speed < 0) {
      speed = Math.min(0, speed + HANDBRAKE_DECEL);
    }
  } else {
    // Acceleration and regular braking/reverse
    if (inputs.up) {
      if (speed < 0) {
        // Foot brake while moving backwards
        speed = Math.min(0, speed + BRAKE_DECEL);
        if (Math.abs(speed) > 1.0) skidding = true;
      } else {
        speed = Math.min(MAX_FORWARD_SPEED, speed + ACCEL);
        isAccelerating = true;
      }
    } else if (inputs.down) {
      if (speed > 0) {
        // Foot brake while moving forward
        speed = Math.max(0, speed - BRAKE_DECEL);
        if (speed > 1.2) skidding = true;
      } else {
        speed = Math.max(MAX_REVERSE_SPEED, speed - REVERSE_ACCEL);
        isReversing = true;
      }
    } else {
      // Natural friction / rolling resistance
      speed *= FRICTION;
      if (Math.abs(speed) < 0.02) {
        speed = 0;
      }
    }
  }

  // Sharp turn skidding detection
  if (Math.abs(steerAngle) > 0.45 && Math.abs(speed) > 2.8) {
    skidding = true;
  }

  // Kinematic Bicycle Model rotation and movement
  if (Math.abs(speed) > 0.001) {
    const angularVelocity = (speed / car.wheelbase) * Math.sin(steerAngle);
    angle += angularVelocity;

    // Heading direction
    const forwardX = Math.sin(angle);
    const forwardY = -Math.cos(angle);

    x += forwardX * speed;
    y += forwardY * speed;
  }

  return {
    newCar: {
      ...car,
      x,
      y,
      angle: normalizeAngle(angle),
      speed,
      steerAngle,
      isBraking: isBraking || (inputs.down && speed > 0.2),
      isAccelerating,
      isReversing,
    },
    skidding,
  };
}

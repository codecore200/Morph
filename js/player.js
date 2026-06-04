// 도형 물리 · 모핑 로직

// 도형별 물리 특성 단일 진실 공급원
const SHAPE_STATS = {
  circle: {
    mass: 0.7,
    friction: 0.92,
    jumpForce: 14,
    moveSpeed: 4.0,
    size: 24,
  },
  square: {
    mass: 1.6,
    friction: 0.75,
    jumpForce: 8,
    moveSpeed: 2.8,
    size: 28,
  },
  triangle: {
    mass: 1.0,
    friction: 0.85,
    jumpForce: 11,
    moveSpeed: 3.5,
    size: 26,
  },
};

/**
 * @function setShapeStats
 * SHAPE_STATS에서 값을 읽어 player에 즉시 적용
 */
function setShapeStats(shapeType) {
  let s = SHAPE_STATS[shapeType];
  if (!s) return;
  player.mass = s.mass;
  player.friction = s.friction;
  player.jumpForce = s.jumpForce;
  player.moveSpeed = s.moveSpeed;
  player.size = s.size;
}

/**
 * @function getMoveSpeed
 * SHAPE_STATS에서 moveSpeed만 조회 (순수 함수)
 */
function getMoveSpeed(shapeType) {
  let s = SHAPE_STATS[shapeType];
  return s ? s.moveSpeed : 0;
}

/**
 * @function getJumpForce
 * SHAPE_STATS에서 jumpForce만 조회 (순수 함수)
 */
function getJumpForce(shapeType) {
  let s = SHAPE_STATS[shapeType];
  return s ? s.jumpForce : 0;
}

/**
 * @function applyGravity
 * player.vy에 중력 가속도 누적
 */
function applyGravity() {
  player.vy += GRAVITY;
}

/**
 * @function updatePlayerPhysics
 * vx · vy · friction 반영해 player 위치 갱신
 */
function updatePlayerPhysics() {
  player.vx *= player.friction || FRICTION_DECAY;
  player.x += player.vx;
  player.y += player.vy;

  // 바닥/플랫폼은 각 스테이지가 blockOnSolid로 처리
  player.onGround = false;

  // 좌우 화면 경계
  let half = player.size / 2;
  if (player.x < half) {
    player.x = half;
    player.vx = 0;
  }
  if (player.x > width - half) {
    player.x = width - half;
    player.vx = 0;
  }
}

/**
 * @function changeShape
 * 쿨다운 / 동일 도형 체크 후 setShapeStats 호출 + 모핑 애니메이션 시작
 */
function changeShape(newShape) {
  if (!SHAPE_STATS[newShape]) return;
  if (player.shape === newShape) return;
  if (millis() < player.cooldownEndTime) return;

  player.morphFromShape = player.shape;
  player.shape = newShape;
  player.morphStartTime = millis();
  player.cooldownEndTime = millis() + MORPH_COOLDOWN_MS;

  setShapeStats(newShape);
}

/**
 * @function drawPlayer
 * 현재 player.shape 기반 렌더링 (모핑 중에는 외곽선 보간)
 */
function drawPlayer() {
  let s = player.size;
  let mainColor = COLOR[player.shape];

  // 모핑 진행도 (0~1)
  let morphT = constrain((millis() - player.morphStartTime) / MORPH_DURATION_MS, 0, 1);
  let isMorphing = morphT < 1 && player.morphFromShape;

  push();
  translate(player.x, player.y);

  // 모핑 중 외곽 잔상 (morphT 진행에 따라 서서히 사라짐)
  if (isMorphing) {
    let prevColor = COLOR[player.morphFromShape];
    noFill();
    stroke(prevColor);
    strokeWeight(2);
    let ghostSize = lerp(s * 1.4, s, morphT);
    drawingContext.globalAlpha = 1 - morphT;
    drawShapeOutline(player.morphFromShape, ghostSize);
    drawingContext.globalAlpha = 1;
  }

  noStroke();
  fill(mainColor);
  drawShapeOutline(player.shape, s);

  pop();
}

/**
 * @function drawShapeOutline
 * 도형 종류에 따른 외곽 경로 그리기 (채움/외곽선은 호출 전 fill·noFill·stroke로 결정)
 */
function drawShapeOutline(shapeType, size) {
  if (shapeType === "circle") {
    ellipse(0, 0, size, size);
  } else if (shapeType === "square") {
    rectMode(CENTER);
    rect(0, 0, size, size, 4);
  } else if (shapeType === "triangle") {
    let h = size * 0.95;
    triangle(0, -h / 2, -size / 2, h / 2, size / 2, h / 2);
  }
}

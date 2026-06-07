// Stage 2: 풍선 · 경사면 · 문 퍼즐

let stage2StartTime = 0;
let stage2ElapsedTime = 0;
let stage2Stars = 3;

let stage2Slopes = [];
let stage2Balloons = [];
// 풍선이 터질 때 발생하는 파편/링 이펙트 큐 (각 항목 = 1회 폭발)
let balloonPops = [];
// 좌측 시작 플랫폼 / 우측 도착 플랫폼 — 사이는 절벽. 우측은 확장된 캔버스 끝까지
let stage2Grounds = [
  { x: 0, y: 380, w: 160, h: 160 },
  { x: 540, y: 480, w: CANVAS_W - 540, h: 60 },
];
let stage2Door = { x: 720, y: 380, w: 18, h: 100, isExist: true };
// 사각형 인식 패널 — 풍선을 모두 터뜨려야 바닥에서 솟아오름. 그 뒤 사각형으로 밟으면 문이 열림
let stage2ShapeSensor = { x: 696, y: 472, w: 20, h: 8, activated: false, revealed: false, revealedAt: 0, targetY: 472 };
// 클리어 아이템은 확장된 우측 영역 끝 근처에 배치 (낙하 삼각형 구간 너머)
let stage2ClearItem = { x: CANVAS_W - 70, y: 430, w: 24, h: 32 };
// 문 위 천장 벽 (점프 우회 방지). 우측 플랫폼 위에 배치
let stage2Walls = [
  { x: 595, y: 50, w: 220, h: 330 },
];

// 우측 통로에 파도처럼 순차 낙하하는 삼각형 장애물 (닿으면 실패)
let stage2Hazards = [];
let hazardWaveIndex = 0; // 다음에 떨어질 삼각형 인덱스
let hazardWaveTimer = 0; // 낙하 간격 카운터
// 삼각형이 떨어지는 위험 구간 — 문 통과 직후 ~ 클리어 직전. 이 영역 밖은 안전.
// 바닥(y+h)은 우측 플랫폼 윗면(480)과 일치시켜 삼각형이 거기 닿으면 깨지게 함
let stage2HazardZone = { x: 820, y: 60, w: CANVAS_W - 130 - 820, h: 420 };

/**
 * @function loadStage2Layout
 * Stage 2 지형·플랫폼·경사 좌표 데이터 구성 (initialStage2가 호출)
 */
function loadStage2Layout() {
  // 좌측 시작 플랫폼(절벽 위) / 우측 도착 플랫폼 — 모두 GROUND_Y 기준 상대 배치
  stage2Grounds = [
    { x: 0,   y: GROUND_Y - 100, w: 160,          h: 300 }, // 좌측 시작 플랫폼
    { x: 540, y: GROUND_Y,       w: CANVAS_W - 540, h: 300 }, // 우측 도착 플랫폼
  ];

  // 경사면: 좌측 플랫폼 우단(GROUND_Y-100) → 우측 플랫폼 상단(GROUND_Y)
  stage2Slopes = [
    { x: 160, y: GROUND_Y - 100, w: 220, h: 100 },
  ];

  // 풍선: 우측 플랫폼 위 통로 — 삼각형으로 점프해 터뜨려야 센서가 등장
  stage2Balloons = [
    { x: 600, y: GROUND_Y - 60, w: 26, h: 32, alive: true },
    { x: 660, y: GROUND_Y - 60, w: 26, h: 32, alive: true },
  ];

  stage2Door        = { x: 720, y: GROUND_Y - 100, w: 18, h: 100, isExist: true };
  stage2ShapeSensor = { x: 696, y: GROUND_Y - 8,   w: 20, h: 8,
                        activated: false, revealed: false, revealedAt: 0,
                        targetY: GROUND_Y - 8 };
  stage2ClearItem   = { x: CANVAS_W - 70, y: GROUND_Y - 50, w: 24, h: 32 };

  // 문 위 천장 벽 — HUD 하단(y=52)부터 문 상단(GROUND_Y-100)까지
  stage2Walls = [
    { x: 595, y: 52, w: 220, h: GROUND_Y - 152 },
  ];

  // 낙하 삼각형 위험 구간 — 문 통과 직후 ~ 클리어 직전, 세로는 바닥까지
  stage2HazardZone = { x: 820, y: 60, w: CANVAS_W - 130 - 820, h: GROUND_Y - 60 };

  // 우측 통로의 낙하 삼각형 장애물 웨이브 셋업
  initStage2Hazards();
}

/**
 * @function initStage2Hazards
 * 위험 구간을 가로로 등분해 삼각형을 배치. 천장 위에서 대기하다 파도 순서로 낙하
 */
function initStage2Hazards() {
  stage2Hazards = [];
  hazardWaveIndex = 0;
  hazardWaveTimer = 0;
  let zone = stage2HazardZone;
  let step = zone.w / HAZARD_COUNT;
  for (let i = 0; i < HAZARD_COUNT; i++) {
    stage2Hazards.push({
      x: zone.x + i * step + step / 2,
      y: zone.y - 40, // 헤더 UI 뒤(화면 위)에서 대기
      falling: false,
      landed: false,
    });
  }
}

/**
 * @function updateStage2Hazards
 * 일정 간격마다 다음 삼각형을 낙하 시작(파도). 플랫폼에 닿으면 깨져 사라지고,
 * 모두 떨어지면 웨이브를 다시 시작해 비처럼 반복
 */
function updateStage2Hazards() {
  hazardWaveTimer++;
  if (
    hazardWaveTimer >= HAZARD_WAVE_INTERVAL &&
    hazardWaveIndex < stage2Hazards.length
  ) {
    stage2Hazards[hazardWaveIndex].falling = true;
    hazardWaveIndex++;
    hazardWaveTimer = 0;
  }

  // 플랫폼 윗면(=zone 바닥)에 닿으면 착지 처리
  let landingY = stage2HazardZone.y + stage2HazardZone.h;
  let allLanded = true;
  for (let h of stage2Hazards) {
    if (h.landed) continue;
    if (h.falling) {
      h.y += HAZARD_DROP_SPEED;
      if (h.y + HAZARD_SIZE / 2 >= landingY) {
        h.landed = true;
      }
    }
    if (!h.landed) allLanded = false;
  }

  // 모든 삼각형이 떨어지면 웨이브 리셋 (반복)
  if (allLanded) initStage2Hazards();
}

/**
 * @function checkHazardCollision
 * 낙하 중인 삼각형과 플레이어가 닿으면 실패 (착지/대기 중인 것은 제외)
 */
function checkHazardCollision() {
  if (clearEffect.active) return;
  let pb = getPlayerBounds();
  let r = HAZARD_SIZE / 2;
  for (let h of stage2Hazards) {
    if (!h.falling || h.landed) continue;
    let hb = { x: h.x - r, y: h.y - r, w: HAZARD_SIZE, h: HAZARD_SIZE };
    if (isColliding(pb, hb)) {
      setGameState(STATE.FAIL);
      return;
    }
  }
}

/**
 * @function drawStage2Hazards
 * 위험 구간 경계 표시 + 아래를 향한 빨간 삼각형(낙하 중) 렌더링
 */
function drawStage2Hazards() {
  let zone = stage2HazardZone;
  let r = HAZARD_SIZE / 2;

  // 위험 구간 — 양 경계 점선 + 바닥 옅은 경고 띠
  push();
  noStroke();
  drawingContext.globalAlpha = 0.07;
  fill(COLOR.spike);
  rect(zone.x, 52, zone.w, GROUND_Y - 52);
  drawingContext.globalAlpha = 1;
  stroke(COLOR.spike);
  strokeWeight(1.5);
  drawingContext.setLineDash([6, 6]);
  drawingContext.globalAlpha = 0.5;
  line(zone.x, 52, zone.x, GROUND_Y);
  line(zone.x + zone.w, 52, zone.x + zone.w, GROUND_Y);
  drawingContext.setLineDash([]);
  drawingContext.globalAlpha = 1;
  // 경고 라벨
  noStroke();
  fill(COLOR.spike);
  textAlign(CENTER, TOP);
  textSize(11);
  textStyle(BOLD);
  text("⚠ DANGER ⚠", zone.x + zone.w / 2, 58);
  pop();

  // 떨어지는 삼각형 (아래를 향한 위협적 형태)
  push();
  noStroke();
  for (let h of stage2Hazards) {
    if (h.landed) continue;
    fill(COLOR.spike);
    triangle(h.x - r, h.y - r, h.x + r, h.y - r, h.x, h.y + r);
  }
  pop();
}

/**
 * @function revealSensorWhenBalloonsGone
 * 살아있는 풍선이 하나도 없을 때 센서를 처음 공개 (바닥에서 솟아오르는 트리거)
 */
function revealSensorWhenBalloonsGone() {
  if (stage2ShapeSensor.revealed) return;
  if (stage2Balloons.some(b => b.alive)) return;
  stage2ShapeSensor.revealed = true;
  stage2ShapeSensor.revealedAt = millis();
}

/**
 * @function handleShapeSensor
 * 사각형 도형이 패널 위에 닿으면 영구 활성화 + 문 개방.
 * 풍선이 모두 터져 센서가 공개(revealed)된 뒤, 솟아오르는 애니메이션이 끝나야 인식 시작
 */
function handleShapeSensor(sensor, door) {
  if (!sensor.revealed) return;
  if (sensor.activated) return;
  if (millis() - sensor.revealedAt < 500) return; // 솟아오르는 중에는 인식 불가
  if (!isColliding(getPlayerBounds(), sensor)) return;
  if (player.shape !== "square") return;
  sensor.activated = true;
  sensor.activatedAt = millis();
  openDoor(door);
}

/**
 * @function initialStage2
 * Stage 2 시작 시 플레이어 + 모든 오브젝트 초기화 (풍선·경사·문·클리어)
 */
function initialStage2() {
  // 창 크기에 맞춰 바닥 y 좌표를 재계산
  GROUND_Y = computeGroundY();

  player.x = 60;
  player.y = GROUND_Y - 300; // 좌측 시작 플랫폼(GROUND_Y-100) 위에서 낙하 시작
  player.vx = 0;
  player.vy = 0;
  player.shape = "circle";
  player.morphFromShape = null;
  player.morphStartTime = 0;
  player.cooldownEndTime = 0;
  setShapeStats("circle");

  loadStage2Layout();
  balloonPops = [];

  stage2StartTime = millis();
  stage2ElapsedTime = 0;
  stage2Stars = 3;
}

/**
 * @function spawnBalloonPop
 * 풍선 중심 좌표에서 보라색 파편 + 확장 링 폭발 이펙트 생성
 */
function spawnBalloonPop(cx, cy) {
  let parts = [];
  let count = 16;
  for (let i = 0; i < count; i++) {
    let a = (TWO_PI * i) / count + random(-0.25, 0.25);
    let sp = random(2.8, 6.0);
    parts.push({
      x: cx,
      y: cy,
      vx: cos(a) * sp,
      vy: sin(a) * sp - 1.4,
      size: random(3, 7),
      rot: random(TWO_PI),
      vrot: random(-0.35, 0.35),
      life: 1,
      decay: random(0.028, 0.042),
    });
  }
  balloonPops.push({ x: cx, y: cy, startAt: millis(), particles: parts });
}

/**
 * @function updateBalloonPops
 * 모든 진행 중인 풍선 폭발 파티클 갱신, 수명 다한 파편/이펙트 제거
 */
function updateBalloonPops() {
  // 주의: 루프 변수명을 'pop'으로 쓰면 p5의 pop() 함수를 가려서 drawBalloonPops가 깨짐. bp로 명명
  for (let bp of balloonPops) {
    for (let p of bp.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.985;
      p.rot += p.vrot;
      p.life -= p.decay;
    }
    bp.particles = bp.particles.filter((p) => p.life > 0);
  }
  balloonPops = balloonPops.filter((bp) => bp.particles.length > 0);
}

/**
 * @function drawBalloonPops
 * 풍선 폭발 링 + 파편 렌더링
 */
function drawBalloonPops() {
  for (let bp of balloonPops) {
    let age = millis() - bp.startAt;
    let ringT = constrain(age / 220, 0, 1);
    if (ringT < 1) {
      push();
      noFill();
      stroke(COLOR.balloon);
      strokeWeight(2 * (1 - ringT) + 0.5);
      drawingContext.globalAlpha = 1 - ringT;
      ellipse(bp.x, bp.y, 26 + ringT * 60);
      drawingContext.globalAlpha = 1;
      pop();
    }
    for (let p of bp.particles) {
      push();
      translate(p.x, p.y);
      rotate(p.rot);
      noStroke();
      drawingContext.globalAlpha = max(0, min(1, p.life));
      fill(COLOR.balloon);
      rect(-p.size / 2, -p.size / 2, p.size, p.size, 1);
      drawingContext.globalAlpha = 1;
      pop();
    }
  }
}

/**
 * @function updateStage2
 * Stage 2 매 프레임 업데이트 — 경사 가속, 풍선/문 상호작용
 */
function updateStage2() {
  // 바닥 (좌측 시작 + 우측 도착)
  for (let g of stage2Grounds) blockOnSolid(g);

  // 경사면 — 원이면 표면 굴림 + 가속, 그 외 도형이면 솔리드 박스
  for (let s of stage2Slopes) handleSlope(s);

  // 풍선 상호작용
  for (let b of stage2Balloons) {
    handleBalloonInteraction(b);
  }

  // 풍선이 모두 터지면 바닥 패널 공개
  revealSensorWhenBalloonsGone();

  // 천장 벽
  for (let w of stage2Walls) blockOnSolid(w);

  // 사각형 인식 패널 — 사각형으로 밟으면 문이 열림
  handleShapeSensor(stage2ShapeSensor, stage2Door);

  // 문
  blockOnDoor(stage2Door);

  // 우측 통로의 낙하 삼각형 장애물 — 갱신 후 충돌 시 실패
  updateStage2Hazards();
  checkHazardCollision();

  // 풍선 폭발 파티클 갱신
  updateBalloonPops();
}

/**
 * @function drawStage2
 * Stage 2 지형 · 경사 · 풍선 · 문 · 클리어 아이템 렌더링
 */
function drawStage2() {
  // 바닥 (좌측 시작 + 우측 도착 — 사이는 절벽)
  noStroke();
  fill(COLOR.terrain);
  for (let g of stage2Grounds) {
    rect(g.x, g.y, g.w, g.h);
  }
  fill(COLOR.terrainHi);
  for (let g of stage2Grounds) {
    rect(g.x, g.y, g.w, 3);
  }

  // 절벽 위험 표시 (양 바닥 끝 빨간 라인)
  stroke(COLOR.spike);
  strokeWeight(2);
  let leftEdge = stage2Grounds[0];
  let rightEdge = stage2Grounds[1];
  line(leftEdge.x + leftEdge.w, leftEdge.y, leftEdge.x + leftEdge.w, leftEdge.y + 20);
  line(rightEdge.x, rightEdge.y, rightEdge.x, rightEdge.y + 20);

  // 경사면 (왼쪽 위 → 오른쪽 아래)
  for (let s of stage2Slopes) {
    fill(COLOR.terrain);
    stroke(COLOR.terrainHi);
    strokeWeight(2);
    triangle(s.x, s.y, s.x, s.y + s.h, s.x + s.w, s.y + s.h);
  }

  // 풍선
  for (let b of stage2Balloons) {
    if (!b.alive) continue;
    noStroke();
    fill(COLOR.balloon);
    ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
    // 줄
    stroke(COLOR.terrainHi);
    strokeWeight(1);
    line(b.x + b.w / 2, b.y + b.h, b.x + b.w / 2, b.y + b.h + 18);
  }

  // 풍선 폭발 이펙트 (살아있는 풍선 위에 오버레이)
  drawBalloonPops();

  // 문 위 천장 벽
  fill(COLOR.terrain);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  for (let w of stage2Walls) {
    rect(w.x, w.y, w.w, w.h, 2);
  }

  // 사각형 인식 패널 (문 앞) — 풍선을 모두 터뜨리면 바닥에서 솟아오름
  if (stage2ShapeSensor.revealed) {
    let sensor = stage2ShapeSensor;
    let floorY = stage2Grounds[1].y; // 480 — 플랫폼 윗면
    let elapsed = millis() - sensor.revealedAt;
    let riseT = constrain(elapsed / 500, 0, 1);
    // 바닥면(floorY)에서 targetY까지 솟아오름
    let drawY = lerp(floorY, sensor.targetY, riseT);
    let sensorPulse = riseT >= 1 ? 1 + 0.06 * sin(millis() * 0.006) : 1;

    // 바닥 위로 올라온 부분만 보이도록 클립
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, CANVAS_W, floorY);
    drawingContext.clip();

    push();
    noStroke();
    if (sensor.activated) {
      fill(COLOR.clear);
      rect(sensor.x, drawY, sensor.w, sensor.h, 3);
      noFill();
      stroke(COLOR.clear);
      strokeWeight(2);
      drawingContext.globalAlpha = 0.5;
      rect(sensor.x - 3, drawY - 3, sensor.w + 6, sensor.h + 6, 5);
      drawingContext.globalAlpha = 1;
    } else {
      fill(COLOR.bgFar);
      stroke(COLOR.square);
      strokeWeight(2);
      rect(sensor.x, drawY, sensor.w, sensor.h, 3);
    }
    noStroke();
    fill(sensor.activated ? COLOR.bg : COLOR.square);
    let iconSize = 8 * sensorPulse;
    rect(
      sensor.x + sensor.w / 2 - iconSize / 2,
      drawY + sensor.h / 2 - iconSize / 2,
      iconSize,
      iconSize,
      1
    );
    pop();

    drawingContext.restore();

    // 솟아오르는 동안 바닥 위 글로우 링
    if (riseT < 1) {
      push();
      noFill();
      stroke(COLOR.square);
      strokeWeight(2);
      drawingContext.globalAlpha = (1 - riseT) * 0.7;
      ellipse(sensor.x + sensor.w / 2, floorY, 28 + riseT * 24);
      drawingContext.globalAlpha = 1;
      pop();
    }
  }

  // 문
  if (stage2Door.isExist) {
    noStroke();
    fill(COLOR.door);
    stroke(COLOR.terrainHi);
    strokeWeight(2);
    rect(stage2Door.x, stage2Door.y, stage2Door.w, stage2Door.h, 3);
    noStroke();
    fill(COLOR.terrainHi);
    ellipse(stage2Door.x + stage2Door.w - 4, stage2Door.y + stage2Door.h / 2, 4, 4);
  }

  // 우측 통로의 낙하 삼각형 장애물 (위험 구간 + 떨어지는 삼각형)
  drawStage2Hazards();

  // 클리어 아이템 (획득 후에는 숨김 — 파티클 이펙트가 자리를 대체)
  if (!stage2ClearItem.collected) {
    push();
    translate(
      stage2ClearItem.x + stage2ClearItem.w / 2,
      stage2ClearItem.y + stage2ClearItem.h / 2
    );
    let pulse = 1 + 0.08 * sin(millis() * 0.005);
    scale(pulse);
    noStroke();
    fill(COLOR.clear);
    rect(-stage2ClearItem.w / 2, -stage2ClearItem.h / 2, stage2ClearItem.w, stage2ClearItem.h, 4);
    fill(COLOR.bg);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(BOLD);
    text("★", 0, 1);
    pop();
  }

  // 힌트 텍스트
  fill(COLOR.uiText);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(NORMAL);
  text(
    "Hint: 원(Q)으로 경사 굴러 절벽 넘기 → 삼각형(E)으로 풍선 모두 터뜨리기 → 패널이 솟아오르면 사각형(W)으로 밟아 문 열기 → 원(Q)으로 삼각형 비 피해 골인",
    16,
    58
  );
}

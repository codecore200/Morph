// Stage 2: 경사 · 풍선 · 문 퍼즐 + 문 이후 입체 클라이맥스(점프 패드 · 무너지는 발판 · 이동 발판)

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
// 클리어 아이템은 확장된 우측 영역 끝 근처에 배치 (입체 클라이맥스 너머)
let stage2ClearItem = { x: CANVAS_W - 70, y: 430, w: 24, h: 32 };
// 문 위 천장 벽 (점프 우회 방지). 우측 플랫폼 위에 배치
let stage2Walls = [
  { x: 595, y: 50, w: 220, h: 330 },
];

// 우측 통로에 파도처럼 순차 낙하하는 삼각형 장애물 (닿으면 실패)
let stage2Hazards = [];
let hazardWaveIndex = 0; // 다음에 떨어질 삼각형 인덱스
let hazardWaveTimer = 0; // 낙하 간격 카운터
// 삼각형이 떨어지는 위험 구간 — 문 통과 직후 구간. 이 영역 밖은 안전.
let stage2HazardZone = { x: 820, y: 60, w: 240, h: 420 };

// 문 이후 입체 클라이맥스 기믹들
let stage2JumpPads = [];     // 스프링 점프 패드 (가벼운 도형일수록 높이 튕김)
let stage2CrumblePlats = []; // 무너지는 발판 (밟으면 붕괴 후 복구)
let stage2MovePlats = [];    // 좌우 왕복 이동 발판
let crumbleDebris = [];      // 발판 붕괴 시 파편 이펙트 큐

// 배경 시차(parallax) 도형 — 분위기용으로 천천히 떠다니는 큰 도형 실루엣
let stage2BgShapes = [];

/**
 * @function loadStage2Layout
 * Stage 2 지형·플랫폼·경사 좌표 데이터 구성 (initialStage2가 호출)
 */
function loadStage2Layout() {
  let GY = GROUND_Y;

  // 좌측 시작 플랫폼(절벽 위) / 우측 바닥은 갭으로 분할 — 모두 GROUND_Y 기준 상대 배치.
  // 사이드스크롤 확장으로 RB1 내부에 이동 거리를 더 두고 골인 발판도 넓힘.
  // 동선: RB1(540~1560, 풍선·센서 → 빈 구간 → 낙하 위험지대 → 점프 패드) ─갭A─▶
  //        무너지는 발판(1730~1810) ─갭─▶ MB 디딤돌(1835~1885) ─갭B(이동 발판)─▶ RB3(1960~) 골인
  stage2Grounds = [
    { x: 0,    y: GY - 100, w: 160,            h: 300 }, // 좌측 시작 플랫폼
    { x: 540,  y: GY,       w: 1020,           h: 300 }, // RB1 (540~1560)
    { x: 1835, y: GY,       w: 50,             h: 300 }, // MB 고정 디딤돌 (1835~1885)
    { x: 1960, y: GY,       w: CANVAS_W - 1960, h: 300 }, // RB3 (1960~) 골인 발판
  ];

  // 경사면: 좌측 플랫폼 우단(GROUND_Y-100) → 우측 플랫폼 상단(GROUND_Y)
  stage2Slopes = [
    { x: 160, y: GY - 100, w: 220, h: 100 },
  ];

  // 풍선 3개: 우측 플랫폼 위 통로 — 삼각형으로 점프해 모두 터뜨려야 센서가 등장.
  // 가운데를 높게 배치해 정밀 점프를 요구(도전적)
  stage2Balloons = [
    { x: 604, y: GY - 58, w: 26, h: 32, alive: true },
    { x: 652, y: GY - 86, w: 26, h: 32, alive: true },
    { x: 700, y: GY - 58, w: 26, h: 32, alive: true },
  ];

  stage2Door        = { x: 720, y: GY - 100, w: 18, h: 100, isExist: true };
  stage2ShapeSensor = { x: 696, y: GY - 8,   w: 20, h: 8,
                        activated: false, revealed: false, revealedAt: 0,
                        targetY: GY - 8 };
  stage2ClearItem   = { x: 1972, y: GY - 50, w: 24, h: 32 };

  // 문 위 천장 벽 — HUD 하단(y=52)부터 문 상단(GROUND_Y-100)까지
  stage2Walls = [
    { x: 595, y: 52, w: 220, h: GY - 152 },
  ];

  // 낙하 삼각형 위험 구간 — 풍선 구간 너머 빈 통로를 지나(1220) ~ 점프 패드 진입 여유(1480). RB1 위, 세로는 바닥까지
  stage2HazardZone = { x: 1220, y: 60, w: 260, h: GY - 60 };

  // --- 입체 클라이맥스 기믹 배치 ---
  // 점프 패드: RB1 끝부분 위(1495~1555). 비를 뚫고 달려와 원으로 밟으면 갭A를 넘어 무너지는 발판에 착지
  stage2JumpPads = [
    { x: 1495, y: GY - 14, w: 60, h: 14, firedAt: 0 },
  ];
  // 무너지는 발판: 갭A(1560~1730) 너머(1730~1810). 밟으면 흔들리다 붕괴 — 빠르게 MB로 점프
  stage2CrumblePlats = [
    { x: 1730, y: GY, w: 80, h: 18, state: "solid", shakeAt: 0, goneAt: 0 },
  ];
  // 좌우 왕복 이동 발판: 갭B(1885~1960)를 메우며 왕복(1895~1945). MB↔RB3 사이라 양쪽 고정 → 운빨 없음
  stage2MovePlats = [
    { baseX: 1895, x: 1895, y: GY - 6, w: 50, h: 16, range: 15, phase: 0 },
  ];

  // 우측 통로의 낙하 삼각형 장애물 웨이브 셋업
  initStage2Hazards();
  // 배경 시차 도형 셋업
  initStage2BgShapes();
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

/* ============================================================
 * 배경 시차 도형 (분위기 연출)
 * ========================================================== */

/**
 * @function initStage2BgShapes
 * 화면 뒤에서 천천히 떠다닐 큰 도형 실루엣 9개 생성
 */
function initStage2BgShapes() {
  stage2BgShapes = [];
  let shapes = ["circle", "square", "triangle"];
  for (let i = 0; i < 9; i++) {
    stage2BgShapes.push({
      shape: shapes[i % 3],
      x: random(CANVAS_W),
      y: random(70, GROUND_Y - 40),
      size: random(46, 104),
      vx: random(0.12, 0.4) * (random() < 0.5 ? -1 : 1),
      rot: random(TWO_PI),
      vrot: random(-0.006, 0.006),
      depth: random(0.04, 0.1), // 멀수록 옅고 느림
    });
  }
}

/**
 * @function updateStage2BgShapes
 * 배경 도형 수평 이동 · 회전, 화면 밖으로 나가면 반대편에서 재등장
 */
function updateStage2BgShapes() {
  for (let s of stage2BgShapes) {
    s.x += s.vx;
    s.rot += s.vrot;
    if (s.x < -80) s.x = CANVAS_W + 80;
    if (s.x > CANVAS_W + 80) s.x = -80;
  }
}

/**
 * @function drawStage2Background
 * 세로 그라데이션 + 시차 도형 실루엣으로 깊이감 있는 배경 연출
 */
function drawStage2Background() {
  let ctx = drawingContext;
  let bottom = GROUND_Y + 200;

  // 세로 그라데이션 (위는 어둡게, 지평선 부근은 살짝 밝게)
  let g = ctx.createLinearGradient(0, 0, 0, bottom);
  g.addColorStop(0, COLOR.bg);
  g.addColorStop(0.72, COLOR.bgFar);
  g.addColorStop(1, COLOR.terrain);
  push();
  noStroke();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, bottom);
  pop();

  // 시차 도형 실루엣
  for (let s of stage2BgShapes) {
    push();
    translate(s.x, s.y);
    rotate(s.rot);
    noFill();
    stroke(COLOR[s.shape]);
    strokeWeight(2);
    ctx.globalAlpha = s.depth;
    drawShapeOutline(s.shape, s.size);
    ctx.globalAlpha = 1;
    pop();
  }
}

/* ============================================================
 * 점프 패드 (스프링) — 가벼운 도형일수록 높이 튕김
 * ========================================================== */

/**
 * @function updateJumpPad
 * 평소엔 솔리드 발판. 위에서 밟으면 도형 질량에 반비례해 강하게 위로 튕김.
 * (원 0.7 → 가장 높이, 사각형 1.6 → 낮게) — 넓은 갭은 원으로만 통과 가능
 */
function updateJumpPad(pad) {
  blockOnSolid(pad);

  let pb = getPlayerBounds();
  let feetY = pb.y + pb.h;
  let onTop =
    player.onGround &&
    feetY >= pad.y - 3 &&
    feetY <= pad.y + pad.h &&
    pb.x + pb.w > pad.x &&
    pb.x < pad.x + pad.w;

  if (onTop) {
    let boost = JUMP_PAD_POWER / max(JUMP_PAD_MIN_MASS, player.mass);
    player.vy = -boost;
    player.onGround = false;
    pad.firedAt = millis();
    playBGM("pop"); // 튕기는 순간 효과음(기존 사운드 재사용)
  }
}

/**
 * @function drawJumpPad
 * 스프링 패드 본체 + 발동 시 확장 링 + 상단 화살표
 */
function drawJumpPad(pad) {
  push();
  // 발동 링 (튕긴 직후 0.3초)
  if (pad.firedAt && millis() - pad.firedAt < 300) {
    let t = (millis() - pad.firedAt) / 300;
    noFill();
    stroke(COLOR.circle);
    strokeWeight(2 * (1 - t) + 0.5);
    drawingContext.globalAlpha = 1 - t;
    ellipse(pad.x + pad.w / 2, pad.y, 30 + t * 60);
    drawingContext.globalAlpha = 1;
  }

  // 패드 본체 — 살짝 눌렸다 튀는 느낌
  let press = pad.firedAt && millis() - pad.firedAt < 120 ? 3 : 0;
  noStroke();
  fill(COLOR.bgFar);
  rect(pad.x, pad.y + pad.h - 4, pad.w, 6, 2); // 받침
  fill(COLOR.circle);
  rect(pad.x + 4, pad.y + press, pad.w - 8, pad.h - 4, 4); // 스프링 상판

  // 위 방향 화살표(이중)
  fill(COLOR.bg);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(13);
  text("▲", pad.x + pad.w / 2, pad.y + pad.h / 2 + press);
  pop();
}

/* ============================================================
 * 무너지는 발판 — 밟으면 흔들리다 붕괴, 잠시 후 복구
 * ========================================================== */

/**
 * @function isStandingOn
 * 플레이어가 해당 발판 윗면에 막 올라서 있는지 (blockOnSolid 직후 호출)
 */
function isStandingOn(plat) {
  let pb = getPlayerBounds();
  return (
    player.onGround &&
    pb.y + pb.h <= plat.y + 8 &&
    pb.y + pb.h >= plat.y - 2 &&
    pb.x + pb.w > plat.x &&
    pb.x < plat.x + plat.w
  );
}

/**
 * @function updateCrumblePlat
 * solid → (밟으면) shaking → (유예 후) gone → (시간 후) solid 순환.
 * gone 상태에서는 솔리드가 사라져 머물던 플레이어가 추락
 */
function updateCrumblePlat(c) {
  if (c.state === "gone") {
    if (millis() - c.goneAt > CRUMBLE_RESPAWN_MS) c.state = "solid";
    return; // 붕괴 중에는 발판 없음
  }

  // solid / shaking 모두 밟을 수 있음
  blockOnSolid(c);

  if (c.state === "solid" && isStandingOn(c)) {
    c.state = "shaking";
    c.shakeAt = millis();
  }
  if (c.state === "shaking" && millis() - c.shakeAt > CRUMBLE_SHAKE_MS) {
    c.state = "gone";
    c.goneAt = millis();
    spawnCrumbleDebris(c);
  }
}

/**
 * @function drawCrumblePlat
 * 상태별 렌더링 — solid/shaking(흔들림+균열), gone(복구 예고 점멸 윤곽)
 */
function drawCrumblePlat(c) {
  if (c.state === "gone") {
    // 복구 예고 — 점멸하는 점선 윤곽
    let blink = 0.18 + 0.16 * sin(millis() * 0.012);
    push();
    noFill();
    stroke(COLOR.box);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    drawingContext.globalAlpha = blink;
    rect(c.x, c.y, c.w, c.h, 3);
    drawingContext.setLineDash([]);
    drawingContext.globalAlpha = 1;
    pop();
    return;
  }

  push();
  // 붕괴 임박할수록 크게 흔들림
  let shake = 0;
  if (c.state === "shaking") {
    let prog = (millis() - c.shakeAt) / CRUMBLE_SHAKE_MS;
    shake = (1 + prog * 2) * random(-1, 1);
  }
  translate(shake, shake * 0.5);

  fill(COLOR.box);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  rect(c.x, c.y, c.w, c.h, 3);

  // 균열 무늬
  stroke(COLOR.bg);
  strokeWeight(1.5);
  line(c.x + c.w * 0.32, c.y + 2, c.x + c.w * 0.42, c.y + c.h - 2);
  line(c.x + c.w * 0.66, c.y + 2, c.x + c.w * 0.56, c.y + c.h - 2);
  line(c.x + c.w * 0.42, c.y + c.h * 0.5, c.x + c.w * 0.66, c.y + c.h * 0.5);
  pop();
}

/**
 * @function spawnCrumbleDebris
 * 발판 붕괴 순간 아래로 쏟아지는 회색 파편 생성
 */
function spawnCrumbleDebris(c) {
  let parts = [];
  let count = 12;
  for (let i = 0; i < count; i++) {
    parts.push({
      x: c.x + random(c.w),
      y: c.y + random(c.h),
      vx: random(-1.4, 1.4),
      vy: random(0.5, 2.2),
      size: random(4, 9),
      rot: random(TWO_PI),
      vrot: random(-0.3, 0.3),
      life: 1,
      decay: random(0.012, 0.02),
    });
  }
  crumbleDebris.push({ particles: parts });
}

/**
 * @function updateCrumbleDebris
 * 붕괴 파편 낙하 · 소멸 처리
 */
function updateCrumbleDebris() {
  for (let d of crumbleDebris) {
    for (let p of d.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.rot += p.vrot;
      p.life -= p.decay;
    }
    d.particles = d.particles.filter((p) => p.life > 0);
  }
  crumbleDebris = crumbleDebris.filter((d) => d.particles.length > 0);
}

/**
 * @function drawCrumbleDebris
 * 붕괴 파편 렌더링
 */
function drawCrumbleDebris() {
  for (let d of crumbleDebris) {
    for (let p of d.particles) {
      push();
      translate(p.x, p.y);
      rotate(p.rot);
      noStroke();
      drawingContext.globalAlpha = max(0, min(1, p.life));
      fill(COLOR.box);
      rect(-p.size / 2, -p.size / 2, p.size, p.size, 1);
      drawingContext.globalAlpha = 1;
      pop();
    }
  }
}

/* ============================================================
 * 좌우 왕복 이동 발판 — 타이밍 맞춰 올라타 갭 건너기
 * ========================================================== */

/**
 * @function updateMovePlat
 * 사인 곡선으로 좌우 왕복. 윗면에 올라탄 플레이어를 이동량(dx)만큼 함께 옮김
 */
function updateMovePlat(p) {
  let prevX = p.x;
  p.phase += MOVE_PLAT_SPEED;
  p.x = p.baseX + sin(p.phase) * (p.range != null ? p.range : MOVE_PLAT_RANGE);
  let dx = p.x - prevX;

  // 올라타 있으면(발이 윗면 근처 + 하강/정지 중) 함께 이동
  let pb = getPlayerBounds();
  let feetY = pb.y + pb.h;
  let onTop =
    feetY >= p.y - 5 &&
    feetY <= p.y + p.h * 0.6 &&
    pb.x + pb.w > p.x &&
    pb.x < p.x + p.w &&
    player.vy >= 0;
  if (onTop) player.x += dx;

  blockOnSolid(p);
}

/**
 * @function drawMovePlat
 * 이동 발판 본체 + 좌우 이동 표식
 */
function drawMovePlat(p) {
  push();
  noStroke();
  fill(COLOR.balloon);
  rect(p.x, p.y, p.w, p.h, 4);
  fill(COLOR.uiText);
  rect(p.x, p.y, p.w, 3); // 상단 하이라이트
  fill(COLOR.bg);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(13);
  text("↔", p.x + p.w / 2, p.y + p.h / 2 + 1);
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
 * Stage 2 시작 시 플레이어 + 모든 오브젝트 초기화 (풍선·경사·문·클리어·클라이맥스)
 */
function initialStage2() {
  // Stage 2는 기존 1600 너비 유지 (computeGroundY가 CANVAS_W에 의존하므로 먼저 설정)
  CANVAS_W = STAGE2_CANVAS_W;
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
  crumbleDebris = [];

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
 * Stage 2 매 프레임 업데이트 — 경사·풍선·문 + 입체 클라이맥스 기믹
 */
function updateStage2() {
  // 배경 시차 도형
  updateStage2BgShapes();

  // 바닥 (좌측 시작 + RB1 + RB3 골인)
  for (let g of stage2Grounds) blockOnSolid(g);

  // 경사면 — 원이면 표면 굴림 + 가속, 그 외 도형이면 솔리드 박스
  for (let s of stage2Slopes) handleSlope(s);

  // 입체 클라이맥스 기믹 — 점프 패드 → 무너지는 발판 → 이동 발판
  for (let pad of stage2JumpPads) updateJumpPad(pad);
  for (let c of stage2CrumblePlats) updateCrumblePlat(c);
  for (let mp of stage2MovePlats) updateMovePlat(mp);

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

  // 이펙트 파티클 갱신
  updateBalloonPops();
  updateCrumbleDebris();
}

/**
 * @function drawStage2
 * Stage 2 배경 · 지형 · 경사 · 기믹 · 풍선 · 문 · 클리어 아이템 렌더링
 */
function drawStage2() {
  // 깊이감 배경 (그라데이션 + 시차 도형)
  drawStage2Background();

  // 바닥 (좌측 시작 + RB1 + RB3 — 사이는 절벽/갭)
  noStroke();
  fill(COLOR.terrain);
  for (let g of stage2Grounds) {
    rect(g.x, g.y, g.w, g.h);
  }
  fill(COLOR.terrainHi);
  for (let g of stage2Grounds) {
    rect(g.x, g.y, g.w, 3);
  }

  // 갭(절벽) 가장자리 위험 표시 — 각 바닥 조각의 갭에 면한 끝(화면 경계 제외)
  stroke(COLOR.spike);
  strokeWeight(2);
  for (let g of stage2Grounds) {
    if (g.x > 0) line(g.x, g.y, g.x, g.y + 20);
    if (g.x + g.w < CANVAS_W) line(g.x + g.w, g.y, g.x + g.w, g.y + 20);
  }

  // 경사면 (왼쪽 위 → 오른쪽 아래)
  for (let s of stage2Slopes) {
    fill(COLOR.terrain);
    stroke(COLOR.terrainHi);
    strokeWeight(2);
    triangle(s.x, s.y, s.x, s.y + s.h, s.x + s.w, s.y + s.h);
  }

  // 입체 클라이맥스 기믹 (지형류 — 풍선/문보다 먼저)
  for (let pad of stage2JumpPads) drawJumpPad(pad);
  for (let c of stage2CrumblePlats) drawCrumblePlat(c);
  for (let mp of stage2MovePlats) drawMovePlat(mp);
  drawCrumbleDebris();

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
    let floorY = stage2Grounds[1].y; // RB1 윗면 — 플랫폼 표면
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

  // 힌트 텍스트 (두 줄)
  fill(COLOR.uiText);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(NORMAL);
  text(
    "Hint: 원(Q) 경사 굴러 절벽 넘기 → 삼각형(E)으로 풍선 모두 터뜨리기 → 사각형(W)으로 솟은 패널 밟아 문 열기",
    16,
    58
  );
  text(
    "      원(Q)으로 삼각형 비 질주 → 점프대(가벼운 원이 가장 높이!) → 무너지는 발판 빠르게 → 흔들 발판 타이밍 점프 → ★",
    16,
    74
  );
}

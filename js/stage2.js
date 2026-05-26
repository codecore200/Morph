// Stage 2: 풍선 · 경사면 · 문 퍼즐

let stage2StartTime = 0;
let stage2ElapsedTime = 0;
let stage2Stars = 3;

let stage2Slopes = [];
let stage2Balloons = [];
// 좌측 시작 플랫폼 / 우측 도착 플랫폼 — 사이는 절벽
let stage2Grounds = [
  { x: 0, y: 380, w: 160, h: 160 },
  { x: 540, y: 480, w: 360, h: 60 },
];
let stage2Door = { x: 720, y: 380, w: 18, h: 100, isExist: true };
let stage2ClearItem = { x: 830, y: 430, w: 30, h: 40 };
// 문 위 천장 벽 (점프 우회 방지). 우측 플랫폼 위에 배치
let stage2Walls = [
  { x: 595, y: 50, w: 220, h: 330 },
];

/**
 * @function loadStage2Layout
 * Stage 2 지형·플랫폼·경사 좌표 데이터 구성 (initialStage2가 호출)
 */
function loadStage2Layout() {
  // 경사면: 좌상단(160,380) → 우하단(380,480). 원만 표면을 따라 굴러내림
  stage2Slopes = [
    { x: 160, y: 380, w: 220, h: 100 },
  ];

  // 풍선: 우측 플랫폼 위 통로에 배치 — 삼각형 변신해 터뜨려야 문에 접근
  stage2Balloons = [
    { x: 600, y: 420, w: 32, h: 40, alive: true },
    { x: 660, y: 420, w: 32, h: 40, alive: true },
  ];

  stage2Door = { x: 720, y: 380, w: 18, h: 100, isExist: true };
  stage2ClearItem = { x: 830, y: 430, w: 30, h: 40 };
}

/**
 * @function initialStage2
 * Stage 2 시작 시 플레이어 + 모든 오브젝트 초기화 (풍선·경사·문·클리어)
 */
function initialStage2() {
  // 좌측 시작 플랫폼 위에서 떨어지며 시작 (y=380이 플랫폼 윗면)
  player.x = 60;
  player.y = 200;
  player.vx = 0;
  player.vy = 0;
  player.shape = "circle";
  player.morphFromShape = null;
  player.morphStartTime = 0;
  player.cooldownEndTime = 0;
  setShapeStats("circle");

  loadStage2Layout();

  stage2StartTime = millis();
  stage2ElapsedTime = 0;
  stage2Stars = 3;
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

  // 천장 벽
  for (let w of stage2Walls) blockOnSolid(w);

  // 문
  blockOnDoor(stage2Door);
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

  // 문 위 천장 벽
  fill(COLOR.terrain);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  for (let w of stage2Walls) {
    rect(w.x, w.y, w.w, w.h, 2);
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

  // 클리어 아이템
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

  // 힌트 텍스트
  fill(COLOR.uiText);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  textStyle(NORMAL);
  text("Hint: 원(Q)으로 경사를 굴러 절벽을 넘고, 삼각형(E)으로 풍선을 터뜨려요", 16, GROUND_Y - 6);
}

// Stage 1: 상자 · 버튼 · 문 퍼즐

// Stage 1 전역 오브젝트 데이터
let stage1StartTime = 0;
let stage1ElapsedTime = 0;
let stage1Stars = 3;
let stage1Box = { x: 320, y: 380, w: 40, h: 40, vy: 0 };
let stage1Button = { x: 540, y: 470, w: 60, h: 10, isPressed: false };
let stage1Door = { x: 700, y: 380, w: 18, h: 100, isExist: true };
let stage1ClearItem = { x: 820, y: 430, w: 30, h: 40 };
// 문 위 천장 (점프 우회 방지). 너비 235 > 원 점프 비행 거리 187
let stage1Walls = [
  { x: 580, y: 50, w: 235, h: 330 },
];
// Stage 1 바닥 — 단일 솔리드 (전체 폭)
let stage1Grounds = [
  { x: 0, y: GROUND_Y, w: 900, h: 60 },
];

/**
 * @function initialStage1
 * Stage 1 시작 시 플레이어 · 상자 · 버튼 · 문 등 모든 오브젝트 초기 데이터 세팅
 */
function initialStage1() {
  player.x = 80;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.shape = "square";
  player.morphFromShape = null;
  player.morphStartTime = 0;
  player.cooldownEndTime = 0;
  setShapeStats("square");

  stage1Box = { x: 320, y: 380, w: 40, h: 40, vy: 0 };
  stage1Button = { x: 540, y: 470, w: 60, h: 10, isPressed: false };
  stage1Door = { x: 700, y: 380, w: 18, h: 100, isExist: true };
  stage1ClearItem = { x: 820, y: 430, w: 30, h: 40 };

  stage1StartTime = millis();
  stage1ElapsedTime = 0;
  stage1Stars = 3;
}

/**
 * @function updateBoxPhysics
 * 상자에 중력 · 바닥 충돌만 적용 (위치는 boxCollision이 갱신)
 */
function updateBoxPhysics() {
  stage1Box.vy = (stage1Box.vy || 0) + GRAVITY * 0.6;
  stage1Box.y += stage1Box.vy;
  if (stage1Box.y + stage1Box.h >= GROUND_Y) {
    stage1Box.y = GROUND_Y - stage1Box.h;
    stage1Box.vy = 0;
  }
}

/**
 * @function boxCollision
 * 사각형 상태일 때 상자 밀기 물리 + 벽면 관통 방지 (AABB 분리)
 */
function boxCollision() {
  let pb = getPlayerBounds();
  if (!isColliding(pb, stage1Box)) return;

  let overlapX = min(
    pb.x + pb.w - stage1Box.x,
    stage1Box.x + stage1Box.w - pb.x
  );
  let overlapY = min(
    pb.y + pb.h - stage1Box.y,
    stage1Box.y + stage1Box.h - pb.y
  );

  if (overlapX < overlapY) {
    // 수평 충돌
    if (player.x < stage1Box.x) {
      if (player.shape === "square") {
        stage1Box.x += overlapX;
      } else {
        player.x -= overlapX;
        player.vx = 0;
      }
    } else {
      if (player.shape === "square") {
        stage1Box.x -= overlapX;
      } else {
        player.x += overlapX;
        player.vx = 0;
      }
    }
  } else {
    // 수직 충돌
    if (player.y < stage1Box.y) {
      player.y -= overlapY;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.y += overlapY;
      player.vy = 0;
    }
  }
}

/**
 * @function buttonFunction
 * 상자(또는 플레이어)가 버튼을 누르면 연동된 문 삭제
 */
function buttonFunction() {
  // 상자가 버튼을 누르는지
  let boxAbove =
    stage1Box.x < stage1Button.x + stage1Button.w &&
    stage1Box.x + stage1Box.w > stage1Button.x &&
    stage1Box.y + stage1Box.h >= stage1Button.y - 4;

  // 플레이어가 버튼을 누르는지
  let pb = getPlayerBounds();
  let playerAbove =
    pb.x < stage1Button.x + stage1Button.w &&
    pb.x + pb.w > stage1Button.x &&
    pb.y + pb.h >= stage1Button.y - 4 &&
    player.shape === "square";

  if (boxAbove || playerAbove) {
    stage1Button.isPressed = true;
    stage1Door.isExist = false;
  } else {
    stage1Button.isPressed = false;
    stage1Door.isExist = true;
  }
}

/**
 * @function drawStage1
 * Stage 1 지형 · 상자 · 버튼 · 문 · 클리어 아이템 렌더링
 */
function drawStage1() {
  // 바닥
  noStroke();
  fill(COLOR.terrain);
  rect(0, GROUND_Y, width, height - GROUND_Y);
  fill(COLOR.terrainHi);
  rect(0, GROUND_Y, width, 3);

  // 상자
  fill(COLOR.box);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  rect(stage1Box.x, stage1Box.y, stage1Box.w, stage1Box.h, 4);

  // 버튼
  noStroke();
  fill(stage1Button.isPressed ? COLOR.clear : COLOR.spike);
  let by = stage1Button.isPressed ? stage1Button.y + 4 : stage1Button.y;
  rect(stage1Button.x, by, stage1Button.w, stage1Button.h, 3);
  fill(COLOR.terrainHi);
  rect(stage1Button.x - 5, stage1Button.y + 10, stage1Button.w + 10, 4);

  // 문 위 천장 벽
  fill(COLOR.terrain);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  for (let w of stage1Walls) {
    rect(w.x, w.y, w.w, w.h, 2);
  }

  // 문
  if (stage1Door.isExist) {
    fill(COLOR.door);
    stroke(COLOR.terrainHi);
    strokeWeight(2);
    rect(stage1Door.x, stage1Door.y, stage1Door.w, stage1Door.h, 3);
    noStroke();
    fill(COLOR.terrainHi);
    ellipse(stage1Door.x + stage1Door.w - 4, stage1Door.y + stage1Door.h / 2, 4, 4);
  }

  // 클리어 아이템
  push();
  translate(
    stage1ClearItem.x + stage1ClearItem.w / 2,
    stage1ClearItem.y + stage1ClearItem.h / 2
  );
  let pulse = 1 + 0.08 * sin(millis() * 0.005);
  scale(pulse);
  noStroke();
  fill(COLOR.clear);
  rect(-stage1ClearItem.w / 2, -stage1ClearItem.h / 2, stage1ClearItem.w, stage1ClearItem.h, 4);
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
  text("Hint: 사각형으로 상자를 밀어 버튼 위에 올리세요", 16, GROUND_Y - 6);
}

/**
 * @function updateStage1
 * Stage 1 매 프레임 업데이트 — 물리, 충돌, 버튼 판정
 */
function updateStage1() {
  updateBoxPhysics();
  for (let g of stage1Grounds) blockOnSolid(g);
  boxCollision();
  for (let w of stage1Walls) blockOnSolid(w);
  blockOnDoor(stage1Door);
  buttonFunction();
}

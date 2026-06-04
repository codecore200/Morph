// Stage 1: 상자 · 버튼 · 문 퍼즐

// Stage 1 전역 오브젝트 데이터
let stage1StartTime = 0;
let stage1ElapsedTime = 0;
let stage1Stars = 3;
let stage1Box = { x: 320, y: 380, w: 32, h: 32, vy: 0 };
// 버튼은 구덩이(핏) 바닥에 위치 — 박스가 떨어져야만 닿을 수 있음
let stage1Button = { x: 520, y: 520, w: 100, h: 20, isPressed: false };
let stage1Door = { x: 700, y: 380, w: 18, h: 100, isExist: true };
// 클리어 아이템은 확장된 우측 영역 끝 근처에 배치 — 그 사이 공간이 새 요소 추가용
let stage1ClearItem = { x: 1320, y: 430, w: 24, h: 32 };
// 문 위 천장 (점프 우회 방지). 너비 235 > 원 점프 비행 거리 187
let stage1Walls = [
  { x: 580, y: 50, w: 235, h: 330 },
];
// Stage 1 바닥 — 좌·우 분리, 사이 100px 구덩이 (x=520~620). 우측은 확장된 캔버스 끝까지
let stage1Grounds = [
  { x: 0, y: GROUND_Y, w: 520, h: 60 },
  { x: 620, y: GROUND_Y, w: CANVAS_W - 620, h: 60 },
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

  stage1Box = { x: 320, y: 380, w: 32, h: 32, vy: 0 };
  stage1Button = { x: 520, y: 520, w: 100, h: 20, isPressed: false };
  stage1Door = { x: 700, y: 380, w: 18, h: 100, isExist: true };
  stage1ClearItem = { x: 1320, y: 430, w: 24, h: 32 };

  stage1StartTime = millis();
  stage1ElapsedTime = 0;
  stage1Stars = 3;
}

/**
 * @function updateBoxPhysics
 * 상자에 중력 적용 + 좌·우 지면 / 버튼(핏 바닥) 중 박스 중심 x가 닿는 가장 높은 표면에서 정지.
 * 박스 중심이 구덩이 위에 오면 떠받칠 솔리드가 사라져 자유낙하 → 버튼 위로 떨어짐
 */
function updateBoxPhysics() {
  stage1Box.vy = (stage1Box.vy || 0) + GRAVITY * 0.6;
  stage1Box.y += stage1Box.vy;

  // 박스 가로 범위와 겹치는 솔리드(좌·우 지면, 버튼) 중 가장 위 표면을 바닥으로 사용
  // 박스의 어느 부분이라도 지면 위에 걸쳐 있으면 떠받쳐짐 → 완전히 절벽을 넘은 뒤에만 추락
  let surfaces = stage1Grounds.concat([stage1Button]);
  let floorY = Infinity;
  for (let s of surfaces) {
    let xOverlap = stage1Box.x + stage1Box.w > s.x && stage1Box.x < s.x + s.w;
    if (xOverlap && s.y < floorY) floorY = s.y;
  }
  if (stage1Box.y + stage1Box.h >= floorY) {
    stage1Box.y = floorY - stage1Box.h;
    stage1Box.vy = 0;
  }
}

/**
 * @function canBoxOccupy
 * 박스가 주어진 사각형 영역을 점유할 수 있는지 — 닫힌 문/벽과 겹치면 false
 */
function canBoxOccupy(boxRect) {
  if (stage1Door.isExist && isColliding(boxRect, stage1Door)) return false;
  for (let w of stage1Walls) {
    if (isColliding(boxRect, w)) return false;
  }
  // 좌·우 지면이 구덩이 측벽 역할 — 박스가 핏 바깥으로 새지 못하도록
  for (let g of stage1Grounds) {
    if (isColliding(boxRect, g)) return false;
  }
  return true;
}

/**
 * @function boxCollision
 * 사각형 상태일 때 상자 밀기 물리 + 벽면 관통 방지 (AABB 분리).
 * 박스의 새 위치가 솔리드와 겹치면 박스 못 밀고 플레이어가 분리됨.
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

  // 상승 중(vy < 0)에 플레이어 하단이 박스 상단을 막 지나칠 때 overlapY가 극소화되어
  // 수평 접근임에도 수직 충돌로 오판 → vy = 0 설정으로 점프가 강제 중단되는 버그 방지.
  // 플레이어 중심이 박스 상단보다 위에 있고 위로 이동 중이면 수평으로 처리.
  let resolveAsHorizontal = overlapX < overlapY || (player.vy < 0 && player.y < stage1Box.y);

  if (resolveAsHorizontal) {
    // 수평 충돌
    if (player.x < stage1Box.x) {
      let newBox = {
        x: stage1Box.x + overlapX,
        y: stage1Box.y,
        w: stage1Box.w,
        h: stage1Box.h,
      };
      if (player.shape === "square" && canBoxOccupy(newBox)) {
        stage1Box.x = newBox.x;
      } else {
        player.x -= overlapX;
        player.vx = 0;
      }
    } else {
      let newBox = {
        x: stage1Box.x - overlapX,
        y: stage1Box.y,
        w: stage1Box.w,
        h: stage1Box.h,
      };
      if (player.shape === "square" && canBoxOccupy(newBox)) {
        stage1Box.x = newBox.x;
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
  // 오직 상자만 버튼을 누를 수 있음 (기획안 8.5)
  let boxAbove =
    stage1Box.x < stage1Button.x + stage1Button.w &&
    stage1Box.x + stage1Box.w > stage1Button.x &&
    stage1Box.y + stage1Box.h >= stage1Button.y - 4;

  if (boxAbove) {
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
  // 좌·우 지면 (사이는 구덩이)
  noStroke();
  fill(COLOR.terrain);
  for (let g of stage1Grounds) {
    rect(g.x, g.y, g.w, g.h);
  }
  fill(COLOR.terrainHi);
  for (let g of stage1Grounds) {
    rect(g.x, g.y, g.w, 3);
  }

  // 구덩이 측벽 위험 라인 (절벽 끝 빨간 마커)
  stroke(COLOR.spike);
  strokeWeight(2);
  let leftG = stage1Grounds[0];
  let rightG = stage1Grounds[1];
  line(leftG.x + leftG.w, leftG.y, leftG.x + leftG.w, leftG.y + 24);
  line(rightG.x, rightG.y, rightG.x, rightG.y + 24);

  // 상자
  noStroke();
  fill(COLOR.box);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  rect(stage1Box.x, stage1Box.y, stage1Box.w, stage1Box.h, 4);

  // 버튼 (구덩이 바닥)
  noStroke();
  fill(stage1Button.isPressed ? COLOR.clear : COLOR.spike);
  let by = stage1Button.isPressed ? stage1Button.y + 4 : stage1Button.y;
  rect(stage1Button.x, by, stage1Button.w, stage1Button.h, 3);

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

  // 클리어 아이템 (획득 후에는 숨김 — 파티클 이펙트가 자리를 대체)
  if (!stage1ClearItem.collected) {
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
  }

  // 힌트 텍스트
  fill(COLOR.uiText);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  textStyle(NORMAL);
  text("Hint: 사각형으로 상자를 밀어 구덩이에 떨어뜨려 버튼을 누르세요", 16, GROUND_Y - 6);
}

/**
 * @function updateStage1
 * Stage 1 매 프레임 업데이트 — 물리, 충돌, 버튼 판정
 */
function updateStage1() {
  updateBoxPhysics();
  for (let g of stage1Grounds) blockOnSolid(g);
  // 버튼은 박스만 인식해 문을 열지만, 발판 자체는 플레이어에게도 솔리드 (빠진 뒤 탈출 가능)
  blockOnSolid(stage1Button);
  boxCollision();
  for (let w of stage1Walls) blockOnSolid(w);
  blockOnDoor(stage1Door);
  buttonFunction();
}

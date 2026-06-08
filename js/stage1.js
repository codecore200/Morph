// Stage 1: 상자 · 버튼 · 문 퍼즐 + 우측 확장 구간(가시 구덩이 · 상자 디딤돌 · 풍선 관문)
//          + 사이드스크롤 피날레(컨베이어 벨트 · 균열 바닥) — Stage 2와 겹치지 않는 Stage 1 고유 기믹
// 세 도형의 개성을 차례로 익힌 뒤 한 구간에서 종합적으로 활용하도록 설계:
//   원(Q)으로 등반/점프 → 사각형(W)으로 상자 밀기 → 삼각형(E)으로 풍선 터뜨리기
//   → (피날레) 빠른 원(Q)으로 역방향 컨베이어 벨트를 거슬러 통과 → 무거운 사각형(W)으로 균열 바닥을 내리찍어 뚫고 ★

// Stage 1 전역 오브젝트 데이터 (실제 좌표는 initialStage1에서 GROUND_Y 기준으로 재설정)
let stage1StartTime = 0;
let stage1ElapsedTime = 0;
let stage1Stars = 3;
// 상자1 — 버튼을 누르는 무게추. 좌측 발판 위에서 시작해 사각형으로 밀어 구덩이에 떨어뜨림
let stage1Box = { x: 320, y: 380, w: 32, h: 32, vy: 0 };
// 상자2 — 디딤돌. 우측에서 높은 턱 앞으로 밀어 밟고 올라서는 발판으로 사용 (상자1보다 큰 48px)
let stage1Box2 = { x: 1160, y: 380, w: 48, h: 48, vy: 0 };
// 버튼은 구덩이(핏) 바닥에 위치 — 박스가 떨어져야만 닿을 수 있음
let stage1Button = { x: 520, y: 520, w: 100, h: 20, isPressed: false };
let stage1Door = { x: 700, y: 380, w: 18, h: 100, isExist: true };
// 클리어 아이템 — 풍선 관문 너머, 높은 턱 위 오른쪽 끝
let stage1ClearItem = { x: 1850, y: 240, w: 24, h: 32 };
// 점프 블록 — 좌측 시작 지점에서 상자1 발판까지 80px씩 등반. 마지막(폭 넓음)은 상자 발판
let stage1JumpBlocks = [
  { x: 110, y: 400, w: 85,  h: 18 },
  { x: 240, y: 320, w: 85,  h: 18 },
  { x: 360, y: 240, w: 160, h: 18 },
];
// 천장 벽 — [0] 좌측 문 위(점프 우회 방지) [1] 풍선 관문 천장(점프 회피 방지)
let stage1Walls = [
  { x: 580, y: 50, w: 235, h: 330 },
];
// Stage 1 바닥 — 좌측·우측A·우측B·높은 턱으로 분할 (사이는 구덩이/갭)
let stage1Grounds = [
  { x: 0, y: GROUND_Y, w: 520, h: 60 },
  { x: 620, y: GROUND_Y, w: CANVAS_W - 620, h: 60 },
];
// 가시 구덩이 — 우측A와 우측B 사이 갭. 닿으면 실패 (initialStage1에서 좌표 설정)
let stage1Spikes = [];
// 풍선 관문 — 높은 턱 위 통로를 막는 풍선 벽 (initialStage1에서 좌표 설정)
let stage1Balloons = [];
// 피날레 컨베이어 벨트 — 왼쪽으로 흐르는 역방향 러닝머신. 걷는 속도가 흐름보다 빠른 도형(원)만 거슬러 전진.
//   (원 4.0 > 흐름 3.0 → 통과 / 삼각형 3.5 → 매우 느림 / 사각형 2.8 → 뒤로 밀림) → 빠른 원 변신 유도 (Stage 1 고유 기믹)
let stage1Belts = [];
// 피날레 균열 바닥 — 약한 발판. 무거운 사각형이 위에서 빠르게 내리찍어야(낙하 충격) 부서져 아래 통로가 열림.
//   원·삼각형은 밟고 서 있을 뿐 못 부숨 → 무거운 사각형 변신 유도 (Stage 1 고유 기믹)
let stage1Brittles = [];

/**
 * @function initialStage1
 * Stage 1 시작 시 플레이어 · 상자 · 버튼 · 문 · 가시 · 풍선 등 모든 오브젝트 초기 데이터 세팅
 */
function initialStage1() {
  // Stage 1은 우측 확장 구간을 위해 가로 2000 사용
  // (computeGroundY가 CANVAS_W에 의존하므로 바닥 계산 전에 설정)
  CANVAS_W = STAGE1_CANVAS_W;
  GROUND_Y = computeGroundY();
  let GY = GROUND_Y;

  player.x = 80;
  player.y = GY - 300; // 바닥 위 300px 지점에서 낙하 시작
  player.vx = 0;
  player.vy = 0;
  player.shape = "square";
  player.morphFromShape = null;
  player.morphStartTime = 0;
  player.cooldownEndTime = 0;
  setShapeStats("square");

  // 지면 — 모두 GROUND_Y 기준 상대 배치. 사이드스크롤 확장으로 구간 사이 이동 거리를 넉넉히 둠
  //   [기초 퍼즐] 좌측(0~520) ─구덩이─ 우측A(620~1220) ─가시 갭─ 우측B(1360~1960) ─턱─ 높은 턱(1960~2460)
  //   [피날레]   지상A(2460~2680) ─벨트 갭(2680~2840)─ 지상B(2840~3160) ─계단↑─ 높은 발판(3160~3340) ─균열 바닥(3340~3540)↓─ 골인 지상(3340~3940)
  stage1Grounds = [
    { x: 0,    y: GY,       w: 520, h: 300 }, // 좌측 지면 (상자 퍼즐)
    { x: 620,  y: GY,       w: 600, h: 300 }, // 우측A: 문 착지 + 가시 도움닫기 (620~1220)
    { x: 1360, y: GY,       w: 600, h: 300 }, // 우측B: 상자 디딤돌 구역 (1360~1960)
    { x: 1960, y: GY - 196, w: 500, h: 480 }, // 높은 턱: 풍선 관문 (윗면 GY-196 — 상자 디딤돌 필요, 1960~2460)
    { x: 2460, y: GY,       w: 220, h: 300 }, // 지상A: 높은 턱에서 강하 착지 + 벨트 진입 (2460~2680)
    { x: 2840, y: GY,       w: 320, h: 300 }, // 지상B: 벨트 착지 + 계단 진입 (2840~3160)  [벨트 갭 2680~2840]
    { x: 3160, y: GY - 160, w: 180, h: 460 }, // 높은 발판: 균열 바닥으로 이어지는 윗길 (윗면 GY-160, 3160~3340)
    { x: 3340, y: GY,       w: 600, h: 300 }, // 골인 지상: 균열 바닥을 뚫고 내려오는 아랫길 + 클리어 ★ (3340~3940)
  ];

  stage1Button = { x: 520, y: GY + 40, w: 100, h: 20, isPressed: false };
  // 문을 높게(상단 GROUND_Y-200) — 점프 블록 발판 높이대까지 통로를 막음
  stage1Door   = { x: 700, y: GY - 200, w: 18, h: 200, isExist: true };

  // 등반 블록 — [좌측] 시작 지점에서 상자1 발판까지 80px씩 등반(마지막 폭 160은 상자 발판)
  //            [피날레] 지상B(GY)에서 높은 발판(GY-160)으로 오르는 디딤 계단 1개
  stage1JumpBlocks = [
    { x: 110,  y: GY - 80,  w: 85,  h: 18 },
    { x: 240,  y: GY - 160, w: 85,  h: 18 },
    { x: 360,  y: GY - 240, w: 160, h: 18 }, // 상자1 발판 (오른쪽 끝 x=520 = 구덩이 입구)
    { x: 3050, y: GY - 90,  w: 100, h: 18 }, // 피날레 계단 (지상B → 높은 발판 진입)
  ];

  // 상자1 — 좌측 발판(360~520) 정중앙(424)에 안착. 사각형으로 밀어 구덩이로 떨어뜨려 버튼을 누름.
  stage1Box  = { x: 424, y: GY - 272, w: 32, h: 32, vy: 0 };
  // 상자2 — 우측B 위. 사각형으로 높은 턱(x=1960) 앞까지 밀어 디딤돌로 사용.
  // 상자1보다 큰 48px — 그 위에서 점프해야 턱 윗면(GY-196)에 닿음(맨바닥 점프로는 16px 부족)
  stage1Box2 = { x: 1460, y: GY - 48, w: 48, h: 48, vy: 0 };

  // 천장 벽 — [0] 좌측 문 위(HUD 하단 52 ~ 문 상단), [1] 높은 턱 풍선 관문 천장(아랫면 GY-240),
  //          [2] 벨트 위 낮은 천장(아랫면 GY-44 — 점프로 벨트 회피 방지),
  //          [3] 균열 바닥 위 천장(아랫면 GY-220), [4] 균열 바닥 우측 차단벽(GY-220~GY-160)
  //          → [3]+[4]로 균열 바닥 위가 좌측(높은 발판)만 열린 막힌 공간 → 출구는 바닥을 뚫고 아래로만
  stage1Walls = [
    { x: 580,  y: 52,       w: 235, h: GY - 252 },
    { x: 2020, y: 52,       w: 200, h: GY - 292 },
    { x: 2680, y: 52,       w: 160, h: GY - 96  },
    { x: 3340, y: 52,       w: 200, h: GY - 320 },  // brittle chamber 천장 — 사각형 제자리 점프 정점보다 충분히 높여 낙하 시 vy>6 확보
    { x: 3540, y: GY - 268, w: 20,  h: 108      },  // brittle chamber 우측 벽 (천장 하단~바닥 사이를 메움)
  ];

  // 가시 구덩이 — 우측A↔우측B 갭(폭 140). 톱니에 닿으면 즉시 실패.
  // 가장자리에서 점프하면 원만 건너고(비행 ≈172px), 사각형·삼각형은 비행거리가 부족 → 원 변신 유도
  stage1Spikes = [
    { x: 1220, y: GY + 4, w: 140, h: 40 },
  ];

  // 풍선 관문 — 높은 턱 위 통로(천장 아랫면 GY-240 ~ 턱 윗면 GY-196)를 5개가 가로로 꽉 막음.
  // 삼각형으로 모두 터뜨려야 통과. 그 외 도형은 풍선 벽 + 천장에 막혀 우회 불가
  stage1Balloons = [
    { x: 2020, y: GY - 240, w: 40, h: 44, alive: true },
    { x: 2060, y: GY - 240, w: 40, h: 44, alive: true },
    { x: 2100, y: GY - 240, w: 40, h: 44, alive: true },
    { x: 2140, y: GY - 240, w: 40, h: 44, alive: true },
    { x: 2180, y: GY - 240, w: 40, h: 44, alive: true },
  ];

  // 피날레 컨베이어 벨트 — 지상A(끝 2680)와 지상B(시작 2840) 사이 갭(160)을 메우는 발판. 왼쪽으로 흐름(dir -1).
  // 위 천장(벽[2])이 점프를 막아 반드시 벨트 위를 걸어 건너야 함 → 흐름보다 빠른 원(4.0)만 거슬러 통과
  stage1Belts = [
    { x: 2680, y: GY, w: 160, h: 24, dir: -1, speed: 3.0, scroll: 0 },
  ];

  // 피날레 균열 바닥 — 높은 발판(3160~3340)에서 이어지는 약한 발판(3340~3540, 윗면 GY-160).
  // 위·우측이 막혀 유일한 진행로는 이 바닥을 뚫는 것. 사각형으로 점프 내리찍으면(낙하 충격) 부서져 골인 지상으로 강하
  stage1Brittles = [
    { x: 3340, y: GY - 160, w: 200, h: 18, broken: false, brokenAt: 0 },
  ];

  // 클리어 아이템 — 균열 바닥을 뚫고 내려온 골인 지상(GY) 위
  stage1ClearItem = { x: 3760, y: GY - 32, w: 24, h: 32, collected: false };

  balloonPops = [];   // 풍선 폭발 이펙트 큐 초기화 (Stage 2와 공유)
  crumbleDebris = []; // 균열 바닥 붕괴 파편 큐 초기화 (Stage 2와 공유)

  stage1StartTime = gmillis();
  stage1ElapsedTime = 0;
  stage1Stars = 3;
}

/**
 * @function updateBoxPhysics
 * 상자에 중력 적용 + 좌·우 지면 / 점프 블록 / 버튼 중 박스 중심 x가 닿는 가장 높은 표면에서 정지.
 * 박스가 구덩이 위에 오면 떠받칠 솔리드가 사라져 자유낙하
 */
function updateBoxPhysics(box) {
  box.vy = (box.vy || 0) + GRAVITY * 0.6;
  box.y += box.vy;

  // 박스 가로 범위와 겹치는 솔리드(지면, 점프 블록, 버튼) 중 가장 위 표면을 바닥으로 사용.
  // 박스의 어느 부분이라도 표면 위에 걸쳐 있으면 떠받쳐짐 → 완전히 가장자리를 넘은 뒤에만 추락
  let surfaces = stage1Grounds.concat(stage1JumpBlocks).concat([stage1Button]);
  let floorY = Infinity;
  for (let s of surfaces) {
    let xOverlap = box.x + box.w > s.x && box.x < s.x + s.w;
    if (xOverlap && s.y < floorY) floorY = s.y;
  }
  if (box.y + box.h >= floorY) {
    box.y = floorY - box.h;
    box.vy = 0;
  }
}

/**
 * @function canBoxOccupy
 * 박스가 주어진 사각형 영역을 점유할 수 있는지 — 닫힌 문/벽/지면과 겹치면 false.
 * 지면(우측B↔높은 턱 경계 포함)이 측벽 역할을 해 박스가 턱 너머로 새지 못하게 함
 */
function canBoxOccupy(boxRect) {
  if (stage1Door.isExist && isColliding(boxRect, stage1Door)) return false;
  for (let w of stage1Walls) {
    if (isColliding(boxRect, w)) return false;
  }
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
function boxCollision(box) {
  let pb = getPlayerBounds();
  if (!isColliding(pb, box)) return;

  let overlapX = min(pb.x + pb.w - box.x, box.x + box.w - pb.x);
  let overlapY = min(pb.y + pb.h - box.y, box.y + box.h - pb.y);

  // 상승 중(vy < 0)에 플레이어 하단이 박스 상단을 막 지나칠 때 overlapY가 극소화되어
  // 수평 접근임에도 수직 충돌로 오판 → vy = 0 설정으로 점프가 강제 중단되는 버그 방지.
  let resolveAsHorizontal = overlapX < overlapY || (player.vy < 0 && player.y < box.y);

  if (resolveAsHorizontal) {
    // 수평 충돌 — 사각형일 때만 박스를 밀 수 있음
    if (player.x < box.x) {
      let newBox = { x: box.x + overlapX, y: box.y, w: box.w, h: box.h };
      if (player.shape === "square" && canBoxOccupy(newBox)) {
        box.x = newBox.x;
      } else {
        player.x -= overlapX;
        player.vx = 0;
      }
    } else {
      let newBox = { x: box.x - overlapX, y: box.y, w: box.w, h: box.h };
      if (player.shape === "square" && canBoxOccupy(newBox)) {
        box.x = newBox.x;
      } else {
        player.x += overlapX;
        player.vx = 0;
      }
    }
  } else {
    // 수직 충돌
    if (player.y < box.y) {
      player.y -= overlapY;
      player.vy = 0;
      player.onGround = true; // 박스 위 착지 → 디딤돌로 사용 가능
    } else {
      player.y += overlapY;
      player.vy = 0;
    }
  }
}

/**
 * @function buttonFunction
 * 상자1이 버튼을 누르면 연동된 문 삭제 (오직 상자만 버튼을 누를 수 있음)
 */
function buttonFunction() {
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
 * @function checkSpikeCollision
 * 가시에 닿으면 즉시 실패 (클리어 이펙트 중에는 제외)
 */
function checkSpikeCollision() {
  if (clearEffect.active) return;
  let pb = getPlayerBounds();
  for (let sp of stage1Spikes) {
    if (isColliding(pb, sp)) {
      setGameState(STATE.FAIL);
      return;
    }
  }
}

/**
 * @function drawBox
 * 상자 공통 렌더 (상자1·상자2 공용)
 */
function drawBox(box) {
  noStroke();
  fill(COLOR.box);
  stroke(COLOR.terrainHi);
  strokeWeight(2);
  rect(box.x, box.y, box.w, box.h, 4);
}

/**
 * @function drawSpikes
 * 가시 구덩이 — 갭 내부의 위협적인 빨간 톱니 렌더
 */
function drawSpikes() {
  for (let sp of stage1Spikes) {
    // 구덩이 안쪽 어둠
    noStroke();
    fill(COLOR.bg);
    rect(sp.x, sp.y, sp.w, sp.h + 200);
    // 톱니
    fill(COLOR.spike);
    let teeth = max(1, floor(sp.w / 18));
    let tw = sp.w / teeth;
    for (let i = 0; i < teeth; i++) {
      let bx = sp.x + i * tw;
      triangle(bx, sp.y + sp.h, bx + tw / 2, sp.y, bx + tw, sp.y + sp.h);
    }
  }
}

/**
 * @function drawBalloons
 * 풍선 관문 — 살아있는 풍선 렌더 (보라색 풍선 + 줄)
 */
function drawBalloons() {
  for (let b of stage1Balloons) {
    if (!b.alive) continue;
    noStroke();
    fill(COLOR.balloon);
    ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
    stroke(COLOR.terrainHi);
    strokeWeight(1);
    line(b.x + b.w / 2, b.y + b.h, b.x + b.w / 2, b.y + b.h + 14);
  }
}

/* ============================================================
 * 피날레 컨베이어 벨트 — 왼쪽으로 흐르는 역방향 러닝머신
 * 흐름보다 걷는 속도가 빠른 도형(원)만 거슬러 전진할 수 있다.
 * ========================================================== */

/**
 * @function updateConveyor
 * 벨트는 평소 솔리드 발판. 윗면에 서 있으면 흐름 방향(dir)으로 매 프레임 떠밀린다.
 * 이동 입력(player.vx)과 합쳐져, moveSpeed가 흐름보다 큰 도형만 거슬러 나아간다.
 */
function updateConveyor(belt) {
  blockOnSolid(belt);

  let pb = getPlayerBounds();
  let feetY = pb.y + pb.h;
  let onTop =
    player.onGround &&
    feetY >= belt.y - 3 &&
    feetY <= belt.y + belt.h &&
    pb.x + pb.w > belt.x &&
    pb.x < belt.x + belt.w;

  if (onTop) player.x += belt.dir * belt.speed;
  belt.scroll += belt.dir * belt.speed; // 표면 줄무늬 스크롤(렌더용)
}

/**
 * @function drawConveyor
 * 벨트 본체 + 흐름 방향으로 움직이는 화살표 줄무늬 (영역 클립)
 */
function drawConveyor(belt) {
  push();
  noStroke();
  fill(COLOR.bgFar);
  rect(belt.x, belt.y, belt.w, belt.h, 3);
  fill(COLOR.terrainHi);
  rect(belt.x, belt.y, belt.w, 3); // 상단 하이라이트

  // 흐름 표시 — 벨트 안쪽으로 클립한 뒤 방향 화살표를 스크롤
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(belt.x, belt.y, belt.w, belt.h);
  drawingContext.clip();
  fill(COLOR.balloon);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(13);
  let step = 24;
  let off = ((belt.scroll % step) + step) % step;
  let glyph = belt.dir < 0 ? "◄" : "►";
  for (let x = belt.x - step + off; x < belt.x + belt.w + step; x += step) {
    text(glyph, x, belt.y + belt.h / 2 + 1);
  }
  drawingContext.restore();
  pop();
}

/* ============================================================
 * 피날레 균열 바닥 — 사각형이 위에서 내리찍어야 부서지는 약한 발판
 * ========================================================== */

/**
 * @function updateBrittleFloor
 * 평소엔 솔리드. 무거운 사각형이 충분한 낙하 속도로 윗면을 내리찍으면 부서져 솔리드가 사라진다.
 * (원·삼각형은 밟고 서 있을 뿐 못 부숨 → 사각형 변신 강제)
 */
function updateBrittleFloor(b) {
  if (b.broken) return;

  let pb = getPlayerBounds();
  let feetPrev = (pb.y + pb.h) - player.vy; // 직전 프레임 발 위치(blockOnSolid가 vy를 0으로 만들기 전 판정)
  let hardStomp =
    player.shape === "square" &&
    player.vy > 6 &&
    isColliding(pb, b) &&
    feetPrev <= b.y + 2 &&
    player.y < b.y;

  if (hardStomp) {
    b.broken = true;
    b.brokenAt = gmillis();
    spawnCrumbleDebris(b); // Stage 2와 공유하는 파편 큐 사용
    playBGM("pop");
    return; // 솔리드 처리 생략 → 즉시 통과(아래로 추락)
  }

  blockOnSolid(b);
}

/**
 * @function drawBrittleFloor
 * 균열 무늬 발판 + "사각형으로 내리찍기" 안내 아이콘 (부서지면 숨김)
 */
function drawBrittleFloor(b) {
  if (b.broken) return;
  push();
  fill(COLOR.box);
  stroke(COLOR.spike);
  strokeWeight(2);
  rect(b.x, b.y, b.w, b.h, 2);

  // 균열 무늬
  stroke(COLOR.bg);
  strokeWeight(1.5);
  for (let i = 1; i < 6; i++) {
    let x = b.x + (b.w * i) / 6;
    line(x, b.y + 2, x + 7, b.y + b.h - 2);
  }

  // 내리찍기 안내(아래 화살표) — 사각형 색
  noStroke();
  fill(COLOR.square);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(12);
  text("▼", b.x + b.w / 2, b.y + b.h / 2 + 1);
  pop();
}

/**
 * @function drawStage1
 * Stage 1 지형 · 가시 · 상자 · 버튼 · 문 · 풍선 · 클리어 아이템 렌더링
 */
function drawStage1() {
  // 좌·우 지면 + 높은 턱
  noStroke();
  fill(COLOR.terrain);
  for (let g of stage1Grounds) {
    rect(g.x, g.y, g.w, g.h);
  }
  fill(COLOR.terrainHi);
  for (let g of stage1Grounds) {
    rect(g.x, g.y, g.w, 3);
  }

  // 갭/절벽 가장자리 위험 라인 — 각 지면 조각이 갭에 면한 끝(화면 경계 제외)에 표시.
  // 높이가 다른 피날레 고원도 g.y 기준으로 정확히 그려진다.
  stroke(COLOR.spike);
  strokeWeight(2);
  for (let g of stage1Grounds) {
    if (g.x > 0) line(g.x, g.y, g.x, g.y + 20);
    if (g.x + g.w < CANVAS_W) line(g.x + g.w, g.y, g.x + g.w, g.y + 20);
  }

  // 가시 구덩이
  drawSpikes();

  // 버튼 (구덩이 바닥)
  noStroke();
  fill(stage1Button.isPressed ? COLOR.clear : COLOR.spike);
  let by = stage1Button.isPressed ? stage1Button.y + 4 : stage1Button.y;
  rect(stage1Button.x, by, stage1Button.w, stage1Button.h, 3);

  // 상자1 · 상자2
  drawBox(stage1Box);
  drawBox(stage1Box2);

  // 천장 벽 (좌측 문 위 + 풍선 관문 천장)
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

  // 점프 블록 (좌측 등반 — 밟고 올라가 상자1에 닿음)
  for (let jb of stage1JumpBlocks) {
    noStroke();
    fill(COLOR.balloon);
    rect(jb.x, jb.y, jb.w, jb.h, 4);
    fill(COLOR.uiText);
    rect(jb.x, jb.y, jb.w, 3);
    fill(COLOR.bg);
    textAlign(CENTER, CENTER);
    textSize(13);
    textStyle(BOLD);
    text("▲", jb.x + jb.w / 2, jb.y + jb.h / 2 + 2);
  }

  // 피날레 컨베이어 벨트 · 균열 바닥 + 붕괴 파편
  for (let belt of stage1Belts) drawConveyor(belt);
  for (let b of stage1Brittles) drawBrittleFloor(b);
  drawCrumbleDebris(); // Stage 2와 공유하는 붕괴 파편

  // 풍선 관문 (풍선 벽 + 폭발 이펙트)
  drawBalloons();
  drawBalloonPops(); // Stage 2와 공유하는 폭발 파티클

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

  // 힌트 텍스트 (세 줄 — 좌측 퍼즐 / 중앙 확장 / 피날레)
  fill(COLOR.uiText);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(NORMAL);
  text(
    "Hint: 원(Q)으로 점프 블록을 올라 상자에 닿고, 사각형(W)으로 밀어 버튼을 누른 뒤 문을 통과하세요",
    16,
    58
  );
  text(
    "      원(Q)으로 가시 구덩이 점프 → 사각형(W)으로 상자를 턱 앞에 밀어 디딤돌 → 삼각형(E)으로 풍선을 터뜨려 통과",
    16,
    74
  );
  text(
    "      피날레 — 빠른 원(Q)으로 역방향 컨베이어 벨트를 거슬러 통과 → 무거운 사각형(W)으로 균열 바닥을 내리찍어 뚫고 ★",
    16,
    90
  );
}

/**
 * @function updateStage1
 * Stage 1 매 프레임 업데이트 — 물리, 충돌, 버튼 · 가시 · 풍선 판정
 */
function updateStage1() {
  updateBoxPhysics(stage1Box);
  updateBoxPhysics(stage1Box2);

  for (let g of stage1Grounds) blockOnSolid(g);
  // 버튼은 박스만 인식해 문을 열지만, 발판 자체는 플레이어에게도 솔리드 (빠진 뒤 탈출 가능)
  blockOnSolid(stage1Button);
  boxCollision(stage1Box);
  boxCollision(stage1Box2);
  // 점프 블록은 모든 도형에 솔리드 — 착지 시 onGround 회복돼 연속 점프로 올라갈 수 있음
  for (let jb of stage1JumpBlocks) blockOnSolid(jb);

  // 피날레 지형 기믹 — 컨베이어 벨트(흐름보다 빠른 원만 거슬러 통과) → 균열 바닥(사각형 내리찍기로 파괴)
  for (let belt of stage1Belts) updateConveyor(belt);
  for (let b of stage1Brittles) updateBrittleFloor(b);

  for (let w of stage1Walls) blockOnSolid(w);
  blockOnDoor(stage1Door);
  buttonFunction();

  // 풍선 관문 — 삼각형이면 터뜨리고(interaction.js), 그 외 도형은 벽처럼 막힘
  for (let b of stage1Balloons) handleBalloonInteraction(b);
  // 이펙트(Stage 2와 공유 큐) 갱신 — 풍선 폭발 · 균열 바닥 붕괴 파편
  updateBalloonPops();
  updateCrumbleDebris();

  // 가시 구덩이 — 닿으면 실패
  checkSpikeCollision();
}

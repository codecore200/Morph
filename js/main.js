// 전역 상태 · setup · draw · 입력 디스패처

let gameState = STATE.TITLE;
let currentStage = 1;

// draw()에서 계산한 균등 스케일·오프셋 — gameMX/gameMY가 참조
let _gs = 1, _gox = 0, _goy = 0;

let player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  shape: "circle",
  mass: 0,
  friction: 0,
  jumpForce: 0,
  moveSpeed: 0,
  size: 0,
  onGround: false,
  morphFromShape: null,
  morphStartTime: 0,
  cooldownEndTime: 0,
};


/**
 * @function setup
 * 캔버스 생성, 리소스 로드, 전역 초기화
 */
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");
  setShapeStats(player.shape);
  initTitleShapes();
}

/**
 * @function draw
 * gameState별 화면 분기 호출
 */
function draw() {
  background(COLOR.bg);

  // 가로를 CANVAS_W 기준으로 스케일 → 세로는 창 높이를 자동으로 꽉 채움
  // GROUND_Y는 각 스테이지 초기화 때 computeGroundY()로 결정하므로 여기선 스케일만 계산
  _gs  = width / CANVAS_W;
  _gox = 0;
  _goy = 0;

  push();
  scale(_gs);

  if (gameState === STATE.TITLE) {
    updateTitleShapes();
    drawTitleScreen();
  } else if (gameState === STATE.STAGE_SELECT) {
    drawStageSelect();
  } else if (gameState === STATE.PLAYING) {
    // 클리어 이펙트 재생 중에는 물리/입력/스테이지 업데이트를 멈춰 픽업 순간을 고정
    if (!clearEffect.active) {
      handleMoveInput();
      applyGravity();
      updatePlayerPhysics();
      updateCurrentStage();
    }

    // 렌더링은 이펙트 중에도 계속 (정지 화면 위에 파티클이 튐)
    drawCurrentStage();
    drawPlayer();

    // 클리어 이펙트 갱신·렌더 (활성 시에만 동작)
    updateClearEffect();
    drawClearEffect();

    // HUD
    timeAndStar();
    headerUI();

    // 클리어 · 실패 판정 (이펙트 중에는 실패 트리거 방지)
    if (!clearEffect.active) {
      clearCondition();
      failCondition();
    }
  } else if (gameState === STATE.CLEAR) {
    // 클리어 화면 뒤에 정지된 스테이지 배경 잠시 노출
    drawCurrentStage();
    drawPlayer();
    headerUI();
    showClearWindow();
  } else if (gameState === STATE.FAIL) {
    drawCurrentStage();
    headerUI();
    failScreen();
  }

  pop();
}

/**
 * @function updateCurrentStage
 * 현재 스테이지의 매 프레임 물리·상호작용 업데이트로 분기
 */
function updateCurrentStage() {
  if (currentStage === 1) updateStage1();
  else updateStage2();
}

/**
 * @function drawCurrentStage
 * 현재 스테이지의 지형·오브젝트 렌더링으로 분기
 */
function drawCurrentStage() {
  if (currentStage === 1) drawStage1();
  else drawStage2();
}

/**
 * @function handleMoveInput
 * 좌우 키 폴링 → player.vx 갱신 (keyIsDown으로 실시간 조회)
 */
function handleMoveInput() {
  let speed = getMoveSpeed(player.shape);
  if (keyIsDown(LEFT_ARROW)) player.vx = -speed;
  if (keyIsDown(RIGHT_ARROW)) player.vx = speed;
}

/**
 * @function keyPressed
 * 도형 변환(Q/W/E) · 점프(SPACE/↑) · 풀스크린(F) 디스패치
 * keyCode 기준이라 한글 입력기 켜져 있어도 동작
 */
function keyPressed() {
  // Q=81, W=87, E=69, F=70 (물리 키 위치)
  if (gameState === STATE.PLAYING) {
    if (keyCode === 81) changeShape("circle");
    else if (keyCode === 87) changeShape("square");
    else if (keyCode === 69) changeShape("triangle");

    // 점프: SPACE 또는 ↑
    if ((keyCode === 32 || keyCode === UP_ARROW) && player.onGround) {
      player.vy = -getJumpForce(player.shape);
      player.onGround = false;
    }
  }
  if (keyCode === 70) toggleFullscreen();
  // M=77: BGM 음소거 토글 (게임 상태와 무관하게 항상 동작)
  if (keyCode === 77) toggleMute();
  // 스페이스 기본 스크롤 방지
  if (keyCode === 32) return false;
}

/**
 * @function mousePressed
 * gameState 보고 화면별 클릭 핸들러로 라우팅 (단일 디스패처)
 */
function mousePressed() {
  // 최초 클릭(타이틀 START 등)을 사용자 입력으로 삼아 BGM 시작.
  // 이후 호출은 멱등하므로 음악이 끊기지 않고 모든 화면에서 계속 흐른다.
  playBGM("ui");
  if (gameState === STATE.TITLE) titleScreenClick();
  else if (gameState === STATE.STAGE_SELECT) stageSelectClick();
  else if (gameState === STATE.CLEAR) clearScreenClick();
  else if (gameState === STATE.FAIL) failScreenClick();
}

/**
 * @function toggleFullscreen
 * p5.js fullscreen 토글
 */
function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
}

/**
 * @function computeGroundY
 * 현재 창 크기 기준으로 바닥 y 좌표를 계산 — 스케일 후 게임 세로 공간의 하단 60px 위
 */
function computeGroundY() {
  return floor(windowHeight * CANVAS_W / windowWidth) - 60;
}

/**
 * @function windowResized
 * 브라우저 창 크기 변경 시 캔버스를 맞추고 현재 스테이지를 재초기화
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameState === STATE.PLAYING) {
    moveToStage(currentStage);
  }
}

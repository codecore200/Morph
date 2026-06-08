// 전역 상태 · setup · draw · 입력 디스패처

let gameState = STATE.TITLE;
let currentStage = 1;

// draw()에서 계산한 균등 스케일·오프셋 — gameMX/gameMY가 참조
let _gs = 1, _gox = 0, _goy = 0;

// 사이드스크롤 카메라 — 플레이어를 화면 중앙 부근에 두고 좌우로 따라가며,
// 레벨(CANVAS_W) 양 끝에서는 더 이상 스크롤되지 않도록 고정한다.
let cameraX = 0;

// 일시정지 상태 — gmillis()가 이 값들을 참조해 정지 시간을 게임 타이머에서 제외한다.
let isPaused = false;
let pausedAccum = 0;
let pauseStartedAt = 0;

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

  // 가로를 VIEWPORT_W(고정 화면 폭) 기준으로 스케일 → 세로는 창 높이를 자동으로 꽉 채움
  // GROUND_Y는 각 스테이지 초기화 때 computeGroundY()로 결정하므로 여기선 스케일만 계산
  _gs  = width / VIEWPORT_W;
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
    // 클리어 이펙트 재생 중이거나 일시정지 중에는 물리/입력/스테이지 업데이트를 멈춤
    if (!clearEffect.active && !isPaused) {
      handleMoveInput();
      applyGravity();
      updatePlayerPhysics();
      updateCurrentStage();
    }
    updateCamera();

    // 월드(레벨) 렌더링은 카메라만큼 좌우로 이동 — 렌더링은 정지 중에도 계속(고정 화면 표시)
    push();
    translate(-cameraX, 0);
    drawCurrentStage();
    drawPlayer();

    // 클리어 이펙트 갱신·렌더 (활성 시에만, 일시정지 중에는 갱신 멈춤)
    if (!isPaused) updateClearEffect();
    drawClearEffect();
    pop();

    // HUD는 카메라와 무관하게 화면에 고정
    timeAndStar();
    headerUI();

    // 클리어 · 실패 판정 (이펙트 · 일시정지 중에는 트리거 방지)
    if (!clearEffect.active && !isPaused) {
      clearCondition();
      failCondition();
    }

    if (isPaused) drawPauseOverlay();
  } else if (gameState === STATE.CLEAR) {
    // 클리어 화면 뒤에 정지된 스테이지 배경 잠시 노출
    push();
    translate(-cameraX, 0);
    drawCurrentStage();
    drawPlayer();
    pop();
    headerUI();
    showClearWindow();
  } else if (gameState === STATE.FAIL) {
    push();
    translate(-cameraX, 0);
    drawCurrentStage();
    pop();
    headerUI();
    failScreen();
  }

  pop();
}

/**
 * @function updateCamera
 * 플레이어를 화면 중앙 부근에 두도록 cameraX를 갱신.
 * 레벨 양 끝(0 ~ CANVAS_W - VIEWPORT_W)을 벗어나지 않도록 고정한다.
 */
function updateCamera() {
  let maxCameraX = max(0, CANVAS_W - VIEWPORT_W);
  cameraX = constrain(player.x - VIEWPORT_W / 2, 0, maxCameraX);
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
    // 일시정지 토글: P 또는 ESC (클리어 이펙트 재생 중에는 차단해 픽업 연출을 보존)
    if ((keyCode === 80 || keyCode === ESCAPE) && !clearEffect.active) {
      togglePause();
      return false;
    }

    if (!isPaused) {
      if (keyCode === 81) changeShape("circle");
      else if (keyCode === 87) changeShape("square");
      else if (keyCode === 69) changeShape("triangle");

      // 점프: SPACE 또는 ↑
      if ((keyCode === 32 || keyCode === UP_ARROW) && player.onGround) {
        player.vy = -getJumpForce(player.shape);
        player.onGround = false;
      }
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
  // BGM은 setGameState가 스테이지 진입/이탈에 맞춰 자동으로 재생·정지하므로
  // 여기서 별도로 시작시키지 않는다(타이틀 등에서는 음악이 흐르지 않아야 함).
  if (gameState === STATE.TITLE) titleScreenClick();
  else if (gameState === STATE.STAGE_SELECT) stageSelectClick();
  else if (gameState === STATE.CLEAR) clearScreenClick();
  else if (gameState === STATE.FAIL) failScreenClick();
}

/**
 * @function togglePause
 * 일시정지 on/off 전환. 정지 동안 흐른 실제 시간을 pausedAccum에 누적해
 * gmillis() 기반 게임 타이머(스테이지 시간 · 모핑 쿨다운 · 이펙트 등)가 어긋나지 않도록 한다.
 */
function togglePause() {
  if (isPaused) {
    pausedAccum += millis() - pauseStartedAt;
    pauseStartedAt = 0;
    isPaused = false;
  } else {
    pauseStartedAt = millis();
    isPaused = true;
  }
}

/**
 * @function drawPauseOverlay
 * 일시정지 중 화면에 어두운 오버레이 + 안내 문구 표시
 */
function drawPauseOverlay() {
  let cx = VIEWPORT_W / 2;
  let cy = (height / _gs) / 2;

  noStroke();
  fill(26, 27, 46, 200);
  rect(0, 0, VIEWPORT_W, height / _gs);

  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(40);
  text("PAUSED", cx, cy - 20);

  textStyle(NORMAL);
  textSize(16);
  text("press P or ESC to resume", cx, cy + 30);
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
  return floor(windowHeight * VIEWPORT_W / windowWidth) - 60;
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

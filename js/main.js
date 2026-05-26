// 전역 상태 · setup · draw · 입력 디스패처

let gameState = STATE.TITLE;
let currentStage = 1;

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
  let cnv = createCanvas(CANVAS_W, CANVAS_H);
  cnv.parent(document.body);
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

  if (gameState === STATE.TITLE) {
    updateTitleShapes();
    drawTitleScreen();
  } else if (gameState === STATE.STAGE_SELECT) {
    drawStageSelect();
  } else if (gameState === STATE.PLAYING) {
    // 좌우 입력
    handleMoveInput();

    // 물리
    applyGravity();
    updatePlayerPhysics();

    // 스테이지별 업데이트 + 렌더링
    if (currentStage === 1) {
      updateStage1();
      drawStage1();
    } else {
      updateStage2();
      drawStage2();
    }

    // 플레이어
    drawPlayer();

    // HUD
    timeAndStar();
    headerUI();

    // 클리어 · 실패 판정
    clearCondition();
    failCondition();
  } else if (gameState === STATE.CLEAR) {
    // 클리어 화면 뒤에 정지된 스테이지 배경 잠시 노출
    if (currentStage === 1) drawStage1();
    else drawStage2();
    drawPlayer();
    headerUI();
    showClearWindow();
  } else if (gameState === STATE.FAIL) {
    if (currentStage === 1) drawStage1();
    else drawStage2();
    headerUI();
    failScreen();
  }
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
  // 스페이스 기본 스크롤 방지
  if (keyCode === 32) return false;
}

/**
 * @function mousePressed
 * gameState 보고 화면별 클릭 핸들러로 라우팅 (단일 디스패처)
 */
function mousePressed() {
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

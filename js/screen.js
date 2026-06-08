// 타이틀 · 스테이지 선택 · 클리어 · 실패 화면 UI

// 타이틀 화면 배경 도형
let titleShapes = [];
let titleStartBtn = { x: 0, y: 0, w: 200, h: 58 };

// 스테이지 선택 카드
let stageButtons = [];
let stageSelectBackBtn = { x: 20, y: 20, w: 90, h: 36 };

// 클리어/실패 화면 버튼
let clearButtons = { restart: null, next: null, quit: null };
let failButtons = { restart: null, quit: null };

/**
 * @function initTitleShapes
 * 타이틀 배경에서 부유할 도형 8개 초기화
 */
function initTitleShapes() {
  titleShapes = [];
  let shapes = ["circle", "square", "triangle"];
  for (let i = 0; i < 8; i++) {
    titleShapes.push({
      shape: shapes[i % 3],
      x: random(VIEWPORT_W),
      y: random(CANVAS_H),
      size: random(40, 80),
      vx: random(-0.4, 0.4),
      vy: random(-0.3, 0.3),
      rot: random(TWO_PI),
      vrot: random(-0.01, 0.01),
    });
  }
}

/**
 * @function updateTitleShapes
 * 타이틀 배경 도형 부유 · 회전 애니메이션
 */
function updateTitleShapes() {
  for (let s of titleShapes) {
    s.x += s.vx;
    s.y += s.vy;
    s.rot += s.vrot;
    if (s.x < -50) s.x = VIEWPORT_W + 50;
    if (s.x > VIEWPORT_W + 50) s.x = -50;
    if (s.y < -50) s.y = CANVAS_H + 50;
    if (s.y > CANVAS_H + 50) s.y = -50;
  }
}

/**
 * @function drawTitleScreen
 * 타이틀 화면 전체 렌더링 (배경 도형 · 타이틀 · ○△□ · Start 버튼)
 */
function drawTitleScreen() {
  // 배경 도형
  for (let s of titleShapes) {
    push();
    translate(s.x, s.y);
    rotate(s.rot);
    noFill();
    stroke(COLOR[s.shape]);
    strokeWeight(1.5);
    drawingContext.globalAlpha = 0.4;
    drawShapeOutline(s.shape, s.size);
    drawingContext.globalAlpha = 1;
    pop();
  }

  let cx = VIEWPORT_W / 2;
  let cy = CANVAS_H / 2;

  // 타이틀
  noStroke();
  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(88);
  text("MORPH", cx, cy);

  // 세 도형 라인 — 1600px 너비에서 간격을 넓혀 균형 있게 배치
  let gap = 90;
  push();
  translate(cx - gap, cy + 75);
  noStroke();
  fill(COLOR.circle);
  drawShapeOutline("circle", 44);
  pop();
  push();
  translate(cx, cy + 75);
  noStroke();
  fill(COLOR.square);
  drawShapeOutline("square", 44);
  pop();
  push();
  translate(cx + gap, cy + 75);
  noStroke();
  fill(COLOR.triangle);
  drawShapeOutline("triangle", 44);
  pop();

  // 부제
  fill(COLOR.uiText);
  textStyle(NORMAL);
  textSize(15);
  text("형태 변환 퍼즐 플랫포머", cx, cy + 120);

  // Start 버튼
  titleStartBtn.x = cx - titleStartBtn.w / 2;
  titleStartBtn.y = cy + 148;
  let hover = isPointInRect(gameMX(), gameMY(), titleStartBtn);
  fill(hover ? COLOR.uiBtnHover : COLOR.uiBtn);
  stroke(COLOR.clear);
  strokeWeight(2);
  rect(titleStartBtn.x, titleStartBtn.y, titleStartBtn.w, titleStartBtn.h, 8);
  noStroke();
  fill(COLOR.uiText);
  textStyle(BOLD);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("START", cx, titleStartBtn.y + titleStartBtn.h / 2);

  // 사용법
  textStyle(NORMAL);
  textSize(12);
  fill(COLOR.uiText);
  let helpY = titleStartBtn.y + titleStartBtn.h + 24;
  text("← / → : 이동    SPACE / ↑ : 점프    F : 풀스크린    M : 음소거", cx, helpY);
  fill(COLOR.circle);
  text("Q : 원", cx - 120, helpY + 18);
  fill(COLOR.square);
  text("W : 사각형", cx, helpY + 18);
  fill(COLOR.triangle);
  text("E : 삼각형", cx + 120, helpY + 18);

  // 제작자
  textStyle(NORMAL);
  textSize(11);
  fill(COLOR.uiBtnHover);
  textAlign(CENTER, BOTTOM);
  text("Made by 신동빈 · 장현우 · 황세혁    |    14조", cx, CANVAS_H + 50);
}

/**
 * @function titleScreenClick
 * Start 버튼 클릭 영역 판정 → STAGE_SELECT 전환
 */
function titleScreenClick() {
  if (isPointInRect(gameMX(), gameMY(), titleStartBtn)) {
    setGameState(STATE.STAGE_SELECT);
  }
}

/**
 * @function drawStageSelect
 * 스테이지 선택 화면 렌더링
 */
function drawStageSelect() {
  let cx = VIEWPORT_W / 2;

  // 타이틀
  noStroke();
  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(40);
  text("STAGE SELECT", cx, 90);

  fill(COLOR.uiBtnHover);
  textSize(14);
  textStyle(NORMAL);
  text("플레이할 스테이지를 선택하세요", cx, 130);

  // 스테이지 데이터
  let stageData = [
    {
      num: 1,
      title: "Stage 1",
      desc: "상자와 버튼 퍼즐",
      color: COLOR.square,
    },
    {
      num: 2,
      title: "Stage 2",
      desc: "풍선과 경사 퍼즐",
      color: COLOR.triangle,
    },
  ];

  stageButtons = [];
  let cardW = 220;
  let cardH = 240;
  let gap = 60;
  let totalW = stageData.length * cardW + (stageData.length - 1) * gap;
  let startX = cx - totalW / 2;
  let cardY = (CANVAS_H - cardH) / 2 + 10;

  for (let i = 0; i < stageData.length; i++) {
    let s = stageData[i];
    let x = startX + i * (cardW + gap);
    let rect_ = { x: x, y: cardY, w: cardW, h: cardH, stageNum: s.num };
    stageButtons.push(rect_);

    let hover = isPointInRect(gameMX(), gameMY(), rect_);

    // 카드
    fill(hover ? COLOR.uiBtnHover : COLOR.uiBtn);
    stroke(s.color);
    strokeWeight(hover ? 3 : 1.5);
    rect(x, cardY, cardW, cardH, 18);

    // 번호
    noStroke();
    fill(s.color);
    textSize(52);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(s.num, x + cardW / 2, cardY + 70);

    // 제목
    fill(COLOR.uiText);
    textSize(20);
    text(s.title, x + cardW / 2, cardY + 130);

    // 설명
    fill(COLOR.uiBtnHover);
    textSize(13);
    textStyle(NORMAL);
    text(s.desc, x + cardW / 2, cardY + 170);

    // 진입 안내
    fill(s.color);
    textSize(12);
    text("CLICK TO START", x + cardW / 2, cardY + 215);

    // 클리어 기록 배지 (localStorage에 저장된 최고 별점 표시)
    let record = getStageClear(s.num);
    if (record) {
      let badgeText = "CLEAR  ";
      for (let i = 0; i < record.stars; i++) badgeText += "★";
      for (let i = record.stars; i < 3; i++) badgeText += "☆";
      noStroke();
      fill(COLOR.clear);
      textSize(13);
      textStyle(BOLD);
      text(badgeText, x + cardW / 2, cardY + 24);
    }
  }

  // 좌상단: 타이틀로 돌아가기 버튼
  let hoverBack = isPointInRect(gameMX(), gameMY(), stageSelectBackBtn);
  fill(hoverBack ? COLOR.uiBtnHover : COLOR.uiBtn);
  stroke(COLOR.uiText);
  strokeWeight(1.5);
  rect(
    stageSelectBackBtn.x,
    stageSelectBackBtn.y,
    stageSelectBackBtn.w,
    stageSelectBackBtn.h,
    8
  );
  noStroke();
  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(13);
  text(
    "HOME",
    stageSelectBackBtn.x + stageSelectBackBtn.w / 2,
    stageSelectBackBtn.y + stageSelectBackBtn.h / 2
  );
}

/**
 * @function stageSelectClick
 * 스테이지 선택 화면에서 카드 / 타이틀 복귀 버튼 클릭 판정
 */
function stageSelectClick() {
  if (isPointInRect(gameMX(), gameMY(), stageSelectBackBtn)) {
    setGameState(STATE.TITLE);
    return;
  }
  for (let b of stageButtons) {
    if (isPointInRect(gameMX(), gameMY(), b)) {
      moveToStage(b.stageNum);
      return;
    }
  }
}

/**
 * @function moveToStage
 * 해당 스테이지로 화면 전환 + 초기화 호출
 */
function moveToStage(stageNumber) {
  currentStage = stageNumber;
  resetClearEffect();
  // 일시정지 상태/누적시간 초기화 — 새 스테이지는 항상 정지 없이 시작
  isPaused = false;
  pausedAccum = 0;
  pauseStartedAt = 0;
  if (stageNumber === 1) {
    initialStage1();
  } else if (stageNumber === 2) {
    initialStage2();
  }
  setGameState(STATE.PLAYING); // BGM 재생도 setGameState 내부에서 함께 시작된다
}

/**
 * @function showClearWindow
 * CLEAR 결과 UI (점수 · 별점 · RESTART/NEXT/QUIT 버튼)
 */
function showClearWindow() {
  let cx = VIEWPORT_W / 2;
  let cy = height / _gs / 2;

  // 어두운 오버레이
  noStroke();
  fill(26, 27, 46, 200);
  rect(0, 0, VIEWPORT_W, height / _gs);

  // 패널
  let pw = 460;
  let ph = 280;
  let px = cx - pw / 2;
  let py = cy - ph / 2;
  fill(COLOR.bg);
  stroke(COLOR.clear);
  strokeWeight(3);
  rect(px, py, pw, ph, 16);

  // 제목
  noStroke();
  fill(COLOR.clear);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(40);
  text("STAGE CLEAR!", cx, py + 50);

  // 시간 표시
  fill(COLOR.uiText);
  textSize(16);
  textStyle(NORMAL);
  let elapsed = getCurrentElapsed();
  let mm = nf(floor(elapsed / 60), 2);
  let ss = nf(elapsed % 60, 2);
  text("TIME  " + mm + ":" + ss, cx, py + 95);

  // 별
  let stars = getCurrentStars();
  textSize(40);
  fill(COLOR.clear);
  let starsText = "";
  for (let i = 0; i < stars; i++) starsText += "★ ";
  for (let i = stars; i < 3; i++) starsText += "☆ ";
  text(starsText.trim(), cx, py + 145);

  // 버튼
  let bw = 110;
  let bh = 42;
  let by = py + ph - 60;
  clearButtons.restart = { x: cx - bw * 1.6, y: by, w: bw, h: bh };
  clearButtons.next    = { x: cx - bw / 2,   y: by, w: bw, h: bh };
  clearButtons.quit    = { x: cx + bw * 0.6,  y: by, w: bw, h: bh };

  drawScreenButton(clearButtons.restart, "RESTART", COLOR.square);
  let isLast = currentStage >= LAST_STAGE;
  drawScreenButton(
    clearButtons.next,
    isLast ? "FINISH" : "NEXT",
    isLast ? COLOR.uiBtnHover : COLOR.clear
  );
  drawScreenButton(clearButtons.quit, "QUIT", COLOR.triangle);
}

/**
 * @function drawScreenButton
 * 공통 화면 버튼 그리기
 */
function drawScreenButton(btn, label, accent) {
  let hover = isPointInRect(gameMX(), gameMY(), btn);
  noStroke();
  fill(hover ? COLOR.uiBtnHover : COLOR.uiBtn);
  stroke(accent);
  strokeWeight(2);
  rect(btn.x, btn.y, btn.w, btn.h, 8);
  noStroke();
  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(15);
  text(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

/**
 * @function clearScreenClick
 * 클리어 화면 버튼 클릭 라우팅
 */
function clearScreenClick() {
  if (clearButtons.restart && isPointInRect(gameMX(), gameMY(), clearButtons.restart)) {
    onRestartButtonClick();
  } else if (clearButtons.next && isPointInRect(gameMX(), gameMY(), clearButtons.next)) {
    onNextStageButtonClick();
  } else if (clearButtons.quit && isPointInRect(gameMX(), gameMY(), clearButtons.quit)) {
    onQuitButtonClick();
  }
}

/**
 * @function onRestartButtonClick
 * 현재 스테이지 재로드
 */
function onRestartButtonClick() {
  moveToStage(currentStage);
}

/**
 * @function onNextStageButtonClick
 * 다음 스테이지 로드 (마지막이면 선택 화면)
 */
function onNextStageButtonClick() {
  if (currentStage >= LAST_STAGE) {
    setGameState(STATE.STAGE_SELECT);
  } else {
    moveToStage(currentStage + 1);
  }
}

/**
 * @function onQuitButtonClick
 * 스테이지 종료 → 선택 화면 복귀
 */
function onQuitButtonClick() {
  setGameState(STATE.STAGE_SELECT);
}

/**
 * @function failScreen
 * FAIL 팝업 + RESTART/QUIT 버튼 렌더링
 */
function failScreen() {
  let cx = VIEWPORT_W / 2;
  let cy = height / _gs / 2;

  // 오버레이
  noStroke();
  fill(26, 27, 46, 200);
  rect(0, 0, VIEWPORT_W, height / _gs);

  // 패널
  let pw = 420;
  let ph = 220;
  let px = cx - pw / 2;
  let py = cy - ph / 2;
  fill(COLOR.bg);
  stroke(COLOR.spike);
  strokeWeight(3);
  rect(px, py, pw, ph, 16);

  // 제목
  noStroke();
  fill(COLOR.spike);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(44);
  text("FAIL", cx, py + 60);

  // 안내
  fill(COLOR.uiText);
  textStyle(NORMAL);
  textSize(14);
  text("다시 도전해 보세요!", cx, py + 110);

  // 버튼
  let bw = 130;
  let bh = 44;
  let by = py + ph - 65;
  failButtons.restart = { x: cx - bw - 10, y: by, w: bw, h: bh };
  failButtons.quit    = { x: cx + 10,       y: by, w: bw, h: bh };
  drawScreenButton(failButtons.restart, "RESTART", COLOR.square);
  drawScreenButton(failButtons.quit, "QUIT", COLOR.triangle);
}

/**
 * @function failScreenClick
 * FAIL 화면 RESTART/QUIT 클릭 판정
 */
function failScreenClick() {
  if (failButtons.restart && isPointInRect(gameMX(), gameMY(), failButtons.restart)) {
    onRestartButtonClick();
  } else if (failButtons.quit && isPointInRect(gameMX(), gameMY(), failButtons.quit)) {
    onQuitButtonClick();
  }
}

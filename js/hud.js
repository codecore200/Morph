// 시간 · 별 · 상단 UI

/**
 * @function timeAndStar
 * 진행 시간 실시간 측정 + 10초당 별 1개 감산
 */
function timeAndStar() {
  if (gameState !== STATE.PLAYING) return;
  // 클리어 이펙트 재생 동안에는 픽업 시점 시간/별을 고정
  if (clearEffect.active) return;
  if (currentStage === 1) {
    stage1ElapsedTime = floor((millis() - stage1StartTime) / 1000);
    let lost = floor(stage1ElapsedTime / STAR_INTERVAL_SEC);
    stage1Stars = max(1, 3 - lost);
  } else if (currentStage === 2) {
    stage2ElapsedTime = floor((millis() - stage2StartTime) / 1000);
    let lost = floor(stage2ElapsedTime / STAR_INTERVAL_SEC);
    stage2Stars = max(1, 3 - lost);
  }
}

/**
 * @function getCurrentStars
 * 현재 스테이지의 별 개수 반환
 */
function getCurrentStars() {
  return currentStage === 1 ? stage1Stars : stage2Stars;
}

/**
 * @function getCurrentElapsed
 * 현재 스테이지 진행 시간(초) 반환
 */
function getCurrentElapsed() {
  return currentStage === 1 ? stage1ElapsedTime : stage2ElapsedTime;
}

/**
 * @function headerUI
 * 상단 UI 바 + 시간/별 시각화 + 변신 쿨다운 게이지
 */
function headerUI() {
  push();
  // 배경
  noStroke();
  fill(COLOR.terrain);
  rect(0, 0, VIEWPORT_W, 50);
  fill(COLOR.terrainHi);
  rect(0, 50, VIEWPORT_W, 2);

  // 좌측: 스테이지 + 시간
  fill(COLOR.uiText);
  textAlign(LEFT, CENTER);
  textSize(15);
  textStyle(NORMAL);
  let elapsed = getCurrentElapsed();
  let mm = nf(floor(elapsed / 60), 2);
  let ss = nf(elapsed % 60, 2);
  let bgmLabel = isBGMMuted() ? "BGM OFF" : "BGM ON";
  text(
    "STAGE " + currentStage + "   |   TIME " + mm + ":" + ss + "   |   " + bgmLabel,
    20,
    25
  );

  // 중앙: 변신 쿨다운 게이지
  let cdRemain = max(0, player.cooldownEndTime - millis());
  let cdRatio = 1 - cdRemain / MORPH_COOLDOWN_MS;
  let barW = 160;
  let barH = 8;
  let barX = VIEWPORT_W / 2 - barW / 2;
  let barY = 21;
  fill(COLOR.bgFar);
  rect(barX, barY, barW, barH, 4);
  fill(cdRatio >= 1 ? COLOR.clear : COLOR[player.shape]);
  rect(barX, barY, barW * cdRatio, barH, 4);
  fill(COLOR.uiText);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("MORPH", VIEWPORT_W / 2, barY - 6);

  // 우측: 별 개수
  let stars = getCurrentStars();
  textAlign(RIGHT, CENTER);
  textSize(15);
  fill(COLOR.clear);
  let starsText = "";
  for (let i = 0; i < stars; i++) starsText += "★";
  for (let i = stars; i < 3; i++) starsText += "☆";
  text("STARS " + starsText, VIEWPORT_W - 20, 25);
  pop();
}

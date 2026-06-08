// 클리어 / 실패 판정

// 클리어 아이템 획득 시 재생되는 파티클 이펙트 상태
let clearEffect = {
  active: false,
  particles: [],
  startAt: 0,
  pendingClearAt: 0,
  x: 0,
  y: 0,
};
const CLEAR_EFFECT_DURATION_MS = 700;

/**
 * @function checkClearItemCollision
 * player-클리어 아이템 충돌 여부 boolean 반환 (이미 획득된 아이템은 제외)
 */
function checkClearItemCollision(clearItem) {
  if (!clearItem) return false;
  if (clearItem.collected) return false;
  return isColliding(getPlayerBounds(), clearItem);
}

/**
 * @function triggerStageClear
 * 클리어 처리 (시간 정지, CLEAR 상태로 전환)
 */
function triggerStageClear() {
  saveStageClear(currentStage, getCurrentStars());
  setGameState(STATE.CLEAR);
}

/**
 * @function clearCondition
 * 현재 스테이지의 클리어 아이템 충돌 검사 → 통과 시 이펙트 발동
 */
function clearCondition() {
  if (clearEffect.active) return;
  let item = currentStage === 1 ? stage1ClearItem : stage2ClearItem;
  if (checkClearItemCollision(item)) {
    item.collected = true;
    spawnClearEffect(item);
    playBGM("clearItem");
  }
}

/**
 * @function spawnClearEffect
 * 클리어 아이템 위치에서 파티클 폭발 + CLEAR 전환 딜레이 예약
 */
function spawnClearEffect(item) {
  let cx = item.x + item.w / 2;
  let cy = item.y + item.h / 2;
  clearEffect.active = true;
  clearEffect.x = cx;
  clearEffect.y = cy;
  clearEffect.particles = [];
  clearEffect.startAt = gmillis();
  clearEffect.pendingClearAt = clearEffect.startAt + CLEAR_EFFECT_DURATION_MS;

  let count = 28;
  for (let i = 0; i < count; i++) {
    let a = (TWO_PI * i) / count + random(-0.18, 0.18);
    let sp = random(3.5, 7.5);
    clearEffect.particles.push({
      x: cx,
      y: cy,
      vx: cos(a) * sp,
      vy: sin(a) * sp - 1.8,
      size: random(4, 9),
      rot: random(TWO_PI),
      vrot: random(-0.25, 0.25),
      life: 1,
      decay: random(0.014, 0.024),
      isStar: i % 5 === 0,
    });
  }
}

/**
 * @function updateClearEffect
 * 파티클 물리 갱신 + 딜레이 종료 시 CLEAR 상태 전환
 */
function updateClearEffect() {
  if (!clearEffect.active) return;

  for (let p of clearEffect.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.22;
    p.vx *= 0.985;
    p.rot += p.vrot;
    p.life -= p.decay;
  }
  clearEffect.particles = clearEffect.particles.filter((p) => p.life > 0);

  if (gmillis() >= clearEffect.pendingClearAt) {
    triggerStageClear();
  }
}

/**
 * @function drawClearEffect
 * 중심 링 플래시 + 파편 파티클 렌더링
 */
function drawClearEffect() {
  if (!clearEffect.active) return;

  let elapsed = gmillis() - clearEffect.startAt;

  // 초기 0~350ms 확장 링 플래시
  let ringT = constrain(elapsed / 350, 0, 1);
  if (ringT < 1) {
    push();
    noFill();
    stroke(COLOR.clear);
    strokeWeight(3 * (1 - ringT) + 0.5);
    drawingContext.globalAlpha = 1 - ringT;
    ellipse(clearEffect.x, clearEffect.y, 50 + ringT * 140);
    drawingContext.globalAlpha = 1;
    pop();
  }

  // 파티클
  for (let p of clearEffect.particles) {
    push();
    translate(p.x, p.y);
    rotate(p.rot);
    noStroke();
    drawingContext.globalAlpha = max(0, min(1, p.life));
    if (p.isStar) {
      fill(COLOR.uiText);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(p.size + 6);
      text("★", 0, 1);
    } else {
      fill(COLOR.clear);
      rect(-p.size / 2, -p.size / 2, p.size, p.size, 1);
    }
    drawingContext.globalAlpha = 1;
    pop();
  }
}

/**
 * @function resetClearEffect
 * 스테이지 재시작/이동 시 이펙트 상태 초기화
 */
function resetClearEffect() {
  clearEffect.active = false;
  clearEffect.particles = [];
  clearEffect.startAt = 0;
  clearEffect.pendingClearAt = 0;
}

/**
 * @function failCondition
 * 추락 · 화면 밖 감지 시 FAIL 상태 전환
 */
function failCondition() {
  if (player.y > GROUND_Y + 200) {
    setGameState(STATE.FAIL);
  }
}

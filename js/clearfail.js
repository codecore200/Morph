// 클리어 / 실패 판정

/**
 * @function checkClearItemCollision
 * player-클리어 아이템 충돌 여부 boolean 반환
 */
function checkClearItemCollision(clearItem) {
  if (!clearItem) return false;
  return isColliding(getPlayerBounds(), clearItem);
}

/**
 * @function triggerStageClear
 * 클리어 처리 (시간 정지, CLEAR 상태로 전환)
 */
function triggerStageClear() {
  setGameState(STATE.CLEAR);
}

/**
 * @function clearCondition
 * 현재 스테이지의 클리어 아이템 충돌 검사 → 통과 시 triggerStageClear 호출
 */
function clearCondition() {
  let item = currentStage === 1 ? stage1ClearItem : stage2ClearItem;
  if (checkClearItemCollision(item)) {
    triggerStageClear();
  }
}

/**
 * @function failCondition
 * 추락 · 화면 밖 감지 시 FAIL 상태 전환
 */
function failCondition() {
  if (player.y > height + 100) {
    setGameState(STATE.FAIL);
  }
}

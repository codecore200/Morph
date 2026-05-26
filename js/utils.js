// 공통 유틸: 충돌 판정 · 점 영역 판정 · 게임 상태 전환

/**
 * @function isColliding
 * 두 AABB 객체(x, y, w, h) 간 충돌 여부 반환
 */
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * @function isPointInRect
 * (px, py)가 rect(x, y, w, h) 영역 내부인지 판정
 */
function isPointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.w &&
    py >= rect.y &&
    py <= rect.y + rect.h
  );
}

/**
 * @function getPlayerBounds
 * 플레이어 중심좌표 기반으로 AABB(x, y, w, h) 변환
 */
function getPlayerBounds() {
  let s = player.size || 30;
  return {
    x: player.x - s / 2,
    y: player.y - s / 2,
    w: s,
    h: s,
  };
}

/**
 * @function setGameState
 * gameState 변경 + 화면 전환 부수 효과 처리
 */
function setGameState(newState) {
  gameState = newState;
  if (newState === STATE.PLAYING) {
    stage1StartTime = millis();
    stage2StartTime = millis();
  }
}

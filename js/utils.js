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
 * gameState 변경 (스테이지 시작 시간은 각 initialStageX가 설정하므로 여기선 상태만 전환)
 */
function setGameState(newState) {
  gameState = newState;
}

/**
 * @function gameMX / gameMY
 * draw()의 scale 변환 때문에 실제 mouseX/mouseY는 windowWidth/windowHeight 기준.
 * 게임 좌표계(CANVAS_W x CANVAS_H)로 역변환해 UI 충돌 판정에 사용
 */
function gameMX() { return mouseX / _gs; }
function gameMY() { return mouseY / _gs; }

// localStorage에 저장되는 스테이지 클리어 기록 키
const STAGE_CLEAR_STORAGE_KEY = "morph_stage_clears";

/**
 * @function loadStageClears
 * localStorage에서 스테이지별 클리어 기록(별점)을 불러옴 — 없거나 손상 시 빈 객체 반환
 */
function loadStageClears() {
  try {
    let raw = localStorage.getItem(STAGE_CLEAR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * @function saveStageClear
 * 스테이지 클리어 시 호출 — 기존 기록보다 별점이 높을 때만 갱신해 최고 기록을 보존
 */
function saveStageClear(stageNumber, stars) {
  let clears = loadStageClears();
  let prev = clears[stageNumber];
  if (!prev || stars > prev.stars) {
    clears[stageNumber] = { stars: stars };
    localStorage.setItem(STAGE_CLEAR_STORAGE_KEY, JSON.stringify(clears));
  }
}

/**
 * @function getStageClear
 * 해당 스테이지의 클리어 기록 반환 (없으면 null)
 */
function getStageClear(stageNumber) {
  let clears = loadStageClears();
  return clears[stageNumber] || null;
}

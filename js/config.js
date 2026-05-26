// 게임 전반의 매직 넘버 · 색 팔레트 · 상태 문자열 모음

// 캔버스 크기
const CANVAS_W = 900;
const CANVAS_H = 540;

// 물리 상수
const GRAVITY = 0.6;
const FRICTION_DECAY = 0.82;
const GROUND_Y = 480;

// 모핑 관련
const MORPH_DURATION_MS = 300;
const MORPH_COOLDOWN_MS = 1000;

// 별 감산 주기 (초)
const STAR_INTERVAL_SEC = 10;

// 마지막 스테이지 번호
const LAST_STAGE = 2;

// 게임 상태 문자열
const STATE = {
  TITLE: "TITLE",
  STAGE_SELECT: "STAGE_SELECT",
  PLAYING: "PLAYING",
  CLEAR: "CLEAR",
  FAIL: "FAIL",
};

// 도형 코딩 다크 팔레트
const COLOR = {
  // 플레이어 도형
  circle: "#4ECDC4",
  square: "#FFD166",
  triangle: "#EF476F",

  // 배경 · 지형
  bg: "#1A1B2E",
  bgFar: "#252740",
  terrain: "#2E3047",
  terrainHi: "#3E4060",

  // 장애물 · 아이템
  box: "#7A7C9E",
  balloon: "#9B8CFF",
  door: "#5A5C7A",
  spike: "#FF5252",
  clear: "#06D6A0",

  // UI
  uiBtn: "#2E3047",
  uiBtnHover: "#3E4060",
  uiText: "#EDEDF2",
};

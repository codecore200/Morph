// 게임 전반의 매직 넘버 · 색 팔레트 · 상태 문자열 모음

// 캔버스 크기 — 가로를 1600으로 늘려 우측 통로에 '파도형 낙하 삼각형' 회피 구간 확보
const CANVAS_W = 1600;
const CANVAS_H = 540;

// 물리 상수
const GRAVITY = 0.6;
const FRICTION_DECAY = 0.82;
let GROUND_Y = 480; // 스테이지 초기화 시 창 높이에 맞춰 동적으로 재계산

// 모핑 관련
const MORPH_DURATION_MS = 300;
const MORPH_COOLDOWN_MS = 1000;

// 별 감산 주기 (초)
const STAR_INTERVAL_SEC = 10;

// Stage 2 떨어지는 삼각형 장애물 (파도처럼 순차 낙하 — 원으로 빠르게 통과)
const HAZARD_COUNT = 10; // 통로를 덮는 삼각형 개수
const HAZARD_WAVE_INTERVAL = 12; // 다음 삼각형이 떨어지기까지의 프레임 간격 (작을수록 빠른 폭격)
const HAZARD_DROP_SPEED = 7; // 삼각형 낙하 속도 (px/frame)
const HAZARD_SIZE = 28; // 삼각형 크기 (한 변 기준)

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

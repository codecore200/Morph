// 게임 전반의 매직 넘버 · 색 팔레트 · 상태 문자열 모음

// 화면(뷰포트) 크기 — 항상 고정. HUD·타이틀·스테이지 선택 화면은 이 너비를 기준으로 그려진다.
// 세로는 창 높이에 맞춰 자동 스케일된다.
const VIEWPORT_W = 1280;
const CANVAS_H = 540;

// 레벨(맵) 전체 가로 폭 — 스테이지마다 다르며 뷰포트보다 넓을 때 카메라가 플레이어를 따라 좌우로 스크롤된다.
// (각 initialStageX가 진입 시 CANVAS_W를 해당 스테이지 폭으로 재설정)
let CANVAS_W = 1600;
const STAGE1_CANVAS_W = 4000; // Stage 1: 상자/버튼/문·가시·디딤돌·풍선 관문 → 컨베이어 벨트(원만 역류 통과)·균열 바닥(사각형 내리찍기) 피날레까지 좌우로 길게 확장
const STAGE2_CANVAS_W = 3600; // Stage 2: 점프 패드·무너지는 발판·이동 발판 + 무게 다리·풍선 관문·펜듈럼·상승 기류 피날레까지 사이드스크롤 확장

// 물리 상수
const GRAVITY = 0.6;
const FRICTION_DECAY = 0.82;
let GROUND_Y = 480; // 스테이지 초기화 시 창 높이에 맞춰 동적으로 재계산

// 모핑 관련
const MORPH_DURATION_MS = 300;
const MORPH_COOLDOWN_MS = 1000;

// 별 감산 주기 (초) — 스테이지 난이도에 맞춰 따로 둔다.
// Stage 2는 기믹이 많고 동선이 길어 같은 기준이면 별을 너무 빨리 잃으므로 더 느슨하게.
const STAGE1_STAR_INTERVAL_SEC = 10;
const STAGE2_STAR_INTERVAL_SEC = 18;

// Stage 2 떨어지는 삼각형 장애물 (파도처럼 순차 낙하 — 원으로 빠르게 통과)
const HAZARD_COUNT = 6; // 통로를 덮는 삼각형 개수 (좁아진 비 구간에 맞춰 간격 확보)
const HAZARD_WAVE_INTERVAL = 12; // 다음 삼각형이 떨어지기까지의 프레임 간격 (작을수록 빠른 폭격)
const HAZARD_DROP_SPEED = 7; // 삼각형 낙하 속도 (px/frame)
const HAZARD_SIZE = 28; // 삼각형 크기 (한 변 기준)

// Stage 2 클라이맥스 기믹 — 문 통과 이후 입체 구간
// 점프 패드(스프링): 밟으면 위로 튕김. 실제 boost = POWER / 도형 질량 →
// 가벼운 원(0.7)이 가장 높이 솟아 넓은 갭을 넘고, 무거운 사각형(1.6)은 낮게 → 도형 선택 유도
const JUMP_PAD_POWER = 12;       // 튕김 기준 세기 (원 비행거리 ≈ 228px → 갭 170px는 원만 통과)
const JUMP_PAD_MIN_MASS = 0.7;   // boost 상한 보호용 최소 질량
// 무너지는 발판: 밟으면 흔들리다 붕괴 후 일정 시간 뒤 복구 (빠르게 통과해야 함)
const CRUMBLE_SHAKE_MS = 440;    // 밟은 뒤 붕괴까지의 유예
const CRUMBLE_RESPAWN_MS = 1600; // 붕괴 후 복구까지
// 좌우 왕복 이동 발판: 타이밍 맞춰 올라타 갭을 건넘
const MOVE_PLAT_SPEED = 0.022;   // 위상 증가 속도 (작을수록 느림)
const MOVE_PLAT_RANGE = 72;      // 좌우 진폭(px)

// Stage 2 사이드스크롤 확장 피날레 (골인 직전 추가 구간)
// 무게 다리: 무거운 도형(삼각형·사각형)이 밟으면 균열 후 붕괴 → 가벼운 원(0.7)만 안전하게 건넘.
// 모두에게 무너지는 CRUMBLE과 달리 '질량 조건부'라 도형 선택을 강제한다.
const BRIDGE_MASS_LIMIT = 0.9;   // 이 질량 초과 도형이 밟으면 붕괴 시작 (원만 통과)
const BRIDGE_CRACK_MS = 240;     // 밟은 뒤 붕괴까지의 유예 (짧게 — 즉각적 긴장)
const BRIDGE_RESPAWN_MS = 2200;  // 붕괴한 널판이 복구되기까지
// 펜듈럼 해머: 좌우로 스윙하는 가시구. 닿으면 실패 — 스윙이 비켜난 순간 타이밍 맞춰 통과.
// 진폭은 가시구가 RB4 통로 안에만 머물도록(상승 기류 침범 방지) 제한, 길이는 바닥 근처까지 내려와 선 도형을 위협.
const PENDULUM_SPEED = 0.024;    // 위상 증가 속도(스윙 빠르기)
const PENDULUM_AMP = 0.8;        // 최대 스윙 각(라디안) — 좌우 반경 ≈ sin(0.8)*LEN ≈ 122px
const PENDULUM_LEN = 170;        // 팔 길이(px) — 최하단 가시구가 GY-30 → 선 플레이어와 겹침
const PENDULUM_BOB = 26;         // 가시구 지름(px)
// 상승 기류: 가벼운 도형일수록 강하게 떠오름. 원은 솟아 높은 골인 발판에 닿고, 사각형은 못 떠 추락한다.
const UPDRAFT_POWER = 0.92;      // 프레임당 상승 가속 기준(÷도형 질량)
const UPDRAFT_RISE_MAX = 5.2;    // 상승 속도 상한(px/frame)

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

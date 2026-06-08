// 배경음악(BGM) — assets의 레트로 아케이드 트랙을 루프 재생
// p5.sound 라이브러리 없이 브라우저 표준 HTML5 Audio API로 단일 BGM을 관리한다.

// BGM 자산 경로 — 파일명에 공백/괄호가 있어 encodeURI로 안전하게 인코딩
const BGM_SRC = encodeURI("assets/mfcc-retro-arcade-game-music-297305 (1).mp3");
const BGM_VOLUME = 0.4; // 0~1, 게임 진행을 방해하지 않을 정도로 적당히 낮게

let bgmAudio = null; // HTMLAudioElement (최초 사용 시 지연 생성)
let bgmMuted = false; // 음소거 상태

/**
 * @function initBGM
 * BGM용 Audio 객체를 1회 생성하고 루프·볼륨을 설정
 */
function initBGM() {
  if (bgmAudio) return;
  bgmAudio = new Audio(BGM_SRC);
  bgmAudio.loop = true;
  bgmAudio.volume = BGM_VOLUME;
  bgmAudio.preload = "auto";
}

/**
 * @function playBGM
 * 배경음악 재생 시작. 이미 재생 중이거나 음소거 상태면 무시한다.
 * 트랙이 하나뿐이라 bgmName은 호출 흐름 식별용으로만 받는다(stage/pop/door 등).
 * 브라우저 자동재생 정책상 최초 사용자 입력 이후에 호출되어야 실제로 소리가 난다.
 */
function playBGM(bgmName) {
  initBGM();
  if (bgmMuted) return;
  if (!bgmAudio.paused) return; // 스테이지 전환 등에서도 끊기지 않고 계속 재생
  let p = bgmAudio.play();
  if (p && p.catch) {
    // 자동재생이 차단되면 조용히 무시 — 다음 사용자 입력에서 다시 시도된다
    p.catch(() => {});
  }
}

/**
 * @function stopBGM
 * 배경음악 재생을 정지(일시정지)한다. 스테이지를 벗어날 때 호출되어
 * 타이틀·스테이지 선택·클리어/실패 화면 등에서는 음악이 흐르지 않도록 한다.
 * (bgmMuted 상태는 건드리지 않으므로 다음 스테이지 진입 시 음소거 여부가 그대로 유지된다)
 */
function stopBGM() {
  if (bgmAudio) bgmAudio.pause();
}

/**
 * @function toggleMute
 * BGM 음소거 토글(M 키). 해제 시 재생을 재개한다.
 */
function toggleMute() {
  initBGM();
  bgmMuted = !bgmMuted;
  if (bgmMuted) {
    bgmAudio.pause();
  } else {
    playBGM("resume");
  }
}

/**
 * @function isBGMMuted
 * 현재 음소거 여부 반환 (HUD 표시용)
 */
function isBGMMuted() {
  return bgmMuted;
}

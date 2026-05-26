// 사운드 (현재는 placeholder — 향후 BGM/SFX 자산 추가 시 확장)

/**
 * @function playBGM
 * 스테이지 · 상황에 맞는 배경음악 재생 / 교체
 */
function playBGM(bgmName) {
  // BGM 자산이 준비되면 여기서 loadSound·loop 호출
  // 현재는 콘솔 로그만으로 호출 흐름 확인
  if (typeof console !== "undefined" && console.log) {
    console.log("[SOUND] " + bgmName);
  }
}

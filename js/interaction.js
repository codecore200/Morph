// 경사 · 풍선 · 문 상호작용 (도형 판별이 들어가는 인터랙션 모음)

/**
 * @function getSlopeSurfaceY
 * 경사면 상의 특정 x 위치 표면 y (왼쪽 높음, 오른쪽 낮음)
 */
function getSlopeSurfaceY(slope, x) {
  let t = constrain((x - slope.x) / slope.w, 0, 1);
  return slope.y + t * slope.h;
}

/**
 * @function isOnSlope
 * player가 해당 경사면 표면 위에 닿아 있는지 boolean
 */
function isOnSlope(slope) {
  if (player.x < slope.x || player.x > slope.x + slope.w) return false;
  let surfaceY = getSlopeSurfaceY(slope, player.x);
  return player.y + player.size / 2 >= surfaceY - 2;
}

/**
 * @function getSlopeAngle
 * 경사면의 기울기 각도(라디안) 반환 — slope.angle 우선, 없으면 w/h 비례
 */
function getSlopeAngle(slope) {
  if (typeof slope.angle === "number") return slope.angle;
  return atan2(slope.h, slope.w);
}

/**
 * @function rollDownSlope
 * player가 원일 때만 경사각 기반 굴림 속도(오른쪽)를 강제 유지
 */
function rollDownSlope(slopeAngle) {
  if (player.shape !== "circle") return;
  let rollSpeed = sin(abs(slopeAngle)) * 10;
  if (player.vx < rollSpeed) {
    player.vx = rollSpeed;
  }
}

/**
 * @function handleSlope
 * 원이면 표면 따라가며 가속, 그 외 도형이면 경사 표면 Y에 직접 착지
 * (blockOnSolid는 경사를 직사각형으로 취급해 표면 위에서 붕 뜨는 버그 발생)
 */
function handleSlope(slope) {
  if (player.shape === "circle") {
    if (isOnSlope(slope)) {
      let surfaceY = getSlopeSurfaceY(slope, player.x);
      player.y = surfaceY - player.size / 2;
      player.vy = 0;
      player.onGround = true;
      rollDownSlope(getSlopeAngle(slope));
    }
  } else {
    let half = player.size / 2;
    if (player.x >= slope.x && player.x <= slope.x + slope.w) {
      // 경사면 X 범위 안: 표면 Y를 직접 계산해 착지
      let surfaceY = getSlopeSurfaceY(slope, player.x);
      if (player.y + half >= surfaceY - 2) {
        player.y = surfaceY - half;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      // 경사면 X 범위 밖(왼쪽 수직벽 등): 솔리드 박스로 막음
      blockOnSolid(slope);
    }
  }
}

/**
 * @function checkBalloonCollision
 * player-풍선 충돌 여부 boolean 반환
 */
function checkBalloonCollision(balloon) {
  if (!balloon.alive) return false;
  return isColliding(getPlayerBounds(), balloon);
}

/**
 * @function popBalloon
 * 풍선 제거 + 파편 폭발 이펙트 + 사운드 트리거
 */
function popBalloon(balloon) {
  balloon.alive = false;
  balloon.poppedAt = millis();
  spawnBalloonPop(balloon.x + balloon.w / 2, balloon.y + balloon.h / 2);
  playBGM("pop");
}

/**
 * @function handleBalloonInteraction
 * 삼각형이면 풍선을 터뜨림, 그 외 도형이면 풍선이 솔리드 장애물로 길을 막음
 */
function handleBalloonInteraction(balloon) {
  if (!balloon.alive) return;
  if (!checkBalloonCollision(balloon)) return;

  if (player.shape === "triangle") {
    popBalloon(balloon);
    // 풍선 터질 때 위쪽으로 살짝 튕겨오름
    player.vy = -getJumpForce(player.shape) * 0.6;
  } else {
    // 삼각형 외 도형은 풍선을 못 뚫음 — AABB 분리로 가로/세로 모두 차단
    blockOnSolid(balloon);
  }
}

/**
 * @function checkDoorCollision
 * player-문 충돌 여부 boolean 반환
 */
function checkDoorCollision(door) {
  if (!door.isExist) return false;
  return isColliding(getPlayerBounds(), door);
}

/**
 * @function openDoor
 * 문을 열림 상태로 전환 + 애니메이션 트리거
 */
function openDoor(door) {
  door.isExist = false;
  door.openedAt = millis();
  playBGM("door");
}

/**
 * @function blockOnSolid
 * 정적 솔리드 사각형에 대해 플레이어 위치를 4면 방향으로 분리 (벽·천장·바닥)
 */
function blockOnSolid(solid) {
  let pb = getPlayerBounds();
  if (!isColliding(pb, solid)) return;

  let overlapX = min(
    pb.x + pb.w - solid.x,
    solid.x + solid.w - pb.x
  );
  let overlapY = min(
    pb.y + pb.h - solid.y,
    solid.y + solid.h - pb.y
  );

  // 측벽에 붙어 점프 상승 중(vy < 0)일 때, 솔리드 상단 모서리를 막 지나치는 순간
  // overlapY가 극소화되어 측면 충돌이 '착지'로 오판 → vy = 0 으로 점프가 강제
  // 중단되는 버그 방지. 상승 중이고 플레이어 중심이 솔리드 상단보다 위면 수평 분리.
  // (stage1.js의 boxCollision과 동일 패턴)
  let resolveAsHorizontal =
    overlapX < overlapY || (player.vy < 0 && player.y < solid.y);

  if (resolveAsHorizontal) {
    // 수평 분리
    if (player.x < solid.x + solid.w / 2) {
      player.x -= overlapX;
    } else {
      player.x += overlapX;
    }
    player.vx = 0;
  } else {
    // 수직 분리
    if (player.y < solid.y + solid.h / 2) {
      // 플레이어가 솔리드 위 (착지)
      player.y -= overlapY;
      player.vy = 0;
      player.onGround = true;
    } else {
      // 플레이어가 솔리드 아래 (머리 부딪힘)
      player.y += overlapY;
      if (player.vy < 0) player.vy = 0;
    }
  }
}

/**
 * @function blockOnDoor
 * 닫힌 문은 모든 도형에 대해 솔리드. 문은 외부 메커니즘(버튼 등)으로만 열림
 */
function blockOnDoor(door) {
  if (!door.isExist) return;
  blockOnSolid(door);
}

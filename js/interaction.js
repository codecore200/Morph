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
 * 원이면 표면 따라가며 가속, 그 외 도형이면 솔리드 박스로 막음
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
    blockOnSolid(slope);
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
 * 풍선 제거 + 터지는 효과 / 사운드 트리거
 */
function popBalloon(balloon) {
  balloon.alive = false;
  balloon.poppedAt = millis();
  playBGM("pop");
}

/**
 * @function handleBalloonInteraction
 * 충돌 AND 삼각형일 때만 popBalloon 호출
 */
function handleBalloonInteraction(balloon) {
  if (!checkBalloonCollision(balloon)) return;
  if (player.shape !== "triangle") return;
  popBalloon(balloon);
  // 풍선 터질 때 위쪽으로 살짝 튕겨오름
  player.vy = -getJumpForce(player.shape) * 0.6;
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
 * @function handleDoorInteraction
 * 충돌 AND 사각형일 때만 openDoor 호출
 */
function handleDoorInteraction(door) {
  if (!checkDoorCollision(door)) return;
  if (player.shape !== "square") return;
  openDoor(door);
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

  if (overlapX < overlapY) {
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
 * 닫힌 문은 사각형이 아닐 경우 진행을 막는 단순 솔리드 처리
 */
function blockOnDoor(door) {
  if (!door.isExist) return;
  let pb = getPlayerBounds();
  if (!isColliding(pb, door)) return;
  if (player.shape === "square") {
    handleDoorInteraction(door);
    return;
  }
  // 좌/우에서 막기
  if (player.x < door.x) {
    player.x = door.x - player.size / 2;
    player.vx = 0;
  } else {
    player.x = door.x + door.w + player.size / 2;
    player.vx = 0;
  }
}

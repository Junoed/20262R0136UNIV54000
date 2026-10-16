"use strict";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const startButton = document.getElementById("start-button");

const GROUND_Y = 220;
const DINO_X = 80;
const DINO_WIDTH = 36;
const DINO_HEIGHT = 48;
const CACTUS_WIDTH = 24;
const CACTUS_HEIGHT = 44;
const JUMP_SPEED = -650;
const GRAVITY = 1900;
const RESTART_DELAY = 400;

let state = "ready";
let dinoY = GROUND_Y; // 발바닥 좌표. 아래 방향이 양수다.
let velocityY = 0;
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 1.5;
let elapsedTime = 0;
let score = 0;
let groundOffset = 0;
let lastTimestamp = null;
let gameOverAt = 0;

function resetGame() {
  dinoY = GROUND_Y;
  velocityY = 0;
  obstacles = [];
  spawnTimer = 0;
  spawnInterval = 1.5;
  elapsedTime = 0;
  score = 0;
  groundOffset = 0;
  gameOverAt = 0;
  lastTimestamp = null;
  scoreDisplay.textContent = "0";
}

// 키보드, 게임 화면, 버튼이 모두 같은 입력 함수를 사용한다.
function startGame() {
  if (state === "gameover" && performance.now() - gameOverAt < RESTART_DELAY) {
    return;
  }

  if (state !== "running") {
    resetGame();
    state = "running";
    startButton.textContent = "진행 중";
    startButton.disabled = true;
  }

  if (dinoY === GROUND_Y && velocityY === 0) {
    velocityY = JUMP_SPEED;
  }
}

function hasCollision(obstacle) {
  const left = DINO_X + 4;
  const right = DINO_X + DINO_WIDTH - 4;
  const top = dinoY - DINO_HEIGHT + 4;
  const bottom = dinoY - 4;

  return left < obstacle.x + CACTUS_WIDTH &&
    right > obstacle.x &&
    top < GROUND_Y &&
    bottom > GROUND_Y - CACTUS_HEIGHT;
}

function update(deltaTime, timestamp) {
  elapsedTime += deltaTime;
  const speed = Math.min(320 + elapsedTime * 6, 500);

  velocityY += GRAVITY * deltaTime;
  dinoY += velocityY * deltaTime;
  if (dinoY >= GROUND_Y && velocityY >= 0) {
    dinoY = GROUND_Y;
    velocityY = 0;
  }

  for (const obstacle of obstacles) {
    obstacle.x -= speed * deltaTime;
  }
  obstacles = obstacles.filter((obstacle) => obstacle.x + CACTUS_WIDTH > 0);

  spawnTimer += deltaTime;
  if (spawnTimer >= spawnInterval) {
    spawnTimer -= spawnInterval;
    obstacles.push({ x: 920 });
    spawnInterval = 1.3 + Math.random() * 0.6;
  }

  groundOffset = (groundOffset + speed * deltaTime) % 36;
  score = Math.floor(elapsedTime * 10);
  scoreDisplay.textContent = String(score);

  if (obstacles.some(hasCollision)) {
    state = "gameover";
    gameOverAt = timestamp;
    startButton.textContent = "다시 시작";
    startButton.disabled = false;
  }
}

function drawDino() {
  const x = DINO_X;
  const y = dinoY - DINO_HEIGHT;
  context.fillStyle = "#363b3b";
  context.fillRect(x + 16, y, 20, 16); // 머리
  context.fillRect(x + 16, y + 12, 12, 18); // 목
  context.fillRect(x + 8, y + 20, 20, 16); // 몸통
  context.fillRect(x, y + 16, 8, 8); // 꼬리
  context.fillRect(x + 4, y + 24, 8, 8);
  context.fillRect(x + 26, y + 24, 8, 4); // 앞발
  context.fillRect(x + 30, y + 24, 4, 8);
  context.fillRect(x + 8, y + 34, 7, 14); // 다리
  context.fillRect(x + 8, y + 44, 11, 4);
  context.fillRect(x + 22, y + 34, 7, 14);
  context.fillRect(x + 22, y + 44, 11, 4);
  context.fillStyle = "#f7f8f8";
  context.fillRect(x + 29, y + 4, 3, 3); // 눈
  context.fillRect(x + 27, y + 12, 9, 3); // 입
}

function drawCactus(obstacle) {
  const x = obstacle.x;
  const y = GROUND_Y - CACTUS_HEIGHT;
  context.fillStyle = "#363b3b";
  context.fillRect(x + 8, y, 8, CACTUS_HEIGHT);
  context.fillRect(x, y + 12, 6, 17);
  context.fillRect(x, y + 25, 12, 6);
  context.fillRect(x + 18, y + 6, 6, 16);
  context.fillRect(x + 12, y + 18, 12, 6);
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#858d8d";
  context.fillRect(0, GROUND_Y, canvas.width, 1);
  for (let index = 0; index < 27; index += 1) {
    context.fillRect(index * 36 - groundOffset, 232 + (index % 3) * 5, 3 + (index % 2) * 2, 2);
  }

  drawDino();
  obstacles.forEach(drawCactus);

  if (state !== "running") {
    context.fillStyle = "#f7f8f8";
    context.fillRect(230, 62, 440, 90);
    context.fillStyle = "#363b3b";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 22px system-ui, sans-serif";
    context.fillText(state === "ready" ? "Space 또는 클릭으로 시작" : "게임 오버", 450, 91);
    if (state === "gameover") {
      context.font = "16px system-ui, sans-serif";
      context.fillText("Space 또는 클릭으로 다시 시작", 450, 126);
    }
  }
}

function frame(timestamp) {
  const deltaTime = lastTimestamp === null || document.hidden
    ? 0
    : Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.033);
  lastTimestamp = document.hidden ? null : timestamp;

  if (state === "running" && !document.hidden) {
    update(deltaTime, timestamp);
  }
  draw();
  requestAnimationFrame(frame);
}

document.addEventListener("keydown", (event) => {
  // Enter의 버튼 기본 동작은 유지하되 자동 반복 클릭은 막는다.
  if (event.target === startButton && event.code === "Enter" && event.repeat) {
    event.preventDefault();
    return;
  }
  if (event.code !== "Space" && event.code !== "ArrowUp") {
    return;
  }
  // 버튼에 포커스가 있어도 Space의 기본 클릭이 중복 발생하지 않게 한다.
  event.preventDefault();
  if (!event.repeat) {
    startGame();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  startGame();
});

startButton.addEventListener("click", startGame);
document.addEventListener("visibilitychange", () => {
  lastTimestamp = null;
});

requestAnimationFrame(frame);

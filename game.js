(() => {
  const canvas = document.querySelector('#snake-board');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  const size = 20;
  const cells = canvas.width / size;
  const scoreElement = document.querySelector('#score');
  const highScoreElement = document.querySelector('#high-score');
  const statusElement = document.querySelector('#game-status');
  const startButton = document.querySelector('#start-game');
  const pauseButton = document.querySelector('#pause-game');
  const restartButton = document.querySelector('#restart-game');
  let snake;
  let food;
  let enemy;
  let direction;
  let nextDirection;
  let score;
  let highScore = 0;
  let timer = null;
  let running = false;
  let gameOver = false;
  let ticks = 0;

  try { highScore = Number(localStorage.getItem('snake-high-score')) || 0; } catch (_) { /* storage is optional */ }

  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };

  const sameCell = (first, second) => first.x === second.x && first.y === second.y;
  const occupied = (cell, includeEnemy = true) => snake.some((part) => sameCell(part, cell)) || (includeEnemy && enemy && sameCell(enemy, cell));
  const randomCell = (includeEnemy = true) => {
    let cell;
    do { cell = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) }; } while (occupied(cell, includeEnemy) || (food && sameCell(cell, food)));
    return cell;
  };
  const speed = () => Math.max(72, 150 - Math.floor(score / 3) * 12);

  function updateHud(message) {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    statusElement.textContent = message;
  }

  function stop(message) {
    if (timer) clearInterval(timer);
    timer = null;
    running = false;
    gameOver = message === 'Game over';
    pauseButton.disabled = true;
    startButton.textContent = gameOver ? 'Start again' : 'Resume';
    updateHud(message);
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = setInterval(tick, speed());
  }

  function reset() {
    if (timer) clearInterval(timer);
    timer = null;
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = directions.right;
    nextDirection = directions.right;
    score = 0;
    ticks = 0;
    enemy = randomCell(false);
    food = randomCell();
    running = false;
    gameOver = false;
    pauseButton.disabled = true;
    startButton.textContent = 'Start';
    updateHud('Ready');
    draw();
  }

  function setDirection(name) {
    const candidate = directions[name];
    if (!candidate || (candidate.x === -nextDirection.x && candidate.y === -nextDirection.y)) return;
    nextDirection = candidate;
  }

  function moveEnemy() {
    const candidates = Object.values(directions)
      .map((move) => ({ x: enemy.x + move.x, y: enemy.y + move.y }))
      .filter((cell) => cell.x >= 0 && cell.x < cells && cell.y >= 0 && cell.y < cells && !snake.some((part) => sameCell(part, cell)) && !sameCell(cell, food));
    if (candidates.length) enemy = candidates[Math.floor(Math.random() * candidates.length)];
    if (snake.some((part) => sameCell(part, enemy))) stop('Game over');
  }

  function tick() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || snake.some((part) => sameCell(part, head)) || sameCell(head, enemy)) {
      stop('Game over'); draw(); return;
    }
    snake.unshift(head);
    if (sameCell(head, food)) {
      score += 1;
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem('snake-high-score', String(highScore)); } catch (_) { /* storage is optional */ }
      }
      food = randomCell();
      schedule();
    } else {
      snake.pop();
    }
    ticks += 1;
    if (ticks % Math.max(2, 5 - Math.floor(score / 4)) === 0) moveEnemy();
    if (running) updateHud(`Running · speed ${speed()}ms`);
    draw();
  }

  function drawCell(cell, color, inset = 2) {
    context.fillStyle = color;
    context.fillRect(cell.x * size + inset, cell.y * size + inset, size - inset * 2, size - inset * 2);
  }

  function draw() {
    context.fillStyle = '#040611';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(0,223,255,.16)';
    context.lineWidth = 1;
    for (let line = 0; line <= cells; line += 1) {
      context.beginPath(); context.moveTo(line * size, 0); context.lineTo(line * size, canvas.height); context.stroke();
      context.beginPath(); context.moveTo(0, line * size); context.lineTo(canvas.width, line * size); context.stroke();
    }
    drawCell(food, '#ff4abf', 5);
    drawCell(enemy, '#ffc14a', 3);
    snake.forEach((part, index) => drawCell(part, index === 0 ? '#8ff5ff' : '#11d9f3', 2));
  }

  function start() {
    if (gameOver) reset();
    if (running) return;
    running = true;
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pause';
    startButton.textContent = 'Running';
    updateHud(`Running · speed ${speed()}ms`);
    schedule();
  }

  startButton.addEventListener('click', start);
  pauseButton.addEventListener('click', () => {
    if (!running) return;
    stop('Paused');
  });
  restartButton.addEventListener('click', reset);
  document.querySelectorAll('[data-direction]').forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
  window.addEventListener('keydown', (event) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    if (!keyMap[event.key]) return;
    event.preventDefault();
    setDirection(keyMap[event.key]);
  });

  window.__snakeGame = { start, reset, setDirection, getState: () => ({ score, highScore, running, gameOver, snake: snake.map((cell) => ({ ...cell })), food: { ...food }, enemy: { ...enemy } }) };
  reset();
})();

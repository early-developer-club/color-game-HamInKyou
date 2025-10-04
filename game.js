class ColorGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.timeLeft = 100; // 100%로 시작
        this.maxTime = 100;
        this.decreaseRate = 10; // 초당 감소율 (%) - 10초면 끝!
        this.animationTimer = null;
        this.lastUpdateTime = null;
        this.chancesLeft = 3; // 찬스 횟수
        this.gameBoard = document.getElementById('game-board');
        this.levelDisplay = document.getElementById('level');
        this.scoreDisplay = document.getElementById('score');
        this.timerBar = document.getElementById('timer-bar');
        this.message = document.getElementById('message');
        this.restartBtn = document.getElementById('restart-btn');
        this.startBtn = document.getElementById('start-btn');
        this.chanceBtn = document.getElementById('chance-btn');
        this.chanceCount = document.getElementById('chance-count');
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.finalLevel = document.getElementById('final-level');
        this.finalScore = document.getElementById('final-score');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.chanceBtn.addEventListener('click', () => this.useChance());
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.initGame();
    }

    initGame() {
        this.createBoard();
        this.startTimer();
        this.updateChanceDisplay();
    }

    startTimer() {
        this.stopTimer();
        this.lastUpdateTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const deltaTime = (now - this.lastUpdateTime) / 1000; // 초 단위
            this.lastUpdateTime = now;

            // 시간을 지속적으로 감소
            this.timeLeft = Math.max(0, this.timeLeft - (this.decreaseRate * deltaTime));

            // 바 업데이트
            const percentage = (this.timeLeft / this.maxTime) * 100;
            this.timerBar.style.width = percentage + '%';

            // 시간에 따라 색상 변경
            if (percentage > 50) {
                this.timerBar.style.backgroundColor = '#4caf50'; // 녹색
            } else if (percentage > 25) {
                this.timerBar.style.backgroundColor = '#ff9800'; // 주황색
            } else {
                this.timerBar.style.backgroundColor = '#f44336'; // 빨간색
            }

            if (this.timeLeft <= 0) {
                this.gameOver('시간 초과! ⏰');
            } else {
                this.animationTimer = requestAnimationFrame(animate);
            }
        };

        this.animationTimer = requestAnimationFrame(animate);
    }

    stopTimer() {
        if (this.animationTimer) {
            cancelAnimationFrame(this.animationTimer);
            this.animationTimer = null;
        }
    }

    gameOver(message) {
        this.stopTimer();
        this.gameScreen.style.display = 'none';
        this.gameoverScreen.style.display = 'block';
        this.finalLevel.textContent = this.level;
        this.finalScore.textContent = this.score;
    }

    getGridSize() {
        // 레벨에 따라 그리드 크기 증가 (2x2 -> 3x3 -> 4x4 ...)
        return Math.min(2 + Math.floor(this.level / 2), 8);
    }

    getColorDifference() {
        // 레벨이 올라갈수록 색상 차이가 미묘해짐
        // 레벨 1: 50, 레벨 2: 45, 레벨 3: 40 ...
        return Math.max(50 - (this.level - 1) * 5, 5);
    }

    generateColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return { r, g, b };
    }

    getDifferentColor(baseColor, difference) {
        const colorChannel = Math.floor(Math.random() * 3); // 0: R, 1: G, 2: B
        const direction = Math.random() > 0.5 ? 1 : -1;

        const newColor = { ...baseColor };

        if (colorChannel === 0) {
            newColor.r = Math.max(0, Math.min(255, baseColor.r + (difference * direction)));
        } else if (colorChannel === 1) {
            newColor.g = Math.max(0, Math.min(255, baseColor.g + (difference * direction)));
        } else {
            newColor.b = Math.max(0, Math.min(255, baseColor.b + (difference * direction)));
        }

        return newColor;
    }

    colorToString(color) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }

    createBoard() {
        this.gameBoard.innerHTML = '';
        const gridSize = this.getGridSize();
        const totalSquares = gridSize * gridSize;
        const difference = this.getColorDifference();

        // 그리드 크기 설정
        this.gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        // 기본 색상 생성
        const baseColor = this.generateColor();
        const differentColor = this.getDifferentColor(baseColor, difference);

        // 다른 색상이 들어갈 위치 랜덤 선택
        const differentIndex = Math.floor(Math.random() * totalSquares);

        // 칸 생성
        for (let i = 0; i < totalSquares; i++) {
            const square = document.createElement('div');
            square.className = 'square';

            if (i === differentIndex) {
                square.style.backgroundColor = this.colorToString(differentColor);
                square.dataset.different = 'true';
            } else {
                square.style.backgroundColor = this.colorToString(baseColor);
            }

            square.addEventListener('click', () => this.handleSquareClick(square));
            this.gameBoard.appendChild(square);
        }
    }

    handleSquareClick(square) {
        if (square.dataset.different === 'true') {
            // 정답! - 시간 증가
            this.score += this.level * 10;
            this.level++;
            this.timeLeft = Math.min(100, this.timeLeft + 15); // 15% 증가
            this.updateDisplay();
            this.showMessage('정답! 🎉', 'success');

            setTimeout(() => {
                this.message.textContent = '';
                this.createBoard();
            }, 500);
        } else {
            // 오답 - 시간 감소
            this.timeLeft = Math.max(0, this.timeLeft - 20); // 20% 감소
            this.showMessage('틀렸습니다! -20%', 'warning');

            setTimeout(() => {
                this.message.textContent = '';
            }, 500);

            if (this.timeLeft <= 0) {
                this.gameOver('게임 오버! 😢');
            }
        }
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = `message ${type}`;
    }

    updateDisplay() {
        this.levelDisplay.textContent = this.level;
        this.scoreDisplay.textContent = this.score;
    }

    updateChanceDisplay() {
        this.chanceCount.textContent = this.chancesLeft;
        if (this.chancesLeft === 0) {
            this.chanceBtn.disabled = true;
            this.chanceBtn.style.opacity = '0.5';
            this.chanceBtn.style.cursor = 'not-allowed';
        } else {
            this.chanceBtn.disabled = false;
            this.chanceBtn.style.opacity = '1';
            this.chanceBtn.style.cursor = 'pointer';
        }
    }

    useChance() {
        if (this.chancesLeft <= 0) return;

        this.chancesLeft--;
        this.updateChanceDisplay();

        // 다른 색의 타일에 힌트 표시
        const squares = this.gameBoard.querySelectorAll('.square');
        squares.forEach(square => {
            if (square.dataset.different === 'true') {
                square.classList.add('hint');
                setTimeout(() => {
                    square.classList.remove('hint');
                }, 1000);
            }
        });

        this.showMessage('힌트가 표시됩니다! 💡', 'info');
        setTimeout(() => {
            this.message.textContent = '';
        }, 1000);
    }

    restart() {
        this.stopTimer();
        this.level = 1;
        this.score = 0;
        this.timeLeft = 100;
        this.chancesLeft = 3;
        this.updateDisplay();
        this.updateChanceDisplay();
        this.message.textContent = '';
        this.gameoverScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.startScreen.style.display = 'block';
        this.gameBoard.style.pointerEvents = 'auto';
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new ColorGame();
});
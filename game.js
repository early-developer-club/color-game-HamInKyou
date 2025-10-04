// Supabase 초기화
const SUPABASE_URL = 'https://ijyvnvhpjgyfopjdpesr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqeXZudmhwamd5Zm9wamRwZXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NjIwNzQsImV4cCI6MjA3NTEzODA3NH0.r4u2vaWEEcPh6kj20Y6kPM3cJInpZ5YfEEEzsfZBqYI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        this.combo = 0; // 콤보 카운트
        this.isFeverMode = false; // 피버 모드 여부
        this.feverThreshold = 5; // 피버 모드 진입 콤보 수
        this.roundStartTime = null; // 라운드 시작 시간
        this.comboTimeLimit = 3000; // 3초 이내에 정답 맞춰야 콤보 유지 (ms)

        this.gameBoard = document.getElementById('game-board');
        this.levelDisplay = document.getElementById('level');
        this.scoreDisplay = document.getElementById('score');
        this.timerBar = document.getElementById('timer-bar');
        this.message = document.getElementById('message');
        this.restartBtn = document.getElementById('restart-btn');
        this.startBtn = document.getElementById('start-btn');
        this.chanceBtn = document.getElementById('chance-btn');
        this.chanceCount = document.getElementById('chance-count');
        this.comboDisplay = document.getElementById('combo-display');
        this.comboCount = document.getElementById('combo');
        this.feverContainer = document.getElementById('fever-container');
        this.feverBar = document.getElementById('fever-bar');
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.finalLevel = document.getElementById('final-level');
        this.finalScore = document.getElementById('final-score');
        this.nicknameInput = document.getElementById('nickname-input');
        this.submitScoreBtn = document.getElementById('submit-score-btn');
        this.viewRankingBtn = document.getElementById('view-ranking-btn');
        this.rankingScreen = document.getElementById('ranking-screen');
        this.rankingList = document.getElementById('ranking-list');
        this.backToGameBtn = document.getElementById('back-to-game-btn');
        this.nicknameBox = document.getElementById('nickname-box');
        this.previewList = document.getElementById('preview-list');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.chanceBtn.addEventListener('click', () => this.useChance());
        this.submitScoreBtn.addEventListener('click', () => this.submitScore());
        this.viewRankingBtn.addEventListener('click', () => this.showRanking());
        this.backToGameBtn.addEventListener('click', () => this.backToGame());

        // 시작 화면에서 랭킹 미리보기 로드
        this.loadRankingPreview();
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
        // 5레벨마다 크기 증가로 변경하여 난이도 완화
        return Math.min(2 + Math.floor(this.level / 5), 6);
    }

    getColorDifference() {
        // 레벨이 올라갈수록 색상 차이가 미묘해짐
        // 레벨 1: 80, 레벨 2: 77, 레벨 3: 74 ... (3씩 감소로 변경)
        return Math.max(80 - (this.level - 1) * 3, 15);
    }

    generateColor() {
        const h = Math.floor(Math.random() * 360);
        const s = 50 + Math.floor(Math.random() * 50); // 50-100%
        const l = 40 + Math.floor(Math.random() * 40); // 40-80%
        return { h, s, l };
    }

    getDifferentColor(baseColor, difference) {
        const newColor = { ...baseColor };

        // HSL에서 Hue(색상)를 조정 - 더 극명한 차이
        const direction = Math.random() > 0.5 ? 1 : -1;
        newColor.h = (baseColor.h + (difference * direction) + 360) % 360;

        return newColor;
    }

    colorToString(color) {
        return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
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

        // 라운드 시작 시간 기록
        this.roundStartTime = Date.now();
    }

    handleSquareClick(square) {
        if (square.dataset.different === 'true') {
            // 정답! - 콤보 체크
            const timeElapsed = Date.now() - this.roundStartTime;

            if (timeElapsed <= this.comboTimeLimit) {
                // 시간 내에 정답 - 콤보 증가
                this.combo++;
                this.updateComboDisplay();

                // 피버 모드 체크
                if (this.combo >= this.feverThreshold && !this.isFeverMode) {
                    this.enterFeverMode();
                }
            } else {
                // 시간 초과 - 콤보 리셋
                this.resetCombo();
            }

            // 점수 계산 (피버 모드면 2배)
            const baseScore = this.level * 10;
            const scoreToAdd = this.isFeverMode ? baseScore * 2 : baseScore;
            this.score += scoreToAdd;

            this.level++;
            this.timeLeft = Math.min(100, this.timeLeft + 15); // 15% 증가
            this.updateDisplay();

            const message = this.isFeverMode ? `정답! 🎉 +${scoreToAdd} (FEVER x2)` : '정답! 🎉';
            this.showMessage(message, 'success');

            setTimeout(() => {
                this.message.textContent = '';
                this.createBoard();
            }, 500);
        } else {
            // 오답 - 콤보 리셋 및 시간 감소
            this.resetCombo();
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

    updateComboDisplay() {
        if (this.combo > 0) {
            this.comboDisplay.style.display = 'block';
            this.comboCount.textContent = this.combo;
        } else {
            this.comboDisplay.style.display = 'none';
        }
    }

    enterFeverMode() {
        this.isFeverMode = true;
        this.feverContainer.style.opacity = '1';
        this.feverContainer.style.maxHeight = '30px';
        this.feverContainer.style.marginBottom = '20px';
        this.showMessage('🔥 FEVER MODE! 🔥', 'fever');
    }

    exitFeverMode() {
        this.isFeverMode = false;
        this.feverContainer.style.opacity = '0';
        this.feverContainer.style.maxHeight = '0';
        this.feverContainer.style.marginBottom = '0';
    }

    resetCombo() {
        this.combo = 0;
        this.updateComboDisplay();
        if (this.isFeverMode) {
            this.exitFeverMode();
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

    async submitScore() {
        const nickname = this.nicknameInput.value.trim();

        if (!nickname) {
            alert('닉네임을 입력해주세요!');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('rankings')
                .insert([
                    {
                        player_name: nickname,
                        score: this.score,
                        level: this.level
                    }
                ]);

            if (error) throw error;

            alert('랭킹에 등록되었습니다! 🎉');
            this.nicknameBox.style.display = 'none';
            this.nicknameInput.value = '';
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('랭킹 등록 중 오류가 발생했습니다.');
        }
    }

    async showRanking() {
        try {
            const { data, error } = await supabase
                .from('rankings')
                .select('*')
                .order('score', { ascending: false })
                .limit(10);

            if (error) throw error;

            this.gameoverScreen.style.display = 'none';
            this.rankingScreen.style.display = 'block';
            this.displayRankings(data);
        } catch (error) {
            console.error('Error fetching rankings:', error);
            alert('랭킹을 불러오는 중 오류가 발생했습니다.');
        }
    }

    displayRankings(rankings) {
        if (!rankings || rankings.length === 0) {
            this.rankingList.innerHTML = '<div class="no-ranking">아직 등록된 랭킹이 없습니다.</div>';
            return;
        }

        let html = '<div class="ranking-table">';
        rankings.forEach((rank, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`;
            html += `
                <div class="ranking-item">
                    <div class="rank">${medal}</div>
                    <div class="player-name">${rank.player_name}</div>
                    <div class="player-score">${rank.score}점</div>
                    <div class="player-level">Lv.${rank.level}</div>
                </div>
            `;
        });
        html += '</div>';
        this.rankingList.innerHTML = html;
    }

    async loadRankingPreview() {
        try {
            const { data, error } = await supabase
                .from('rankings')
                .select('*')
                .order('score', { ascending: false })
                .limit(3);

            if (error) throw error;

            if (!data || data.length === 0) {
                this.previewList.innerHTML = '<div class="no-ranking-preview">아직 랭킹이 없습니다</div>';
                return;
            }

            let html = '';
            data.forEach((rank, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                html += `
                    <div class="preview-item">
                        <span class="preview-medal">${medal}</span>
                        <span class="preview-name">${rank.player_name}</span>
                        <span class="preview-score">${rank.score}점</span>
                    </div>
                `;
            });
            this.previewList.innerHTML = html;
        } catch (error) {
            console.error('Error loading ranking preview:', error);
            this.previewList.innerHTML = '<div class="no-ranking-preview">랭킹 로드 실패</div>';
        }
    }

    backToGame() {
        this.rankingScreen.style.display = 'none';
        this.gameoverScreen.style.display = 'block';
    }

    restart() {
        this.stopTimer();
        this.level = 1;
        this.score = 0;
        this.timeLeft = 100;
        this.chancesLeft = 3;
        this.combo = 0;
        this.isFeverMode = false;
        this.updateDisplay();
        this.updateChanceDisplay();
        this.updateComboDisplay();
        this.exitFeverMode();
        this.message.textContent = '';
        this.gameoverScreen.style.display = 'none';
        this.rankingScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
        this.startScreen.style.display = 'block';
        this.gameBoard.style.pointerEvents = 'auto';
        this.nicknameBox.style.display = 'block';
        this.nicknameInput.value = '';

        // 랭킹 미리보기 새로고침
        this.loadRankingPreview();
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new ColorGame();
});
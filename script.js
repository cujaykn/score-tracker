// --- Game Logic Base and Implementations ---
class GameLogic {
    constructor(app) {
        this.app = app;
    }
    // Methods to override:
    getInitialPlayerData(player) { return { ...player }; }
    getRoundInputFields(player) { return []; }
    processRoundInput(player, input) {}
    getWinner(players, gameState) { return null; }
    renderChart(ctx, gameState) {}
}

class NertzLogic extends GameLogic {
    getInitialPlayerData(player) {
        // Only totalScore for Nertz
        return { ...player, totalScore: 0 };
    }
    getRoundInputFields(player) {
        return [
            { type: 'score', label: 'Score', min: -26, max: 52 }
        ];
    }
    processRoundInput(player, input) {
        // input: { score: number }
        player.totalScore += input.score;
    }
    getWinner(players, gameState) {
        return players.find(p => p.totalScore >= gameState.winningScore);
    }
    renderChart(ctx, gameState) {
        // Nertz: line chart of cumulative score per round
        if (this.app.chart) {
            this.app.chart.destroy();
        }
        const labels = gameState.rounds.map(round => `Round ${round.roundNumber}`);
        const datasets = gameState.players.map(player => {
            let cumulativeScore = 0;
            const data = gameState.rounds.map(round => {
                const scoreData = (round.data || round.scores || []).find(s => s.playerId === player.id);
                if (scoreData && (scoreData.input ? scoreData.input.score !== undefined : scoreData.score !== undefined)) {
                    cumulativeScore += scoreData.input ? scoreData.input.score : scoreData.score;
                }
                return cumulativeScore;
            });
            return {
                label: player.name,
                data: data,
                borderColor: this.app.getPlayerColor(player.id),
                backgroundColor: this.app.getPlayerColor(player.id, 0.1),
                borderWidth: 3,
                fill: false,
                tension: 0.1
            };
        });
        this.app.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Score Progression by Round' }
                },
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'Score' } },
                    x: { title: { display: true, text: 'Round' } }
                }
            }
        });
    }
}

class Phase10Logic extends GameLogic {
    getInitialPlayerData(player) {
        // Phase 10: phase (1-10), totalScore
        return { ...player, phase: 1, totalScore: 0 };
    }
    getRoundInputFields(player) {
        return [
            { type: 'checkbox', label: `Phase ${player.phase}` },
            { type: 'score', label: 'Score', min: 0, max: 500 }
        ];
    }
    processRoundInput(player, input) {
        // input: { completedPhase: bool, score: number }
        if (input.completedPhase) player.phase = (player.phase || 1) + 1;
        player.totalScore += input.score;
    }
    getWinner(players, gameState) {
        // Winner: first to phase 11 (completed 10), lowest score breaks tie
        const finished = players.filter(p => p.phase > 10);
        if (finished.length === 0) return null;
        return finished.reduce((min, p) => p.totalScore < min.totalScore ? p : min, finished[0]);
    }
    renderChart(ctx, gameState) {
        // Phase 10: line chart of phase progress per player, tooltip shows score for each round
        if (this.app.chart) {
            this.app.chart.destroy();
        }
        const labels = gameState.rounds.map(round => `Round ${round.roundNumber}`);
        const datasets = gameState.players.map(player => {
            let phase = 1;
            const data = gameState.rounds.map(round => {
                const pdata = (round.data || []).find(s => s.playerId === player.id);
                if (pdata && pdata.input && pdata.input.completedPhase) phase += 1;
                return phase;
            });
            // For tooltips: collect score for each round
            const scores = gameState.rounds.map(round => {
                const pdata = (round.data || []).find(s => s.playerId === player.id);
                return pdata && pdata.input && typeof pdata.input.score === 'number' ? pdata.input.score : 0;
            });
            return {
                label: player.name,
                data: data,
                borderColor: this.app.getPlayerColor(player.id),
                backgroundColor: this.app.getPlayerColor(player.id, 0.1),
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                scores: scores
            };
        });
        this.app.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Phase Progression by Round' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const phase = context.parsed.y;
                                const score = context.dataset.scores[context.dataIndex];
                                return `${context.dataset.label}: Phase ${phase} (Score: ${score})`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, min: 1, max: 11, stepSize: 1, title: { display: true, text: 'Phase' } },
                    x: { title: { display: true, text: 'Round' } }
                }
            }
        });
    }
}
// Game State Management
class GameScoreTracker {
    renderScoreInputs() {
        const container = document.getElementById('scoresContainer');
        if (!container) return;
        container.innerHTML = '';
        const logic = this.gameLogics[this.gameState.selectedGame] || this.gameLogics['nertz'];
        this.gameState.players.forEach(player => {
            const group = document.createElement('div');
            group.className = this.gameState.selectedGame === 'phase10' ? 'score-input-group phase10-row' : 'score-input-group';
            // Player info
            const info = document.createElement('div');
            info.className = 'score-player-info';
            info.innerHTML = `<span class="player-icon"><i class="${player.icon}"></i></span> <span class="player-name">${player.name}</span>`;
            group.appendChild(info);

            // Game-specific input fields
            const fields = logic.getRoundInputFields(player);
            fields.forEach(field => {
                if (field.type === 'checkbox') {
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.gap = '0.3rem';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'phase-complete-checkbox';
                    checkbox.setAttribute('data-player-id', player.id);
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(field.label));
                    group.appendChild(label);
                } else if (field.type === 'score') {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'score-input';
                    input.setAttribute('data-player-id', player.id);
                    input.value = '';
                    input.placeholder = 'Score';
                    input.readOnly = true;
                    input.addEventListener('click', () => {
                        this._scoreEntryInput = input;
                        this._scoreEntryMin = field.min;
                        this._scoreEntryMax = field.max;
                        document.getElementById('scoreEntryDisplay').textContent = input.value || '0';
                        // Set dynamic title with player name and icon
                        const modalTitle = document.querySelector('#scoreEntryModal .modal-header h3');
                        if (modalTitle) {
                            modalTitle.innerHTML = `<span class='player-icon'><i class='${player.icon}'></i></span> ${player.name}`;
                        }
                        document.getElementById('scoreEntryModal').classList.add('active');
                        this.renderScoreKeypad();
                    });
                    group.appendChild(input);
                }
            });
            container.appendChild(group);
        });
    }
    saveRound() {
        // Only Nertz for now
        const logic = this.gameLogics?.[this.gameState.selectedGame] || this.gameLogics?.nertz;
        const roundData = [];
        let allFilled = true;
        this.gameState.players.forEach(player => {
            const inputEl = document.querySelector(`.score-input[data-player-id='${player.id}']`);
            let val = inputEl ? Number(inputEl.value) : 0;
            if (inputEl && inputEl.value === '') allFilled = false;
            let inputObj = { score: val };
            if (this.gameState.selectedGame === 'phase10') {
                const checkbox = document.querySelector(`.phase-complete-checkbox[data-player-id='${player.id}']`);
                inputObj.completedPhase = checkbox && checkbox.checked;
            }
            roundData.push({ playerId: player.id, input: inputObj });
        });
        if (!allFilled) {
            this.showAlert('Missing Score', 'Please enter a score for each player.');
            return;
        }
        // Update player scores
        roundData.forEach(data => {
            const player = this.gameState.players.find(p => p.id === data.playerId);
            logic.processRoundInput(player, data.input);
        });
        // Save round
        this.gameState.rounds.push({ roundNumber: this.gameState.currentRound, data: roundData });
        this.gameState.currentRound += 1;
        this.saveToStorage();
        // Show stats/leaderboard after saving round
        this.showStatsScreenAfterRound();
    }

    showStatsScreenAfterRound() {
        this.showScreen('statsScreen');
        this.renderScoreChart();
        // Show only Next Round button if game is active, hide Back to Game
        const nextBtn = document.getElementById('nextRoundFromStatsBtn');
        if (nextBtn) {
            nextBtn.style.display = this.gameState.isActive ? '' : 'none';
            nextBtn.onclick = () => {
                this.showScreen('gameScreen');
                this.renderScoreInputs();
                const roundEl = document.getElementById('currentRound');
                if (roundEl) roundEl.textContent = this.gameState.currentRound;
            };
        }
        const backBtn = document.getElementById('backToGameBtn');
        if (backBtn) backBtn.style.display = 'none';
        // Render leaderboard
        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const container = document.getElementById('cumulativeScores');
        if (!container) return;
        let sorted;
        if (this.gameState.selectedGame === 'phase10') {
            // Sort by phase DESC, then totalScore ASC
            sorted = [...this.gameState.players].sort((a, b) => {
                if ((b.phase || 1) !== (a.phase || 1)) return (b.phase || 1) - (a.phase || 1);
                return (a.totalScore || 0) - (b.totalScore || 0);
            });
        } else {
            // Nertz: highest totalScore first
            sorted = [...this.gameState.players].sort((a, b) => b.totalScore - a.totalScore);
        }
        container.innerHTML = '';
        sorted.forEach(player => {
            const card = document.createElement('div');
            card.className = 'leaderboard-card';
            let phaseLine = '';
            if (this.gameState.selectedGame === 'phase10') {
                phaseLine = `<div class="leaderboard-phase" style="font-size:0.95rem;font-weight:400;opacity:0.85;line-height:1.1;">Phase ${player.phase || 1}</div>`;
            }
            card.innerHTML = `
                <div class="leaderboard-icon"><i class="${player.icon}"></i></div>
                <div class="leaderboard-name">${player.name}${phaseLine}</div>
                <div class="leaderboard-score">${player.totalScore}</div>
            `;
            container.appendChild(card);
        });
    }
    renderChart(ctx, gameState) {
        // Phase 10: line chart of phase progress per player, tooltip shows score for each round
        if (this.app.chart) {
            this.app.chart.destroy();
        }
        const labels = gameState.rounds.map(round => `Round ${round.roundNumber}`);
        const datasets = gameState.players.map(player => {
            let phase = 1;
            const data = gameState.rounds.map(round => {
                const pdata = (round.data || []).find(s => s.playerId === player.id);
                if (pdata && pdata.input && pdata.input.completedPhase) phase += 1;
                return phase;
            });
            // For tooltips: collect score for each round
            const scores = gameState.rounds.map(round => {
                const pdata = (round.data || []).find(s => s.playerId === player.id);
                return pdata && pdata.input && typeof pdata.input.score === 'number' ? pdata.input.score : 0;
            });
            return {
                label: player.name,
                data: data,
                borderColor: this.app.getPlayerColor(player.id),
                backgroundColor: this.app.getPlayerColor(player.id, 0.1),
                borderWidth: 3,
                fill: false,
                tension: 0.1,
                scores: scores
            };
        });
        this.app.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Phase Progression by Round' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const phase = context.parsed.y;
                                const score = context.dataset.scores[context.dataIndex];
                                return `${context.dataset.label}: Phase ${phase} (Score: ${score})`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, min: 1, max: 10, stepSize: 1, title: { display: true, text: 'Phase' } },
                    x: { title: { display: true, text: 'Round' } }
                }
            }
        });
    }

    renderScoreKeypad() {
        const keypad = document.getElementById('scoreEntryKeypad');
        keypad.innerHTML = '';
        const keys = ['1','2','3','4','5','6','7','8','9','0','-','C'];
        keys.forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key;
            btn.className = 'keypad-btn';
            btn.addEventListener('click', () => {
                let current = document.getElementById('scoreEntryDisplay').textContent;
                if (key === 'C') {
                    current = '';
                } else if (key === '-') {
                    if (!current.startsWith('-')) current = '-' + current;
                } else {
                    if (current === '0') current = '';
                    current += key;
                }
                document.getElementById('scoreEntryDisplay').textContent = current;
            });
            keypad.appendChild(btn);
        });
        // OK and Next handled by modal footer
        document.getElementById('scoreEntryOkBtn').onclick = () => {
            let val = document.getElementById('scoreEntryDisplay').textContent;
            if (val === '' || isNaN(Number(val))) val = '0';
            let num = Number(val);
            if (this._scoreEntryMin !== undefined && num < this._scoreEntryMin) num = this._scoreEntryMin;
            if (this._scoreEntryMax !== undefined && num > this._scoreEntryMax) num = this._scoreEntryMax;
            this._scoreEntryInput.value = num;
            document.getElementById('scoreEntryModal').classList.remove('active');
        };
        document.getElementById('scoreEntryNextBtn').onclick = () => {
            document.getElementById('scoreEntryOkBtn').onclick();
            // Focus next input
            const inputs = Array.from(document.querySelectorAll('.score-input'));
            const idx = inputs.indexOf(this._scoreEntryInput);
            if (idx >= 0 && idx < inputs.length - 1) {
                inputs[idx + 1].click();
            }
        };
        document.getElementById('closeScoreEntryBtn').onclick = () => {
            document.getElementById('scoreEntryModal').classList.remove('active');
        };
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        // Show the requested screen
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
        // Hide or show Winning Score label based on game
        if (screenId === 'gameScreen') {
            const ws = document.querySelector('.winning-score-display');
            if (ws) {
                ws.style.display = (this.gameState.selectedGame === 'phase10') ? 'none' : '';
            }
        }
    }

    startGame() {
        // Mark game as active, reset rounds, set round to 1
        this.gameState.isActive = true;
        this.gameState.currentRound = 1;
        this.gameState.rounds = [];
        // Optionally reset per-player data for the selected game
        // (e.g., totalScore, phase, etc.)
        const logic = this.gameLogics?.[this.gameState.selectedGame] || this.gameLogics?.nertz;
        if (logic && typeof logic.getInitialPlayerData === 'function') {
            this.gameState.players = this.gameState.players.map(p => logic.getInitialPlayerData({ ...p }));
        }
    this.saveToStorage();
    this.showScreen('gameScreen');
    this.renderScoreInputs();
    // Reset round display
    const roundEl = document.getElementById('currentRound');
    if (roundEl) roundEl.textContent = '1';
    }

    updateStartGameButton() {
        const btn = document.getElementById('startGameBtn');
        if (!btn) return;
        // Enable if at least 2 players
        btn.disabled = this.gameState.players.length < 2;
    }

    renderPlayersList() {
        const list = document.getElementById('playersList');
        if (!list) return;
        list.innerHTML = '';
        this.gameState.players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'player-item';
            item.innerHTML = `
                <div class="player-icon"><i class="${player.icon}"></i></div>
                <span class="player-name">${player.name}</span>
            `;
            list.appendChild(item);
        });
    }

    saveToStorage() {
        try {
            localStorage.setItem('nertzGameState', JSON.stringify(this.gameState));
        } catch (e) {
            console.error('Failed to save game state:', e);
        }
    }
    constructor() {
        // Patch closeScoreEntryBtn to restore static title
        setTimeout(() => {
            const closeBtn = document.getElementById('closeScoreEntryBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    const modalTitle = document.querySelector('#scoreEntryModal .modal-header h3');
                    if (modalTitle) modalTitle.textContent = 'Enter Score';
                });
            }
        }, 0);
        // Load recentPlayers from localStorage if available
        let recentPlayers = [];
        try {
            const stored = localStorage.getItem('nertzGameState');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && Array.isArray(parsed.recentPlayers)) {
                    recentPlayers = parsed.recentPlayers;
                }
            }
        } catch (e) {}
        this.gameState = {
            isActive: false,
            winningScore: 100,
            currentRound: 1,
            players: [],
            rounds: [],
            recentPlayers: recentPlayers,
            selectedGame: 'nertz', // default
        };
        // Initialize per-game logic
        this.gameLogics = {
            nertz: new NertzLogic(this),
            phase10: new Phase10Logic(this)
        };
    }

    renderScoreChart() {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        const logic = this.gameLogics[this.gameState.selectedGame] || this.gameLogics['nertz'];
        logic.renderChart(ctx, this.gameState);
    }

    addPlayer(name, icon) {
        const player = {
            id: crypto.randomUUID(),
            name,
            icon
        };
        this.gameState.players.push(player);
        // Add to recent players if not already there
        const existingRecent = this.gameState.recentPlayers.find(p => 
            p.name === name && p.icon === icon
        );
        if (!existingRecent) {
            this.gameState.recentPlayers.unshift({ name, icon });
            this.gameState.recentPlayers = this.gameState.recentPlayers.slice(0, 10); // Keep only 10 most recent
        }
        this.saveToStorage();
        this.renderPlayersList();
        this.updateStartGameButton();
    }

    getPlayerColor(playerId, alpha = 1) {
        const colors = [
            `rgba(102, 126, 234, ${alpha})`,
            `rgba(72, 187, 120, ${alpha})`,
            `rgba(237, 137, 54, ${alpha})`,
            `rgba(245, 101, 101, ${alpha})`,
            `rgba(159, 122, 234, ${alpha})`,
            `rgba(16, 185, 129, ${alpha})`,
            `rgba(251, 191, 36, ${alpha})`,
            `rgba(239, 68, 68, ${alpha})`,
            `rgba(139, 92, 246, ${alpha})`,
            `rgba(34, 197, 94, ${alpha})`,
            `rgba(245, 158, 11, ${alpha})`,
            `rgba(220, 38, 127, ${alpha})`
        ];
        const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
        return colors[playerIndex % colors.length];
    }

    showAddPlayerModal() {
        this.renderIconGrid();
        this.renderRecentPlayers();
        document.getElementById('addPlayerModal').classList.add('active');
        document.getElementById('playerName').focus();
    }

    hideAddPlayerModal() {
        document.getElementById('addPlayerModal').classList.remove('active');
        document.getElementById('playerName').value = '';
        this.selectedIcon = null;
        document.querySelectorAll('.icon-option').forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    renderIconGrid() {
        const iconGrid = document.getElementById('iconGrid');
        const icons = [
            'fas fa-user', 'fas fa-user-tie', 'fas fa-user-graduate', 'fas fa-user-ninja',
            'fas fa-user-astronaut', 'fas fa-user-cowboy', 'fas fa-user-nurse', 'fas fa-user-md',
            'fas fa-user-secret', 'fas fa-user-shield', 'fas fa-user-slash', 'fas fa-user-tag',
            'fas fa-heart', 'fas fa-star', 'fas fa-crown', 'fas fa-gem',
            'fas fa-rocket', 'fas fa-car', 'fas fa-plane', 'fas fa-ship',
            'fas fa-cat', 'fas fa-dog', 'fas fa-fish', 'fas fa-bird',
            'fas fa-tree', 'fas fa-leaf', 'fas fa-flower', 'fas fa-seedling',
            'fas fa-sun', 'fas fa-moon', 'fas fa-cloud', 'fas fa-bolt',
            'fas fa-fire', 'fas fa-water', 'fas fa-mountain', 'fas fa-umbrella',
            'fas fa-gift', 'fas fa-birthday-cake', 'fas fa-trophy', 'fas fa-medal'
        ];

        iconGrid.innerHTML = '';
        icons.forEach(icon => {
            const iconOption = document.createElement('div');
            iconOption.className = 'icon-option';
            iconOption.innerHTML = `<i class="${icon}"></i>`;
            iconOption.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                iconOption.classList.add('selected');
                this.selectedIcon = icon;
            });
            iconGrid.appendChild(iconOption);
        });
    }

    renderRecentPlayers() {
        const container = document.getElementById('recentPlayers');
        container.innerHTML = '';

        this.gameState.recentPlayers.forEach(player => {
            const recentPlayer = document.createElement('div');
            recentPlayer.className = 'recent-player';
            // Only check if player is already added when we're in setup mode (not active game)
            const isInCurrentGame = !this.gameState.isActive && this.gameState.players.some(p => 
                p.name.toLowerCase() === player.name.toLowerCase() && p.icon === player.icon
            );
            if (isInCurrentGame) {
                recentPlayer.classList.add('already-added');
            }
            recentPlayer.innerHTML = `
                <div class="recent-player-icon">
                    <i class="${player.icon}"></i>
                </div>
                <span>${player.name}</span>
                ${isInCurrentGame ? '<span class="already-added-text">(Already added)</span>' : ''}
            `;
            recentPlayer.addEventListener('click', () => {
                if (isInCurrentGame) {
                    this.showAlert('Player Exists', 'This player is already in the current game setup');
                    return;
                }
                // Automatically add the player and close the modal
                this.addPlayer(player.name, player.icon);
                this.hideAddPlayerModal();
            });
            container.appendChild(recentPlayer);
        });
    }

    async confirmAddPlayer() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            this.showAlert('Missing Information', 'Please enter a player name');
            return;
        }
        if (!this.selectedIcon) {
            this.showAlert('Missing Information', 'Please select an icon');
            return;
        }
        // Check if player with same name and icon already exists
        const existingPlayer = this.gameState.players.find(p => 
            p.name.toLowerCase() === name.toLowerCase() && p.icon === this.selectedIcon
        );
        if (existingPlayer) {
            this.showAlert('Player Exists', 'A player with this name and icon already exists in the current game');
            return;
        }
        // Check if player with same name exists but different icon (allow with confirmation)
        const sameNamePlayer = this.gameState.players.find(p => 
            p.name.toLowerCase() === name.toLowerCase() && p.icon !== this.selectedIcon
        );
        if (sameNamePlayer) {
            const confirmAdd = await this.showConfirm(
                'Player Name Exists', 
                `A player named "${sameNamePlayer.name}" already exists with a different icon. Do you want to add "${name}" as a separate player?`
            );
            if (!confirmAdd) {
                return;
            }
        }
        this.addPlayer(name, this.selectedIcon);
        this.hideAddPlayerModal();
    }

    setupEventListeners() {
        // Alert OK button
        const alertOkBtn = document.getElementById('alertOkBtn');
        if (alertOkBtn) {
            alertOkBtn.addEventListener('click', () => {
                document.getElementById('alertModal').classList.remove('active');
            });
        }
        document.getElementById('confirmAddPlayerBtn').addEventListener('click', () => {
            this.confirmAddPlayer();
        });
        // Add Player modal close X
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideAddPlayerModal();
            });
        }
        // Setup screen
        document.getElementById('addPlayerBtn').addEventListener('click', () => {
            this.showAddPlayerModal();
        });
        // Back to Game button (stats screen)
        const backBtn = document.getElementById('backToGameBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showScreen('gameScreen');
            });
        }
        // View Stats button (game screen)
        document.getElementById('viewStatsBtn').addEventListener('click', () => {
            this.showScreen('statsScreen');
            this.renderScoreChart();
            // Show only Back to Game, hide Next Round
            const backBtn = document.getElementById('backToGameBtn');
            if (backBtn) backBtn.style.display = this.gameState.isActive ? '' : 'none';
            const nextBtn = document.getElementById('nextRoundFromStatsBtn');
            if (nextBtn) nextBtn.style.display = 'none';
        });
            // New Game button (game screen)
            document.getElementById('newGameBtn').addEventListener('click', () => {
                this.newGame();
            });
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        document.getElementById('winningScore').addEventListener('input', (e) => {
            this.gameState.winningScore = parseInt(e.target.value);
            this.updateWinningScoreDisplay();
        });
        // Game type selection
        const gameTypeSelect = document.getElementById('gameType');
        if (gameTypeSelect) {
            gameTypeSelect.addEventListener('change', (e) => {
                this.gameState.selectedGame = e.target.value;
                this.saveToStorage();
                this.updateGameSettingsVisibility();
            });
            // On load, set correct settings visibility
            this.updateGameSettingsVisibility();
        }
        // Save Round
        document.getElementById('saveRoundBtn').addEventListener('click', () => {
            this.saveRound();
        });
    }

    updateGameSettingsVisibility() {
        const nertzSettings = document.getElementById('nertzSettings');
        const phase10Settings = document.getElementById('phase10Settings');
        const gameType = document.getElementById('gameType').value;
        if (gameType === 'nertz') {
            nertzSettings.style.display = '';
            phase10Settings.style.display = 'none';
        } else if (gameType === 'phase10') {
            nertzSettings.style.display = 'none';
            phase10Settings.style.display = '';
            // You can add Phase 10-specific settings here in the future
        }
    }


    updateWinningScoreDisplay() {
        document.getElementById('displayWinningScore').textContent = this.gameState.winningScore;
    }

    showAlert(title, message) {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertModal').classList.add('active');
    }

    showConfirm(title, message) {
        return new Promise((resolve) => {
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            const modal = document.getElementById('confirmModal');
            modal.classList.add('active');
            const handleConfirm = () => {
                modal.classList.remove('active');
                document.getElementById('confirmOkBtn').removeEventListener('click', handleConfirm);
                document.getElementById('confirmCancelBtn').removeEventListener('click', handleCancel);
                resolve(true);
            };
            const handleCancel = () => {
                modal.classList.remove('active');
                document.getElementById('confirmOkBtn').removeEventListener('click', handleConfirm);
                document.getElementById('confirmCancelBtn').removeEventListener('click', handleCancel);
                resolve(false);
            };
            document.getElementById('confirmOkBtn').addEventListener('click', handleConfirm);
            document.getElementById('confirmCancelBtn').addEventListener('click', handleCancel);
        });
    }

    newGame() {
        this.gameState.isActive = false;
        this.gameState.currentRound = 1;
        this.gameState.rounds = [];
        this.gameState.players = []; // Clear the players array for new game
        this.saveToStorage();
        this.showScreen('gameSetup');
        this.updateStartGameButton();
        this.renderPlayersList(); // Re-render the empty players list
    // Reset round display in case user returns to game screen
    const roundEl = document.getElementById('currentRound');
    if (roundEl) roundEl.textContent = '1';
    }
}

// Initialize the app
const app = new GameScoreTracker();
app.setupEventListeners();

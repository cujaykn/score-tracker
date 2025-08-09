// Game State Management
class NertzScoreTracker {
    constructor() {
        this.gameState = {
            isActive: false,
            winningScore: 100,
            currentRound: 1,
            players: [],
            rounds: [],
            recentPlayers: []
        };
        
        this.selectedIcon = null;
        this.chart = null;
        this.touchStartY = null;
        this.cameFromSave = false;
        
        this.loadFromStorage();
        this.initializeApp();
        this.setupEventListeners();
    }

    initializeApp() {
        this.updateWinningScoreDisplay();
        this.renderPlayersList();
        this.updateStartGameButton();
        
        // Check if there's an active game and restore the appropriate screen
        if (this.gameState.isActive && this.gameState.players.length > 0) {
            // Restore the game screen
            this.showScreen('gameScreen');
            this.renderScoreInputs();
            this.updateGameDisplay();
            this.updateCumulativeScores();
        } else {
            // Show the setup screen
            this.showScreen('gameSetup');
        }
    }

    // Storage Management
    saveToStorage() {
        localStorage.setItem('nertzGameState', JSON.stringify(this.gameState));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('nertzGameState');
        if (saved) {
            this.gameState = { ...this.gameState, ...JSON.parse(saved) };
        }
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Player Management
    addPlayer(name, icon) {
        if (this.gameState.players.length >= 12) {
            this.showAlert('Player Limit', 'Maximum 12 players allowed');
            return;
        }

        const player = {
            id: Date.now() + Math.random(),
            name: name,
            icon: icon,
            totalScore: 0
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

    removePlayer(playerId) {
        this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
        this.saveToStorage();
        this.renderPlayersList();
        this.updateStartGameButton();
    }

    renderPlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';

        this.gameState.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <div class="player-icon">
                    <i class="${player.icon}"></i>
                </div>
                <div class="player-name">${player.name}</div>
                <button class="remove-player" onclick="app.removePlayer(${player.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            playersList.appendChild(playerItem);
        });
    }

    updateStartGameButton() {
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = this.gameState.players.length < 2;
    }

    // Game Management
    startGame() {
        this.gameState.isActive = true;
        this.gameState.currentRound = 1;
        this.gameState.rounds = [];
        
        // Reset player scores
        this.gameState.players.forEach(player => {
            player.totalScore = 0;
        });

        this.saveToStorage();
        this.showScreen('gameScreen');
        this.renderScoreInputs();
        this.updateGameDisplay();
    }

    renderScoreInputs() {
        const container = document.getElementById('scoresContainer');
        container.innerHTML = '';

        this.gameState.players.forEach(player => {
            const scoreGroup = document.createElement('div');
            scoreGroup.className = 'score-input-group';
            scoreGroup.innerHTML = `
                <div class="score-player-info">
                    <div class="player-icon">
                        <i class="${player.icon}"></i>
                    </div>
                    <div class="player-name">${player.name}</div>
                </div>
                <input type="number" 
                       class="score-input" 
                       inputmode="numeric"
                       data-player-id="${player.id}"
                       placeholder="Score"
                       min="-26" 
                       max="52"
                       step="1">
                <div class="cumulative-score">${player.totalScore}</div>
            `;
            container.appendChild(scoreGroup);
        });

        // Add event listeners for score validation and navigation
        container.querySelectorAll('.score-input').forEach((input, index) => {
            input.addEventListener('input', (e) => this.validateScore(e.target));
            
            // Add keyboard navigation
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.navigateToNextInput(index);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateToPreviousInput(index);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateToNextInput(index);
                }
            });
            
            // Add touch navigation (swipe gestures)
            input.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
            });
            
            input.addEventListener('touchend', (e) => {
                if (this.touchStartY) {
                    const touchEndY = e.changedTouches[0].clientY;
                    const diff = this.touchStartY - touchEndY;
                    
                    if (Math.abs(diff) > 50) { // Minimum swipe distance
                        if (diff > 0) {
                            // Swipe up - next input
                            this.navigateToNextInput(index);
                        } else {
                            // Swipe down - previous input
                            this.navigateToPreviousInput(index);
                        }
                    }
                    this.touchStartY = null;
                }
            });
        });
    }

    validateScore(input) {
        const value = parseInt(input.value);
        input.classList.remove('valid', 'invalid');
        
        if (input.value === '') return;
        
        if (value >= -26 && value <= 52) {
            input.classList.add('valid');
        } else {
            input.classList.add('invalid');
        }
    }

    navigateToNextInput(currentIndex) {
        const inputs = document.querySelectorAll('.score-input');
        const nextIndex = (currentIndex + 1) % inputs.length;
        inputs[nextIndex].focus();
        inputs[nextIndex].select();
    }

    navigateToPreviousInput(currentIndex) {
        const inputs = document.querySelectorAll('.score-input');
        const prevIndex = currentIndex === 0 ? inputs.length - 1 : currentIndex - 1;
        inputs[prevIndex].focus();
        inputs[prevIndex].select();
    }

    saveRound() {
        const scoreInputs = document.querySelectorAll('.score-input');
        const roundScores = [];
        let allValid = true;

        // First, validate all inputs
        for (const input of scoreInputs) {
            const playerId = parseFloat(input.dataset.playerId); // Use parseFloat for decimal IDs
            const score = parseInt(input.value);
            
            if (isNaN(score) || score < -26 || score > 52) {
                allValid = false;
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
                roundScores.push({
                    playerId: playerId,
                    score: score
                });
            }
        }

        if (!allValid) {
            this.showAlert('Invalid Scores', 'Please enter valid scores for all players (-26 to 52)');
            return;
        }

        console.log('Saving round with scores:', roundScores);
        console.log('Current players:', this.gameState.players.map(p => ({ id: p.id, name: p.name, totalScore: p.totalScore })));

        // Save round
        this.gameState.rounds.push({
            roundNumber: this.gameState.currentRound,
            scores: roundScores
        });

        // Update player totals
        roundScores.forEach(scoreData => {
            const player = this.gameState.players.find(p => p.id === scoreData.playerId);
            if (player) {
                player.totalScore += scoreData.score;
                console.log(`Updated ${player.name}: ${player.totalScore - scoreData.score} + ${scoreData.score} = ${player.totalScore}`);
            } else {
                console.error('Player not found for ID:', scoreData.playerId, 'Available players:', this.gameState.players.map(p => ({ id: p.id, name: p.name })));
            }
        });

        console.log('Updated players:', this.gameState.players.map(p => ({ id: p.id, name: p.name, totalScore: p.totalScore })));

        // Increment the round number for the next round immediately after saving
        this.gameState.currentRound++;
        
        this.saveToStorage();
        this.checkForWinner();
        this.showRoundSaved();
    }

    showRoundSaved() {
        // Set flag to indicate we came from saving a round
        this.cameFromSave = true;
        
        // Go to stats page to show updated standings
        this.showStats();
    }

    nextRound() {
        this.cameFromSave = false; // Reset the flag
        this.saveToStorage();
        this.showScreen('gameScreen');
        this.renderScoreInputs();
        this.updateGameDisplay();
    }

    updateGameDisplay() {
        document.getElementById('currentRound').textContent = this.gameState.currentRound;
        document.getElementById('displayWinningScore').textContent = this.gameState.winningScore;
    }

    updateCumulativeScores() {
        const scoreGroups = document.querySelectorAll('.score-input-group');
        scoreGroups.forEach(group => {
            const playerId = parseFloat(group.querySelector('.score-input').dataset.playerId);
            const player = this.gameState.players.find(p => p.id === playerId);
            const cumulativeScore = group.querySelector('.cumulative-score');
            if (player) {
                cumulativeScore.textContent = player.totalScore;
            } else {
                console.error('Player not found for cumulative score update:', playerId);
            }
        });
    }

    checkForWinner() {
        const winner = this.gameState.players.find(player => 
            player.totalScore >= this.gameState.winningScore
        );

        if (winner) {
            this.showWinnerModal(winner);
        }
    }

    showWinnerModal(winner) {
        const modal = document.getElementById('winnerModal');
        const display = document.getElementById('winnerDisplay');
        
        display.innerHTML = `
            <div class="winner-icon">
                <i class="${winner.icon}"></i>
            </div>
            <h4>${winner.name}</h4>
            <div class="winner-score">${winner.totalScore}</div>
        `;
        
        modal.classList.add('active');
    }

    // Statistics
    showStats() {
        this.showScreen('statsScreen');
        this.renderCumulativeScores();
        this.renderScoreChart();
        
        // Show appropriate navigation button based on context
        const backBtn = document.getElementById('backToGameBtn');
        const nextBtn = document.getElementById('nextRoundFromStatsBtn');
        
        if (this.cameFromSave) {
            // Came from saving a round - show Next Round button
            backBtn.style.display = 'none';
            nextBtn.style.display = 'block';
        } else {
            // Came from View Stats button - show Back to Game button
            backBtn.style.display = 'block';
            nextBtn.style.display = 'none';
        }
    }

    renderCumulativeScores() {
        const container = document.getElementById('cumulativeScores');
        const header = document.getElementById('cumulativeScoresHeader');
        container.innerHTML = '';

        // Update header with round information
        const roundCount = this.gameState.rounds.length;
        if (roundCount === 0) {
            header.textContent = 'Leaderboard (No rounds played yet)';
        } else if (roundCount === 1) {
            header.textContent = `Leaderboard (After 1 Round)`;
        } else {
            header.textContent = `Leaderboard (After ${roundCount} Rounds)`;
        }

        // Sort players by score (highest first)
        const sortedPlayers = [...this.gameState.players].sort((a, b) => b.totalScore - a.totalScore);

        sortedPlayers.forEach(player => {
            const card = document.createElement('div');
            card.className = 'cumulative-score-card';
            card.innerHTML = `
                <div class="player-icon" style="margin: 0 auto 0.5rem auto;">
                    <i class="${player.icon}"></i>
                </div>
                <h4>${player.name}</h4>
                <div class="score">${player.totalScore}</div>
            `;
            container.appendChild(card);
        });
    }

    renderScoreChart() {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.gameState.rounds.map(round => `Round ${round.roundNumber}`);
        const datasets = this.gameState.players.map(player => {
            let cumulativeScore = 0;
            const data = this.gameState.rounds.map(round => {
                const scoreData = round.scores.find(s => s.playerId === player.id);
                if (scoreData) {
                    cumulativeScore += scoreData.score;
                }
                return cumulativeScore;
            });

            return {
                label: player.name,
                data: data,
                borderColor: this.getPlayerColor(player.id),
                backgroundColor: this.getPlayerColor(player.id, 0.1),
                borderWidth: 3,
                fill: false,
                tension: 0.1
            };
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Score Progression by Round'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Round'
                        }
                    }
                }
            }
        });
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

    // Modal Management
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

    // Event Listeners
    setupEventListeners() {
        // Setup screen
        document.getElementById('addPlayerBtn').addEventListener('click', () => {
            this.showAddPlayerModal();
        });

        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('winningScore').addEventListener('input', (e) => {
            this.gameState.winningScore = parseInt(e.target.value);
            this.updateWinningScoreDisplay();
        });

        // Game screen
        document.getElementById('saveRoundBtn').addEventListener('click', () => {
            this.saveRound();
        });

        document.getElementById('nextRoundBtn').addEventListener('click', () => {
            this.nextRound();
        });

        document.getElementById('viewStatsBtn').addEventListener('click', () => {
            this.cameFromSave = false; // Reset the flag
            this.showStats();
        });

        document.getElementById('newGameBtn').addEventListener('click', async () => {
            const confirmed = await this.showConfirm(
                'Start New Game', 
                'Are you sure you want to start a new game? Current game progress will be lost.'
            );
            if (confirmed) {
                this.newGame();
            }
        });

        // Stats screen
        document.getElementById('backToGameBtn').addEventListener('click', () => {
            this.showScreen('gameScreen');
        });

        document.getElementById('nextRoundFromStatsBtn').addEventListener('click', () => {
            this.cameFromSave = false; // Reset the flag
            this.nextRound();
        });

        // Alert and Confirm modal events
        document.getElementById('alertOkBtn').addEventListener('click', () => {
            document.getElementById('alertModal').classList.remove('active');
        });

        // Modal events
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideAddPlayerModal();
        });

        document.getElementById('confirmAddPlayerBtn').addEventListener('click', () => {
            this.confirmAddPlayer();
        });

        // Winner modal
        document.getElementById('newGameFromWinnerBtn').addEventListener('click', () => {
            document.getElementById('winnerModal').classList.remove('active');
            this.newGame();
        });

        document.getElementById('viewStatsFromWinnerBtn').addEventListener('click', () => {
            document.getElementById('winnerModal').classList.remove('active');
            this.showStats();
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    updateWinningScoreDisplay() {
        document.getElementById('displayWinningScore').textContent = this.gameState.winningScore;
    }

    // Custom Alert and Confirm functions
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
    }
}

// Initialize the app
const app = new NertzScoreTracker(); 

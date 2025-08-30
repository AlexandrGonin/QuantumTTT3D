import { initAuth, api } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
        this.currentLobby = null;
        this.currentView = 'main';
        this.init();
    }

    async init() {
        try {
            console.log('Initializing app...');
            
            if (!window.Telegram || !Telegram.WebApp) {
                this.showError('Please open in Telegram');
                return;
            }

            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            // Сразу скрываем экран аутентификации после загрузки
            document.getElementById('auth-screen').classList.remove('active');
            
            this.user = await initAuth(Telegram.WebApp.initData);
            this.showMainMenu();
            
            // Глобальные функции
            window.createLobby = () => this.showCreateLobby();
            window.joinLobby = () => this.showJoinLobby();
            window.backToMain = () => this.showMainMenu();
            window.confirmCreateLobby = () => this.confirmCreateLobby();
            window.confirmJoinLobby = () => this.confirmJoinLobby();
            window.shareLobby = () => this.shareLobby();
            window.leaveLobby = () => this.leaveLobby();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    showMainMenu() {
        this.currentView = 'main';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container clickable">
                <div class="user-card">
                    <div class="user-avatar">👤</div>
                    <div class="user-info">
                        <div class="user-name">${this.user.first_name}${this.user.last_name ? ' ' + this.user.last_name : ''}</div>
                        <div class="user-username">${this.user.username ? '@' + this.user.username : ''}</div>
                    </div>
                </div>

                <div class="menu-buttons">
                    <button class="menu-btn primary" onclick="createLobby()">
                        <span class="btn-icon">➕</span>
                        Create Lobby
                    </button>
                    <button class="menu-btn secondary" onclick="joinLobby()">
                        <span class="btn-icon">🔍</span>
                        Join Lobby
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('game-screen').classList.add('active');
    }

    showCreateLobby() {
        this.currentView = 'create-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container clickable">
                <div class="form-card">
                    <h2 class="form-title">Create Lobby</h2>
                    
                    <div class="input-group">
                        <label for="lobbyName">Lobby Name</label>
                        <input type="text" id="lobbyName" placeholder="Enter lobby name" value="Quantum Game" class="text-input">
                    </div>

                    <div class="form-buttons">
                        <button class="btn secondary" onclick="backToMain()">
                            <span class="btn-icon">←</span>
                            Back
                        </button>
                        <button class="btn primary" onclick="confirmCreateLobby()">
                            <span class="btn-icon">🎮</span>
                            Create
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async confirmCreateLobby() {
        const lobbyNameInput = document.getElementById('lobbyName');
        const lobbyName = lobbyNameInput ? lobbyNameInput.value.trim() : 'Quantum Lobby';
        
        if (!lobbyName) {
            this.showError('Please enter lobby name');
            return;
        }

        try {
            const response = await api.createLobby(this.user.id, lobbyName);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.showLobbyView();
            }
            
        } catch (error) {
            console.error('Create lobby error:', error);
            this.showError('Failed to create lobby: ' + error.message);
        }
    }

    showJoinLobby() {
        this.currentView = 'join-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container clickable">
                <div class="form-card">
                    <h2 class="form-title">Join Lobby</h2>
                    
                    <div class="input-group">
                        <label for="lobbyCode">Lobby Code</label>
                        <input type="text" id="lobbyCode" placeholder="Enter lobby code" class="text-input">
                    </div>

                    <div class="form-buttons">
                        <button class="btn secondary" onclick="backToMain()">
                            <span class="btn-icon">←</span>
                            Back
                        </button>
                        <button class="btn primary" onclick="confirmJoinLobby()">
                            <span class="btn-icon">🚪</span>
                            Join
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async confirmJoinLobby() {
        const lobbyCodeInput = document.getElementById('lobbyCode');
        const lobbyCode = lobbyCodeInput ? lobbyCodeInput.value.trim() : '';
        
        if (!lobbyCode) {
            this.showError('Please enter lobby code');
            return;
        }

        try {
            const response = await api.joinLobby(this.user.id, lobbyCode);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.showLobbyView();
            }
            
        } catch (error) {
            console.error('Join lobby error:', error);
            this.showError('Failed to join lobby: ' + error.message);
        }
    }

    showLobbyView() {
        if (!this.currentLobby) return;
        
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container clickable">
                <div class="lobby-card">
                    <h2 class="lobby-title">${this.currentLobby.name}</h2>
                    <div class="lobby-id">ID: ${this.currentLobby.id}</div>
                    
                    <div class="players-list">
                        <h3>Players (${this.currentLobby.players.length}/2)</h3>
                        ${this.currentLobby.players.map(player => `
                            <div class="player-item ${player.id === this.user.id ? 'current-player' : ''}">
                                <span class="player-avatar">👤</span>
                                <span class="player-name">${player.first_name}</span>
                                ${player.id === this.currentLobby.creator ? '<span class="player-badge">Host</span>' : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div class="lobby-actions">
                        <button class="btn share-btn" onclick="shareLobby()">
                            <span class="btn-icon">📤</span>
                            Invite Friends
                        </button>
                        
                        <button class="btn danger" onclick="leaveLobby()">
                            <span class="btn-icon">🚪</span>
                            Leave Lobby
                        </button>
                    </div>

                    <div class="lobby-status">
                        ${this.currentLobby.players.length === 2 ? 
                            '✅ Ready to start' : 
                            '⏳ Waiting for players...'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    async shareLobby() {
        if (!this.currentLobby) return;

        try {
            const shareText = `Join my Quantum Tic-Tac-Toe game! 🎮\nLobby: ${this.currentLobby.name}\nCode: ${this.currentLobby.id}`;
            
            Telegram.WebApp.openLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`);
            
        } catch (error) {
            console.error('Share error:', error);
            Telegram.WebApp.showPopup({
                title: 'Invite Friends',
                message: `Share this lobby code:\n${this.currentLobby.id}`
            });
        }
    }

    async leaveLobby() {
        try {
            if (!this.currentLobby) return;
            
            await api.leaveLobby(this.user.id, this.currentLobby.id);
            this.currentLobby = null;
            
            this.showMainMenu();
            
        } catch (error) {
            console.error('Leave lobby error:', error);
            this.showError('Failed to leave lobby');
        }
    }

    showError(message) {
        Telegram.WebApp.showPopup({
            title: 'Error',
            message: message
        });
    }
}

// Initialize the app
const app = new QuantumTicTacToe();
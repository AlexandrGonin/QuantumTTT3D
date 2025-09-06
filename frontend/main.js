import { initAuth, api, createWebSocketConnection } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
        this.socket = null;
        this.currentLobby = null;
        this.currentView = 'auth';
        this.game = null;
        this.selectedLayer = 1;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.heartbeatInterval = null;
        this.init();
    }

    async init() {
        try {
            if (!window.Telegram || !Telegram.WebApp) {
                this.showError('Please open in Telegram');
                return;
            }

            this.disableZoom();
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            this.showAuthScreen();
            
            // Глобальные функции для UI
            window.createLobby = () => this.showCreateLobby();
            window.joinLobby = () => this.showJoinLobby();
            window.leaveLobby = () => this.leaveLobby();
            window.confirmCreateLobby = () => this.confirmCreateLobby();
            window.confirmJoinLobby = () => this.confirmJoinLobby();
            window.backToMain = () => this.showMainMenu();
            window.startGame = () => this.startGame();
            window.selectLayer = (layer) => this.selectLayer(layer);
            window.makeMove = (x, y, z) => this.makeMove(x, y, z);
            window.retryAuth = () => this.retryAuth();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize game');
        }
    }

    showAuthScreen() {
        this.currentView = 'auth';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = '';
        
        const authScreenDiv = document.getElementById('auth-screen');
        authScreenDiv.classList.add('active');
        document.getElementById('game-screen').classList.remove('active');

        // Автоматическая аутентификация
        this.authenticate();
    }

    async authenticate() {
        try {
            const initData = Telegram.WebApp?.initData;
            if (!initData) throw new Error('Telegram initData not found');

            this.user = await initAuth(initData);
            this.showMainMenu();
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError('Authentication failed. Please try again.', error.message);
        }
    }

    showAuthError(message, detail = '') {
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container">
                <div class="auth-container">
                    <h2>🎮 Quantum 3D Tic-Tac-Toe</h2>
                    <p style="color: #ff6b6b; margin-bottom: 20px;">${message}</p>
                    ${detail ? `<p style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 20px;">${detail}</p>` : ''}
                    <button class="btn primary" onclick="retryAuth()">🔄 Try Again</button>
                    <button class="btn secondary" style="margin-top: 10px;" onclick="window.location.reload()">↻ Reload App</button>
                </div>
            </div>
        `;
    }

    retryAuth() {
        this.showAuthScreen();
    }

    disableZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        document.addEventListener('touchstart', e => { if(e.touches.length > 1) e.preventDefault(); }, { passive: false });
        document.addEventListener('gesturestart', e => e.preventDefault());
    }

    showMainMenu() {
        this.currentView = 'main';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container">
                <div class="user-card">
                    <div class="user-avatar">👤</div>
                    <div class="user-info">
                        <div class="user-name">${this.user.first_name}${this.user.last_name ? ' ' + this.user.last_name : ''}</div>
                        <div class="user-username">${this.user.username ? '@' + this.user.username : ''}</div>
                    </div>
                </div>

                <div class="menu-buttons">
                    <button class="menu-btn primary" onclick="createLobby()">➕ Create Lobby</button>
                    <button class="menu-btn secondary" onclick="joinLobby()">🔢 Join by Code</button>
                </div>
            </div>
        `;
        
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }

    showCreateLobby() {
        this.currentView = 'create-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container">
                <div class="form-card">
                    <h2 class="form-title">Create Lobby</h2>
                    <div class="input-group">
                        <label for="lobbyName">Lobby Name</label>
                        <input type="text" id="lobbyName" placeholder="Enter lobby name" value="Quantum Game" class="text-input">
                    </div>
                    <div class="form-buttons">
                        <button class="btn secondary" onclick="backToMain()">← Back</button>
                        <button class="btn primary" onclick="confirmCreateLobby()">🎮 Create</button>
                    </div>
                </div>
            </div>
        `;
    }

    showJoinLobby() {
        this.currentView = 'join-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container">
                <div class="form-card">
                    <h2 class="form-title">Join Lobby</h2>
                    <div class="input-group">
                        <label for="lobbyCode">Lobby Code</label>
                        <input type="text" id="lobbyCode" placeholder="Enter lobby code" class="text-input">
                    </div>
                    <div class="form-buttons">
                        <button class="btn secondary" onclick="backToMain()">← Back</button>
                        <button class="btn primary" onclick="confirmJoinLobby()">🚪 Join</button>
                    </div>
                </div>
            </div>
        `;
    }

    async confirmCreateLobby() {
        const lobbyNameInput = document.getElementById('lobbyName');
        const lobbyName = lobbyNameInput ? lobbyNameInput.value.trim() : 'Quantum Lobby';
        if (!lobbyName) { this.showError('Please enter lobby name'); return; }
        try {
            const response = await api.createLobby(this.user.id, lobbyName);
            if (response.success) {
                this.currentLobby = response.lobby;
                this.setupWebSocket();
                this.showLobbyView();
            }
        } catch (error) {
            console.error('Create lobby error:', error);
            this.showError('Failed to create lobby: ' + error.message);
        }
    }

    async confirmJoinLobby() {
        const lobbyCodeInput = document.getElementById('lobbyCode');
        const lobbyCode = lobbyCodeInput ? lobbyCodeInput.value.trim() : '';
        if (!lobbyCode) { this.showError('Please enter lobby code'); return; }
        try {
            const response = await api.joinLobby(this.user.id, lobbyCode);
            if (response.success) {
                this.currentLobby = response.lobby;
                this.setupWebSocket();
                this.showLobbyView();
            }
        } catch (error) {
            console.error('Join lobby error:', error);
            this.showError('Failed to join lobby: ' + error.message);
        }
    }

    showLobbyView() {
        const isHost = this.currentLobby.host === this.user.id;
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="center-container">
                <div class="lobby-card">
                    <h2 class="lobby-title">${this.currentLobby.name}</h2>
                    <div class="lobby-id">Code: ${this.currentLobby.id}</div>
                    <div class="players-list">
                        <h3>Players (${this.currentLobby.players.length}/2)</h3>
                        ${this.currentLobby.players.map(player => `
                            <div class="player-item ${player.id === this.user.id ? 'current-player' : ''}">
                                <span class="player-avatar">${player.id === this.currentLobby.host ? '👑' : '👤'}</span>
                                <span class="player-name">${player.first_name}</span>
                                ${player.id === this.currentLobby.host ? '<span class="player-badge">Host</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="lobby-status">
                        ${this.currentLobby.players.length === 2 ? '✅ Ready to start' : '⏳ Waiting for players...'}
                    </div>
                    <div class="lobby-actions">
                        ${isHost && this.currentLobby.players.length === 2 ? `
                            <button class="btn primary" onclick="startGame()">🚀 Start Game</button>
                        ` : ''}
                        <button class="btn danger" onclick="leaveLobby()">❌ Leave Lobby</button>
                    </div>
                </div>
            </div>
        `;
    }

    async startGame() {
        if (!this.currentLobby) return;
        try {
            const response = await api.startGame(this.user.id, this.currentLobby.id);
            if (response.success) {
                this.init3DGame(response.gameState);
            }
        } catch (error) {
            console.error('Start game error:', error);
            this.showError('Failed to start game: ' + error.message);
        }
    }

    init3DGame(gameState) {
        const canvas = document.getElementById('game-canvas');
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(3, 3, 5);

        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
        this.renderer.setSize(width, height);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const gridHelper = new THREE.GridHelper(3, 3, 0xffffff, 0xffffff);
        this.scene.add(gridHelper);

        this.game = gameState;

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.renderer) this.renderer.render(this.scene, this.camera);
    }

    selectLayer(layer) {
        this.selectedLayer = layer;
        console.log('Selected layer', layer);
    }

    async makeMove(x, y, z) {
        if (!this.socket) return;
        this.socket.send(JSON.stringify({ type: 'move', x, y, z }));
    }

    async leaveLobby() {
        if (!this.currentLobby) return;
        try {
            await api.leaveLobby(this.user.id, this.currentLobby.id);
            this.currentLobby = null;
            this.showMainMenu();
        } catch (error) {
            console.error('Leave lobby error:', error);
            this.showError('Failed to leave lobby: ' + error.message);
        }
    }

    async setupWebSocket() {
        try {
            this.socket = await createWebSocketConnection();

            this.socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                console.log('WebSocket message:', msg);
            };

            this.socket.onclose = () => {
                console.log('WebSocket closed, attempting reconnect...');
                setTimeout(() => this.setupWebSocket(), 2000);
            };

        } catch (error) {
            console.error('WebSocket setup failed:', error);
        }
    }

    showError(message) {
        alert(message);
    }

    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

const app = new QuantumTicTacToe();
window.addEventListener('resize', () => app.handleResize());

// main.js
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
            
            // Показываем экран аутентификации
            this.showAuthScreen();
            
            // Глобальные функции
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
        overlay.innerHTML = 
            `<div class="center-container">
                <div class="auth-container">
                    <h2>🎮 Quantum 3D Tic-Tac-Toe</h2>
                    <p>Authenticating with Telegram...</p>
                    <div class="auth-loading">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>`;
        
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
        
        // Автоматическая аутентификация
        this.authenticate();
    }

    async authenticate() {
        try {
            this.user = await initAuth(Telegram.WebApp.initData);
            this.showMainMenu();
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError('Authentication failed. Please try again.', error.message);
        }
    }

    showAuthError(message, detail = '') {
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = 
            `<div class="center-container">
                <div class="auth-container">
                    <h2>🎮 Quantum 3D Tic-Tac-Toe</h2>
                    <p style="color: #ff6b6b; margin-bottom: 20px;">${message}</p>
                    ${detail ? `<p style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 20px;">${detail}</p>` : ''}
                    <button class="btn primary" onclick="retryAuth()">
                        <span class="btn-icon">🔄</span>
                        Try Again
                    </button>
                    <button class="btn secondary" style="margin-top: 10px;" onclick="window.location.reload()">
                        <span class="btn-icon">↻</span>
                        Reload App
                    </button>
                </div>
            </div>`;
    }

    retryAuth() {
        this.showAuthScreen();
    }

    disableZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
    }

    showMainMenu() {
        this.currentView = 'main';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = 
            `<div class="center-container">
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
                        <span class="btn-icon">🔢</span>
                        Join by Code
                    </button>
                </div>
            </div>`;
        
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }

    showCreateLobby() {
        this.currentView = 'create-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = 
            `<div class="center-container">
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
            </div>`;
    }

    showJoinLobby() {
        this.currentView = 'join-lobby';
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = 
            `<div class="center-container">
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
            </div>`;
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
        
        if (!lobbyCode) {
            this.showError('Please enter lobby code');
            return;
        }

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
        
        overlay.innerHTML = 
            `<div class="center-container">
                <div class="lobby-card">
                    <h2 class="lobby-title">${this.currentLobby.name}</h2>
                    <div class="lobby-id">Code: ${this.currentLobby.id}</div>
                    
                    <div class="players-list">
                        <h3>Players (${this.currentLobby.players.length}/2)</h3>
                        ${this.currentLobby.players.map(player => 
                            `<div class="player-item ${player.id === this.user.id ? 'current-player' : ''}">
                                <span class="player-avatar">${player.id === this.currentLobby.host ? '👑' : '👤'}</span>
                                <span class="player-name">${player.first_name}</span>
                                ${player.id === this.currentLobby.host ? '<span class="player-badge">Host</span>' : ''}
                            </div>`
                        ).join('')}
                    </div>

                    <div class="lobby-status">
                        ${this.currentLobby.players.length === 2 ? 
                            '✅ Ready to start' : 
                            '⏳ Waiting for players...'
                        }
                    </div>

                    <div class="lobby-actions">
                        ${isHost && this.currentLobby.players.length === 2 ? 
                            `<button class="btn primary" onclick="startGame()">
                                <span class="btn-icon">🚀</span>
                                Start Game
                            </button>`
                         : ''}

                        <button class="btn danger" onclick="leaveLobby()">
                            <span class="btn-icon">🚪</span>
                            Leave Lobby
                        </button>
                    </div>
                </div>
            </div>`;
    }

    async startGame() {
        try {
            if (!this.currentLobby || this.currentLobby.host !== this.user.id) return;
            
            const response = await api.startGame(this.user.id, this.currentLobby.id);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.init3DGame();
            }
            
        } catch (error) {
            console.error('Start game error:', error);
            this.showError('Failed to start game: ' + error.message);
        }
    }

    init3DGame() {
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = 
            `<div class="game-controls-top">
                <div class="layer-selector">
                    <label class="layer-radio">
                        <input type="radio" name="layer" value="1" ${this.selectedLayer === 1 ? 'checked' : ''} onchange="selectLayer(1)">
                        <span>Layer 1</span>
                    </label>
                    <label class="layer-radio">
                        <input type="radio" name="layer" value="2" ${this.selectedLayer === 2 ? 'checked' : ''} onchange="selectLayer(2)">
                        <span>Layer 2</span>
                    </label>
                    <label class="layer-radio">
                        <input type="radio" name="layer" value="3" ${this.selectedLayer === 3 ? 'checked' : ''} onchange="selectLayer(3)">
                        <span>Layer 3</span>
                    </label>
                </div>
            </div>
            <div class="game-controls-bottom">
                <div class="game-status">
                    ${this.getCurrentPlayerSymbol() === 'X' ? 'Your turn (X)' : 'Waiting for opponent (O)'}
                </div>
                <button class="btn danger" onclick="leaveLobby()">
                    <span class="btn-icon">←</span>
                    Leave Game
                </button>
            </div>`;

        this.initThreeJS();
    }

    selectLayer(layer) {
        this.selectedLayer = layer;
        console.log('Selected layer:', layer);
    }

    getCurrentPlayerSymbol() {
        if (!this.currentLobby?.gameState) return '';
        const currentPlayer = this.currentLobby.gameState.players.find(p => p.id === this.user.id);
        return currentPlayer ? currentPlayer.symbol : '';
    }

    initThreeJS() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        this.cleanupGame();

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        this.createGameBoard(scene);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        camera.position.set(4, 4, 4);
        camera.lookAt(0, 0, 0);

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const onPointerDown = (event) => {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX || event.touches[0].clientX,
                y: event.clientY || event.touches[0].clientY
            };
            event.preventDefault();
        };

        const onPointerMove = (event) => {
            if (!isDragging) return;

            const clientX = event.clientX || (event.touches && event.touches[0].clientX);
            const clientY = event.clientY || (event.touches && event.touches[0].clientY);

            const deltaMove = {
                x: clientX - previousMousePosition.x,
                y: clientY - previousMousePosition.y
            };

            scene.rotation.y += deltaMove.x * 0.01;
            scene.rotation.x += deltaMove.y * 0.01;

            previousMousePosition = { x: clientX, y: clientY };
            event.preventDefault();
        };

        const onPointerUp = () => {
            isDragging = false;
        };

        const handleMouseDown = (e) => onPointerDown(e);
        const handleMouseMove = (e) => onPointerMove(e);
        const handleMouseUp = () => onPointerUp();
        
        const handleTouchStart = (e) => onPointerDown(e.touches[0]);
        const handleTouchMove = (e) => onPointerMove(e.touches[0]);
        const handleTouchEnd = () => onPointerUp();

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        animate();

        this.game = { 
            scene, camera, renderer, animate,
            eventListeners: {
                mousedown: handleMouseDown, mousemove: handleMouseMove, mouseup: handleMouseUp,
                touchstart: handleTouchStart, touchmove: handleTouchMove, touchend: handleTouchEnd
            }
        };
    }

    createGameBoard(scene) {
        const cellSize = 0.8;
        const spacing = 1.0;
        
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    this.createCell(scene, x, y, z, cellSize, spacing);
                }
            }
        }
    }

    createCell(scene, x, y, z, size, spacing) {
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({
            color: 0x1e88e5,
            transparent: true,
            opacity: 0.3,
            wireframe: false
        });

        const cell = new THREE.Mesh(geometry, material);
        cell.position.set(x * spacing, y * spacing, z * spacing);
        cell.userData = { x, y, z, occupied: false, symbol: null };
        
        scene.add(cell);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        cell.add(line);
    }

    makeMove(x, y, z) {
        if (!this.currentLobby?.gameState) return;
        
        const currentPlayer = this.currentLobby.gameState.players.find(p => p.id === this.user.id);
        if (!currentPlayer) return;
        
        const currentPlayerIndex = this.currentLobby.gameState.players.findIndex(p => p.id === this.currentLobby.gameState.currentPlayer);
        if (this.user.id !== this.currentLobby.gameState.currentPlayer) {
            this.showError("Not your turn!");
            return;
        }

        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'game_move',
                lobbyId: this.currentLobby.id,
                userId: this.user.id,
                move: { x, y, z, symbol: currentPlayer.symbol }
            }));
        }
    }

    async leaveLobby() {
        try {
            if (this.currentLobby) {
                await api.leaveLobby(this.user.id, this.currentLobby.id);
            }
            
            this.cleanupGame();
            this.currentLobby = null;
            this.showMainMenu();
            
        } catch (error) {
            console.error('Leave lobby error:', error);
            this.showError('Failed to leave lobby');
        }
    }

    cleanupGame() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.socket) {
            this.socket.close(1000, 'User left game');
            this.socket = null;
        }

        if (this.game) {
            const canvas = document.getElementById('game-canvas');
            if (canvas && this.game.eventListeners) {
                canvas.removeEventListener('mousedown', this.game.eventListeners.mousedown);
                canvas.removeEventListener('mousemove', this.game.eventListeners.mousemove);
                canvas.removeEventListener('mouseup', this.game.eventListeners.mouseup);
                canvas.removeEventListener('touchstart', this.game.eventListeners.touchstart);
                canvas.removeEventListener('touchmove', this.game.eventListeners.touchmove);
                canvas.removeEventListener('touchend', this.game.eventListeners.touchend);
            }

            if (this.game.renderer) {
                this.game.renderer.dispose();
                const canvas = document.getElementById('game-canvas');
                if (canvas) {
                    const context = canvas.getContext('webgl');
                    if (context) {
                        context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
                    }
                    canvas.width = canvas.width;
                }
            }
            
            cancelAnimationFrame(this.game.animate);
            this.game = null;
        }

        const overlay = document.getElementById('ui-overlay');
        if (overlay) overlay.innerHTML = '';
    }

    async setupWebSocket() {
        if (!this.currentLobby) return;
        
        try {
            this.socket = await createWebSocketConnection();
            this.reconnectAttempts = 0;
            
            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                
                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                    this.heartbeatInterval = null;
                }

                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectWebSocket();
                } else if (this.currentLobby) {
                    console.log('Max reconnection attempts reached');
                    this.showError('Connection lost. Returning to main menu.');
                    this.leaveLobby();
                }
            };

            // После подключения отправляем join_lobby
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'join_lobby',
                        lobbyId: this.currentLobby.id,
                        userId: this.user.id,
                        initData: Telegram.WebApp.initData
                    }));
                }
            }, 100);

            // Запускаем heartbeat
            this.startHeartbeat();
            
        } catch (error) {
            console.error('WebSocket setup error:', error);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectWebSocket();
            } else {
                this.showError('Failed to connect to game server');
            }
        }
    }

    reconnectWebSocket() {
        this.reconnectAttempts++;
        console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
        
        setTimeout(() => {
            if (this.currentLobby) {
                this.setupWebSocket();
            }
        }, 2000 * this.reconnectAttempts);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, 15000);
    }

    handleWebSocketMessage(message) {
        console.log('Processing message:', message.type);
        
        switch (message.type) {
            case 'connected':
                console.log('WebSocket connected successfully');
                break;
                
            case 'lobby_joined':
                console.log('Successfully joined lobby via WebSocket');
                break;
                
            case 'player_joined':
            case 'player_left':
                this.currentLobby = message.lobby;
                this.showLobbyView();
                break;
                
            case 'game_started':
                this.currentLobby = message.lobby;
                this.init3DGame();
                break;
                
            case 'game_update':
                this.currentLobby.gameState = message.gameState;
                this.updateGameView();
                break;
                
            case 'game_ended':
                this.currentLobby = message.lobby;
                this.cleanupGame();
                this.showLobbyView();
                break;
                
            case 'error':
                console.error('WebSocket error:', message.message);
                this.showError(message.message || 'Server error');
                break;
                
            case 'heartbeat_ack':
                // Подтверждение heartbeat
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    updateGameView() {
        const gameStatus = document.querySelector('.game-status');
        if (gameStatus) {
            gameStatus.textContent = this.getCurrentPlayerSymbol() === 'X' ? 
                'Your turn (X)' : 'Waiting for opponent (O)';
        }
    }

    showError(message) {
        Telegram.WebApp.showPopup({
            title: 'Error',
            message: message
        });
    }

    handleResize() {
        if (this.game && this.game.camera && this.game.renderer) {
            this.game.camera.aspect = window.innerWidth / window.innerHeight;
            this.game.camera.updateProjectionMatrix();
            this.game.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

const app = new QuantumTicTacToe();
window.addEventListener('resize', () => app.handleResize());
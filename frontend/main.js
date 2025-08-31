import { initAuth, api, createWebSocketConnection } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
        this.socket = null;
        this.currentLobby = null;
        this.currentView = 'main';
        this.game = null;
        this.init();
    }

    async init() {
        try {
            if (!window.Telegram || !Telegram.WebApp) {
                this.showError('Please open in Telegram');
                return;
            }

            // Отключаем масштабирование
            this.disableZoom();
            
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            this.user = await initAuth(Telegram.WebApp.initData);
            this.showMainMenu();
            
            // Глобальные функции
            window.createLobby = () => this.showCreateLobby();
            window.joinLobby = () => this.showJoinLobby();
            window.leaveLobby = () => this.leaveLobby();
            window.showLobbyList = () => this.showLobbyList();
            window.confirmCreateLobby = () => this.confirmCreateLobby();
            window.confirmJoinLobby = () => this.confirmJoinLobby();
            window.backToMain = () => this.showMainMenu();
            window.startGame = () => this.startGame();
            window.joinLobbyById = (lobbyId) => this.joinLobby(lobbyId);
            
        } catch (error) {
            console.error('Initialization error:', error);
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to authenticate. Please try again.',
            });
        }
    }

    // Отключаем масштабирование на телефоне
    disableZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        // Дополнительная защита от масштабирования
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
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
                    <button class="menu-btn primary" onclick="createLobby()">
                        <span class="btn-icon">➕</span>
                        Create Lobby
                    </button>
                    <button class="menu-btn secondary" onclick="showLobbyList()">
                        <span class="btn-icon">🔍</span>
                        Join Lobby
                    </button>
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

    async showLobbyList() {
        try {
            const response = await api.getLobbies();
            
            if (!response.lobbies || response.lobbies.length === 0) {
                Telegram.WebApp.showPopup({
                    title: 'No Lobbies',
                    message: 'No available lobbies. Create one first!'
                });
                this.showJoinLobby();
                return;
            }

            this.currentView = 'lobby-list';
            const overlay = document.getElementById('ui-overlay');
            
            const lobbiesHtml = response.lobbies.map(lobby => `
                <div class="lobby-item" onclick="joinLobbyById('${lobby.id}')">
                    <div class="lobby-info">
                        <div class="lobby-name">${lobby.name}</div>
                        <div class="lobby-players">${lobby.players || 0}/2 players</div>
                    </div>
                    <div class="lobby-join">→</div>
                </div>
            `).join('');

            overlay.innerHTML = `
                <div class="center-container">
                    <div class="list-card">
                        <h2 class="form-title">Available Lobbies</h2>
                        
                        <div class="lobby-list">
                            ${lobbiesHtml}
                        </div>

                        <div class="form-buttons">
                            <button class="btn secondary" onclick="showJoinLobby()">
                                <span class="btn-icon">🔢</span>
                                Enter Code
                            </button>
                            <button class="btn secondary" onclick="backToMain()">
                                <span class="btn-icon">←</span>
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Lobby list error:', error);
            this.showJoinLobby();
        }
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
                
                Telegram.WebApp.showPopup({
                    title: 'Lobby Created',
                    message: `Lobby Code: ${this.currentLobby.id}`
                });
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

        await this.joinLobby(lobbyCode);
    }

    async joinLobby(lobbyId) {
        try {
            console.log('Joining lobby:', lobbyId);
            
            const response = await api.joinLobby(this.user.id, lobbyId);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.setupWebSocket();
                this.showLobbyView();
                
                Telegram.WebApp.showPopup({
                    title: 'Success',
                    message: `Joined lobby: ${this.currentLobby.name}`
                });
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
                                <span class="player-avatar">👤</span>
                                <span class="player-name">${player.first_name}</span>
                                ${player.id === this.currentLobby.host ? '<span class="player-badge">Host</span>' : ''}
                            </div>
                        `).join('')}
                    </div>

                    <div class="lobby-status">
                        ${this.currentLobby.players.length === 2 ? 
                            '✅ Ready to start' : 
                            '⏳ Waiting for players...'
                        }
                    </div>

                    ${isHost && this.currentLobby.players.length === 2 ? `
                        <button class="btn primary" onclick="startGame()">
                            <span class="btn-icon">🚀</span>
                            Start Game
                        </button>
                    ` : ''}

                    <button class="btn danger" onclick="leaveLobby()">
                        <span class="btn-icon">🚪</span>
                        Leave Lobby
                    </button>
                </div>
            </div>
        `;
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
        overlay.innerHTML = `
            <div class="center-container">
                <div class="game-container">
                    <h2>Quantum 3D Tic-Tac-Toe</h2>
                    <p>Rotate the cube with your finger</p>
                    <div class="game-controls">
                        <button class="btn danger" onclick="leaveLobby()">
                            <span class="btn-icon">←</span>
                            Leave Game
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.initThreeJS();
    }

    initThreeJS() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        // Очищаем предыдущую сцену
        if (this.game) {
            canvas.innerHTML = '';
        }

        // Создаем сцену Three.js
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Создаем куб
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Добавляем освещение
        const light = new THREE.AmbientLight(0x404040);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        camera.position.z = 5;

        // Переменные для управления вращением
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotationSpeed = 0.02;

        // Обработчики событий для вращения куба
        const onMouseDown = (event) => {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onMouseMove = (event) => {
            if (!isDragging) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            cube.rotation.y += deltaMove.x * 0.01;
            cube.rotation.x += deltaMove.y * 0.01;

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        // Добавляем обработчики событий
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        // Для touch устройств
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            onMouseDown(event.touches[0]);
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            onMouseMove(event.touches[0]);
        });

        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            onMouseUp();
        });

        // Анимация
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (!isDragging) {
                // Медленное автоматическое вращение
                cube.rotation.x += rotationSpeed * 0.1;
                cube.rotation.y += rotationSpeed * 0.1;
            }
            
            renderer.render(scene, camera);
        };

        animate();

        this.game = { scene, camera, renderer, cube, animate };
    }

    async leaveLobby() {
        try {
            if (!this.currentLobby) return;
            
            await api.leaveLobby(this.user.id, this.currentLobby.id);
            this.currentLobby = null;
            
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            
            if (this.game) {
                // Очищаем 3D сцену
                this.game.renderer.dispose();
                this.game = null;
            }
            
            this.showMainMenu();
            
        } catch (error) {
            console.error('Leave lobby error:', error);
            this.showError('Failed to leave lobby');
        }
    }

    setupWebSocket() {
        if (!this.currentLobby) return;
        
        this.socket = createWebSocketConnection();
        
        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({
                type: 'join_lobby',
                lobbyId: this.currentLobby.id,
                userId: this.user.id
            }));
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'player_joined':
            case 'player_left':
                this.currentLobby = message.lobby;
                this.showLobbyView();
                break;
                
            case 'game_started':
                this.currentLobby = message.lobby;
                this.init3DGame();
                break;
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
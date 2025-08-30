import { initAuth, api, createWebSocketConnection } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
        this.socket = null;
        this.currentLobby = null;
        this.init();
    }

    async init() {
        try {
            if (!window.Telegram || !Telegram.WebApp) {
                this.showError('Please open in Telegram');
                return;
            }

            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            this.user = await initAuth(Telegram.WebApp.initData);
            this.showGameInterface(this.user);
            
            // Делаем методы доступными глобально
            window.createLobby = () => this.createLobby();
            window.joinLobby = () => this.joinLobby();
            window.leaveLobby = () => this.leaveLobby();
            window.showLobbyList = () => this.showLobbyList();
            
        } catch (error) {
            console.error('Initialization error:', error);
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to authenticate. Please try again.',
            });
        }
    }

    showGameInterface(user) {
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
            <div class="user-info">
                👤 ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}
                ${user.username ? `(@${user.username})` : ''}
            </div>
            <div class="game-controls">
                <button onclick="createLobby()">Create Lobby</button>
                <button onclick="showLobbyList()">Join Lobby</button>
            </div>
            ${this.currentLobby ? `
                <div class="lobby-info">
                    <h3>Lobby: ${this.currentLobby.id}</h3>
                    <p>Players: ${this.currentLobby.players.length}/2</p>
                    <button onclick="leaveLobby()">Leave Lobby</button>
                </div>
            ` : ''}
        `;
        
        document.getElementById('game-screen').classList.add('active');
    }

    async createLobby() {
        try {
            const result = await Telegram.WebApp.showPopup({
                title: 'Create Lobby',
                message: 'Enter lobby name:',
                buttons: [{ type: 'default', text: 'Create' }]
            });
            
            if (result === undefined) return; // User cancelled
            
            const lobbyName = result || 'Quantum Lobby';
            const response = await api.createLobby(this.user.id, lobbyName);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.setupWebSocket();
                
                Telegram.WebApp.showPopup({
                    title: 'Lobby Created',
                    message: `ID: ${response.lobbyId}\nShare this ID with friends!`
                });
                
                this.showGameInterface(this.user);
            }
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to create lobby: ' + error.message
            });
        }
    }

    async showLobbyList() {
        try {
            const response = await api.getLobbies();
            
            if (response.lobbies.length === 0) {
                Telegram.WebApp.showPopup({
                    title: 'No Lobbies',
                    message: 'No available lobbies. Create one first!'
                });
                return;
            }
            
            const lobbyButtons = response.lobbies.map(lobby => ({
                type: 'default',
                text: `${lobby.name} (${lobby.players}/2)`
            }));
            
            // Добавляем кнопку отмены
            lobbyButtons.push({ type: 'cancel', text: 'Cancel' });
            
            const result = await Telegram.WebApp.showPopup({
                title: 'Join Lobby',
                message: 'Select a lobby to join:',
                buttons: lobbyButtons
            });
            
            if (result && result !== 'Cancel') {
                const selectedLobby = response.lobbies.find(l => 
                    `${l.name} (${lobby.players}/2)` === result
                );
                
                if (selectedLobby) {
                    await this.joinLobby(selectedLobby.id);
                }
            }
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to get lobbies: ' + error.message
            });
        }
    }

    async joinLobby(lobbyId) {
        try {
            const response = await api.joinLobby(this.user.id, lobbyId);
            
            if (response.success) {
                this.currentLobby = response.lobby;
                this.setupWebSocket();
                
                Telegram.WebApp.showPopup({
                    title: 'Joined Lobby',
                    message: `Lobby: ${response.lobby.name}`
                });
                
                this.showGameInterface(this.user);
            }
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to join lobby: ' + error.message
            });
        }
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
            
            Telegram.WebApp.showPopup({
                title: 'Left Lobby',
                message: 'You left the lobby'
            });
            
            this.showGameInterface(this.user);
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to leave lobby: ' + error.message
            });
        }
    }

    setupWebSocket() {
        if (!this.currentLobby) return;
        
        this.socket = createWebSocketConnection();
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
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
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
        };
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'player_joined':
                this.currentLobby = message.lobby;
                this.showGameInterface(this.user);
                break;
                
            case 'player_left':
                this.currentLobby = message.lobby;
                this.showGameInterface(this.user);
                break;
                
            case 'game_start':
                this.startGame(message.gameState);
                break;
        }
    }

    startGame(gameState) {
        console.log('Game starting:', gameState);
        // Здесь будет запуск 3D игры
    }

    showError(message) {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>❌ Error</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

// Создаем глобальный экземпляр
const app = new QuantumTicTacToe();

// Делаем методы доступными глобально
window.createLobby = () => app.createLobby();
window.joinLobby = () => app.joinLobby();
window.leaveLobby = () => app.leaveLobby();
window.showLobbyList = () => app.showLobbyList(); 
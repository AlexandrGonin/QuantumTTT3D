import { initAuth } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
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
            
            console.log('Telegram WebApp initialized');
            
            this.user = await initAuth(Telegram.WebApp.initData);
            console.log('User authenticated:', this.user);
            
            this.showMainMenu();
            
            // Make methods globally available
            window.createLobby = () => this.showCreateLobby();
            window.joinLobby = () => this.showJoinLobby();
            window.backToMain = () => this.showMainMenu();
            window.confirmCreateLobby = () => this.confirmCreateLobby();
            window.confirmJoinLobby = () => this.confirmJoinLobby();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
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
                    <button class="menu-btn secondary" onclick="joinLobby()">
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

    async confirmCreateLobby() {
        const lobbyNameInput = document.getElementById('lobbyName');
        const lobbyName = lobbyNameInput ? lobbyNameInput.value.trim() : 'Quantum Lobby';
        
        if (!lobbyName) {
            this.showError('Please enter lobby name');
            return;
        }

        try {
            // Здесь будет вызов API для создания лобби
            console.log('Creating lobby:', lobbyName);
            
            Telegram.WebApp.showPopup({
                title: 'Lobby Created',
                message: `Lobby "${lobbyName}" created successfully!`
            });
            
            this.showMainMenu();
            
        } catch (error) {
            console.error('Create lobby error:', error);
            this.showError('Failed to create lobby');
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
            // Здесь будет вызов API для присоединения к лобби
            console.log('Joining lobby:', lobbyCode);
            
            Telegram.WebApp.showPopup({
                title: 'Joined Lobby',
                message: `Joined lobby: ${lobbyCode}`
            });
            
            this.showMainMenu();
            
        } catch (error) {
            console.error('Join lobby error:', error);
            this.showError('Failed to join lobby');
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
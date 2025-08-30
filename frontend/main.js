import { initAuth } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.user = null;
        this.socket = null;
        this.currentScreen = null;
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
            
            console.log('Telegram WebApp initialized');
            
            this.user = await initAuth(Telegram.WebApp.initData);
            console.log('User authenticated:', this.user);
            
            this.showGameInterface(this.user);
            
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
                <button onclick="app.createLobby()">Create Lobby</button>
                <button onclick="app.joinLobby()">Join Lobby</button>
            </div>
        `;
        
        document.getElementById('game-screen').classList.add('active');
    }

    async createLobby() {
        try {
            const response = await fetch('https://quantumttt3d-backend.onrender.com/lobby/create', {
                method: 'POST'
            });
            const data = await response.json();
            
            Telegram.WebApp.showPopup({
                title: 'Lobby Created',
                message: `ID: ${data.lobbyId}`
            });
            
        } catch (error) {
            Telegram.WebApp.showPopup({
                title: 'Error',
                message: 'Failed to create lobby'
            });
        }
    }

    async joinLobby() {
        Telegram.WebApp.showPopup({
            title: 'Join Lobby',
            message: 'This feature will be available soon!'
        });
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

window.app = new QuantumTicTacToe();
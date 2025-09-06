// src/utils/api.js
const API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://your-backend-app.onrender.com'; // ЗАМЕНИ на свой реальный URL

export async function initAuth(initData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        return data.user;

    } catch (error) {
        console.error('Auth error:', error);
        throw new Error('Authentication failed: ' + error.message);
    }
}

export const api = {
    async createLobby(userId, lobbyName = 'Quantum Lobby') {
        const response = await fetch(`${API_BASE_URL}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lobbyName })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to create lobby: ${response.status}`);
        }
        
        return response.json();
    },

    async joinLobby(userId, lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lobbyId })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to join lobby: ${response.status}`);
        }
        
        return response.json();
    },

    async leaveLobby(userId, lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to leave lobby: ${response.status}`);
        }
        
        return response.json();
    },

    async startGame(userId, lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to start game: ${response.status}`);
        }
        
        return response.json();
    }
};

export function createWebSocketConnection() {
    return new Promise((resolve, reject) => {
        const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
        console.log('Connecting to WebSocket:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
        }, 10000);

        ws.onopen = () => {
            clearTimeout(timeout);
            console.log('WebSocket connection established');
            resolve(ws);
        };

        ws.onerror = (error) => {
            clearTimeout(timeout);
            console.error('WebSocket connection error:', error);
            reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = (event) => {
            clearTimeout(timeout);
            console.log('WebSocket connection closed:', event.code, event.reason);
            reject(new Error(`WebSocket closed: ${event.reason || event.code}`));
        };
    });
}
const API_BASE_URL = 'https://quantumttt3d-backend.onrender.com';

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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to leave lobby: ${response.status}`);
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to start game: ${response.status}`);
        }
        
        return response.json();
    }
};

export function createWebSocketConnection() {
    // Правильное создание WebSocket соединения
    const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    return new WebSocket(wsUrl);
}
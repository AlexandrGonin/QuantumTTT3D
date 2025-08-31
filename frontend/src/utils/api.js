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
    },

    async getLobby(lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to get lobby: ${response.status}`);
        }
        
        return response.json();
    },

    async pollGameUpdates(lobbyId, userId, lastUpdate = 0) {
        const response = await fetch(`${API_BASE_URL}/game/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId, userId, lastUpdate })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to poll updates: ${response.status}`);
        }
        
        return response.json();
    },

    async sendGameMessage(lobbyId, userId, message) {
        const response = await fetch(`${API_BASE_URL}/game/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId, userId, message })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to send message: ${response.status}`);
        }
        
        return response.json();
    }
};

// Класс для управления игровым соединением через HTTP long-polling
export class GameConnection {
    constructor(lobbyId, userId, onMessage) {
        this.lobbyId = lobbyId;
        this.userId = userId;
        this.onMessage = onMessage;
        this.isConnected = true;
        this.lastUpdate = Date.now();
        this.pollInterval = null;
        this.startPolling();
    }

    async startPolling() {
        while (this.isConnected) {
            try {
                const response = await api.pollGameUpdates(this.lobbyId, this.userId, this.lastUpdate);
                
                if (response.success && response.updates && response.updates.length > 0) {
                    response.updates.forEach(update => {
                        this.onMessage(update);
                        this.lastUpdate = Math.max(this.lastUpdate, update.timestamp || Date.now());
                    });
                }
                
                // Ждем 2 секунды перед следующим запросом
                await new Promise(resolve => {
                    if (this.isConnected) {
                        this.pollInterval = setTimeout(resolve, 2000);
                    }
                });
                
            } catch (error) {
                console.error('Polling error:', error);
                
                // При ошибке ждем 5 секунд перед повторной попыткой
                await new Promise(resolve => {
                    if (this.isConnected) {
                        this.pollInterval = setTimeout(resolve, 5000);
                    }
                });
            }
        }
    }

    async send(message) {
        try {
            const response = await api.sendGameMessage(this.lobbyId, this.userId, message);
            return response;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    close() {
        this.isConnected = false;
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
        }
        console.log('Game connection closed');
    }
}

// Альтернативная функция для создания соединения
export function createGameConnection(lobbyId, userId, onMessage) {
    return new GameConnection(lobbyId, userId, onMessage);
}
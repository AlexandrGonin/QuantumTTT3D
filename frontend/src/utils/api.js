// src/utils/api.js
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-backend-app.onrender.com'; // ЗАМЕНИ НА СВОЙ URL

console.log('API base URL:', API_BASE_URL);

export async function initAuth(initData) {
    try {
        console.log('Starting authentication...');
        
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData })
        });

        console.log('Auth response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth failed:', response.status, errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: `HTTP error: ${response.status}` };
            }
            
            throw new Error(errorData.error || `Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Auth response data:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        console.log('Authentication successful:', data.user);
        return data.user;

    } catch (error) {
        console.error('Auth error:', error);
        throw new Error('Authentication failed: ' + error.message);
    }
}

export const api = {
    async createLobby(userId, lobbyName = 'Quantum Lobby') {
        try {
            console.log('Creating lobby for user:', userId);
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
        } catch (error) {
            console.error('Create lobby error:', error);
            throw error;
        }
    },

    async joinLobby(userId, lobbyId) {
        try {
            console.log('Joining lobby:', lobbyId, 'for user:', userId);
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
        } catch (error) {
            console.error('Join lobby error:', error);
            throw error;
        }
    },

    async leaveLobby(userId, lobbyId) {
        try {
            console.log('Leaving lobby:', lobbyId);
            const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to leave lobby: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('Leave lobby error:', error);
            throw error;
        }
    },

    async startGame(userId, lobbyId) {
        try {
            console.log('Starting game in lobby:', lobbyId);
            const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to start game: ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error('Start game error:', error);
            throw error;
        }
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
const API_BASE_URL = 'https://quantumttt3d-backend.onrender.com';

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

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
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
    async createLobby(userId, lobbyName) {
        const response = await fetch(`${API_BASE_URL}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lobbyName })
        });
        return response.json();
    },

    async joinLobby(userId, lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lobbyId })
        });
        return response.json();
    }
};
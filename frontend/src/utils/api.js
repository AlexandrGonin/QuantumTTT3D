const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quantumttt3d-backend.onrender.com';

export async function initAuth(initData) {
    try {
        console.log('🔐 Authenticating with initData');
        
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        console.log('✅ Auth successful:', data.user);
        return data.user;

    } catch (error) {
        console.error('❌ Auth error:', error);
        throw new Error('Authentication failed: ' + error.message);
    }
}

export const api = {
    async createLobby() {
        const response = await fetch(`${API_BASE_URL}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    },

    async getLobbies() {
        const response = await fetch(`${API_BASE_URL}/lobby/list`);
        return response.json();
    },

    async joinLobby(lobbyId) {
        const response = await fetch(`${API_BASE_URL}/lobby/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lobbyId })
        });
        return response.json();
    }
};
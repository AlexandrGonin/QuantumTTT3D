const API_BASE_URL = 'https://quantumttt3d-backend.onrender.com';

export async function initAuth(initData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.error || `Auth failed: ${response.status}`);
        }
        return data.user;
    } catch (error) {
        console.error('initAuth error:', error);
        throw new Error(error.message);
    }
}

export const api = {
    async createLobby(userId, lobbyName = 'Quantum Lobby') {
        const res = await fetch(`${API_BASE_URL}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, lobbyName })
        });
        return res.json();
    },
    async joinLobby(userId, lobbyId) {
        const res = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return res.json();
    },
    async leaveLobby(userId, lobbyId) {
        const res = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return res.json();
    },
    async startGame(userId, lobbyId) {
        const res = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return res.json();
    }
};

export function createWebSocketConnection() {
    return new Promise((resolve, reject) => {
        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => reject(new Error('WebSocket timeout')), 10000);
        ws.onopen = () => { clearTimeout(timeout); resolve(ws); };
        ws.onerror = (err) => { clearTimeout(timeout); reject(err); };
        ws.onclose = (e) => { clearTimeout(timeout); reject(new Error(`WS closed: ${e.code}`)); };
    });
}

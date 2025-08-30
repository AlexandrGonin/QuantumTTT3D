// Используем Vite env переменную или localhost по умолчанию
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:3000';

/**
 * Аутентификация через Telegram WebApp data
 */
export async function initAuth(initData) {
    try {
        console.log('🔐 Authenticating with initData:', initData);
        
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ initData })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Auth failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        console.log('✅ Auth successful:', data.user);
        return data.user;

    } catch (error) {
        console.error('❌ Auth error:', error);
        throw new Error('Failed to authenticate: ' + error.message);
    }
}

/**
 * Создает WebSocket соединение
 */
export function createWebSocketConnection(userId) {
    const wsUrl = API_BASE_URL.replace('https', 'wss').replace('http', 'ws');
    console.log('🔗 Connecting to WebSocket:', wsUrl);
    
    return new WebSocket(wsUrl);
}

/**
 * Вспомогательные функции для API
 */
export const api = {
    // Лобби
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
        const response = await fetch(`${API_BASE_URL}/lobby/${lobbyId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }
};
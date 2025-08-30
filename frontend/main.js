import { initGame } from './src/scenes/gameScene.js';
import { initAuth } from './src/utils/api.js';

class QuantumTicTacToe {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Инициализируем Telegram Web App
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            // Проходим аутентификацию
            const userData = await initAuth();
            
            // Запускаем игру
            this.game = initGame(userData);
            
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }
}

// Запуск приложения
new QuantumTicTacToe();
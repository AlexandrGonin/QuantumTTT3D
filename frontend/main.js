import { AuthScreen } from './src/components/AuthScreen.js';
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
            console.log('🚀 Initializing Quantum Tic-Tac-Toe...');
            
            // Проверяем, что мы в Telegram WebApp
            if (!window.Telegram || !Telegram.WebApp) {
                this.showError('Please open this game in Telegram');
                return;
            }

            // Инициализируем Telegram WebApp
            Telegram.WebApp.ready();
            Telegram.WebApp.expand(); // Полноэкранный режим
            Telegram.WebApp.enableClosingConfirmation(); // Подтверждение выхода
            
            console.log('📱 Telegram WebApp initialized');

            // Показываем экран аутентификации
            this.showAuthScreen();

            // Проходим аутентификацию
            await this.authenticate();

        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    showAuthScreen() {
        const authContainer = document.getElementById('auth-screen');
        this.authScreen = new AuthScreen((user) => this.onAuthSuccess(user));
        authContainer.appendChild(this.authScreen.element);
        authContainer.classList.add('active');
        this.currentScreen = 'auth';
    }

    async authenticate() {
        try {
            this.authScreen.updateStatus('Connecting to server...');
            
            // Получаем данные от Telegram
            const initData = Telegram.WebApp.initData;
            console.log('📋 InitData received:', initData);

            if (!initData) {
                throw new Error('No authentication data from Telegram');
            }

            this.authScreen.updateStatus('Verifying...');
            
            // Отправляем на сервер для проверки
            this.user = await initAuth(initData);
            
            this.authScreen.updateStatus('Success! Starting game...');
            
            // Задержка для показа сообщения об успехе
            setTimeout(() => this.onAuthSuccess(this.user), 1000);

        } catch (error) {
            console.error('❌ Authentication failed:', error);
            this.authScreen.showError(error);
        }
    }

    onAuthSuccess(user) {
        console.log('✅ Authenticated as:', user);
        
        // Скрываем экран аутентификации
        document.getElementById('auth-screen').classList.remove('active');
        
        // Показываем основной интерфейс
        this.showGameInterface(user);
        
        // Устанавливаем цвет тему Telegram
        this.setTelegramTheme();
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

    setTelegramTheme() {
        // Устанавливаем тему в соответствии с настройками Telegram
        const themeParams = Telegram.WebApp.themeParams;
        document.documentElement.style.setProperty('--bg-color', themeParams.bg_color || '#667eea');
        document.documentElement.style.setProperty('--text-color', themeParams.text_color || '#ffffff');
    }

    initGameScene() {
        // Заглушка для Three.js инициализации
        console.log('🎮 Initializing game scene...');
        // Здесь будет код из gameScene.js
    }

    showError(message) {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="error-screen">
                <h2>❌ Error</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">Restart</button>
            </div>
        `;
    }

    // Методы для работы с лобби (заглушки)
// Методы для работы с лобби
async createLobby() {
  try {
    const response = await fetch(`${API_BASE_URL}/lobby/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      Telegram.WebApp.showPopup({
        title: 'Lobby Created',
        message: `Lobby ID: ${data.lobbyId}`
      });
    }
    
  } catch (error) {
    Telegram.WebApp.showPopup({
      title: 'Error',
      message: 'Failed to create lobby'
    });
  }
}

async joinLobby() {
  try {
    const result = await Telegram.WebApp.showPopup({
      title: 'Join Lobby',
      message: 'Enter Lobby ID:',
      buttons: [{ type: 'default', text: 'Join' }]
    });
    
    if (result) {
      const response = await fetch(`${API_BASE_URL}/lobby/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyId: result })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Telegram.WebApp.showPopup({
          title: 'Success',
          message: `Joined lobby: ${data.lobbyId}`
        });
      }
    }
    
  } catch (error) {
    Telegram.WebApp.showPopup({
      title: 'Error',
      message: 'Failed to join lobby'
    });
  }
}
}

// Делаем глобальным для доступа из HTML
window.app = new QuantumTicTacToe();
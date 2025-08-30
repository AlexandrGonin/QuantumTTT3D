export class AuthScreen {
    constructor(onAuthSuccess) {
        this.onAuthSuccess = onAuthSuccess;
        this.element = this.createAuthScreen();
    }

    createAuthScreen() {
        const div = document.createElement('div');
        div.className = 'screen auth-screen';
        div.innerHTML = `
            <div class="auth-container">
                <h2>🎮 Quantum 3D Tic-Tac-Toe</h2>
                <p>Authenticating with Telegram...</p>
                <div class="loading-spinner"></div>
                <p class="auth-status">Initializing</p>
            </div>
        `;
        return div;
    }

    updateStatus(message) {
        const statusEl = this.element.querySelector('.auth-status');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    showError(error) {
        this.element.innerHTML = `
            <div class="auth-container">
                <h2>❌ Authentication Failed</h2>
                <p>${error.message || 'Unknown error'}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }
}
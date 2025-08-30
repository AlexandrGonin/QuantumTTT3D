require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/auth', require('./src/controllers/authController'));
app.use('/lobby', require('./src/middleware/auth'), require('./src/controllers/lobbyController'));

// HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, request) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        // Здесь будет обработка игровых сообщений
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
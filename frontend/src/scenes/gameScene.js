// src/scenes/gameScene.js
import * as THREE from 'three';

export class GameScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        
        this.init();
    }

    init() {
        // Настройка рендерера
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);

        // Настройка камеры
        this.camera.position.z = 5;

        // Создание игрового поля (3x3x3 куб)
        this.createGameBoard();

        // Освещение
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Анимация
        this.animate();
    }

    createGameBoard() {
        // Создаем 3D сетку 3x3x3
        this.cells = [];
        const size = 0.8;
        const spacing = 1.2;

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const geometry = new THREE.BoxGeometry(size, size, size);
                    const material = new THREE.MeshBasicMaterial({
                        color: 0x888888,
                        transparent: true,
                        opacity: 0.3,
                        wireframe: true
                    });
                    
                    const cell = new THREE.Mesh(geometry, material);
                    cell.position.set(x * spacing, y * spacing, z * spacing);
                    cell.userData = { x, y, z, state: null };
                    
                    this.scene.add(cell);
                    this.cells.push(cell);
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    handleCellClick(intersects) {
        // Обработка клика по ячейке
        if (intersects.length > 0) {
            const cell = intersects[0].object;
            console.log('Cell clicked:', cell.userData);
            // Здесь будет логика квантового хода
        }
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
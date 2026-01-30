import * as THREE from 'three';
import { Player } from './Player.js';
import { World } from './World.js';
import { UIManager } from './UIManager.js';
import { SoundManager } from './SoundManager.js';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 10, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Game Objects
    this.soundManager = new SoundManager();
    this.player = new Player(this.scene, this.soundManager);
    this.world = new World(this.scene);
    this.uiManager = new UIManager(this);

    this.isPlaying = false;
    this.isGameOver = false;
    this.score = 0;
    this.coins = 0;
    this.clock = new THREE.Clock();

    // Camera setup
    this.camera.position.set(0, 3, 6);
    this.camera.lookAt(0, 1, 0);

    // Resize handler
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Start Loop
    this.renderer.setAnimationLoop(() => this.update());

    // Start Game
    this.start();
  }

  start() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.score = 0;
    this.coins = 0;
    this.player.reset();
    this.world.reset();
    this.uiManager.hideGameOver();
    this.uiManager.updateCoins(this.coins);
    this.clock.start();
  }

  gameOver() {
    this.isPlaying = false;
    this.isGameOver = true;
    this.soundManager.playCrash();
    this.uiManager.showGameOver(Math.floor(this.score), this.coins);
  }

  revive() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.uiManager.hideGameOver();
    this.player.makeInvincible(2000);
    this.world.clearNearbyObstacles(this.player.getPosition().z);
  }

  update() {
    const delta = this.clock.getDelta();

    if (this.isPlaying && !this.isGameOver) {
      this.world.update(delta, this.player.getSpeed());
      this.player.update(delta);
      this.score += delta * 10 * this.player.getSpeed();
      this.uiManager.updateScore(Math.floor(this.score));

      // Collisions
      const obstacles = this.world.getObstacles();
      const coins = this.world.getCoins();

      if (this.player.checkCollision(obstacles)) {
        this.gameOver();
      }

      // Coin Collection
      const collectedCoinIndex = this.player.checkCoinCollection(coins);
      if (collectedCoinIndex !== -1) {
        this.soundManager.playCoin();
        this.coins++;
        this.uiManager.updateCoins(this.coins);
        this.world.removeCoin(collectedCoinIndex);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

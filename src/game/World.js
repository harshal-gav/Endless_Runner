import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.coins = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 1000);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Grid helper for visual reference of movement
        this.grid = new THREE.GridHelper(100, 50);
        this.scene.add(this.grid);
    }

    reset() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];
        this.coins.forEach(c => this.scene.remove(c));
        this.coins = [];
        this.spawnTimer = 0;
    }

    update(delta, speed) {
        // Move ground texture/grid to simulate movement
        // Actually, let's move obstacles towards player
        // Player stays at Z=0 mostly (except minor wobbles maybe, but we kept Z=0)

        // Spawn Obstacles
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            // Decrease interval slightly as speed increases
            this.spawnInterval = Math.max(0.5, 1.5 - (speed - 10) * 0.05);
        }

        // Move Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z += speed * delta; // Moving towards positive Z (Player is at 0, facing -Z)
            // Wait, standard setup: Camera at +Z looking at -Z.
            // Usually player runs INTO the screen (-Z) or OUT (+Z).
            // Let's assume Subway Surfers style: Player runs AWAY from camera into the distance (-Z direction).
            // So obstacles come from -Z? No, static world, player moves -Z.
            // OR Player static, World moves +Z.

            // Let's stick to: Player static at Z=0. World moves +Z towards player? 
            // If player runs FORWARD into screen (-Z), objects should appear at far -Z and move +Z towards camera.
            // Yes.

            if (obs.position.z > 10) { // Behind camera
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Move Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.position.z += speed * delta;
            coin.rotation.y += delta * 3; // Spin

            if (coin.position.z > 10) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }

        // Animate grid to give feeling of connection
        this.grid.position.z = (this.grid.position.z + speed * delta) % 2;
        // Just a visual hack for the floor
    }

    spawnObstacle() {
        const lanes = [-2.5, 0, 2.5];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        const type = Math.random();
        let geometry, material, yPos;

        // Random bright colors
        const randomColor = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);

        if (type < 0.5) {
            // Barrier (Jump over)
            geometry = new THREE.BoxGeometry(2, 1, 1);
            material = new THREE.MeshStandardMaterial({ color: randomColor });
            yPos = 0.5;
        } else if (type < 0.8) {
            // Tall Barrier (Cannot jump, must dodge)
            geometry = new THREE.BoxGeometry(2, 3, 1);
            material = new THREE.MeshStandardMaterial({ color: randomColor });
            yPos = 1.5;
        } else {
            // High Barrier (Roll under) - not fully implemented collision wise strictly for roll yet but visual is there
            geometry = new THREE.BoxGeometry(2, 1, 1);
            material = new THREE.MeshStandardMaterial({ color: randomColor });
            yPos = 2.0; // Floating
        }

        const obs = new THREE.Mesh(geometry, material);
        obs.position.set(lane, yPos, -50); // Spawn far away
        obs.castShadow = true;
        obs.receiveShadow = true;

        this.scene.add(obs);
        this.obstacles.push(obs);

        // Spawn Coin in distinct lane
        if (Math.random() > 0.3) {
            this.spawnCoin(lane);
        }
    }

    spawnCoin(obstacleLane) { // Avoid spawning inside obstacle
        const lanes = [-2.5, 0, 2.5];
        const availableLanes = lanes.filter(l => l !== obstacleLane);
        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        geometry.rotateX(Math.PI / 2); // Uplift to face camera
        const material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });

        const coin = new THREE.Mesh(geometry, material);
        coin.position.set(lane, 1.0, -50);
        coin.castShadow = true;

        this.scene.add(coin);
        this.coins.push(coin);
    }

    getObstacles() {
        return this.obstacles;
    }

    getCoins() {
        return this.coins;
    }

    removeCoin(index) {
        if (this.coins[index]) {
            this.scene.remove(this.coins[index]);
            this.coins.splice(index, 1);
        }
    }

    clearNearbyObstacles(playerZ) {
        // Clear obstacles very close to player to avoid instant death on revive
        // Player is at 0. Clear anything between -5 and 5Z
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.position.z > -10 && obs.position.z < 5) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }
        // Also clear nearby coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.position.z > -10 && coin.position.z < 5) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }
    }
}

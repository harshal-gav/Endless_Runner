import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.coins = [];
        this.scenery = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.sceneryTimer = 0;
        this.sceneryInterval = 0.5;
        this.powerups = [];

        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 1000);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Darker road
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Grass Strips (Side Backgrounds)
        const grassGeo = new THREE.PlaneGeometry(100, 1000);
        const grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });

        this.leftGrass = new THREE.Mesh(grassGeo, grassMat);
        this.leftGrass.rotation.x = -Math.PI / 2;
        this.leftGrass.position.set(-55, -0.1, 0); // Slightly below road
        this.leftGrass.receiveShadow = true;
        this.scene.add(this.leftGrass);

        this.rightGrass = new THREE.Mesh(grassGeo, grassMat);
        this.rightGrass.rotation.x = -Math.PI / 2;
        this.rightGrass.position.set(55, -0.1, 0);
        this.rightGrass.receiveShadow = true;
        this.scene.add(this.rightGrass);


        // Lane Markers
        this.createLaneMarkers();

        // ------------------------------------------------
        // PERFORMANCE OPTIMIZATION: CACHED GEOMETRIES & MATERIALS
        // ------------------------------------------------

        // Barriers
        this.barrierGeo = new THREE.BoxGeometry(2, 1, 0.5);
        this.tallBarrierGeo = new THREE.BoxGeometry(2, 4, 1);
        this.floatingBlockGeo = new THREE.BoxGeometry(2, 2, 2);

        this.obsMaterials = [];
        for (let i = 0; i < 5; i++) {
            const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
            this.obsMaterials.push(new THREE.MeshLambertMaterial({ color: color }));
        }
        this.redMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });

        // Coin
        this.coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8); // Reduced segments from 16
        this.coinGeo.rotateX(Math.PI / 2);
        this.coinMat = new THREE.MeshLambertMaterial({ color: 0xFFD700, emissive: 0x444400 });

        // Scenery
        this.trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 5); // Reduced segments
        this.trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.leavesGeo = new THREE.ConeGeometry(3, 6, 5); // Reduced segments
        this.leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });

        this.houseBaseGeo = new THREE.BoxGeometry(4, 4, 4); // Standard size, scale later
        this.houseRoofGeo = new THREE.ConeGeometry(3.5, 3, 4);
        this.houseMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa }); // Will emit color change or instance?
        // Actually for house variety, cached materials might be limited. Let's keep fresh materials for houses OR create a palette.
        this.houseMaterials = [];
        for (let i = 0; i < 5; i++) {
            this.houseMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6) }));
        }
        this.roofMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });

        // Powerups
        this.magnetGeo = new THREE.TorusGeometry(0.5, 0.15, 6, 12, Math.PI); // Reduced resolution
        this.jetpackGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        this.hoverboardGeo = new THREE.BoxGeometry(1.5, 0.2, 0.8);

        this.magnetMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0x222222 });
        this.jetpackMat = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x222222 });
        this.hoverboardMat = new THREE.MeshLambertMaterial({ color: 0x0000ff, emissive: 0x222222 });

        // Particles
        this.particleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        this.particleMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true });

    }

    createLaneMarkers() {
        // Lanes are at -2.5, 0, 2.5
        // Dividers at -1.25 and 1.25
        const lineGeo = new THREE.PlaneGeometry(0.15, 1000);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.rotation.x = -Math.PI / 2;
        line1.position.set(-1.25, 0.01, 0); // Slightly above road
        this.scene.add(line1);

        const line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.rotation.x = -Math.PI / 2;
        line2.position.set(1.25, 0.01, 0);
        this.scene.add(line2);

        // Side edges
        const edgeGeo = new THREE.PlaneGeometry(0.3, 1000);
        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b }); // Yellow curbs

        const edge1 = new THREE.Mesh(edgeGeo, edgeMat);
        edge1.rotation.x = -Math.PI / 2;
        edge1.position.set(-4, 0.02, 0);
        this.scene.add(edge1);

        const edge2 = new THREE.Mesh(edgeGeo, edgeMat);
        edge2.rotation.x = -Math.PI / 2;
        edge2.position.set(4, 0.02, 0);
        this.scene.add(edge2);
    }

    reset() {
        this.obstacles.forEach(o => this.scene.remove(o));
        this.obstacles = [];
        this.coins.forEach(c => this.scene.remove(c));
        this.coins = [];
        this.scenery.forEach(s => this.scene.remove(s.mesh));
        this.scenery = [];
        this.particles.forEach(p => this.scene.remove(p.mesh));
        this.particles = [];
        this.powerups.forEach(p => this.scene.remove(p));
        this.powerups = [];
        this.spawnTimer = 0;
    }

    update(delta, speed) {
        // Spawn Obstacles
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(0.6, 1.5 - (speed - 10) * 0.03);
        }

        // Spawn Scenery
        this.sceneryTimer += delta;
        if (this.sceneryTimer > this.sceneryInterval) {
            this.spawnSideScenery();
            // Faster spawning at higher speeds to keep density
            this.sceneryInterval = 0.8 / (speed / 10);
            if (this.sceneryInterval > 1.0) this.sceneryInterval = 1.0;
            if (this.sceneryInterval < 0.2) this.sceneryInterval = 0.2;
            this.sceneryTimer = 0;
        }

        // Move Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z += speed * delta;

            // Floating animation for some obstacles
            if (obs.userData.float) {
                obs.position.y = obs.userData.baseY + Math.sin(Date.now() * 0.005) * 0.2;
            }

            if (obs.position.z > 10) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Move Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.position.z += speed * delta;
            coin.rotation.y += delta * 5; // Faster spin

            if (coin.position.z > 10) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }

        // Move Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.position.z += speed * delta;
            p.rotation.y += delta * 2;

            if (p.position.z > 10) {
                this.scene.remove(p);
                this.powerups.splice(i, 1);
            }
        }

        // Move Scenery
        for (let i = this.scenery.length - 1; i >= 0; i--) {
            const s = this.scenery[i];
            s.mesh.position.z += speed * delta;
            if (s.mesh.position.z > 20) {
                this.scene.remove(s.mesh);
                this.scenery.splice(i, 1);
            }
        }

        // Update Particles
        this.updateParticles(delta);
    }

    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
            p.mesh.material.opacity = p.life / p.maxLife;
            p.mesh.rotation.x += delta * 2;
            p.mesh.rotation.y += delta * 2;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    createCoinExplosion(position) {
        const particleCount = 5; // Reduced from 8
        // optimized: reuse geometry/material

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(this.particleGeo, this.particleMat.clone()); // Need clone for opacity fade? Yes
            mesh.position.copy(position);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() * 2) + 1,
                (Math.random() - 0.5) * 4
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    spawnSideScenery() {
        const side = Math.random() > 0.5 ? 1 : -1;
        const xPos = side * (8 + Math.random() * 15);

        const type = Math.random();
        let mesh;

        if (type < 0.6) {
            // Tree
            const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMat);
            const leaves = new THREE.Mesh(this.leavesGeo, this.leavesMat);
            leaves.position.y = 3;

            mesh = new THREE.Group();
            mesh.add(trunk);
            mesh.add(leaves);
            mesh.position.set(xPos, 1, -100);
        } else {
            // House
            // Variation handling via scaling
            const wScale = 1 + Math.random() * 0.5;
            const hScale = 1 + Math.random();

            // Random cached material
            const material = this.houseMaterials[Math.floor(Math.random() * this.houseMaterials.length)];

            const base = new THREE.Mesh(this.houseBaseGeo, material);
            base.scale.set(wScale, hScale, 1); // Z is depth, kept 4*1

            const roof = new THREE.Mesh(this.houseRoofGeo, this.roofMat);
            roof.position.y = (4 * hScale) / 2 + 1.5;
            roof.scale.set(wScale, 1, 1);
            roof.rotation.y = Math.PI / 4;

            mesh = new THREE.Group();
            mesh.add(base);
            mesh.add(roof);
            // Height adjust
            mesh.position.set(xPos, 2 * hScale, -100);
        }

        mesh.traverse(c => {
            if (c.isMesh) {
                // Optimization: Disabling shadow casting for bulk scenery on mobile might be good
                // c.castShadow = true; 
                c.receiveShadow = true;
            }
        });

        this.scene.add(mesh);
        this.scenery.push({ mesh: mesh });
    }

    spawnObstacle() {
        if (Math.random() < 0.05) { // 5% chance per spawn tick
            this.spawnPowerUp();
            return;
        }

        const lanes = [-2.5, 0, 2.5];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        const type = Math.random();
        let geometry, material, yPos;
        let isFloat = false;
        let baseY = 0;

        // Use cached random materials
        const randomMat = this.obsMaterials[Math.floor(Math.random() * this.obsMaterials.length)];

        if (type < 0.4) {
            // Barrier
            geometry = this.barrierGeo;
            material = this.redMat;
            yPos = 0.5;
        } else if (type < 0.7) {
            // Tall Barrier
            geometry = this.tallBarrierGeo;
            material = randomMat;
            yPos = 2.0;
        } else {
            // Floating Block
            geometry = this.floatingBlockGeo;
            material = randomMat;
            yPos = 3.0;
            isFloat = true;
            baseY = 3.0;
        }

        const obs = new THREE.Mesh(geometry, material);
        obs.position.set(lane, yPos, -100);
        obs.castShadow = true;
        obs.receiveShadow = true;

        if (isFloat) {
            obs.userData = { float: true, baseY: baseY };
        } else {
            obs.userData = { float: false };
        }

        this.scene.add(obs);
        this.obstacles.push(obs);

        if (Math.random() > 0.3) {
            this.spawnCoin(lane);
        }
    }

    spawnPowerUp() {
        const lanes = [-2.5, 0, 2.5];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const typeRand = Math.random();

        let type, material, geometry;

        if (typeRand < 0.33) {
            type = 'MAGNET';
            geometry = this.magnetGeo;
            material = this.magnetMat;
        } else if (typeRand < 0.66) {
            type = 'JETPACK';
            geometry = this.jetpackGeo;
            material = this.jetpackMat;
        } else {
            type = 'HOVERBOARD';
            geometry = this.hoverboardGeo;
            material = this.hoverboardMat;
        }

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(lane, 1.5, -100);
        mesh.userData = { type: type, name: 'powerup' };

        if (type === 'MAGNET') {
            mesh.rotation.z = Math.PI; // Face down U
        }

        this.scene.add(mesh);
        this.powerups.push(mesh);
    }

    spawnCoin(obstacleLane) { // Avoid spawning inside obstacle
        const lanes = [-2.5, 0, 2.5];
        const availableLanes = lanes.filter(l => l !== obstacleLane);
        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

        // Coin groups - spawn 3-5 coins in a row
        const count = 3 + Math.floor(Math.random() * 3);
        const spacing = 3;

        for (let i = 0; i < count; i++) {
            // Reuse cached coin geometry and material
            const coin = new THREE.Mesh(this.coinGeo, this.coinMat);
            const zOffset = i * spacing;
            coin.position.set(lane, 1.0, -100 - zOffset);
            coin.castShadow = true;

            this.scene.add(coin);
            this.coins.push(coin);
        }
    }

    getObstacles() {
        return this.obstacles;
    }

    getCoins() {
        return this.coins;
    }

    getPowerUps() {
        return this.powerups;
    }

    removePowerUp(index) {
        if (this.powerups[index]) {
            this.scene.remove(this.powerups[index]);
            this.powerups.splice(index, 1);
        }
    }

    removeCoin(index) {
        if (this.coins[index]) {
            this.scene.remove(this.coins[index]);
            this.coins.splice(index, 1);
        }
    }

    clearNearbyObstacles(playerZ) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.position.z > -20 && obs.position.z < 20) {
                this.scene.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Also clear nearby powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (p.position.z > -20 && p.position.z < 20) {
                this.scene.remove(p);
                this.powerups.splice(i, 1);
            }
        }
    }
}

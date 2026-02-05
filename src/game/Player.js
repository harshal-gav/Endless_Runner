import * as THREE from 'three';

export class Player {
    constructor(scene, soundManager) {
        this.scene = scene;
        this.soundManager = soundManager;
        this.speed = 1.0;

        // Player Mesh
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.y = 0.5; // On ground
        this.scene.add(this.mesh);

        // Movement
        this.lane = 0; // -1 (Left), 0 (Center), 1 (Right)
        this.laneWidth = 2.5;
        this.targetX = 0;

        // Jump/Roll
        this.isJumping = false;
        this.verticalVelocity = 0;
        this.gravity = -20;
        this.jumpForce = 10;
        this.groundY = 0.5;

        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Powerup States
        this.isJetpackActive = false;
        this.jetpackTimer = 0;
        this.isHoverboardActive = false;
        this.hoverboardTimer = 0;
        this.magnetActive = false;

        // Controls
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Touch Controls
        this.touchStartX = 0;
        this.touchStartY = 0;

        window.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, false);

        window.addEventListener('touchend', (e) => {
            this.handleSwipe(e);
        }, false);
    }

    handleSwipe(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;

        const diffX = touchEndX - this.touchStartX;
        const diffY = touchEndY - this.touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal Swipe
            if (Math.abs(diffX) > 30) { // Threshold
                if (diffX > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
        } else {
            // Vertical Swipe
            if (Math.abs(diffY) > 30) {
                if (diffY > 0) {
                    // Down (Screen coordinates: Y increases downwards) -> Roll
                    this.roll();
                } else {
                    // Up -> Jump
                    this.jump();
                }
            }
        }
    }

    moveLeft() {
        if (this.lane > -1) this.lane--;
        this.targetX = this.lane * this.laneWidth;
    }

    moveRight() {
        if (this.lane < 1) this.lane++;
        this.targetX = this.lane * this.laneWidth;
    }

    jump() {
        if (!this.isJumping) {
            this.verticalVelocity = this.jumpForce;
            this.isJumping = true;
            if (this.soundManager) this.soundManager.playJump();
        }
    }

    roll() {
        // Roll (Squish)
        if (!this.isJumping) {
            this.mesh.scale.set(1, 0.5, 1);
            this.mesh.position.y = 0.25;
            if (this.soundManager) this.soundManager.playRoll();
            setTimeout(() => {
                this.mesh.scale.set(1, 1, 1);
                if (!this.isJumping) this.mesh.position.y = 0.5;
            }, 500);
        }
    }

    reset() {
        this.lane = 0;
        this.targetX = 0;
        this.mesh.position.set(0, 0.5, 0);
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.speed = 1.0;
        this.isInvincible = false;
        this.isJetpackActive = false;
        this.isHoverboardActive = false;
        this.mesh.material.color.setHex(0x00ff00);
        this.mesh.scale.set(1, 1, 1);
    }

    onKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.moveLeft();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.moveRight();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.jump();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.roll();
                break;
        }
    }

    activatePowerUp(type, duration) {
        if (type === 'JETPACK') {
            this.isJetpackActive = true;
            this.jetpackTimer = duration;
            this.verticalVelocity = 0;
            this.isJumping = false;
            // Visual
            this.mesh.material.color.setHex(0x00ffff);
        } else if (type === 'HOVERBOARD') {
            this.isHoverboardActive = true;
            this.hoverboardTimer = duration;
            this.mesh.material.color.setHex(0xff00ff);
        } else if (type === 'MAGNET') {
            this.magnetActive = true;
            setTimeout(() => this.magnetActive = false, duration * 1000);
        }
    }

    update(delta) {
        // Horizontal interpolation
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * delta * 10;

        // Jetpack Logic
        if (this.isJetpackActive) {
            this.jetpackTimer -= delta;
            // Float high
            this.mesh.position.y += (4.0 - this.mesh.position.y) * delta * 5;

            if (this.jetpackTimer <= 0) {
                this.isJetpackActive = false;
                this.mesh.material.color.setHex(0x00ff00);
                // Drop down
                this.verticalVelocity = 0;
                this.isJumping = true; // Transition to fall
            }
            return; // Skip normal gravity
        }

        // Hoverboard Timer
        if (this.isHoverboardActive) {
            this.hoverboardTimer -= delta;
            if (this.hoverboardTimer <= 0) {
                this.isHoverboardActive = false;
                this.mesh.material.color.setHex(0x00ff00);
            }
        }

        // Vertical Movement (Gravity)
        if (this.isJumping) {
            this.mesh.position.y += this.verticalVelocity * delta;
            this.verticalVelocity += this.gravity * delta;

            if (this.mesh.position.y <= this.groundY) {
                this.mesh.position.y = this.groundY;
                this.isJumping = false;
                this.verticalVelocity = 0;
            }
        }

        // Invincibility handling
        if (this.isInvincible) {
            this.invincibleTimer -= delta * 1000;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.mesh.material.color.setHex(0x00ff00);
                this.mesh.material.transparent = false;
                this.mesh.material.opacity = 1;
            } else {
                // Flash effect
                this.mesh.material.transparent = true;
                this.mesh.material.opacity = Math.sin(Date.now() / 50) * 0.5 + 0.5;
            }
        }
    }

    getSpeed() {
        return 10 + (window.performance.now() / 5000); // Speed scales with time slightly
    }

    getPosition() {
        return this.mesh.position;
    }

    makeInvincible(durationMs) {
        this.isInvincible = true;
        this.invincibleTimer = durationMs;
    }

    checkCollision(obstacles) {
        if (this.isInvincible) return false;

        // Jetpack avoids ground obstacles
        if (this.isJetpackActive) return false;

        const playerBox = new THREE.Box3().setFromObject(this.mesh);
        // Shrink box slightly for forgiving gameplay
        playerBox.expandByScalar(-0.1);

        for (const obs of obstacles) {
            const obsBox = new THREE.Box3().setFromObject(obs);
            if (playerBox.intersectsBox(obsBox)) {
                if (this.isHoverboardActive) {
                    // Shield break
                    this.isHoverboardActive = false;
                    this.makeInvincible(2000); // Temporary invincibility after hit
                    this.mesh.material.color.setHex(0x00ff00);
                    return false; // Survived
                }
                return true;
            }
        }
        return false;
    }

    checkCoinCollection(coins) {
        // Magnet effect in update loop usually, but here we check collection range
        const range = this.magnetActive ? 5.0 : 0.2;

        for (let i = 0; i < coins.length; i++) {
            // Simple distance check for magnet
            if (this.magnetActive) {
                if (this.mesh.position.distanceTo(coins[i].position) < range) {
                    return i;
                }
            }

            const playerBox = new THREE.Box3().setFromObject(this.mesh);
            playerBox.expandByScalar(0.2);
            const coinBox = new THREE.Box3().setFromObject(coins[i]);
            if (playerBox.intersectsBox(coinBox)) {
                return i;
            }
        }
        return -1;
    }

    checkPowerUpCollection(powerups) {
        const playerBox = new THREE.Box3().setFromObject(this.mesh);

        for (let i = 0; i < powerups.length; i++) {
            const pBox = new THREE.Box3().setFromObject(powerups[i]);
            if (playerBox.intersectsBox(pBox)) {
                return i;
            }
        }
        return -1;
    }
}

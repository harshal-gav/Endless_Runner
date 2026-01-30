export class SoundManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration) {
        if (!this.enabled) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playJump() {
        // slide up
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playRoll() {
        this.playTone(150, 'triangle', 0.1);
    }

    playCoin() {
        // High ping
        this.playTone(1200, 'sine', 0.1);
        setTimeout(() => this.playTone(1600, 'sine', 0.1), 50);
    }

    playCrash() {
        // Noise buffer (simulated with low sawtooth for simplicity or random buffer)
        this.playTone(100, 'sawtooth', 0.3);
        this.playTone(80, 'square', 0.3);
    }
}

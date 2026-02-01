import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.scoreEl = document.getElementById('score');
        this.finalScoreEl = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.adOverlay = document.getElementById('ad-overlay');
        this.adTimerEl = document.getElementById('ad-timer');
        this.adTitleEl = document.querySelector('#ad-overlay h2');

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.start();
        });

        document.getElementById('ad-btn').addEventListener('click', () => {
            this.showRewardAd();
        });

        this.initializeAdMob();
    }

    async initializeAdMob() {
        try {
            await AdMob.initialize({
                initializeForTesting: true,
            });
            console.log('AdMob Initialized');

            // Prepare the first Reward Video
            this.prepareRewardAd();

            AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
                // User watched the ad completely
                console.log('Ad Rewarded:', reward);
                this.game.revive();
            });

            AdMob.addListener(RewardAdPluginEvents.Loaded, (info) => {
                console.log('Ad Loaded Success:', info);
                // Optional: You could enable the button here
                // alert('Ad Loaded and Ready!'); 
            });

            AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
                console.error('Ad Failed to Load:', error);
                // Alert the PREPARE error which is what we are missing
                alert(`Ad Load Failed: ${error.message || 'Unknown'} (Code: ${error.code})`);
            });

        } catch (e) {
            console.error('AdMob Init Failed', e);
        }
    }

    async prepareRewardAd() {
        try {
            const options = {
                adId: 'ca-app-pub-1126148240601289/6263814842', // Unit ID provided by user
                // isTesting: true // Use true for testing with Test Ads, but user wants real ID integration logic
                // Note: AdMob often fails to load real ads in debug builds or simulators.
            };
            await AdMob.prepareRewardVideoAd(options);
        } catch (e) {
            console.error('AdMob Prepare Failed', e);
        }
    }

    async showRewardAd() {
        // Check if we are running in a Capacitor native environment
        const isNative = !!window.Capacitor?.isNative;

        if (isNative) {
            try {
                const result = await AdMob.showRewardVideoAd();
                // Prepare next ad
                this.prepareRewardAd();
            } catch (e) {
                console.error('AdMob Show Failed', e);
                // Alert the real error to debug on device
                const errMsg = e.message || 'Unknown Error';
                const errCode = e.code !== undefined ? e.code : 'No Code';
                alert(`AdMob Error: ${errMsg} | Code: ${errCode} | Raw: ${JSON.stringify(e)}`);

                // Fallback to Mock if Ad fails (e.g. no internet/no fill)
                this.playMockAd('Ad Failed to Load (Simulating)');
            }
        } else {
            console.log('Not Native - Playing Mock Ad');
            this.playMockAd('Simulated Ad (Browser/Web Mode)');
        }
    }

    playMockAd(message = 'Simulated Ad (Browser Mode)') {
        this.adOverlay.classList.remove('hidden');
        if (this.adTitleEl) this.adTitleEl.innerText = message;

        let timeLeft = 3;
        this.adTimerEl.innerText = timeLeft;

        const interval = setInterval(() => {
            timeLeft--;
            this.adTimerEl.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(interval);
                this.adOverlay.classList.add('hidden');
                this.game.revive();
            }
        }, 1000);
    }

    updateScore(score) {
        this.scoreEl.innerText = score;
    }

    updateCoins(coins) {
        const coinEl = document.getElementById('coins');
        if (coinEl) coinEl.innerText = coins;
    }

    showGameOver(score, coins) {
        this.finalScoreEl.innerText = `${score} (Coins: ${coins || 0})`;
        this.gameOverScreen.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    }

    playAd() {
        this.adOverlay.classList.remove('hidden');
        let timeLeft = 5;
        this.adTimerEl.innerText = timeLeft;

        const interval = setInterval(() => {
            timeLeft--;
            this.adTimerEl.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(interval);
                this.adOverlay.classList.add('hidden');
                this.game.revive();
            }
        }, 1000);
    }
}

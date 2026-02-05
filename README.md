# Endless Runner 3D

A fast-paced 3D endless runner game built with **Three.js** and **Vite**, packaged for Android using **Capacitor** with **AdMob** integration.

## 🎮 Features
- **3D Graphics**: Built using Three.js with custom synthesized sound effects.
- **Endless Gameplay**: Procedurally generated obstacles and coins.
- **Mobile Controls**: Swipe to move, jump, and roll.
- **AdMob Integration**: Watch Rewarded Video ads to revive after crashing.
- **Coin System**: Collect coins to increase your score (and potential future upgrades).

## 🛠️ Tech Stack
- **Frontend**: Vanilla JavaScript, Vite
- **3D Engine**: Three.js
- **Mobile Runtime**: Capacitor (Android)
- **Monetization**: AdMob (`@capacitor-community/admob`)

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Android Studio (for mobile build)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/harshal-gav/Endless_Runner.git
    cd Endless_Runner
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally (Web)
To play in the browser (Note: AdMob will use simulation mode):
```bash
npm run dev
```

## 📱 Building for Android

This project is configured for **Android**.

### 1. Sync Project
Ensure the web assets are built and synced to the Android native project:
```bash
npm run build
npx cap sync
```

### 2. Build APK (Debug)
You can build the APK directly using Gradle:
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Build AAB (Release)
For the Play Store:
```bash
cd android
./gradlew bundleDebug
```
(Note: For a signed release build, open the project in Android Studio and use "Generate Signed Bundle / APK").

## 🕹️ Controls

| Action | PC (Keyboard) | Mobile (Swipe) |
| :--- | :--- | :--- |
| **Move Left** | Left Arrow / A | Swipe Left |
| **Move Right** | Right Arrow / D | Swipe Right |
| **Jump** | Up Arrow / W | Swipe Up |
| **Roll** | Down Arrow / S | Swipe Down |

## 📝 License
This project is open source.

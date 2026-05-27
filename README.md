# MOVI-X Smart Wheelchair Ecosystem

MOVI-X is an advanced, autonomous smart wheelchair ecosystem designed to provide independent mobility with enhanced safety, real-time telemetry, and sophisticated AI-driven interfaces. 

This repository contains the complete ecosystem, including the hardware firmware and the intelligent React-based dashboard applications.

## 🚀 Comprehensive Feature List

MOVI-X is equipped with a wide array of smart features distributed across its intelligent dashboard and hardware:

### 🎮 Control & Navigation
- **Virtual Joystick (Remote Mode):** Full directional control of the wheelchair directly from the web interface.
- **Speed & Mode Selection:** Dynamic speed scaling and operating mode switches (Normal, Eco, Sport, Emergency).
- **Map-Based Navigation:** Google Maps-style navigation interface with real-time tracking of the wheelchair's current location and intended paths.
- **Voice Control (NavAbility Integration):** Hands-free operation using an integrated AI voice assistant. Speak commands like "move forward" or "stop" to control the wheelchair naturally.

### 🛡️ Safety & Emergency Systems
- **Real-Time Obstacle Detection:** Integration with ultrasonic sensors mapped onto a visual dashboard interface. Warns the user of proximity alerts.
- **Emergency SOS System:** A dedicated SOS module that immediately halts the wheelchair and triggers emergency protocols.
- **Twilio SMS Alerts:** Automated SMS notifications dispatched to emergency contacts for critical events, movement commands, or detected obstacles.
- **Automatic Safety Override:** Firmware-level failsafes that prevent movement if an obstacle is within a critical threshold or if the websocket connection drops.

### 📊 Telemetry & Monitoring
- **Live Health Monitoring:** Real-time visualization of battery levels, system uptime, and WiFi client connections.
- **System Debugging Panel:** Advanced debug view providing raw sensor data, API latency stats, WebSocket connection health, and historical event logs for developers.
- **Constant Heartbeat:** 1-second interval heartbeat pings to ensure the hardware and software are perfectly synced, displaying live network latency.

### 🤖 UI/UX & AI Features
- **Companion AI Avatar:** An interactive digital companion face (`movi-face`) that reacts to wheelchair states and user interactions.
- **High-Fidelity Dashboard:** A premium, responsive interface featuring dynamic layouts, smooth Framer Motion animations, and modern glassmorphism styling.
- **Authentication & Onboarding:** Secure login and personalized user onboarding workflows to tailor the experience to individual needs.
- **Hardware Simulation Mode:** A built-in developer mode that simulates telemetry, battery drain, and hardware responses without needing physical ESP32 connections.

## 📁 Project Structure

The repository is structured into distinct modules:

- `/Movi-app`: The primary React-based intelligent dashboard and control center. Built with Vite, TanStack Start, TailwindCSS, and Radix UI.
- `/movi-face`: An interactive companion face/avatar interface application.
- `/firmware`: Contains the ESP32 C++ firmware (`movi_x_firmware.ino`) responsible for motor control, sensor readings, and hosting the local API.

## 🛠️ Technology Stack

**Frontend Applications (`Movi-app` & `movi-face`)**
- React 19
- Vite
- TanStack Router & Start
- Tailwind CSS 4
- Zustand (State Management)
- Radix UI & Framer Motion (Animations)
- Twilio REST API

**Hardware (`firmware`)**
- ESP32 Microcontroller
- FreeRTOS (Task-based architecture)
- C++ (Arduino Core)
- WebSockets & HTTP WebServer

## 🚦 Getting Started

### 1. Hardware Setup (ESP32)
1. Open the `firmware/movi_x_firmware.ino` file using the Arduino IDE.
2. Install necessary libraries (WiFi, WebSocketsServer, etc.).
3. Update the WiFi credentials inside the sketch to match your local network or configure the ESP32 as a Hotspot.
4. Flash the firmware to your ESP32 board.

### 2. Software Setup (Dashboard)
The dashboard applications use standard Node.js package managers.

```bash
# Navigate to the main app directory
cd Movi-app

# Install dependencies
npm install

# Set up environment variables
# Create a .env file and add your Twilio credentials if you want SMS features
# VITE_TWILIO_ACCOUNT_SID=...
# VITE_TWILIO_AUTH_TOKEN=...
# VITE_TWILIO_PHONE_NUMBER=...

# Start the development server
npm run dev
```

### 3. Simulation Mode
If you don't have the ESP32 hardware connected but want to test the software interface, you can enable simulation mode:
1. Open `Movi-app/src/services/websocketService.ts`
2. Ensure `export const SIMULATION_MODE = true;` is set.
3. The dashboard will simulate hardware connectivity, battery drain, and sensor telemetry.

## 🌍 Deployment

The web dashboards are optimized for edge deployment (e.g., Cloudflare Pages, Vercel). 

**To deploy to Vercel:**
```bash
cd Movi-app
npx vercel
```

**To deploy to Cloudflare:**
```bash
cd Movi-app
npm run build
npx wrangler deploy
```

## 🛡️ Safety & Architecture Notes

MOVI-X is designed with a non-blocking, FreeRTOS-based firmware architecture to ensure safety-critical functions (like obstacle detection and the emergency stop) are never delayed by network communications. The React frontend maintains an active heartbeat with the ESP32 to ensure constant link stability. If the link drops or an obstacle is detected within the minimum safety threshold, the wheelchair automatically halts.

# Mobile App Setup Guide

This guide will help you configure the mobile app to work with Expo Go on both Android emulator and physical devices.

## Quick Start

### 1. Install Dependencies

```bash
cd apps/mobile
pnpm install
```

### 2. Configure API URL

The app needs to know where your backend API is running. The configuration depends on where you're running the app:

#### For Android Emulator
- **No configuration needed!** The app automatically uses `http://10.0.2.2:8080/api/v1`
- This is a special IP that Android emulator uses to access your host machine's localhost

#### For iOS Simulator
- **No configuration needed!** The app automatically uses `http://localhost:8080/api/v1`
- iOS simulator can directly access localhost

#### For Physical Devices (Android or iOS)
You need to set your computer's local IP address:

1. **Find your Mac's IP address:**
   ```bash
   # Run the helper script
   ./scripts/get-local-ip.sh
   
   # Or manually:
   ipconfig getifaddr en0
   ```
   
   You can also find it in: **System Settings > Network > Wi-Fi/Ethernet > Details**

2. **Create a `.env` file** in the `apps/mobile` directory:
   ```bash
   cd apps/mobile
   cp .env.example .env  # If .env.example exists, or create manually
   ```

3. **Add your IP address to `.env`:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api/v1
   ```
   Replace `192.168.1.100` with your actual IP address.

4. **Make sure your backend is running** and accessible on your network:
   - The backend should be running on port 8080
   - Make sure your Mac's firewall allows connections on port 8080
   - Both your Mac and phone should be on the same Wi-Fi network

## Running the App

### Start the Development Server

```bash
cd apps/mobile
pnpm start
```

### For Android

**Option 1: Using Expo Go (Recommended for development)**
1. Install **Expo Go** from Google Play Store on your Android device
2. Scan the QR code shown in the terminal
3. The app will load in Expo Go

**Option 2: Android Emulator**
```bash
pnpm android
```
This will automatically open the app in your Android emulator.

### For iOS

**Option 1: Using Expo Go**
1. Install **Expo Go** from App Store on your iPhone
2. Scan the QR code shown in the terminal
3. The app will load in Expo Go

**Option 2: iOS Simulator**
```bash
pnpm ios
```
This will automatically open the app in iOS Simulator.

## Troubleshooting

### "Network Error" or "Connection Refused"

**If using a physical device:**
1. ✅ Check that your `.env` file has the correct IP address
2. ✅ Verify your backend is running: `curl http://YOUR_IP:8080/api/v1/health`
3. ✅ Make sure both devices are on the same Wi-Fi network
4. ✅ Check your Mac's firewall settings
5. ✅ Restart Expo after changing `.env` file: Stop the server (Ctrl+C) and run `pnpm start` again

**If using an emulator:**
1. ✅ Check that your backend is running on `localhost:8080`
2. ✅ For Android emulator, the app automatically uses `10.0.2.2` instead of `localhost`

### "Cannot connect to Expo"

1. ✅ Make sure your phone and computer are on the same Wi-Fi network
2. ✅ Try using the tunnel option: `pnpm start --tunnel`
3. ✅ Check if your firewall is blocking Expo

### API URL Not Updating

After changing `.env` file:
1. Stop the Expo server (Ctrl+C)
2. Clear cache: `pnpm start --clear`
3. Restart the server

## Configuration Files

- **`app.config.js`**: Main Expo configuration (supports environment variables)
- **`.env`**: Your local environment variables (not committed to git)
- **`src/config/api.ts`**: API configuration logic

## Notes

- The `.env` file is git-ignored, so each developer needs to create their own
- For production builds, you'll need to set the API URL to your production server
- The app automatically detects if it's running on a device or emulator and adjusts accordingly

/**
 * Expo App Configuration
 * 
 * This file supports environment variables for configuration.
 * 
 * IMPORTANT PORT INFORMATION:
 * - If using Docker: Backend is exposed on port 8081 (not 8080)
 * - If running backend directly: Use port 8080
 * - Set EXPO_PUBLIC_USE_DOCKER=true to use port 8081 automatically
 * 
 * To set the API URL for physical devices:
 * 1. Create a .env file in this directory
 * 2. Add: EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8081/api/v1 (for Docker)
 *    OR: EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8080/api/v1 (for direct)
 * 3. Replace YOUR_COMPUTER_IP with your Mac's local IP address
 * 
 * To find your Mac's IP address:
 * - Run: ipconfig getifaddr en0 (or en1 if en0 doesn't work)
 * - Or check: System Settings > Network > Wi-Fi/Ethernet > Details
 */

module.exports = {
  expo: {
    name: 'FocusedAnswer',
    slug: 'focused-answer',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#070714',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.focusedanswer.app',
      infoPlist: {
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#070714',
      },
      package: 'com.focusedanswer.app',
      permissions: [
        'android.permission.VIBRATE',
        'android.permission.ACCESS_NOTIFICATION_POLICY',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-notifications',
        {
          sounds: ['./assets/sounds/beep.wav'],
        },
      ],
    ],
    extra: {
      // Use environment variable if set, otherwise use localhost
      // For physical devices, set EXPO_PUBLIC_API_URL in .env file
      // Default port is 8081 for Docker setup
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1',
    },
  },
};

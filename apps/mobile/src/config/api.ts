import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API base URL based on the environment
 * 
 * For Android emulator: use localhost or 10.0.2.2
 * For physical Android device: use your computer's local IP address
 * For iOS simulator: use localhost
 * For physical iOS device: use your computer's local IP address
 * 
 * Set EXPO_PUBLIC_API_URL environment variable to override
 */
export const getApiUrl = (): string => {
  // Check if environment variable is set (highest priority)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    console.log('🌐 Using API URL from EXPO_PUBLIC_API_URL:', url);
    return url;
  }

  // Check if configured in app.json/app.config.js
  const configUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configUrl && !configUrl.includes('localhost')) {
    console.log('🌐 Using API URL from app config:', configUrl);
    return configUrl;
  }

  // Default behavior: detect environment
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const isDevice = Constants.isDevice;

  // Check if using Docker (port 8081) or direct (port 8080)
  // Default to 8081 (Docker) unless EXPO_PUBLIC_USE_DOCKER=false is set
  const useDocker = process.env.EXPO_PUBLIC_USE_DOCKER !== 'false';
  const port = useDocker ? '8081' : '8080';

  // Android emulator uses 10.0.2.2 to access host machine's localhost
  if (isAndroid && !isDevice) {
    const url = `http://10.0.2.2:${port}/api/v1`;
    console.log('🌐 Using API URL for Android emulator:', url);
    return url;
  }

  // iOS simulator can use localhost
  if (isIOS && !isDevice) {
    const url = `http://localhost:${port}/api/v1`;
    console.log('🌐 Using API URL for iOS simulator:', url);
    return url;
  }

  // For physical devices, we need the computer's IP address
  // This will fallback to localhost, but you should set EXPO_PUBLIC_API_URL
  // or update app.config.js with your computer's IP
  if (isDevice) {
    // Try to get from config first
    if (configUrl) {
      console.log('🌐 Using API URL from config for device:', configUrl);
      return configUrl;
    }
    // Fallback - you should configure this!
    const fallbackUrl = `http://localhost:${port}/api/v1`;
    console.warn(
      '⚠️ Running on physical device. Please set EXPO_PUBLIC_API_URL environment variable\n' +
      'or update app.config.js with your computer\'s local IP address.\n' +
      'Example: http://192.168.1.100:' + port + '/api/v1\n' +
      'Current fallback URL (will not work on physical device): ' + fallbackUrl
    );
    return fallbackUrl;
  }

  // Default fallback
  const defaultUrl = `http://localhost:${port}/api/v1`;
  console.log('🌐 Using default API URL:', defaultUrl);
  return defaultUrl;
};

export const API_BASE_URL = getApiUrl();

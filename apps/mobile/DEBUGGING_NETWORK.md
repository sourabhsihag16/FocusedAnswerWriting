# Network Debugging Guide for Expo App

## Common Issues and Solutions

### 1. Port Configuration

**Problem**: The backend port differs based on how you're running it:

- **Docker Compose**: Backend is exposed on port `8081` (mapped from container port 8080)
- **Direct Run**: Backend runs on port `8080` directly

**Solution**: 
- If using Docker, set `EXPO_PUBLIC_USE_DOCKER=true` in your `.env` file
- Or manually set `EXPO_PUBLIC_API_URL` with the correct port

### 2. Physical Device Connection

**Problem**: Physical devices can't use `localhost` - they need your computer's IP address.

**Solution**:
1. Find your Mac's IP address:
   ```bash
   ipconfig getifaddr en0
   # or
   ipconfig getifaddr en1
   ```

2. Create a `.env` file in `apps/mobile/`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8081/api/v1
   ```
   (Replace `192.168.1.XXX` with your actual IP, and use `8081` for Docker or `8080` for direct)

3. Restart Expo:
   ```bash
   npx expo start --clear
   ```

### 3. Android Emulator

**Problem**: Android emulator uses special IP `10.0.2.2` to access host machine.

**Solution**: The app automatically detects Android emulator and uses `10.0.2.2:8080` (or `8081` if Docker).

### 4. iOS Simulator

**Problem**: iOS simulator can use `localhost` directly.

**Solution**: The app automatically uses `localhost:8080` (or `8081` if Docker) for iOS simulator.

### 5. CORS Errors

**Problem**: Backend rejects requests from mobile app.

**Solution**: 
- In development, CORS is set to allow all origins
- If you see CORS errors, check that `APP_ENV` is not set to `production` in backend

### 6. Network Error Messages

The app now shows detailed error messages:
- **ECONNREFUSED**: Server not running or wrong port
- **ENOTFOUND**: Wrong server address/IP
- **No response**: Network connectivity issue

## Debugging Steps

1. **Check Console Logs**: 
   - Look for `🌐 Using API URL:` messages to see what URL is being used
   - Look for `📤` (request) and `✅`/`❌` (response) logs

2. **Test Backend Health**:
   ```bash
   # If using Docker
   curl http://localhost:8081/health
   
   # If running directly
   curl http://localhost:8080/health
   ```

3. **Check Backend Logs**:
   ```bash
   # Docker
   docker logs faw-backend
   
   # Direct
   # Check terminal where backend is running
   ```

4. **Verify Port Mapping**:
   ```bash
   # Check if port is listening
   lsof -i :8080
   lsof -i :8081
   ```

5. **Test from Mobile App**:
   - Open Expo DevTools (shake device or press `j` in Expo CLI)
   - Check console logs for API calls
   - Look for error messages with details

## Quick Checklist

- [ ] Backend server is running
- [ ] Correct port (8081 for Docker, 8080 for direct)
- [ ] For physical devices: Using computer's IP address (not localhost)
- [ ] `.env` file exists in `apps/mobile/` with correct `EXPO_PUBLIC_API_URL`
- [ ] Restarted Expo after changing `.env`
- [ ] Firewall allows connections on the port
- [ ] Mobile device and computer are on same network (for physical devices)

## Example .env File

```bash
# For Docker setup with physical device
EXPO_PUBLIC_API_URL=http://192.168.1.100:8081/api/v1
EXPO_PUBLIC_USE_DOCKER=true

# OR for direct backend with physical device
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api/v1
```

## Still Having Issues?

1. Check the console logs in Expo DevTools
2. Try the health endpoint from your computer's browser
3. Verify backend is accessible from your network
4. Check firewall settings on your Mac
5. Ensure mobile device and computer are on the same Wi-Fi network
